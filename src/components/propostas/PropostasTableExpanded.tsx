import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Copy,
  FileDown,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { exportPropostaToPDF } from "@/lib/propostasExportUtils";
import { usePropostas, PropostaComServicos } from "@/hooks/usePropostas";
import { toast } from "sonner";

interface PropostasTableExpandedProps {
  propostas: PropostaComServicos[];
  onView: (proposta: PropostaComServicos) => void;
  onEdit: (proposta: PropostaComServicos) => void;
  onDuplicate: (id: string) => void;
  onChangeStatus: (id: string, status: Database["public"]["Enums"]["proposta_status"], motivo?: string) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  enviada: { label: "Enviada", variant: "default" },
  em_analise: { label: "Em Análise", variant: "outline" },
  aprovada: { label: "Aprovada", variant: "default" },
  recusada: { label: "Recusada", variant: "destructive" },
  expirada: { label: "Expirada", variant: "secondary" },
};

const pacoteConfig: Record<string, string> = {
  basico: "Básico",
  intermediario: "Intermediário",
  completo: "Completo",
  personalizado: "Personalizado",
};

const tipoCondominioConfig: Record<string, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  misto: "Misto",
};

export function PropostasTableExpanded({
  propostas,
  onView,
  onEdit,
  onDuplicate,
  onChangeStatus,
  onDelete,
}: PropostasTableExpandedProps) {
  const { atualizarServicoProposta } = usePropostas();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingServicoId, setEditingServicoId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    valor_unitario: number;
    quantidade: number;
  }>({ valor_unitario: 0, quantidade: 1 });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const isExpiringSoon = (dataValidade: string | null) => {
    if (!dataValidade) return false;
    const validade = new Date(dataValidade);
    const hoje = new Date();
    const diffDays = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (dataValidade: string | null) => {
    if (!dataValidade) return false;
    return new Date(dataValidade) < new Date();
  };

  const handleStartEdit = (servico: any) => {
    setEditingServicoId(servico.id);
    setEditValues({
      valor_unitario: Number(servico.valor_unitario) || 0,
      quantidade: servico.quantidade || 1,
    });
  };

  const handleCancelEdit = () => {
    setEditingServicoId(null);
    setEditValues({ valor_unitario: 0, quantidade: 1 });
  };

  const handleSaveEdit = async (servicoId: string) => {
    try {
      const valor_total = editValues.valor_unitario * editValues.quantidade;
      await atualizarServicoProposta.mutateAsync({
        id: servicoId,
        dados: {
          valor_unitario: editValues.valor_unitario,
          quantidade: editValues.quantidade,
          valor_total,
        },
      });
      toast.success("Valor do serviço atualizado!");
      setEditingServicoId(null);
    } catch (error) {
      toast.error("Erro ao atualizar valor do serviço");
    }
  };

  const getServicosSelecionados = (proposta: PropostaComServicos) => {
    return proposta.proposta_servicos?.filter(s => s.selecionado) || [];
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Número</TableHead>
            <TableHead>Condomínio</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-center">Unidades</TableHead>
            <TableHead>Pacote</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Validade</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propostas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Nenhuma proposta encontrada
              </TableCell>
            </TableRow>
          ) : (
            propostas.map((proposta) => {
              const isExpanded = expandedRows.has(proposta.id);
              const servicosSelecionados = getServicosSelecionados(proposta);
              
              return (
                <>
                  <TableRow key={proposta.id} className="hover:bg-muted/50">
                    <TableCell>
                      {servicosSelecionados.length > 0 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleRow(proposta.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {proposta.numero_proposta}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{proposta.condominio_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {proposta.condominio_cidade}/{proposta.condominio_estado}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tipoCondominioConfig[proposta.condominio_tipo] || proposta.condominio_tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {proposta.condominio_qtd_unidades}
                    </TableCell>
                    <TableCell>
                      {pacoteConfig[proposta.pacote_tipo] || proposta.pacote_tipo}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(proposta.valor_total))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusConfig[proposta.status]?.variant || "secondary"}
                        className={
                          proposta.status === "aprovada"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : proposta.status === "em_analise"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : ""
                        }
                      >
                        {statusConfig[proposta.status]?.label || proposta.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            isExpired(proposta.data_validade)
                              ? "text-red-600"
                              : isExpiringSoon(proposta.data_validade)
                              ? "text-amber-600"
                              : ""
                          }
                        >
                          {formatDate(proposta.data_validade)}
                        </span>
                        {isExpiringSoon(proposta.data_validade) && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                            Expirando
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onView(proposta)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          {proposta.status === "rascunho" && (
                            <DropdownMenuItem onClick={() => onEdit(proposta)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onDuplicate(proposta.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPropostaToPDF(proposta as any)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar PDF
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {proposta.status === "rascunho" && (
                            <DropdownMenuItem onClick={() => onChangeStatus(proposta.id, "enviada")}>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar Proposta
                            </DropdownMenuItem>
                          )}
                          {proposta.status === "enviada" && (
                            <DropdownMenuItem onClick={() => onChangeStatus(proposta.id, "em_analise")}>
                              <Eye className="mr-2 h-4 w-4" />
                              Marcar Em Análise
                            </DropdownMenuItem>
                          )}
                          {(proposta.status === "enviada" || proposta.status === "em_analise") && (
                            <>
                              <DropdownMenuItem
                                onClick={() => onChangeStatus(proposta.id, "aprovada")}
                                className="text-emerald-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const motivo = prompt("Motivo da recusa:");
                                  if (motivo) onChangeStatus(proposta.id, "recusada", motivo);
                                }}
                                className="text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Recusar
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          {proposta.status === "rascunho" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onDelete(proposta.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  
                  {/* Linha expandida com serviços */}
                  {isExpanded && servicosSelecionados.length > 0 && (
                    <TableRow key={`${proposta.id}-services`} className="bg-muted/30">
                      <TableCell colSpan={10} className="p-0">
                        <div className="p-4 border-t">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Serviços da Proposta</span>
                            <Badge variant="outline" className="ml-auto">
                              {servicosSelecionados.length} serviço(s)
                            </Badge>
                          </div>
                          
                          <div className="rounded-md border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Serviço</TableHead>
                                  <TableHead className="text-center w-[100px]">Qtd</TableHead>
                                  <TableHead className="text-right w-[150px]">Valor Unitário</TableHead>
                                  <TableHead className="text-right w-[150px]">Subtotal</TableHead>
                                  <TableHead className="text-right w-[80px]">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {servicosSelecionados.map((servico) => (
                                  <TableRow key={servico.id}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{servico.servico_nome}</p>
                                        {servico.servico_descricao && (
                                          <p className="text-xs text-muted-foreground">
                                            {servico.servico_descricao}
                                          </p>
                                        )}
                                        {!servico.valor_unitario && servico.servico_id && (
                                          <p className="text-xs text-amber-600 mt-1">
                                            ⚠️ Valor não definido - edite para adicionar
                                          </p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {editingServicoId === servico.id ? (
                                        <Input
                                          type="number"
                                          min="1"
                                          value={editValues.quantidade}
                                          onChange={(e) => setEditValues(prev => ({
                                            ...prev,
                                            quantidade: parseInt(e.target.value) || 1
                                          }))}
                                          className="w-16 h-8 text-sm text-center mx-auto"
                                        />
                                      ) : (
                                        servico.quantidade || 1
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingServicoId === servico.id ? (
                                        <div className="relative">
                                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editValues.valor_unitario}
                                            onChange={(e) => setEditValues(prev => ({
                                              ...prev,
                                              valor_unitario: parseFloat(e.target.value) || 0
                                            }))}
                                            className="w-28 h-8 text-sm pl-8 ml-auto"
                                          />
                                        </div>
                                      ) : (
                                        formatCurrency(Number(servico.valor_unitario))
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                      {editingServicoId === servico.id ? (
                                        <span className="text-primary">
                                          {formatCurrency(editValues.valor_unitario * editValues.quantidade)}
                                        </span>
                                      ) : (
                                        formatCurrency(Number(servico.valor_total))
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingServicoId === servico.id ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => handleSaveEdit(servico.id)}
                                            disabled={atualizarServicoProposta.isPending}
                                          >
                                            <Save className="h-3.5 w-3.5 text-green-600" />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={handleCancelEdit}
                                          >
                                            <X className="h-3.5 w-3.5 text-red-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => handleStartEdit(servico)}
                                        >
                                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="bg-muted/50">
                                  <TableCell colSpan={3} className="text-right font-medium">
                                    Total dos Serviços:
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-primary">
                                    {formatCurrency(
                                      servicosSelecionados.reduce((acc, s) => {
                                        if (s.id === editingServicoId) {
                                          return acc + (editValues.valor_unitario * editValues.quantidade);
                                        }
                                        return acc + Number(s.valor_total || 0);
                                      }, 0)
                                    )}
                                  </TableCell>
                                  <TableCell></TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
