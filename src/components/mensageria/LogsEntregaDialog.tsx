import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EntregaStatusBadge } from "./EntregaStatusBadge";
import type { StatusEntrega } from "@/hooks/useMensageria";

interface LogEntrega {
  id: string;
  tentativa: number;
  status: string;
  erro: string | null;
  criado_em: string;
}

interface Props {
  entregaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatarData(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
}

export function LogsEntregaDialog({ entregaId, open, onOpenChange }: Props) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["mensageria-logs", entregaId],
    queryFn: async () => {
      if (!entregaId) return [] as LogEntrega[];
      const { data, error } = await (supabase as any)
        .from("mensageria_logs")
        .select("id, tentativa, status, erro, criado_em")
        .eq("entrega_id", entregaId)
        .order("tentativa", { ascending: true });

      if (error) throw error;
      return (data || []) as LogEntrega[];
    },
    enabled: !!entregaId && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Logs de Entrega</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Nenhuma tentativa registrada ainda.
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Tentativa</TableHead>
                  <TableHead className="w-28">Status</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="w-40 text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-center">
                      {log.tentativa}
                    </TableCell>
                    <TableCell>
                      <EntregaStatusBadge status={log.status as StatusEntrega} />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.erro ? (
                        <span className="text-destructive text-xs font-mono break-all">
                          {log.erro}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatarData(log.criado_em)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
