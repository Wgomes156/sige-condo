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
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
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
import { useState } from "react";
import { useDeleteUnidadeCompleta, type UnidadeCompleta } from "@/hooks/useUnidadesCompleto";
import { Skeleton } from "@/components/ui/skeleton";

interface UnidadesTableProps {
  unidades: UnidadeCompleta[];
  isLoading: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const situacaoLabels: Record<string, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  em_reforma: "Em Reforma",
  desocupada: "Desocupada",
};

const situacaoVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ativa: "default",
  inativa: "secondary",
  em_reforma: "outline",
  desocupada: "destructive",
};

const tipoUnidadeLabels: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  loja: "Loja",
  escritorio: "Escritório",
  sala: "Sala",
};

const statusFinanceiroLabels: Record<string, string> = {
  em_dia: "Em dia",
  inadimplente: "Inadimplente",
  acordo: "Acordo",
};

const statusFinanceiroVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  em_dia: "default",
  inadimplente: "destructive",
  acordo: "outline",
};

export function UnidadesTable({ unidades, isLoading, onView, onEdit }: UnidadesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteUnidade = useDeleteUnidadeCompleta();

  const handleDelete = () => {
    if (deleteId) {
      deleteUnidade.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nº Unidade</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Status Financeiro</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (unidades.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Nenhuma unidade encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em "Nova Unidade" para cadastrar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nº Unidade</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Status Financeiro</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.map((unidade) => (
              <TableRow key={unidade.id}>
                <TableCell className="font-medium">{unidade.codigo}</TableCell>
                <TableCell>{unidade.numero_unidade || "-"}</TableCell>
                <TableCell>{unidade.proprietario_nome || "-"}</TableCell>
                <TableCell>{unidade.inquilino_nome || "-"}</TableCell>
                <TableCell>{tipoUnidadeLabels[unidade.tipo_unidade] || unidade.tipo_unidade}</TableCell>
                <TableCell>{unidade.condominios?.nome || "-"}</TableCell>
                <TableCell>
                  {unidade.bloco || unidade.nome_localizacao ? (
                    <span>
                      {unidade.bloco && `Bloco ${unidade.bloco}`}
                      {unidade.bloco && unidade.andar && ", "}
                      {unidade.andar && `${unidade.andar}º andar`}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={situacaoVariants[unidade.situacao] || "secondary"}>
                    {situacaoLabels[unidade.situacao] || unidade.situacao}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusFinanceiroVariants[unidade.status_financeiro] || "secondary"}>
                    {statusFinanceiroLabels[unidade.status_financeiro] || unidade.status_financeiro}
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
                      <DropdownMenuItem onClick={() => onView(unidade.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(unidade.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(unidade.id)}
                        className="text-destructive focus:text-destructive"
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
            <AlertDialogTitle>Excluir unidade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os dados relacionados a esta unidade serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
