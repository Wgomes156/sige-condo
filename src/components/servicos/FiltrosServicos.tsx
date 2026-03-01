import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { CategoriaServico } from "@/hooks/useServicos";

interface FiltrosServicosProps {
  categorias: CategoriaServico[];
  busca: string;
  setBusca: (value: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (value: string) => void;
  filtroTipo: string;
  setFiltroTipo: (value: string) => void;
}

export function FiltrosServicos({
  categorias,
  busca,
  setBusca,
  filtroCategoria,
  setFiltroCategoria,
  filtroTipo,
  setFiltroTipo,
}: FiltrosServicosProps) {
  const limparFiltros = () => {
    setBusca("");
    setFiltroCategoria("");
    setFiltroTipo("");
  };

  const temFiltros = busca || filtroCategoria || filtroTipo;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todas as categorias</SelectItem>
          {categorias.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.nome_categoria}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filtroTipo} onValueChange={setFiltroTipo}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipo de valor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Todos os tipos</SelectItem>
          <SelectItem value="fixo">Valor Fixo</SelectItem>
          <SelectItem value="percentual">Percentual</SelectItem>
          <SelectItem value="variavel">Variável</SelectItem>
        </SelectContent>
      </Select>

      {temFiltros && (
        <Button variant="ghost" size="icon" onClick={limparFiltros}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
