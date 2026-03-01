import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  OcorrenciaCondominio,
  TipoOcorrencia,
  StatusOcorrencia,
  PrioridadeOcorrencia,
} from "@/hooks/useOcorrenciasCondominio";
import {
  CalendarDays,
  MapPin,
  User,
  DollarSign,
  FileText,
  Building2,
  Tag,
  AlertTriangle,
  Clock,
  Wrench,
} from "lucide-react";

interface OcorrenciaDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ocorrencia: OcorrenciaCondominio | null;
  onGenerateOS?: (ocorrencia: OcorrenciaCondominio) => void;
}

const TIPOS_LABEL: Record<TipoOcorrencia, string> = {
  manutencao: "Manutenção",
  seguranca: "Segurança",
  convivencia: "Convivência",
  outro: "Outro",
};

const STATUS_CONFIG: Record<StatusOcorrencia, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  aberta: { label: "Aberta", variant: "destructive" },
  em_andamento: { label: "Em Andamento", variant: "default" },
  resolvida: { label: "Resolvida", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "outline" },
};

const PRIORIDADE_CONFIG: Record<PrioridadeOcorrencia, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  media: { label: "Média", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  alta: { label: "Alta", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgente: { label: "Urgente", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "-"}</p>
      </div>
    </div>
  );
}

export function OcorrenciaDetalhesDialog({
  open,
  onOpenChange,
  ocorrencia,
  onGenerateOS,
}: OcorrenciaDetalhesDialogProps) {
  if (!ocorrencia) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleGenerateOS = () => {
    if (onGenerateOS && ocorrencia) {
      onGenerateOS(ocorrencia);
      onOpenChange(false);
    }
  };

  const canGenerateOS = ocorrencia.status !== 'cancelada' && ocorrencia.status !== 'resolvida';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalhes da Ocorrência
            </DialogTitle>
            {onGenerateOS && canGenerateOS && (
              <Button
                onClick={handleGenerateOS}
                size="sm"
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Gerar OS
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Título e badges */}
            <div>
              <h3 className="text-lg font-semibold mb-2">{ocorrencia.titulo}</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {TIPOS_LABEL[ocorrencia.tipo_ocorrencia]}
                </Badge>
                {ocorrencia.categoria && (
                  <Badge variant="outline">{ocorrencia.categoria}</Badge>
                )}
                <Badge className={PRIORIDADE_CONFIG[ocorrencia.prioridade].className}>
                  {PRIORIDADE_CONFIG[ocorrencia.prioridade].label}
                </Badge>
                <Badge variant={STATUS_CONFIG[ocorrencia.status].variant}>
                  {STATUS_CONFIG[ocorrencia.status].label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informações principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                icon={Building2}
                label="Condomínio"
                value={ocorrencia.condominios?.nome}
              />
              <InfoRow
                icon={MapPin}
                label="Local"
                value={ocorrencia.local_ocorrencia}
              />
              <InfoRow
                icon={CalendarDays}
                label="Data da Ocorrência"
                value={format(new Date(ocorrencia.data_ocorrencia), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              />
              <InfoRow
                icon={User}
                label="Atribuído a"
                value={ocorrencia.atribuido_a}
              />
            </div>

            <Separator />

            {/* Descrição */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Descrição</span>
              </div>
              <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                {ocorrencia.descricao}
              </p>
            </div>

            {/* Custos */}
            {(ocorrencia.custo_estimado || ocorrencia.custo_real) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow
                    icon={DollarSign}
                    label="Custo Estimado"
                    value={formatCurrency(ocorrencia.custo_estimado)}
                  />
                  <InfoRow
                    icon={DollarSign}
                    label="Custo Real"
                    value={formatCurrency(ocorrencia.custo_real)}
                  />
                </div>
              </>
            )}

            {/* Resolução */}
            {ocorrencia.resolucao && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Resolução / Andamento</span>
                  </div>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {ocorrencia.resolucao}
                  </p>
                </div>
              </>
            )}

            {/* Observações */}
            {ocorrencia.observacoes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Observações</span>
                  </div>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {ocorrencia.observacoes}
                  </p>
                </div>
              </>
            )}

            {/* Datas de resolução */}
            {ocorrencia.data_resolucao && (
              <>
                <Separator />
                <InfoRow
                  icon={Clock}
                  label="Data de Resolução"
                  value={format(new Date(ocorrencia.data_resolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
              <p>Criado em: {format(new Date(ocorrencia.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
              <p>Atualizado em: {format(new Date(ocorrencia.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
