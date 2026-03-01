import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Servico, ServicoHistorico } from "@/hooks/useServicos";

interface HistoricoServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico: Servico | null;
  buscarHistorico: (servicoId: string) => Promise<ServicoHistorico[]>;
}

export function HistoricoServicoDialog({
  open,
  onOpenChange,
  servico,
  buscarHistorico,
}: HistoricoServicoDialogProps) {
  const [historico, setHistorico] = useState<ServicoHistorico[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && servico) {
      setLoading(true);
      buscarHistorico(servico.id)
        .then(setHistorico)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, servico, buscarHistorico]);

  const formatarCampo = (campo: string) => {
    const mapa: Record<string, string> = {
      nome_servico: "Nome",
      descricao: "Descrição",
      valor: "Valor",
      tipo_valor: "Tipo de Valor",
      categoria_id: "Categoria",
      observacoes: "Observações",
      ativo: "Status",
    };
    return mapa[campo] || campo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Histórico de Alterações
            {servico && (
              <span className="text-muted-foreground font-normal ml-2">
                - {servico.nome_servico}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma alteração registrada para este serviço.
          </div>
        ) : (
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Valor Anterior</TableHead>
                  <TableHead>Novo Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {item.created_at
                        ? format(new Date(item.created_at), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatarCampo(item.campo_alterado)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[150px] truncate">
                      {item.valor_anterior || "-"}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {item.valor_novo || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
