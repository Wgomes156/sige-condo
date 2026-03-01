import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
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
import { Comunicado, useUpdateComunicado, useDeleteComunicado } from "@/hooks/useComunicados";
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

interface ComunicadosTableProps {
  comunicados: Comunicado[];
  onEdit: (comunicado: Comunicado) => void;
}

const tipoBadgeVariant: Record<Comunicado["tipo"], "default" | "destructive" | "secondary" | "outline"> = {
  aviso: "default",
  urgente: "destructive",
  manutencao: "secondary",
  assembleia: "outline",
  financeiro: "default",
};

const tipoLabels: Record<Comunicado["tipo"], string> = {
  aviso: "Aviso",
  urgente: "Urgente",
  manutencao: "Manutenção",
  assembleia: "Assembleia",
  financeiro: "Financeiro",
};

const ITEMS_PER_PAGE = 10;

export function ComunicadosTable({ comunicados, onEdit }: ComunicadosTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const updateComunicado = useUpdateComunicado();
  const deleteComunicado = useDeleteComunicado();

  const totalPages = Math.ceil(comunicados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedComunicados = comunicados.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleToggleAtivo = (comunicado: Comunicado) => {
    updateComunicado.mutate({ id: comunicado.id, ativo: !comunicado.ativo });
  };

  const handleDelete = (id: string) => {
    deleteComunicado.mutate(id);
  };

  if (comunicados.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum comunicado encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Publicação</TableHead>
              <TableHead>Expiração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedComunicados.map((comunicado) => (
              <TableRow key={comunicado.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {comunicado.titulo}
                </TableCell>
                <TableCell>{comunicado.condominios?.nome || "-"}</TableCell>
                <TableCell>
                  <Badge variant={tipoBadgeVariant[comunicado.tipo]}>
                    {tipoLabels[comunicado.tipo]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(comunicado.data_publicacao), "dd/MM/yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  {comunicado.data_expiracao
                    ? format(new Date(comunicado.data_expiracao), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={comunicado.ativo ? "default" : "secondary"}>
                    {comunicado.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleAtivo(comunicado)}
                      title={comunicado.ativo ? "Desativar" : "Ativar"}
                    >
                      {comunicado.ativo ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(comunicado)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o comunicado "{comunicado.titulo}"?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(comunicado.id)}>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, comunicados.length)} de {comunicados.length} comunicados
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
