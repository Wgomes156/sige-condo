import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Phone, Mail, Building2, User, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Atendimento } from "@/hooks/useAtendimentos";
import { AnexosSection } from "@/components/anexos/AnexosSection";

interface AtendimentoDetalhesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: Atendimento | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Finalizado":
      return "bg-green-100 text-green-800 border-green-200";
    case "Em andamento":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Tem demanda":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Aguardando retorno":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "";
  }
};

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2">
      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
        {icon}
        {label}:
      </span>
      <span className="col-span-2 text-sm">{value || "Não informado"}</span>
    </div>
  );
}

export function AtendimentoDetalhes({ open, onOpenChange, atendimento }: AtendimentoDetalhesProps) {
  if (!atendimento) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Atendimento - ${atendimento.cliente_nome}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 18px; margin-bottom: 20px; }
              .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
              .label { width: 40%; font-weight: bold; color: #666; }
              .value { width: 60%; }
              .section { margin-top: 20px; }
              .section-title { font-size: 14px; font-weight: bold; color: #333; margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <h1>ATENDIMENTO</h1>
            
            <div class="section">
              <div class="section-title">Dados do Atendimento</div>
              <div class="info-row">
                <span class="label">Data:</span>
                <span class="value">${format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${atendimento.hora?.slice(0, 5)}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador:</span>
                <span class="value">${atendimento.operador_nome}</span>
              </div>
              <div class="info-row">
                <span class="label">Canal:</span>
                <span class="value">${atendimento.canal}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${atendimento.status}</span>
              </div>
              <div class="info-row">
                <span class="label">Motivo:</span>
                <span class="value">${atendimento.motivo}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${atendimento.cliente_nome}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${atendimento.cliente_telefone}</span>
              </div>
              <div class="info-row">
                <span class="label">E-mail:</span>
                <span class="value">${atendimento.cliente_email || "Não informado"}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Condomínio</div>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${atendimento.condominio_nome}</span>
              </div>
            </div>
            
            ${atendimento.observacoes ? `
            <div class="section">
              <div class="section-title">Observações</div>
              <p>${atendimento.observacoes}</p>
            </div>
            ` : ""}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle className="flex items-center gap-2">
            Detalhes do Atendimento
          </SheetTitle>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Dados do Atendimento
          </h3>
          
          <InfoRow
            label="Data"
            value={format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })}
            icon={<Calendar className="h-3 w-3" />}
          />
          
          <InfoRow
            label="Hora"
            value={atendimento.hora?.slice(0, 5)}
          />
          
          <InfoRow
            label="Operador"
            value={atendimento.operador_nome}
            icon={<User className="h-3 w-3" />}
          />

          <InfoRow
            label="Canal"
            value={atendimento.canal}
            icon={<MessageSquare className="h-3 w-3" />}
          />

          <InfoRow
            label="Status"
            value={
              <Badge variant="outline" className={getStatusColor(atendimento.status)}>
                {atendimento.status}
              </Badge>
            }
          />

          <InfoRow
            label="Motivo"
            value={atendimento.motivo}
          />

          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Dados do Cliente
          </h3>
          
          <InfoRow
            label="Nome"
            value={atendimento.cliente_nome}
            icon={<User className="h-3 w-3" />}
          />
          
          <InfoRow
            label="Telefone"
            value={atendimento.cliente_telefone}
            icon={<Phone className="h-3 w-3" />}
          />
          
          <InfoRow
            label="E-mail"
            value={atendimento.cliente_email}
            icon={<Mail className="h-3 w-3" />}
          />

          <Separator className="my-4" />
          
          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
            Condomínio
          </h3>
          
          <InfoRow
            label="Nome"
            value={atendimento.condominio_nome}
            icon={<Building2 className="h-3 w-3" />}
          />

          {atendimento.observacoes && (
            <>
              <Separator className="my-4" />
              
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                Observações
              </h3>
              
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {atendimento.observacoes}
              </p>
            </>
          )}

          {/* Anexos */}
          <div className="mt-6">
            <AnexosSection
              entidadeTipo="atendimento"
              entidadeId={atendimento.id}
              showUploader={true}
              showDelete={true}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
