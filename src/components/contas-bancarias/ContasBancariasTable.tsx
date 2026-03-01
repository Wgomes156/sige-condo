import { useState } from "react";
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
  DropdownMenuSeparator,
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
import {
  Building2,
  Landmark,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { ContaBancaria } from "@/hooks/useContasBancarias";

interface ContasBancariasTableProps {
  contas: ContaBancaria[];
  loading: boolean;
  onEdit: (conta: ContaBancaria) => void;
  onDelete: (id: string) => Promise<boolean>;
  onSetDefault: (
    id: string,
    vinculoId: string,
    tipo: "administradora" | "condominio"
  ) => Promise<boolean>;
}

export function ContasBancariasTable({
  contas,
  loading,
  onEdit,
  onDelete,
  onSetDefault,
}: ContasBancariasTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<ContaBancaria | null>(null);

  const handleDeleteClick = (conta: ContaBancaria) => {
    setContaToDelete(conta);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (contaToDelete) {
      await onDelete(contaToDelete.id);
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    }
  };

  const handleSetDefault = async (conta: ContaBancaria) => {
    const vinculoId = conta.administradora_id || conta.condominio_id;
    const tipo = conta.administradora_id ? "administradora" : "condominio";
    if (vinculoId) {
      await onSetDefault(conta.id, vinculoId, tipo);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">
          Carregando contas...
        </div>
      </div>
    );
  }

  if (contas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Landmark className="h-12 w-12 mb-4" />
        <p>Nenhuma conta bancária cadastrada</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome / Banco</TableHead>
            <TableHead>Agência / Conta</TableHead>
            <TableHead>Titular</TableHead>
            <TableHead>Vinculação</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-[80px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{conta.nome_conta}</span>
                    {conta.conta_padrao && (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {conta.banco_codigo} - {conta.banco_nome}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-mono text-sm">
                  <div>
                    Ag: {conta.agencia}
                    {conta.agencia_digito && `-${conta.agencia_digito}`}
                  </div>
                  <div>
                    Cc: {conta.conta}
                    {conta.conta_digito && `-${conta.conta_digito}`}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{conta.titular_nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {conta.titular_documento}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {conta.condominio_nome ||
                        conta.administradora_nome ||
                        "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {conta.administradora_id
                        ? "Administradora"
                        : "Condomínio"}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={conta.ativa ? "default" : "secondary"}>
                  {conta.ativa ? "Ativa" : "Inativa"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(conta)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {!conta.conta_padrao && (
                      <DropdownMenuItem onClick={() => handleSetDefault(conta)}>
                        <Star className="mr-2 h-4 w-4" />
                        Definir como Padrão
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(conta)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a conta "{contaToDelete?.nome_conta}
              "? Esta ação não pode ser desfeita.
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
    </>
  );
}
