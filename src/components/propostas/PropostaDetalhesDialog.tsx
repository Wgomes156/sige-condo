import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileDown,
  History,
  Package,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { usePropostas } from "@/hooks/usePropostas";
import { exportPropostaToPDF } from "@/lib/propostasExportUtils";
import { toast } from "sonner";

type Proposta = Database["public"]["Tables"]["propostas"]["Row"];

interface PropostaDetalhesDialogProps {
  proposta: Proposta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-slate-100 text-slate-800" },
  enviada: { label: "Enviada", color: "bg-purple-100 text-purple-800" },
  em_analise: { label: "Em Análise", color: "bg-amber-100 text-amber-800" },
  aprovada: { label: "Aprovada", color: "bg-emerald-100 text-emerald-800" },
  recusada: { label: "Recusada", color: "bg-red-100 text-red-800" },
  expirada: { label: "Expirada", color: "bg-orange-100 text-orange-800" },
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

export function PropostaDetalhesDialog({
  proposta,
  open,
  onOpenChange,
}: PropostaDetalhesDialogProps) {
  const { useProposta, useHistorico, atualizarServicoProposta } = usePropostas();
  const { data: propostaCompleta, refetch } = useProposta(proposta?.id);
  const { data: historico = [] } = useHistorico(proposta?.id);
  
  const [editingServicoId, setEditingServicoId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    valor_unitario: number;
    quantidade: number;
  }>({ valor_unitario: 0, quantidade: 1 });

  if (!proposta) return null;

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

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const servicosSelecionados = propostaCompleta?.proposta_servicos?.filter(s => s.selecionado) || [];

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
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar valor do serviço");
    }
  };

  const calcularTotalServicos = () => {
    return servicosSelecionados.reduce((acc, s) => {
      if (s.id === editingServicoId) {
        return acc + (editValues.valor_unitario * editValues.quantidade);
      }
      return acc + Number(s.valor_total || 0);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                Proposta {proposta.numero_proposta}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {proposta.condominio_nome}
              </p>
            </div>
            <Badge className={statusConfig[proposta.status]?.color}>
              {statusConfig[proposta.status]?.label}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="servicos">Serviços</TabsTrigger>
              <TabsTrigger value="valores">Valores</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="space-y-6 mt-4">
              {/* Dados do Condomínio */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4" />
                  Dados do Condomínio
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{proposta.condominio_nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium">
                      {tipoCondominioConfig[proposta.condominio_tipo]}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Endereço
                    </p>
                    <p className="font-medium">
                      {proposta.condominio_endereco || "-"}
                      {proposta.condominio_cidade && `, ${proposta.condominio_cidade}`}
                      {proposta.condominio_estado && `/${proposta.condominio_estado}`}
                      {proposta.condominio_cep && ` - CEP: ${proposta.condominio_cep}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unidades</p>
                    <p className="font-medium">{proposta.condominio_qtd_unidades}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Blocos</p>
                    <p className="font-medium">{proposta.condominio_qtd_blocos || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Funcionários</p>
                    <p className="font-medium">{proposta.condominio_qtd_funcionarios || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{proposta.condominio_cnpj || "-"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Síndico */}
              {proposta.condominio_sindico_nome && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <User className="h-4 w-4" />
                      Síndico
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Nome</p>
                        <p className="font-medium">{proposta.condominio_sindico_nome}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Telefone
                        </p>
                        <p className="font-medium">{proposta.condominio_sindico_telefone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> E-mail
                        </p>
                        <p className="font-medium">{proposta.condominio_sindico_email || "-"}</p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Responsável */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Responsável pela Contratação
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nome</p>
                    <p className="font-medium">{proposta.responsavel_nome}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cargo</p>
                    <p className="font-medium">{proposta.responsavel_cargo || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Telefone
                    </p>
                    <p className="font-medium">{proposta.responsavel_telefone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> E-mail
                    </p>
                    <p className="font-medium">{proposta.responsavel_email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Prazos */}
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Prazos
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data de Emissão</p>
                    <p className="font-medium">{formatDate(proposta.data_emissao)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validade</p>
                    <p className="font-medium">{formatDate(proposta.data_validade)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Previsão de Início</p>
                    <p className="font-medium">{formatDate(proposta.previsao_inicio_servicos)}</p>
                  </div>
                </div>
              </div>

              {/* Observações */}
              {(proposta.diferenciais || proposta.observacoes) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    {proposta.diferenciais && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Diferenciais</p>
                        <p className="text-sm whitespace-pre-wrap">{proposta.diferenciais}</p>
                      </div>
                    )}
                    {proposta.observacoes && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Observações</p>
                        <p className="text-sm whitespace-pre-wrap">{proposta.observacoes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="servicos" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Pacote: {pacoteConfig[proposta.pacote_tipo]}
                </h3>
                <Badge variant="outline">
                  {servicosSelecionados.length} serviço(s) selecionado(s)
                </Badge>
              </div>

              {servicosSelecionados.length > 0 ? (
                <div className="space-y-2">
                  {servicosSelecionados.map((servico) => (
                    <div
                      key={servico.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{servico.servico_nome}</p>
                        {servico.servico_descricao && (
                          <p className="text-sm text-muted-foreground">
                            {servico.servico_descricao}
                          </p>
                        )}
                      </div>
                      
                      {editingServicoId === servico.id ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min="1"
                              value={editValues.quantidade}
                              onChange={(e) => setEditValues(prev => ({
                                ...prev,
                                quantidade: parseInt(e.target.value) || 1
                              }))}
                              className="w-16 h-8 text-sm"
                              placeholder="Qtd"
                            />
                            <span className="text-muted-foreground">x</span>
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
                                className="w-28 h-8 text-sm pl-8"
                                placeholder="Valor"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-sm font-medium text-muted-foreground">
                              = {formatCurrency(editValues.valor_unitario * editValues.quantidade)}
                            </span>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleSaveEdit(servico.id)}
                            disabled={atualizarServicoProposta.isPending}
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="font-medium">
                              {formatCurrency(Number(servico.valor_total))}
                            </p>
                            {servico.quantidade > 1 && (
                              <p className="text-xs text-muted-foreground">
                                {servico.quantidade}x {formatCurrency(Number(servico.valor_unitario))}
                              </p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(servico)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  <Separator className="my-4" />
                  
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <span className="font-semibold">Total dos Serviços</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(calcularTotalServicos())}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum serviço selecionado
                </p>
              )}
            </TabsContent>

            <TabsContent value="valores" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Taxa de Administração</span>
                  <span className="font-medium">
                    {formatCurrency(Number(proposta.valor_administracao))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Gestão de RH</span>
                  <span className="font-medium">
                    {formatCurrency(Number(proposta.valor_rh))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Síndico Profissional</span>
                  <span className="font-medium">
                    {formatCurrency(Number(proposta.valor_sindico_profissional))}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span>Serviços Extras</span>
                  <span className="font-medium">
                    {formatCurrency(Number(proposta.valor_servicos_extras))}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                  <span className="text-lg font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    VALOR TOTAL MENSAL
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(Number(proposta.valor_total))}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 mt-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Histórico de Alterações
              </h3>

              {historico.length > 0 ? (
                <div className="space-y-3">
                  {historico.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="font-medium capitalize">
                          {item.acao.replace(/_/g, " ")}
                        </p>
                        {item.descricao && (
                          <p className="text-sm text-muted-foreground">{item.descricao}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(item.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum registro no histórico
                </p>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => exportPropostaToPDF({ ...proposta, proposta_servicos: propostaCompleta?.proposta_servicos } as any)}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
