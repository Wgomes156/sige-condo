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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { exportPropostaToPDF } from "@/lib/propostasExportUtils";

type Proposta = Database["public"]["Tables"]["propostas"]["Row"];

interface PropostasTableProps {
  propostas: Proposta[];
  onView: (proposta: Proposta) => void;
  onEdit: (proposta: Proposta) => void;
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

export function PropostasTable({
  propostas,
  onView,
  onEdit,
  onDuplicate,
  onChangeStatus,
  onDelete,
}: PropostasTableProps) {
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                Nenhuma proposta encontrada
              </TableCell>
            </TableRow>
          ) : (
            propostas.map((proposta) => (
              <TableRow key={proposta.id} className="hover:bg-muted/50">
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
