import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrdemServico, useDeleteOrdemServico } from "@/hooks/useOrdensServico";

interface OSTableProps {
  ordensServico: OrdemServico[] | undefined;
  isLoading: boolean;
  onEdit: (os: OrdemServico) => void;
  onView: (os: OrdemServico) => void;
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

export function OSTable({ ordensServico, isLoading, onEdit, onView }: OSTableProps) {
  const deleteOS = useDeleteOrdemServico();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!ordensServico?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma ordem de serviço encontrada.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Nº OS</TableHead>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Solicitante</TableHead>
            <TableHead>Condomínio</TableHead>
            <TableHead>Operador</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioridade</TableHead>
            <TableHead>Data Atend.</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordensServico.map((os) => (
            <TableRow key={os.id}>
              <TableCell className="font-medium">#{os.numero_os}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>
                    {format(new Date(os.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {os.hora_solicitacao.slice(0, 5)}
                  </span>
                </div>
              </TableCell>
              <TableCell>{os.solicitante}</TableCell>
              <TableCell>{os.condominio_nome}</TableCell>
              <TableCell>
                {os.atribuido_nome || (
                  <span className="text-muted-foreground text-xs">Não atribuído</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusConfig[os.status]?.variant || "outline"}>
                  {statusConfig[os.status]?.label || os.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={prioridadeConfig[os.prioridade]?.className || ""}>
                  {prioridadeConfig[os.prioridade]?.label || os.prioridade}
                </Badge>
              </TableCell>
              <TableCell>
                {os.data_atendimento
                  ? format(new Date(os.data_atendimento), "dd/MM/yyyy", { locale: ptBR })
                  : "Não informado"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(os)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(os)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a OS #{os.numero_os}? Esta ação
                          não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteOS.mutate(os.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
