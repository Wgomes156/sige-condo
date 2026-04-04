import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Check,
  Eye,
  Trash2,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TransacaoFinanceira,
  useMarcarComoPago,
  useDeleteTransacao,
} from "@/hooks/useFinanceiro";
import { useAuth } from "@/hooks/useAuth";
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
import { EditarTransacaoDialog } from "./EditarTransacaoDialog";

interface TransacoesTableProps {
  data?: TransacaoFinanceira[];
  isLoading: boolean;
  onViewDetails?: (transacao: TransacaoFinanceira) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  atrasado: { label: "Atrasado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

const ITEMS_PER_PAGE = 10;

export function TransacoesTable({
  data,
  isLoading,
  onViewDetails,
}: TransacoesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTransacao, setEditingTransacao] = useState<TransacaoFinanceira | null>(null);
  const { userRole } = useAuth();
  const marcarPago = useMarcarComoPago();
  const deleteTransacao = useDeleteTransacao();

  const isAdmin = userRole === "admin";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const items = data || [];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhuma transação encontrada</p>
      </div>
    );
  }

  const handleMarcarPago = (id: string) => {
    marcarPago.mutate({ id });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteTransacao.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* View de Cards para Mobile (< 640px) */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {paginatedItems.map((item) => {
            const status = statusConfig[item.status] || statusConfig.pendente;
            return (
              <Card key={item.id} className="overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {format(new Date(item.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <h3 className="font-bold text-base line-clamp-1">{item.descricao}</h3>
                    </div>
                    <Badge variant={status.variant} className="whitespace-nowrap">
                      {status.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground block text-xs">Condomínio</span>
                      <span className="font-medium truncate block">{item.condominios?.nome || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Categoria</span>
                      <div className="flex items-center gap-1.5 font-medium">
                        {item.categorias_financeiras && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.categorias_financeiras.cor }}
                          />
                        )}
                        <span className="truncate">{item.categorias_financeiras?.nome || "-"}</span>
                      </div>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-muted-foreground block text-xs">Valor</span>
                      <span className={`text-lg font-bold ${
                        item.tipo === "receita" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {item.tipo === "despesa" ? "- " : ""}
                        {formatCurrency(Number(item.valor))}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1">
                          Ações <MoreHorizontal className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {onViewDetails && (
                          <DropdownMenuItem onClick={() => onViewDetails(item)}>
                            <Eye className="h-4 w-4 mr-2" /> Ver detalhes
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setEditingTransacao(item)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        {item.status !== "pago" && item.status !== "cancelado" && (
                          <DropdownMenuItem onClick={() => handleMarcarPago(item.id)}>
                            <Check className="h-4 w-4 mr-2" /> Marcar como pago
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View de Tabela para Tablet e Desktop (>= 640px) */}
        <div className="rounded-md border hidden sm:block overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden lg:table-cell">Condomínio</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const status = statusConfig[item.status] || statusConfig.pendente;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(item.data_vencimento), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {item.descricao}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate hidden lg:table-cell">
                      {item.condominios?.nome || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.categorias_financeiras ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: item.categorias_financeiras.cor,
                            }}
                          />
                          <span className="truncate max-w-[100px]">
                            {item.categorias_financeiras.nome}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium whitespace-nowrap ${
                        item.tipo === "receita"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.tipo === "despesa" ? "- " : ""}
                      {formatCurrency(Number(item.valor))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewDetails && (
                            <DropdownMenuItem
                              onClick={() => onViewDetails(item)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setEditingTransacao(item)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {item.status !== "pago" &&
                            item.status !== "cancelado" && (
                              <DropdownMenuItem
                                onClick={() => handleMarcarPago(item.id)}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como pago
                              </DropdownMenuItem>
                            )}
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + ITEMS_PER_PAGE, items.length)} de{" "}
              {items.length} registros
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
              <span className="px-4 text-sm">
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode
              ser desfeita.
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

      <EditarTransacaoDialog
        transacao={editingTransacao}
        open={!!editingTransacao}
        onOpenChange={(open) => !open && setEditingTransacao(null)}
      />
    </>
  );
}
