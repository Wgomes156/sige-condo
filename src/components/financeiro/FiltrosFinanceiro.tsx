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
import { Button } from "@/components/ui/button";
import { X, Search, Settings } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useCategorias, TransacaoFilters } from "@/hooks/useFinanceiro";
import { GerenciarCategoriasDialog } from "./GerenciarCategoriasDialog";

interface FiltrosFinanceiroProps {
  filters: TransacaoFilters;
  onFiltersChange: (filters: TransacaoFilters) => void;
  tipo?: "receita" | "despesa";
}

export function FiltrosFinanceiro({
  filters,
  onFiltersChange,
  tipo,
}: FiltrosFinanceiroProps) {
  const { data: condominios } = useCondominios();
  const { data: categorias } = useCategorias(tipo);
  const [localFilters, setLocalFilters] = useState<TransacaoFilters>({
    ...filters,
    tipo,
  });
  const [showGerenciarCategorias, setShowGerenciarCategorias] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({ ...localFilters, tipo });
    }, 300);
    return () => clearTimeout(timeout);
  }, [localFilters, tipo, onFiltersChange]);

  const handleClearFilters = () => {
    const cleared: TransacaoFilters = { tipo };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  const hasActiveFilters =
    localFilters.condominio_id ||
    localFilters.status ||
    localFilters.categoria_id ||
    localFilters.dataInicio ||
    localFilters.dataFim ||
    localFilters.busca;

  return (
    <>
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="busca"
                placeholder="Descrição, documento, morador..."
                value={localFilters.busca || ""}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, busca: e.target.value })
                }
                className="pl-9"
              />
            </div>
          </div>

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
            <div className="flex items-center justify-between">
              <Label htmlFor="categoria">Categoria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-xs"
                onClick={() => setShowGerenciarCategorias(true)}
              >
                <Settings className="h-3 w-3 mr-1" />
                Gerenciar
              </Button>
            </div>
            <Select
              value={localFilters.categoria_id || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  categoria_id: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.cor || "#6b7280" }}
                      />
                      {cat.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status || "all"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  status: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
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

          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={localFilters.dataInicio || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  dataInicio: e.target.value || undefined,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={localFilters.dataFim || ""}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  dataFim: e.target.value || undefined,
                })
              }
            />
          </div>
        </div>
      </div>

      <GerenciarCategoriasDialog
        open={showGerenciarCategorias}
        onOpenChange={setShowGerenciarCategorias}
      />
    </>
  );
}
