import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { BoletoFilters } from "@/hooks/useBoletos";
import { useCondominios } from "@/hooks/useCondominios";

interface FiltrosBoletosProps {
  filters: BoletoFilters;
  onFiltersChange: (filters: BoletoFilters) => void;
}

export function FiltrosBoletos({ filters, onFiltersChange }: FiltrosBoletosProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: condominios } = useCondominios();

  const handleChange = (key: keyof BoletoFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters = Object.values(filters).some((v) => v);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por unidade, morador, número ou referência..."
            value={filters.busca || ""}
            onChange={(e) => handleChange("busca", e.target.value)}
          />
        </div>

        <Select
          value={filters.condominio_id || "all"}
          onValueChange={(v) => handleChange("condominio_id", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Condomínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os condomínios</SelectItem>
            {condominios?.map((cond) => (
              <SelectItem key={cond.id} value={cond.id}>
                {cond.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={(v) => handleChange("status", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="atraso">Atraso</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
              Filtros avançados
            </Button>
          </CollapsibleTrigger>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        <CollapsibleContent className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Data início</Label>
              <Input
                type="date"
                value={filters.dataInicio || ""}
                onChange={(e) => handleChange("dataInicio", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data fim</Label>
              <Input
                type="date"
                value={filters.dataFim || ""}
                onChange={(e) => handleChange("dataFim", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input
                placeholder="Ex: Apto 101"
                value={filters.unidade || ""}
                onChange={(e) => handleChange("unidade", e.target.value)}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
