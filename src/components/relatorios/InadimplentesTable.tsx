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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  InadimplenteItem,
  getFaixaAtraso,
  getCorFaixa,
} from "@/hooks/useRelatorioInadimplencia";

interface InadimplentesTableProps {
  data?: InadimplenteItem[];
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const ITEMS_PER_PAGE = 10;

export function InadimplentesTable({ data, isLoading }: InadimplentesTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

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
        <p className="text-muted-foreground">Nenhum inadimplente encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condomínio</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Morador</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Atraso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((item) => {
              const faixa = getFaixaAtraso(item.dias_atraso);
              const cor = getCorFaixa(item.dias_atraso);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    {item.condominio_nome}
                  </TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {item.morador_nome || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.morador_telefone && (
                        <a
                          href={`tel:${item.morador_telefone}`}
                          className="text-primary hover:text-primary/80"
                          title={item.morador_telefone}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                      {item.morador_email && (
                        <a
                          href={`mailto:${item.morador_email}`}
                          className="text-primary hover:text-primary/80"
                          title={item.morador_email}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {!item.morador_telefone && !item.morador_email && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.referencia}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(item.data_vencimento), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{ backgroundColor: cor, color: "#fff" }}
                      className="whitespace-nowrap"
                    >
                      {item.dias_atraso} dias
                    </Badge>
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
            {Math.min(startIndex + ITEMS_PER_PAGE, items.length)} de {items.length}{" "}
            registros
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
  );
}
