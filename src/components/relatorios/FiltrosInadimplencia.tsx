import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { InadimplenciaFilters } from "@/hooks/useRelatorioInadimplencia";

interface FiltrosInadimplenciaProps {
  filters: InadimplenciaFilters;
  onFiltersChange: (filters: InadimplenciaFilters) => void;
}

export function FiltrosInadimplencia({
  filters,
  onFiltersChange,
}: FiltrosInadimplenciaProps) {
  const { data: condominios } = useCondominios();
  const [localFilters, setLocalFilters] = useState<InadimplenciaFilters>(filters);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange(localFilters);
    }, 300);
    return () => clearTimeout(timeout);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = () => {
    const cleared: InadimplenciaFilters = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters =
    localFilters.condominio_id ||
    localFilters.faixa_atraso ||
    localFilters.valor_minimo !== undefined ||
    localFilters.valor_maximo !== undefined ||
    localFilters.apenas_com_contato;

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label htmlFor="condominio">Condomínio</Label>
          <Select
            value={localFilters.condominio_id || "all"}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                condominio_id: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger id="condominio">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {condominios?.map((cond) => (
                <SelectItem key={cond.id} value={cond.id}>
                  {cond.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faixa">Faixa de Atraso</Label>
          <Select
            value={localFilters.faixa_atraso || "all"}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                faixa_atraso: value === "all" ? undefined : value,
              })
            }
          >
            <SelectTrigger id="faixa">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="1-30">1-30 dias</SelectItem>
              <SelectItem value="31-60">31-60 dias</SelectItem>
              <SelectItem value="61-90">61-90 dias</SelectItem>
              <SelectItem value=">90">&gt; 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_min">Valor Mínimo</Label>
          <Input
            id="valor_min"
            type="number"
            placeholder="R$ 0,00"
            value={localFilters.valor_minimo ?? ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                valor_minimo: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor_max">Valor Máximo</Label>
          <Input
            id="valor_max"
            type="number"
            placeholder="R$ 99.999,99"
            value={localFilters.valor_maximo ?? ""}
            onChange={(e) =>
              setLocalFilters({
                ...localFilters,
                valor_maximo: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label className="text-transparent">Opções</Label>
          <div className="flex items-center space-x-2 h-10">
            <Checkbox
              id="com_contato"
              checked={localFilters.apenas_com_contato || false}
              onCheckedChange={(checked) =>
                setLocalFilters({
                  ...localFilters,
                  apenas_com_contato: checked === true ? true : undefined,
                })
              }
            />
            <Label htmlFor="com_contato" className="text-sm font-normal cursor-pointer">
              Apenas com contato
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
