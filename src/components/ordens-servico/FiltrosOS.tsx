import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdemServicoFilters, OsStatus, OsPrioridade } from "@/hooks/useOrdensServico";

interface FiltrosOSProps {
  filters: OrdemServicoFilters;
  onFiltersChange: (filters: OrdemServicoFilters) => void;
}

export function FiltrosOS({ filters, onFiltersChange }: FiltrosOSProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por solicitante, condomínio ou descrição..."
          value={filters.search || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-10"
        />
      </div>

      <Select
        value={filters.status || "todos"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === "todos" ? "" : (value as OsStatus),
          })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="aberta">Aberta</SelectItem>
          <SelectItem value="em_andamento">Em Andamento</SelectItem>
          <SelectItem value="concluida">Concluída</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.prioridade || "todas"}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            prioridade: value === "todas" ? "" : (value as OsPrioridade),
          })
        }
      >
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas Prioridades</SelectItem>
          <SelectItem value="urgente">Urgente</SelectItem>
          <SelectItem value="periodico">Periódico</SelectItem>
          <SelectItem value="nao_urgente">Não Urgente</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
