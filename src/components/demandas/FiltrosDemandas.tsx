import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { CategoriaDemanda } from "@/hooks/useDemandas";

interface FiltrosDemandasProps {
  busca: string;
  setBusca: (value: string) => void;
  filtroStatus: string;
  setFiltroStatus: (value: string) => void;
  filtroCategoria: string;
  setFiltroCategoria: (value: string) => void;
  categorias: CategoriaDemanda[];
}

export function FiltrosDemandas({
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  filtroCategoria,
  setFiltroCategoria,
  categorias,
}: FiltrosDemandasProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar serviço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={filtroStatus} onValueChange={setFiltroStatus}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value="vencido">⚫ Vencidos</SelectItem>
          <SelectItem value="urgente">🔴 Urgentes</SelectItem>
          <SelectItem value="atencao">🟡 Atenção</SelectItem>
          <SelectItem value="em_dia">🟢 Em dia</SelectItem>
          <SelectItem value="sob_demanda">⚪ Sob demanda</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as categorias</SelectItem>
          {categorias.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
