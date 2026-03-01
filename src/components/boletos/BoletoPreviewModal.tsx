import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, X } from "lucide-react";
import { Boleto } from "@/hooks/useBoletos";
import { gerarBoletoPDF, imprimirBoleto } from "@/lib/boletoExportUtils";
import { format } from "date-fns";

interface BoletoPreviewModalProps {
  boleto: Boleto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  atraso: { label: "Atraso", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export function BoletoPreviewModal({ boleto, open, onOpenChange }: BoletoPreviewModalProps) {
  if (!boleto) return null;

  const config = statusConfig[boleto.status] || statusConfig.pendente;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString + "T12:00:00"), "dd/MM/yyyy");
  };

  const getDiasAtraso = () => {
    if (boleto.status === "pago" || boleto.status === "cancelado") return null;
    const hoje = new Date();
    const vencimento = new Date(boleto.data_vencimento + "T12:00:00");
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  const diasAtraso = getDiasAtraso();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Visualização do Boleto</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cabeçalho com Condomínio e Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Condomínio</p>
              <p className="text-lg font-semibold">{boleto.condominios?.nome || "Não informado"}</p>
            </div>
            <Badge variant={config.variant} className="text-sm px-3 py-1">
              {config.label}
            </Badge>
          </div>

          <Separator />

          {/* Grid com informações */}
          <div className="grid grid-cols-2 gap-6">
            {/* Dados do Morador */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Dados do Morador
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Unidade</p>
                  <p className="font-medium">{boleto.unidade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nome</p>
                  <p className="font-medium">{boleto.morador_nome || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{boleto.morador_telefone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="font-medium">{boleto.morador_email || "Não informado"}</p>
                </div>
              </div>
            </div>

            {/* Dados do Boleto */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Dados do Boleto
              </h4>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Referência</p>
                  <p className="font-medium">{boleto.referencia}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nosso Número</p>
                  <p className="font-medium">{boleto.nosso_numero || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {formatDate(boleto.data_vencimento)}
                    {diasAtraso && (
                      <span className="ml-2 text-sm text-destructive">
                        ({diasAtraso} dia{diasAtraso !== 1 ? "s" : ""} de atraso)
                      </span>
                    )}
                  </p>
                </div>
                {boleto.data_pagamento && (
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Pagamento</p>
                    <p className="font-medium text-emerald-600">{formatDate(boleto.data_pagamento)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Valor em Destaque */}
          <div className="bg-primary rounded-lg p-6 text-center">
            <p className="text-sm text-primary-foreground/80 mb-1">Valor a Pagar</p>
            <p className="text-3xl font-bold text-primary-foreground">
              {formatCurrency(boleto.valor)}
            </p>
          </div>

          {/* Observações */}
          {boleto.observacoes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Observações
              </h4>
              <p className="text-sm bg-muted p-3 rounded-md">{boleto.observacoes}</p>
            </div>
          )}

          {/* Categoria */}
          {boleto.categorias_financeiras && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Categoria:</span>
              <Badge 
                variant="outline" 
                style={{ 
                  borderColor: boleto.categorias_financeiras.cor,
                  color: boleto.categorias_financeiras.cor 
                }}
              >
                {boleto.categorias_financeiras.nome}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
            <Button variant="outline" onClick={() => imprimirBoleto(boleto)}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => gerarBoletoPDF(boleto)}>
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
