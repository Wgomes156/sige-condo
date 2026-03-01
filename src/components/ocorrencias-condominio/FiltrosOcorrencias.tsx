import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCondominios } from "@/hooks/useCondominios";
import {
  OcorrenciaFilters,
  TipoOcorrencia,
  StatusOcorrencia,
  PrioridadeOcorrencia,
} from "@/hooks/useOcorrenciasCondominio";

interface FiltrosOcorrenciasProps {
  filters: OcorrenciaFilters;
  onFiltersChange: (filters: OcorrenciaFilters) => void;
}

const TIPOS_OCORRENCIA: { value: TipoOcorrencia; label: string }[] = [
  { value: "manutencao", label: "Manutenção" },
  { value: "seguranca", label: "Segurança" },
  { value: "convivencia", label: "Convivência" },
  { value: "outro", label: "Outro" },
];

const STATUS_OCORRENCIA: { value: StatusOcorrencia; label: string }[] = [
  { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "resolvida", label: "Resolvida" },
  { value: "cancelada", label: "Cancelada" },
];

const PRIORIDADES: { value: PrioridadeOcorrencia; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

export function FiltrosOcorrencias({ filters, onFiltersChange }: FiltrosOcorrenciasProps) {
  const { data: condominios = [] } = useCondominios();

  const updateFilter = (key: keyof OcorrenciaFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "todos" ? undefined : value,
    });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={filters.condominio_id || "todos"}
        onValueChange={(value) => updateFilter("condominio_id", value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Condomínio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Condomínios</SelectItem>
          {condominios.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.tipo_ocorrencia || "todos"}
        onValueChange={(value) => updateFilter("tipo_ocorrencia", value as TipoOcorrencia)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          {TIPOS_OCORRENCIA.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status || "todos"}
        onValueChange={(value) => updateFilter("status", value as StatusOcorrencia)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          {STATUS_OCORRENCIA.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.prioridade || "todos"}
        onValueChange={(value) => updateFilter("prioridade", value as PrioridadeOcorrencia)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas Prioridades</SelectItem>
          {PRIORIDADES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
