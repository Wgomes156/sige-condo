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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MoreHorizontal, Pencil, Trash2, History, DollarSign, Percent, TrendingUp, Building2, Key, Plus } from "lucide-react";
import { Servico, CategoriaServico } from "@/hooks/useServicos";

interface ServicosTableProps {
  servicosPorCategoria: (CategoriaServico & { servicos: Servico[] })[];
  onEdit: (servico: Servico) => void;
  onDelete: (servico: Servico) => void;
  onViewHistory: (servico: Servico) => void;
  filtroCategoria?: string;
  filtroBusca?: string;
  filtroTipo?: string;
}

const icones: Record<string, React.ElementType> = {
  Building2,
  Key,
  Plus,
};

export function ServicosTable({
  servicosPorCategoria,
  onEdit,
  onDelete,
  onViewHistory,
  filtroCategoria,
  filtroBusca,
  filtroTipo,
}: ServicosTableProps) {
  const getTipoIcon = (tipo: string | null) => {
    switch (tipo) {
      case "fixo":
        return <DollarSign className="h-4 w-4" />;
      case "percentual":
        return <Percent className="h-4 w-4" />;
      case "variavel":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTipoBadge = (tipo: string | null) => {
    const variants: Record<string, { label: string; className: string }> = {
      fixo: { label: "Fixo", className: "bg-blue-100 text-blue-800" },
      percentual: { label: "Percentual", className: "bg-purple-100 text-purple-800" },
      variavel: { label: "Variável", className: "bg-amber-100 text-amber-800" },
    };

    const config = variants[tipo || "fixo"] || variants.fixo;
    return (
      <Badge variant="outline" className={config.className}>
        {getTipoIcon(tipo)}
        <span className="ml-1">{config.label}</span>
      </Badge>
    );
  };

  // Filtrar categorias e serviços
  const categoriasFiltradas = servicosPorCategoria
    .filter((cat) => !filtroCategoria || cat.id === filtroCategoria)
    .map((cat) => ({
      ...cat,
      servicos: cat.servicos.filter((s) => {
        const matchBusca =
          !filtroBusca ||
          s.nome_servico.toLowerCase().includes(filtroBusca.toLowerCase()) ||
          s.descricao?.toLowerCase().includes(filtroBusca.toLowerCase());
        const matchTipo = !filtroTipo || s.tipo_valor === filtroTipo;
        return matchBusca && matchTipo;
      }),
    }))
    .filter((cat) => cat.servicos.length > 0);

  if (categoriasFiltradas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum serviço encontrado com os filtros aplicados.
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={categoriasFiltradas.map((c) => c.id)} className="space-y-4">
      {categoriasFiltradas.map((categoria) => {
        const IconComponent = icones[categoria.icone || "Package"] || Plus;

        return (
          <AccordionItem
            key={categoria.id}
            value={categoria.id}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${categoria.cor}20` }}
                >
                  <IconComponent
                    className="h-5 w-5"
                    style={{ color: categoria.cor || "#3B82F6" }}
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{categoria.nome_categoria}</h3>
                  <p className="text-sm text-muted-foreground">
                    {categoria.servicos.length} serviço(s)
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Serviço</TableHead>
                    <TableHead className="w-[35%]">Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoria.servicos.map((servico) => (
                    <TableRow key={servico.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {!servico.ativo && (
                            <Badge variant="secondary" className="text-xs">
                              Inativo
                            </Badge>
                          )}
                          {servico.nome_servico}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="line-clamp-2">{servico.descricao}</span>
                      </TableCell>
                      <TableCell className="font-medium text-primary">
                        {servico.valor}
                      </TableCell>
                      <TableCell>{getTipoBadge(servico.tipo_valor)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(servico)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onViewHistory(servico)}>
                              <History className="h-4 w-4 mr-2" />
                              Histórico
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(servico)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
