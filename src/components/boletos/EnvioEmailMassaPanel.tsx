import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Send, AlertCircle, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Boleto } from "@/hooks/useBoletos";
import { toast } from "sonner";

interface EnvioEmailMassaPanelProps {
  boletos: Boleto[];
  isLoading: boolean;
}

type TipoEmail = "cobranca" | "lembrete" | "inadimplencia";

interface ResultadoEnvio {
  boleto_id: string;
  unidade: string;
  email: string | null;
  sucesso: boolean;
  erro?: string;
}

export function EnvioEmailMassaPanel({ boletos, isLoading }: EnvioEmailMassaPanelProps) {
  const [tipoEmail, setTipoEmail] = useState<TipoEmail>("cobranca");
  const [incluirPendentes, setIncluirPendentes] = useState(true);
  const [incluirAtrasados, setIncluirAtrasados] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resultados, setResultados] = useState<ResultadoEnvio[] | null>(null);

  // Filter boletos based on selection
  const boletosFiltrados = boletos.filter((b) => {
    if (b.status === "pago" || b.status === "cancelado") return false;
    if (!b.morador_email) return false;
    if (b.status === "pendente" && incluirPendentes) return true;
    if (b.status === "atraso" && incluirAtrasados) return true;
    return false;
  });

  const boletosComEmail = boletosFiltrados.length;
  const boletosSemEmail = boletos.filter(
    (b) =>
      (b.status === "pendente" || b.status === "atraso") &&
      !b.morador_email &&
      ((b.status === "pendente" && incluirPendentes) || (b.status === "atraso" && incluirAtrasados))
  ).length;

  const handleEnviar = async () => {
    setShowConfirmDialog(false);
    setEnviando(true);
    setProgresso(0);
    setResultados(null);

    try {
      const boletoIds = boletosFiltrados.map((b) => b.id);

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setProgresso((prev) => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke("enviar-email-cobranca", {
        body: {
          boleto_ids: boletoIds,
          tipo: tipoEmail,
        },
      });

      clearInterval(progressInterval);
      setProgresso(100);

      if (error) throw error;

      setResultados(data.resultados);

      if (data.enviados > 0) {
        toast.success(`${data.enviados} e-mail(s) enviado(s) com sucesso!`);
      }

      if (data.erros > 0) {
        toast.warning(`${data.erros} e-mail(s) não puderam ser enviados`);
      }
    } catch (error) {
      console.error("Erro ao enviar e-mails:", error);
      toast.error("Erro ao enviar e-mails. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const tipoEmailLabels: Record<TipoEmail, { label: string; description: string; icon: React.ReactNode }> = {
    cobranca: {
      label: "Cobrança Padrão",
      description: "Envia o boleto com informações de pagamento",
      icon: <Mail className="h-4 w-4" />,
    },
    lembrete: {
      label: "Lembrete de Vencimento",
      description: "Lembrete amigável antes do vencimento",
      icon: <Clock className="h-4 w-4" />,
    },
    inadimplencia: {
      label: "Aviso de Inadimplência",
      description: "Notificação formal de débito pendente",
      icon: <AlertCircle className="h-4 w-4" />,
    },
  };

  const resetResultados = () => {
    setResultados(null);
    setProgresso(0);
  };

  if (resultados) {
    const enviados = resultados.filter((r) => r.sucesso).length;
    const falhas = resultados.filter((r) => !r.sucesso).length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            Envio Concluído
          </CardTitle>
          <CardDescription>
            {enviados} e-mail(s) enviado(s) com sucesso, {falhas} falha(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-300">{enviados}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Enviados</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-700 dark:text-red-300">{falhas}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Falhas</p>
              </div>
            </div>
          </div>

          {falhas > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 text-sm font-medium">Detalhes das falhas</div>
              <div className="max-h-48 overflow-auto">
                {resultados
                  .filter((r) => !r.sucesso)
                  .map((r) => (
                    <div key={r.boleto_id} className="px-4 py-2 border-t text-sm flex justify-between">
                      <span>
                        {r.unidade} - {r.email || "Sem e-mail"}
                      </span>
                      <span className="text-muted-foreground">{r.erro}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <Button onClick={resetResultados} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Novo Envio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Envio em Massa de E-mails
        </CardTitle>
        <CardDescription>
          Envie notificações de cobrança para todos os boletos pendentes ou vencidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de E-mail */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de E-mail</Label>
          <RadioGroup
            value={tipoEmail}
            onValueChange={(value) => setTipoEmail(value as TipoEmail)}
            className="grid gap-3"
          >
            {Object.entries(tipoEmailLabels).map(([key, config]) => (
              <Label
                key={key}
                htmlFor={key}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  tipoEmail === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} id={key} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Filtros de Status */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Incluir Boletos</Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="pendentes"
                checked={incluirPendentes}
                onCheckedChange={(checked) => setIncluirPendentes(checked as boolean)}
              />
              <Label htmlFor="pendentes" className="flex items-center gap-2 cursor-pointer">
                <Badge variant="secondary">Pendentes</Badge>
                <span className="text-sm text-muted-foreground">
                  ({boletos.filter((b) => b.status === "pendente" && b.morador_email).length} com e-mail)
                </span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="atrasados"
                checked={incluirAtrasados}
                onCheckedChange={(checked) => setIncluirAtrasados(checked as boolean)}
              />
              <Label htmlFor="atrasados" className="flex items-center gap-2 cursor-pointer">
                <Badge variant="destructive">Atrasados</Badge>
                <span className="text-sm text-muted-foreground">
                  ({boletos.filter((b) => b.status === "atraso" && b.morador_email).length} com e-mail)
                </span>
              </Label>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>E-mails a enviar:</span>
            <span className="font-medium">{boletosComEmail}</span>
          </div>
          {boletosSemEmail > 0 && (
            <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Sem e-mail cadastrado:
              </span>
              <span>{boletosSemEmail}</span>
            </div>
          )}
        </div>

        {/* Progress bar during sending */}
        {enviando && (
          <div className="space-y-2">
            <Progress value={progresso} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">Enviando e-mails... {progresso}%</p>
          </div>
        )}

        {/* Send button */}
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={boletosComEmail === 0 || enviando || isLoading}
          className="w-full"
          size="lg"
        >
          {enviando ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar {boletosComEmail} E-mail{boletosComEmail !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </CardContent>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio em massa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a enviar <strong>{boletosComEmail}</strong> e-mail(s) de{" "}
                <strong>{tipoEmailLabels[tipoEmail].label.toLowerCase()}</strong>.
              </p>
              <p>Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnviar}>
              <Send className="mr-2 h-4 w-4" />
              Confirmar Envio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
