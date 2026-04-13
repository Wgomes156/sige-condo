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
import { useAtendimentoHistorico } from "@/hooks/useAtendimentoHistorico";
import { useAnexos, getAnexoUrl } from "@/hooks/useAnexos";
import { Clock, History, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AtendimentoDetalhesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atendimento: Atendimento | null;
  onEdit?: (atendimento: Atendimento) => void;
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
    case "Com Contrato":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Finalizado sem contrato":
      return "bg-slate-100 text-slate-800 border-slate-200";
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

export function AtendimentoDetalhes({ open, onOpenChange, atendimento, onEdit }: AtendimentoDetalhesProps) {
  // Hooks devem ser chamados SEMPRE, mesmo quando atendimento é null
  const { data: historico, isLoading: loadingHistorico } = useAtendimentoHistorico(atendimento?.id);

  // Guard DEPOIS dos hooks (regra fundamental do React)
  if (!atendimento) return null;

  const getHistoricoStatusColor = (status: string) => {
    switch (status) {
      case "Aguardando":
        return "bg-orange-500/10 text-orange-700 border-orange-500/20";
      case "Em andamento":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Contrato fechado":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "Encerrado sem contrato":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const handlePrint = () => {
    if (!atendimento) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Atendimento - ${atendimento.cliente_nome || ""}</title>
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
                <span class="value">${safeFormatDate(atendimento.data)}</span>
              </div>
              <div class="info-row">
                <span class="label">Hora:</span>
                <span class="value">${atendimento.hora ? atendimento.hora.slice(0, 5) : "--:--"}</span>
              </div>
              <div class="info-row">
                <span class="label">Operador:</span>
                <span class="value">${atendimento.operador_nome || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Canal:</span>
                <span class="value">${atendimento.canal || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Status:</span>
                <span class="value">${atendimento.status || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Motivo:</span>
                <span class="value">${atendimento.motivo || ""}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Dados do Cliente</div>
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">${atendimento.cliente_nome || ""}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${atendimento.cliente_telefone || ""}</span>
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
                <span class="value">${atendimento.condominio_nome || ""}</span>
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

          <Separator className="my-4" />

          <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico do Atendimento
          </h3>

          {loadingHistorico ? (
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          ) : historico && historico.length > 0 ? (
            <div className="space-y-4 mb-6">
              {historico.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-lg border p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          {safeFormatDate(item.data)} às {item.hora ? item.hora.slice(0, 5) : "00:00"}
                        </span>
                        <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", getHistoricoStatusColor(item.status))}>
                          {item.status}
                        </Badge>
                      </div>
                      
                      {onEdit && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onOpenChange(false);
                            // Pequeno delay para garantir que o Sheet feche antes do Dialog abrir
                            setTimeout(() => {
                              onEdit(atendimento);
                            }, 150);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Editar no Form
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.detalhes}</p>
                    <HistoricoAnexos historicoId={item.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2 italic">
              Nenhum registro de histórico.
            </p>
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
function HistoricoAnexos({ historicoId }: { historicoId: string }) {
  const { data: anexos, isLoading } = useAnexos("atendimento_historico", historicoId);

  if (isLoading || !anexos || anexos.length === 0) return null;

  const handleOpenAnexo = async (path: string) => {
    const url = await getAnexoUrl(path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {anexos.map((anexo) => (
        <Button
          key={anexo.id}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[10px] gap-1 bg-background hover:bg-accent border-primary/10"
          onClick={() => handleOpenAnexo(anexo.storage_path)}
        >
          <FileText className="h-3.5 w-3.5 text-red-500" />
          <span className="max-w-[150px] truncate">{anexo.nome_arquivo}</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Button>
      ))}
    </div>
  );
}
