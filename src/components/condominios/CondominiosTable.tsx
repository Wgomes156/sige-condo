import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Edit, Eye, MapPin, Phone, Trash2, User } from "lucide-react";
import { useCondominios, useDeleteCondominio, CondominioFilters, Condominio } from "@/hooks/useCondominios";
import { useAuth } from "@/hooks/useAuth";

interface CondominiosTableProps {
  filters: CondominioFilters;
  onEdit: (condominio: Condominio) => void;
  onView: (condominio: Condominio) => void;
}

export function CondominiosTable({ filters, onEdit, onView }: CondominiosTableProps) {
  const { data: condominios, isLoading, error } = useCondominios(filters);
  const deleteCondominio = useDeleteCondominio();
  const { userRole } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [condominioToDelete, setCondominioToDelete] = useState<Condominio | null>(null);

  const canDelete = userRole === "admin";

  const handleDeleteClick = (condominio: Condominio) => {
    setCondominioToDelete(condominio);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (condominioToDelete) {
      await deleteCondominio.mutateAsync({ 
        id: condominioToDelete.id, 
        nome: condominioToDelete.nome 
      });
      setDeleteDialogOpen(false);
      setCondominioToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-2">
        <p>Erro ao carregar condomínios</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (!condominios || condominios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
        <Building2 className="h-12 w-12 opacity-50" />
        <p>Nenhum condomínio encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {condominios.length} condomínio(s) encontrado(s)
      </p>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Condomínio</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Síndico</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Características</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {condominios.map((condominio) => (
              <TableRow key={condominio.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{condominio.nome}</p>
                    {condominio.cnpj && (
                      <p className="text-xs text-muted-foreground">
                        CNPJ: {condominio.cnpj}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      {condominio.endereco && (
                        <p className="text-sm">{condominio.endereco}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {[condominio.cidade, condominio.uf].filter(Boolean).join(" - ") || "Não informado"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {condominio.tem_sindico && condominio.sindico_nome ? (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm">{condominio.sindico_nome}</p>
                        {condominio.sindico_telefone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {condominio.sindico_telefone}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sem síndico</span>
                  )}
                </TableCell>
                <TableCell>
                  {condominio.tipo_imovel ? (
                    <Badge variant="outline">{condominio.tipo_imovel}</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {condominio.quantidade_unidades && (
                      <Badge variant="secondary" className="text-xs">
                        {condominio.quantidade_unidades} unid.
                      </Badge>
                    )}
                    {condominio.quantidade_blocos && (
                      <Badge variant="secondary" className="text-xs">
                        {condominio.quantidade_blocos} blocos
                      </Badge>
                    )}
                    {condominio.tem_seguranca && (
                      <Badge variant="outline" className="text-xs bg-primary/10">
                        Segurança
                      </Badge>
                    )}
                    {condominio.tem_monitoramento && (
                      <Badge variant="outline" className="text-xs bg-primary/10">
                        Monitoramento
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(condominio)}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(condominio)}
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(condominio)}
                        title="Excluir"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o condomínio "{condominioToDelete?.nome}"? 
              Esta ação não pode ser desfeita e todos os dados vinculados serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
