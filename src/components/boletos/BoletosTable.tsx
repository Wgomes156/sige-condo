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
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Printer,
  Download,
  Pencil,
} from "lucide-react";
import { Boleto, useMarcarBoletoPago, useCancelarBoleto, useDeleteBoleto } from "@/hooks/useBoletos";
import { gerarBoletoPDF, imprimirBoleto } from "@/lib/boletoExportUtils";
import { BoletoPreviewModal } from "./BoletoPreviewModal";
import { EditarBoletoDialog } from "./EditarBoletoDialog";

interface BoletosTableProps {
  boletos: Boleto[];
  isLoading: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  pago: { label: "Pago", variant: "default" },
  atraso: { label: "Atraso", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

export function BoletosTable({ boletos, isLoading }: BoletosTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewBoleto, setPreviewBoleto] = useState<Boleto | null>(null);
  const [editBoleto, setEditBoleto] = useState<Boleto | null>(null);
  const itemsPerPage = 10;

  const marcarPago = useMarcarBoletoPago();
  const cancelar = useCancelarBoleto();
  const deleteBoleto = useDeleteBoleto();

  const totalPages = Math.ceil(boletos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBoletos = boletos.slice(startIndex, startIndex + itemsPerPage);

  const handleMarcarPago = (id: string) => {
    marcarPago.mutate({ id });
  };

  const handleCancelar = (id: string) => {
    cancelar.mutate(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteBoleto.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getDiasAtraso = (dataVencimento: string, status: string) => {
    if (status === "pago" || status === "cancelado") return null;
    const hoje = new Date();
    const vencimento = new Date(dataVencimento + "T12:00:00");
    const diff = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (boletos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">Nenhum boleto encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">
          Cadastre boletos manualmente ou importe em lote
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condomínio</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Morador</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBoletos.map((boleto) => {
              const diasAtraso = getDiasAtraso(boleto.data_vencimento, boleto.status);
              const config = statusConfig[boleto.status] || statusConfig.pendente;

              return (
                <TableRow key={boleto.id}>
                  <TableCell className="font-medium">
                    {boleto.condominios?.nome || "-"}
                  </TableCell>
                  <TableCell>{boleto.unidade}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{boleto.morador_nome || "-"}</span>
                      <div className="flex gap-2 mt-1">
                        {boleto.morador_email && (
                          <a
                            href={`mailto:${boleto.morador_email}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Mail className="w-3 h-3" />
                          </a>
                        )}
                        {boleto.morador_telefone && (
                          <a
                            href={`tel:${boleto.morador_telefone}`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {boleto.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {new Date(boleto.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      {diasAtraso && (
                        <span className="text-xs text-destructive">
                          {diasAtraso} dia{diasAtraso !== 1 ? "s" : ""} de atraso
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{boleto.referencia}</span>
                      {boleto.nosso_numero && (
                        <span className="text-xs text-muted-foreground">
                          Nº {boleto.nosso_numero}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPreviewBoleto(boleto)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditBoleto(boleto)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => imprimirBoleto(boleto)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Imprimir
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => gerarBoletoPDF(boleto)}>
                          <Download className="mr-2 h-4 w-4" />
                          Baixar PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {boleto.status !== "pago" && boleto.status !== "cancelado" && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarcarPago(boleto.id)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                              Marcar como pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelar(boleto.id)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar boleto
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(boleto.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, boletos.length)} de{" "}
            {boletos.length} registros
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
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
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir boleto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O boleto será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BoletoPreviewModal
        boleto={previewBoleto}
        open={!!previewBoleto}
        onOpenChange={(open) => !open && setPreviewBoleto(null)}
      />

      <EditarBoletoDialog
        boleto={editBoleto}
        open={!!editBoleto}
        onOpenChange={(open) => !open && setEditBoleto(null)}
      />
    </div>
  );
}
