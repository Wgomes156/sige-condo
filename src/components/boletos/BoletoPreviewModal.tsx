import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, X, Loader2 } from "lucide-react";
import { Boleto } from "@/hooks/useBoletos";
import { useContasBancarias } from "@/hooks/useContasBancarias";
import { construirDadosBoleto } from "@/services/boletoService";
import { BoletoTemplate, gerarBoletoBancarioPDF } from "@/components/boletos/BoletoTemplate";
import { gerarBoletoPDF } from "@/lib/boletoExportUtils";
import { toast } from "sonner";

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
  const { contas } = useContasBancarias();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!boleto) return null;

  const config = statusConfig[boleto.status] || statusConfig.pendente;

  // Find the bank account linked to this boleto
  const conta =
    contas.find((c) => c.id === (boleto as any).conta_bancaria_id) ||
    contas.find((c) => c.condominio_id === boleto.condominio_id && c.conta_padrao) ||
    contas.find((c) => c.condominio_id === boleto.condominio_id && c.ativa) ||
    contas.find((c) => c.condominio_id === boleto.condominio_id);

  // Reconstruct BoletoCalculado from stored data
  const boletoCalculado =
    conta && boleto.nosso_numero
      ? construirDadosBoleto(conta, {
          nossoNumero: boleto.nosso_numero,
          valorCentavos: Math.round(boleto.valor * 100),
          dataVencimento: new Date(boleto.data_vencimento + "T12:00:00"),
          dataEmissao: boleto.created_at ? new Date(boleto.created_at) : new Date(),
          descricao: boleto.referencia,
          instrucoes: [
            "Não receber após o vencimento",
            "Após vencimento cobrar multa e juros conforme legislação",
          ],
          sacadoNome: boleto.morador_nome || "Condômino",
          sacadoUnidade: boleto.unidade,
          condominioNome: boleto.condominios?.nome,
          condominioId: boleto.condominio_id,
        })
      : null;

  const handleBaixarPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (boletoCalculado) {
        await gerarBoletoBancarioPDF(boletoCalculado);
      } else {
        // Fallback: old PDF without barcode
        gerarBoletoPDF(boleto as any);
        if (!conta) toast.warning("Dados bancários não encontrados. PDF gerado sem código de barras.");
        else if (!boleto.nosso_numero) toast.warning("Nosso número não disponível. PDF gerado sem código de barras.");
      }
    } catch {
      toast.error("Erro ao gerar PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleImprimir = async () => {
    setIsGeneratingPDF(true);
    try {
      if (boletoCalculado) {
        await gerarBoletoBancarioPDF(boletoCalculado);
      } else {
        const { imprimirBoleto } = await import("@/lib/boletoExportUtils");
        imprimirBoleto(boleto as any);
      }
    } catch {
      toast.error("Erro ao imprimir.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Visualização do Boleto</DialogTitle>
            <Badge variant={config.variant} className="text-sm px-3 py-1">
              {config.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Boleto Template com código de barras */}
          {boletoCalculado ? (
            <BoletoTemplate dados={boletoCalculado} />
          ) : (
            // Fallback simples quando não tem conta/nosso_numero
            <div className="rounded-lg border p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Condomínio</p>
                  <p className="font-medium">{boleto.condominios?.nome || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="font-medium">{config.label}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unidade</p>
                  <p className="font-medium">{boleto.unidade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Morador</p>
                  <p className="font-medium">{boleto.morador_nome || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Referência</p>
                  <p className="font-medium">{boleto.referencia}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Nosso Número</p>
                  <p className="font-medium font-mono">{boleto.nosso_numero || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold text-lg text-green-700">
                    {boleto.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium">
                    {new Date(boleto.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              {!conta && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                  Dados bancários não vinculados — código de barras indisponível.
                </p>
              )}
              {conta && !boleto.nosso_numero && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                  Nosso número não disponível — código de barras indisponível.
                  Este boleto foi criado sem número de registro.
                </p>
              )}
            </div>
          )}

          {/* Observações */}
          {boleto.observacoes && !boletoCalculado && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Observações</p>
              <p className="text-sm bg-muted p-3 rounded-md font-mono text-xs break-all">{boleto.observacoes}</p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />Fechar
            </Button>
            <Button variant="outline" onClick={handleImprimir} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
              Imprimir
            </Button>
            <Button onClick={handleBaixarPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Baixar PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
