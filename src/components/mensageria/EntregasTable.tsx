import { useState } from "react";
import { Mail, MessageSquare, Bell, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntregaStatusBadge } from "./EntregaStatusBadge";
import { LogsEntregaDialog } from "./LogsEntregaDialog";
import { useDispararMensagem, type MensageriaEntrega } from "@/hooks/useMensageria";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  entregas: MensageriaEntrega[];
  isLoading: boolean;
}

const CANAL_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  whatsapp: MessageSquare,
  inapp: Bell,
};

const CANAL_LABEL: Record<string, string> = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  inapp: "In-app",
};

function formatarData(iso: string) {
  return format(new Date(iso), "dd/MM/yy HH:mm", { locale: ptBR });
}

function ReenviarButton({ entrega }: { entrega: MensageriaEntrega }) {
  const [loading, setLoading] = useState(false);

  const handleReenviar = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { error } = await supabase.functions.invoke("enviar-mensagem", {
        body: { entrega_id: entrega.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      toast.success("Mensagem reenviada com sucesso!");
    } catch (err) {
      toast.error(`Erro ao reenviar: ${err instanceof Error ? err.message : "erro"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 text-xs gap-1"
      onClick={handleReenviar}
      disabled={loading}
    >
      <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
      Reenviar
    </Button>
  );
}

export function EntregasTable({ entregas, isLoading }: Props) {
  const [logsEntregaId, setLogsEntregaId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (entregas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20 text-center">
        <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-medium text-muted-foreground">Nenhuma entrega encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Dispare mensagens para os moradores para ver o histórico aqui.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: cards (< sm) ── */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {entregas.map((entrega) => {
          const CanalIcon = CANAL_ICON[entrega.canal] ?? Bell;
          return (
            <Card key={entrega.id} className="overflow-hidden border-l-4 border-l-primary/50 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entrega.destinatario_nome ?? "Destinatário desconhecido"}
                    </p>
                    {entrega.assunto && (
                      <p className="text-xs text-muted-foreground truncate">{entrega.assunto}</p>
                    )}
                  </div>
                  <EntregaStatusBadge status={entrega.status} />
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CanalIcon className="h-3 w-3" />
                    {CANAL_LABEL[entrega.canal] ?? entrega.canal}
                  </span>
                  <span>{formatarData(entrega.criado_em)}</span>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1"
                    onClick={() => setLogsEntregaId(entrega.id)}
                  >
                    <Eye className="h-3 w-3" />
                    Ver logs
                  </Button>
                  {entrega.status === "falhou" && (
                    <div className="flex-1">
                      <ReenviarButton entrega={entrega} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Desktop: tabela (≥ sm) ── */}
      <div className="hidden sm:block border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinatário</TableHead>
              <TableHead className="w-28">Canal</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-36">Data</TableHead>
              <TableHead className="w-28 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.map((entrega) => {
              const CanalIcon = CANAL_ICON[entrega.canal] ?? Bell;
              return (
                <TableRow key={entrega.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[180px]">
                        {entrega.destinatario_nome ?? "—"}
                      </p>
                      {entrega.destinatario_email && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {entrega.destinatario_email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CanalIcon className="h-4 w-4 shrink-0" />
                      {CANAL_LABEL[entrega.canal] ?? entrega.canal}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {entrega.assunto ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <EntregaStatusBadge status={entrega.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatarData(entrega.criado_em)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Ver logs"
                        onClick={() => setLogsEntregaId(entrega.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {entrega.status === "falhou" && (
                        <ReenviarButton entrega={entrega} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <LogsEntregaDialog
        entregaId={logsEntregaId}
        open={!!logsEntregaId}
        onOpenChange={(open) => { if (!open) setLogsEntregaId(null); }}
      />
    </>
  );
}
