import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, AlertTriangle, Download, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OcorrenciasCondominioTable } from "@/components/ocorrencias-condominio/OcorrenciasCondominioTable";
import { OcorrenciaCondominioForm } from "@/components/ocorrencias-condominio/OcorrenciaCondominioForm";
import { OcorrenciaDetalhesDialog } from "@/components/ocorrencias-condominio/OcorrenciaDetalhesDialog";
import { FiltrosOcorrencias } from "@/components/ocorrencias-condominio/FiltrosOcorrencias";
import { DashboardOcorrenciasCards } from "@/components/ocorrencias-condominio/DashboardOcorrenciasCards";
import { OcorrenciasPorStatusChart } from "@/components/ocorrencias-condominio/OcorrenciasPorStatusChart";
import { OcorrenciasPorTipoChart } from "@/components/ocorrencias-condominio/OcorrenciasPorTipoChart";
import { OcorrenciasPorPrioridadeChart } from "@/components/ocorrencias-condominio/OcorrenciasPorPrioridadeChart";
import { NovaOSForm, OcorrenciaPrefillData } from "@/components/ordens-servico/NovaOSForm";
import { useOcorrenciasCondominio, OcorrenciaCondominio, OcorrenciaFilters, PrioridadeOcorrencia } from "@/hooks/useOcorrenciasCondominio";
import { useOcorrenciasDashboard } from "@/hooks/useOcorrenciasDashboard";
import { useDebounce } from "@/hooks/useDebounce";
import { useCondominios } from "@/hooks/useCondominios";
import {
  exportOcorrenciasToCSV,
  exportOcorrenciasToPDF,
  buildOcorrenciasResumo,
  buildOcorrenciasPorTipo,
  buildOcorrenciasPorPrioridade,
} from "@/lib/ocorrenciasExportUtils";

export default function OcorrenciasCondominio() {
  const [busca, setBusca] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [osFormOpen, setOsFormOpen] = useState(false);
  const [osPrefillData, setOsPrefillData] = useState<OcorrenciaPrefillData | null>(null);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<OcorrenciaCondominio | null>(null);
  const [filters, setFilters] = useState<OcorrenciaFilters>({});
  const { userRole } = useAuth();

  const buscaDebounced = useDebounce(busca, 300);
  const canCreate = userRole !== "morador";

  const { data: condominios = [] } = useCondominios();

  const filtersWithSearch: OcorrenciaFilters = {
    ...filters,
    busca: buscaDebounced || undefined,
  };

  const { data: ocorrencias = [], isLoading: isLoadingOcorrencias } = useOcorrenciasCondominio(filtersWithSearch);

  const {
    resumo,
    isLoadingResumo,
    porStatus,
    isLoadingPorStatus,
    porTipo,
    isLoadingPorTipo,
    porPrioridade,
    isLoadingPorPrioridade,
  } = useOcorrenciasDashboard(filters.condominio_id);

  const getCondominioNome = () => {
    if (!filters.condominio_id) return null;
    const condominio = condominios.find((c) => c.id === filters.condominio_id);
    return condominio?.nome || null;
  };

  const handleExportCSV = () => {
    const filename = `ocorrencias_${format(new Date(), "yyyy-MM-dd_HH-mm")}`;
    exportOcorrenciasToCSV(ocorrencias, filename);
  };

  const handleExportPDF = () => {
    const resumoExport = buildOcorrenciasResumo(ocorrencias);
    const tipoExport = buildOcorrenciasPorTipo(ocorrencias);
    const prioridadeExport = buildOcorrenciasPorPrioridade(ocorrencias);
    const filename = `ocorrencias_${format(new Date(), "yyyy-MM-dd_HH-mm")}`;
    exportOcorrenciasToPDF(
      ocorrencias,
      resumoExport,
      tipoExport,
      prioridadeExport,
      getCondominioNome(),
      filename
    );
  };

  const handleNovaOcorrencia = () => {
    setOcorrenciaSelecionada(null);
    setFormOpen(true);
  };

  const handleEdit = (ocorrencia: OcorrenciaCondominio) => {
    setOcorrenciaSelecionada(ocorrencia);
    setFormOpen(true);
  };

  const handleView = (ocorrencia: OcorrenciaCondominio) => {
    setOcorrenciaSelecionada(ocorrencia);
    setDetalhesOpen(true);
  };

  const mapPrioridade = (prioridade: PrioridadeOcorrencia): "urgente" | "periodico" | "nao_urgente" => {
    switch (prioridade) {
      case 'urgente':
        return 'urgente';
      case 'alta':
        return 'urgente';
      case 'media':
        return 'periodico';
      case 'baixa':
      default:
        return 'nao_urgente';
    }
  };

  const handleGenerateOS = (ocorrencia: OcorrenciaCondominio) => {
    const prefill: OcorrenciaPrefillData = {
      condominio_id: ocorrencia.condominio_id,
      condominio_nome: ocorrencia.condominios?.nome || "",
      descricao_servico: `[Ocorrência] ${ocorrencia.titulo}\n\n${ocorrencia.descricao}${ocorrencia.local_ocorrencia ? `\n\nLocal: ${ocorrencia.local_ocorrencia}` : ""}`,
      prioridade: mapPrioridade(ocorrencia.prioridade),
      observacoes: ocorrencia.observacoes || "",
    };
    setOsPrefillData(prefill);
    setOsFormOpen(true);
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setOcorrenciaSelecionada(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Ocorrências
          </h2>
          <p className="text-muted-foreground">
            Registre e acompanhe ocorrências nos condomínios
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={ocorrencias.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {canCreate && (
            <Button
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleNovaOcorrencia}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Ocorrência
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <DashboardOcorrenciasCards resumo={resumo} isLoading={isLoadingResumo} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <OcorrenciasPorStatusChart data={porStatus} isLoading={isLoadingPorStatus} />
        <OcorrenciasPorTipoChart data={porTipo} isLoading={isLoadingPorTipo} />
        <OcorrenciasPorPrioridadeChart data={porPrioridade} isLoading={isLoadingPorPrioridade} />
      </div>

      <Card className="bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição, local..."
                className="pl-10"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <FiltrosOcorrencias filters={filters} onFiltersChange={setFilters} />
          </div>
        </CardHeader>
        <CardContent>
          <OcorrenciasCondominioTable
            filters={filtersWithSearch}
            onEdit={handleEdit}
            onView={handleView}
          />
        </CardContent>
      </Card>

      <OcorrenciaCondominioForm
        open={formOpen}
        onOpenChange={handleFormClose}
        ocorrencia={ocorrenciaSelecionada}
      />

      <OcorrenciaDetalhesDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        ocorrencia={ocorrenciaSelecionada}
        onGenerateOS={handleGenerateOS}
      />

      <NovaOSForm
        open={osFormOpen}
        onOpenChange={(open) => {
          setOsFormOpen(open);
          if (!open) {
            setOsPrefillData(null);
          }
        }}
        prefillData={osPrefillData}
      />
    </div>
  );
}
