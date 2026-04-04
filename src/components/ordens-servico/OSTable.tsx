import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!ordensServico?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg bg-card font-medium">
        Nenhuma ordem de serviço encontrada.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View de Cards para Mobile (< 640px) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {ordensServico.map((os) => (
          <Card key={os.id} className="overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-primary uppercase">#{os.numero_os}</span>
                    <Badge variant={statusConfig[os.status]?.variant || "outline"} className="h-5 py-0 text-[10px] uppercase">
                      {statusConfig[os.status]?.label || os.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base mt-0.5 leading-tight">{os.solicitante}</h3>
                </div>
                <Badge className={`${prioridadeConfig[os.prioridade]?.className || ""} h-5 uppercase text-[10px] whitespace-nowrap`}>
                  {prioridadeConfig[os.prioridade]?.label || os.prioridade}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4 mt-4 py-3 border-y border-dashed">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Condomínio</span>
                  <span className="font-medium text-right truncate max-w-[200px]">{os.condominio_nome}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Data Solicitação</span>
                  <span className="font-medium text-right">
                    {format(new Date(os.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })} às {os.hora_solicitacao.slice(0, 5)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Operador Atribuído</span>
                  <span className="font-medium text-right truncate max-w-[150px]">
                    {os.atribuido_nome || "Não atribuído"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onView(os)} className="flex-1 h-10">
                  <Eye className="h-4 w-4 mr-2" /> Visu
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEdit(os)} className="flex-1 h-10">
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive h-10 w-10 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[90vw] max-w-lg rounded-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir OS #{os.numero_os}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação removerá permanentemente esta ordem de serviço.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-row gap-2 mt-4">
                      <AlertDialogCancel className="mt-0 flex-1">Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteOS.mutate(os.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View de Tabela para Tablet e Desktop (>= 640px) */}
      <div className="border rounded-md hidden sm:block overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">OS</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead className="hidden lg:table-cell">Condomínio</TableHead>
              <TableHead className="hidden xl:table-cell">Operador</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Prioridade</TableHead>
              <TableHead className="hidden xl:table-cell">Data Atend.</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordensServico.map((os) => (
              <TableRow key={os.id} className="hover:bg-muted/50">
                <TableCell className="font-bold text-xs uppercase shrink-0 whitespace-nowrap">#{os.numero_os}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs">
                      {format(new Date(os.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {os.hora_solicitacao.slice(0, 5)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-medium truncate max-w-[150px]">{os.solicitante}</TableCell>
                <TableCell className="hidden lg:table-cell truncate max-w-[150px]">{os.condominio_nome}</TableCell>
                <TableCell className="hidden xl:table-cell truncate max-w-[150px]">
                  {os.atribuido_nome || (
                    <span className="text-muted-foreground text-[10px]">Não atribuído</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[os.status]?.variant || "outline"} className="whitespace-nowrap h-5 py-0 text-[10px] uppercase">
                    {statusConfig[os.status]?.label || os.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge className={`${prioridadeConfig[os.prioridade]?.className || ""} whitespace-nowrap h-5 py-0 text-[10px] uppercase shadow-none border`}>
                    {prioridadeConfig[os.prioridade]?.label || os.prioridade}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs whitespace-nowrap">
                  {os.data_atendimento
                    ? format(new Date(os.data_atendimento), "dd/MM/yyyy", { locale: ptBR })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(os)}
                      title="Visualizar"
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(os)}
                      title="Editar"
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Excluir" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja excluir a OS #{os.numero_os}?
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
    </div>
  );
}
