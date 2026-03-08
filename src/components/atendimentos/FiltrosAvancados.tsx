import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AtendimentoFilters } from "@/hooks/useAtendimentos";

interface FiltrosAvancadosProps {
  filters: AtendimentoFilters;
  onFiltersChange: (filters: AtendimentoFilters) => void;
}

const canaisContato = [
  "Telefone",
  "WhatsApp",
  "E-mail",
  "Presencial",
  "Chat",
  "Redes Sociais",
];

const statusOptions = [
  "Em andamento",
  "Tem demanda",
  "Finalizado",
  "Aguardando retorno",
  "Com Contrato",
  "Finalizado sem contrato",
];

const motivosContato = [
  "Dúvida",
  "Reclamação",
  "Solicitação de serviço",
  "Informação",
  "Orçamento",
  "Cancelamento",
  "Outros",
];

export function FiltrosAvancados({ filters, onFiltersChange }: FiltrosAvancadosProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AtendimentoFilters>(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClear = () => {
    const clearedFilters: AtendimentoFilters = {
      busca: filters.busca, // Mantém apenas a busca
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleRemoveFilter = (key: keyof AtendimentoFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    setLocalFilters(newFilters);
  };

  // Conta filtros ativos (exceto busca)
  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== "busca" && value && value !== "todos"
  ).length;

  // Lista de filtros ativos para exibir como badges
  const activeFiltersList = Object.entries(filters)
    .filter(([key, value]) => key !== "busca" && value && value !== "todos")
    .map(([key, value]) => ({
      key: key as keyof AtendimentoFilters,
      label: getFilterLabel(key, value as string),
    }));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filtros Avançados</SheetTitle>
              <SheetDescription>
                Combine filtros para refinar sua busca
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Período */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Período</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">De</Label>
                    <Input
                      type="date"
                      value={localFilters.dataInicio || ""}
                      onChange={(e) =>
                        setLocalFilters({ ...localFilters, dataInicio: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Até</Label>
                    <Input
                      type="date"
                      value={localFilters.dataFim || ""}
                      onChange={(e) =>
                        setLocalFilters({ ...localFilters, dataFim: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={localFilters.status || "todos"}
                  onValueChange={(value) =>
                    setLocalFilters({ ...localFilters, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os status</SelectItem>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Canal */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Canal de Contato</Label>
                <Select
                  value={localFilters.canal || "todos"}
                  onValueChange={(value) =>
                    setLocalFilters({ ...localFilters, canal: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os canais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os canais</SelectItem>
                    {canaisContato.map((canal) => (
                      <SelectItem key={canal} value={canal}>
                        {canal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Motivo do Contato</Label>
                <Select
                  value={localFilters.motivo || "todos"}
                  onValueChange={(value) =>
                    setLocalFilters({ ...localFilters, motivo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os motivos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os motivos</SelectItem>
                    {motivosContato.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Operador */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Operador</Label>
                <Input
                  placeholder="Nome do operador"
                  value={localFilters.operador || ""}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, operador: e.target.value })
                  }
                />
              </div>
            </div>

            <SheetFooter className="flex gap-2">
              <Button variant="outline" onClick={handleClear} className="flex-1">
                Limpar
              </Button>
              <Button onClick={handleApply} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Aplicar Filtros
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Badges dos filtros ativos */}
      {activeFiltersList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFiltersList.map(({ key, label }) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {label}
              <button
                onClick={() => handleRemoveFilter(key)}
                className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={handleClear}
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
}

function getFilterLabel(key: string, value: string): string {
  switch (key) {
    case "status":
      return `Status: ${value}`;
    case "canal":
      return `Canal: ${value}`;
    case "motivo":
      return `Motivo: ${value}`;
    case "operador":
      return `Operador: ${value}`;
    case "dataInicio":
      return `De: ${formatDate(value)}`;
    case "dataFim":
      return `Até: ${formatDate(value)}`;
    default:
      return value;
  }
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}
