import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { OrdemServico } from "@/hooks/useOrdensServico";
import { AnexosSection } from "@/components/anexos/AnexosSection";

interface OSDetalhesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordemServico: OrdemServico | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberta: { label: "Aberta", variant: "outline" },
  em_andamento: { label: "Em Andamento", variant: "secondary" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

const prioridadeConfig: Record<string, { label: string; className: string }> = {
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 border-red-200" },
  periodico: { label: "Periódico", className: "bg-blue-100 text-blue-800 border-blue-200" },
  nao_urgente: { label: "Não Urgente", className: "bg-green-100 text-green-800 border-green-200" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <span className="text-sm font-medium text-muted-foreground">{label}:</span>
      <span className="col-span-2 text-sm">{value || "Não informado"}</span>
    </div>
  );
}

export function OSDetalhes({ open, onOpenChange, ordemServico }: OSDetalhesProps) {
  if (!ordemServico) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("os-print-content");
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ordem de Serviço #${ordemServico.numero_os}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 18px; margin-bottom: 20px; }
                .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
                .label { width: 40%; font-weight: bold; color: #666; }
                .value { width: 60%; }
                .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .badge-urgente { background: #fef2f2; color: #991b1b; }
                .badge-periodico { background: #eff6ff; color: #1e40af; }
                .badge-nao_urgente { background: #f0fdf4; color: #166534; }
              </style>
            </head>
            <body>
              <h1>ORDEM DE SERVIÇO #${ordemServico.numero_os}</h1>
              <div class="info-row">
                <span class="label">Data da Solicitação:</span>
                <span class="value">${format(new Date(ordemServico.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora da Solicitação:</span>
                <span class="value">${ordemServico.hora_solicitacao.slice(0, 5)}</span>
              </div>
              <div class="info-row">
                <span class="label">Solicitante:</span>
                <span class="value">${ordemServico.solicitante}</span>
              </div>
              <div class="info-row">
                <span class="label">Nome do Condomínio:</span>
                <span class="value">${ordemServico.condominio_nome}</span>
              </div>
              <div class="info-row">
                <span class="label">Descrição do Serviço:</span>
                <span class="value">${ordemServico.descricao_servico}</span>
              </div>
              <div class="info-row">
                <span class="label">Status da OS:</span>
                <span class="value">${statusConfig[ordemServico.status]?.label || ordemServico.status}</span>
              </div>
              <div class="info-row">
                <span class="label">Prioridade:</span>
                <span class="value badge badge-${ordemServico.prioridade}">${prioridadeConfig[ordemServico.prioridade]?.label || ordemServico.prioridade}</span>
              </div>
              <div class="info-row">
                <span class="label">Data do Atendimento:</span>
                <span class="value">${ordemServico.data_atendimento ? format(new Date(ordemServico.data_atendimento), "dd/MM/yyyy", { locale: ptBR }) : "Não informado"}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador Responsável:</span>
                <span class="value">${ordemServico.atribuido_nome || "Não informado"}</span>
              </div>
              <div class="info-row">
                <span class="label">Observações:</span>
                <span class="value">${ordemServico.observacoes || "Não informado"}</span>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            Ordem de Serviço #{ordemServico.numero_os}
          </SheetTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </SheetHeader>

        <div id="os-print-content" className="mt-6 space-y-1">
          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Informações da Solicitação
          </h3>
          
          <InfoRow
            label="Data da Solicitação"
            value={format(new Date(ordemServico.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
          />
          
          <InfoRow
            label="Hora da Solicitação"
            value={ordemServico.hora_solicitacao.slice(0, 5)}
          />
          
          <InfoRow
            label="Solicitante"
            value={ordemServico.solicitante}
          />

          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Informações do Condomínio
          </h3>
          
          <InfoRow
            label="Nome do Condomínio"
            value={ordemServico.condominio_nome}
          />

          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Detalhes do Serviço
          </h3>
          
          <InfoRow
            label="Descrição"
            value={ordemServico.descricao_servico}
          />
          
          <InfoRow
            label="Status"
            value={
              <Badge variant={statusConfig[ordemServico.status]?.variant || "outline"}>
                {statusConfig[ordemServico.status]?.label || ordemServico.status}
              </Badge>
            }
          />
          
          <InfoRow
            label="Prioridade"
            value={
              <Badge className={prioridadeConfig[ordemServico.prioridade]?.className || ""}>
                {prioridadeConfig[ordemServico.prioridade]?.label || ordemServico.prioridade}
              </Badge>
            }
          />
          
          <InfoRow
            label="Operador Responsável"
            value={ordemServico.atribuido_nome}
          />
          
          <InfoRow
            label="Data do Atendimento"
            value={
              ordemServico.data_atendimento
                ? format(new Date(ordemServico.data_atendimento), "dd/MM/yyyy", { locale: ptBR })
                : null
            }
          />

          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Observações Adicionais
          </h3>
          
          <p className="text-sm whitespace-pre-wrap">
            {ordemServico.observacoes || "Não informado"}
          </p>

          {/* Anexos */}
          <div className="mt-6">
            <AnexosSection
              entidadeTipo="ordem_servico"
              entidadeId={ordemServico.id}
              showUploader={false}
              showDelete={false}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
