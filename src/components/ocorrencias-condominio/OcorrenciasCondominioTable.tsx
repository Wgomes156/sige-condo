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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOcorrenciasCondominio,
  useDeleteOcorrenciaCondominio,
  OcorrenciaCondominio,
  OcorrenciaFilters,
  TipoOcorrencia,
  StatusOcorrencia,
  PrioridadeOcorrencia,
} from "@/hooks/useOcorrenciasCondominio";

interface OcorrenciasCondominioTableProps {
  filters?: OcorrenciaFilters;
  onEdit: (ocorrencia: OcorrenciaCondominio) => void;
  onView: (ocorrencia: OcorrenciaCondominio) => void;
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

export function OcorrenciasCondominioTable({
  filters,
  onEdit,
  onView,
}: OcorrenciasCondominioTableProps) {
  const { data: ocorrencias, isLoading } = useOcorrenciasCondominio(filters);
  const deleteMutation = useDeleteOcorrenciaCondominio();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!ocorrencias?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma ocorrência encontrada.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ocorrencias.map((ocorrencia) => (
              <TableRow key={ocorrencia.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(ocorrencia.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {ocorrencia.condominios?.nome || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {TIPOS_LABEL[ocorrencia.tipo_ocorrencia]}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {ocorrencia.titulo}
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {ocorrencia.local_ocorrencia || "-"}
                </TableCell>
                <TableCell>
                  <Badge className={PRIORIDADE_CONFIG[ocorrencia.prioridade].className}>
                    {PRIORIDADE_CONFIG[ocorrencia.prioridade].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_CONFIG[ocorrencia.status].variant}>
                    {STATUS_CONFIG[ocorrencia.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(ocorrencia)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(ocorrencia)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(ocorrencia.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ocorrência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
