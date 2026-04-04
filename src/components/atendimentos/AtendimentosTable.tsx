import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {atendimentos.length} atendimento{atendimentos.length !== 1 ? "s" : ""} encontrado{atendimentos.length !== 1 ? "s" : ""}
      </div>

      {/* View de Cards para Mobile (< 640px) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {atendimentos.map((atendimento) => (
          <Card key={atendimento.id} className="overflow-hidden border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {format(new Date(atendimento.data), "dd/MM/yyyy", { locale: ptBR })} - {atendimento.hora?.slice(0, 5)}
                  </p>
                  <h3 className="font-bold text-lg">{atendimento.cliente_nome}</h3>
                </div>
                <Badge variant="outline" className={`${getStatusColor(atendimento.status)} whitespace-nowrap`}>
                  {atendimento.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground block text-xs">Condomínio</span>
                  <span className="font-medium truncate block">{atendimento.condominio_nome}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Motivo</span>
                  <span className="font-medium truncate block">{atendimento.motivo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Telefone</span>
                  <span className="font-medium">{atendimento.cliente_telefone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Canal</span>
                  <span className="font-medium">{atendimento.canal}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => onView?.(atendimento)} className="flex-1">
                  <Eye className="h-4 w-4 mr-2" /> Detalhes
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit?.(atendimento)} className="flex-1">
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setAtendimentoToDelete(atendimento)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View de Tabela para Tablet e Desktop (>= 640px) */}
      <div className="rounded-md border hidden sm:block overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead>Condomínio</TableHead>
              <TableHead className="hidden md:table-cell">Canal</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="hidden xl:table-cell">Operador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
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
                <TableCell className="hidden lg:table-cell">{atendimento.cliente_telefone}</TableCell>
                <TableCell className="truncate max-w-[150px]">{atendimento.condominio_nome}</TableCell>
                <TableCell className="hidden md:table-cell">{atendimento.canal}</TableCell>
                <TableCell>{atendimento.motivo}</TableCell>
                <TableCell className="hidden xl:table-cell">{atendimento.operador_nome}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(atendimento.status)}>
                    {atendimento.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView?.(atendimento)}
                      title="Visualizar"
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit?.(atendimento)}
                      title="Editar"
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAtendimentoToDelete(atendimento)}
                      title="Excluir"
                      className="h-8 w-8 text-destructive hover:text-destructive"
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
