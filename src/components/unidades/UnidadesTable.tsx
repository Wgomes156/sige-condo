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
import { Eye, Pencil, Trash2, MoreHorizontal, User, Home, MapPin, CreditCard } from "lucide-react";
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
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (unidades.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center bg-card">
        <p className="text-muted-foreground font-medium">Nenhuma unidade encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          Clique em "Nova Unidade" para cadastrar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* View de Cards para Mobile (< 640px) */}
        <div className="grid grid-cols-1 gap-4 sm:hidden">
          {unidades.map((unidade) => (
            <Card key={unidade.id} className="overflow-hidden border-l-4 border-l-primary shadow-md">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-tighter">
                      CÓD: {unidade.codigo}
                    </p>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Unidade {unidade.numero_unidade || "-"}
                    </h3>
                  </div>
                  <Badge variant={situacaoVariants[unidade.situacao] || "secondary"}>
                    {situacaoLabels[unidade.situacao] || unidade.situacao}
                  </Badge>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      <strong>Prop:</strong> {unidade.proprietario_nome || "Não informado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {unidade.condominios?.nome || "-"} 
                      {(unidade.bloco || unidade.andar) && " • "}
                      {unidade.bloco && `Bl ${unidade.bloco}`}
                      {unidade.andar && ` • ${unidade.andar}º andar`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Badge variant={statusFinanceiroVariants[unidade.status_financeiro] || "secondary"} className="h-5 py-0">
                      {statusFinanceiroLabels[unidade.status_financeiro] || unidade.status_financeiro}
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => onView(unidade.id)} className="flex-1 h-10">
                    <Eye className="h-4 w-4 mr-2" /> Detalhes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(unidade.id)} className="flex-1 h-10">
                    <Pencil className="h-4 w-4 mr-2" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setDeleteId(unidade.id)} 
                    className="text-destructive h-10 w-10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View de Tabela para Tablet e Desktop (>= 640px) */}
        <div className="border rounded-lg hidden sm:block overflow-x-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="hidden lg:table-cell">Proprietário</TableHead>
                <TableHead className="hidden xl:table-cell">Inquilino</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead>Condomínio</TableHead>
                <TableHead className="hidden xl:table-cell">Localização</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="hidden lg:table-cell">Financeiro</TableHead>
                <TableHead className="w-[80px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unidades.map((unidade) => (
                <TableRow key={unidade.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs font-bold">{unidade.codigo}</TableCell>
                  <TableCell className="font-medium">{unidade.numero_unidade || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell truncate max-w-[150px]">{unidade.proprietario_nome || "-"}</TableCell>
                  <TableCell className="hidden xl:table-cell truncate max-w-[150px]">{unidade.inquilino_nome || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tipoUnidadeLabels[unidade.tipo_unidade] || unidade.tipo_unidade}
                  </TableCell>
                  <TableCell className="truncate max-w-[150px]">{unidade.condominios?.nome || "-"}</TableCell>
                  <TableCell className="hidden xl:table-cell whitespace-nowrap">
                    {unidade.bloco || unidade.andar ? (
                      <span className="text-xs">
                        {unidade.bloco && `Bloco ${unidade.bloco}`}
                        {unidade.bloco && unidade.andar && ", "}
                        {unidade.andar && `${unidade.andar}º andar`}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={situacaoVariants[unidade.situacao] || "secondary"} className="whitespace-nowrap">
                      {situacaoLabels[unidade.situacao] || unidade.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge variant={statusFinanceiroVariants[unidade.status_financeiro] || "secondary"} className="whitespace-nowrap">
                      {statusFinanceiroLabels[unidade.status_financeiro] || unidade.status_financeiro}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
