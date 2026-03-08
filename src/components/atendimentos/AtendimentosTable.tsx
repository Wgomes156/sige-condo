import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAtendimentos, useDeleteAtendimento, type AtendimentoFilters, type Atendimento } from "@/hooks/useAtendimentos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AtendimentosTableProps {
  filters?: AtendimentoFilters;
  onView?: (atendimento: Atendimento) => void;
  onEdit?: (atendimento: Atendimento) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Em andamento":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "Tem demanda":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    case "Finalizado":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "Aguardando retorno":
      return "bg-orange-500/20 text-orange-700 border-orange-500/30";
    case "Com Contrato":
      return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
    case "Finalizado sem contrato":
      return "bg-slate-500/20 text-slate-700 border-slate-500/30";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/30";
  }
};

export function AtendimentosTable({ filters, onView, onEdit }: AtendimentosTableProps) {
  const { data: atendimentos, isLoading, error } = useAtendimentos(filters);
  const deleteAtendimento = useDeleteAtendimento();
  const [atendimentoToDelete, setAtendimentoToDelete] = useState<Atendimento | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Erro ao carregar atendimentos. Verifique se você está logado.</p>
      </div>
    );
  }

  if (!atendimentos || atendimentos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Nenhum atendimento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">
        {atendimentos.length} atendimento{atendimentos.length !== 1 ? "s" : ""} encontrado{atendimentos.length !== 1 ? "s" : ""}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[130px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {atendimentos.map((atendimento) => (
              <TableRow key={atendimento.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {atendimento.hora?.slice(0, 5)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{atendimento.cliente_nome}</TableCell>
                <TableCell>{atendimento.cliente_telefone}</TableCell>
                <TableCell>{atendimento.condominio_nome}</TableCell>
                <TableCell>{atendimento.canal}</TableCell>
                <TableCell>{atendimento.motivo}</TableCell>
                <TableCell>{atendimento.operador_nome}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(atendimento.status)}>
                    {atendimento.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(atendimento)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(atendimento)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAtendimentoToDelete(atendimento)}
                      title="Excluir"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!atendimentoToDelete} onOpenChange={(open) => !open && setAtendimentoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Atendimento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o atendimento de{" "}
              <strong>{atendimentoToDelete?.cliente_nome}</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAtendimento.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (atendimentoToDelete) {
                  deleteAtendimento.mutate(atendimentoToDelete, {
                    onSuccess: () => setAtendimentoToDelete(null),
                  });
                }
              }}
              disabled={deleteAtendimento.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAtendimento.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
