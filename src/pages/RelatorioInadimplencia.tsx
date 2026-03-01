import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  useInadimplentes,
  useResumoInadimplencia,
  useInadimplenciaPorCondominio,
  useInadimplenciaPorFaixaAtraso,
  InadimplenciaFilters,
} from "@/hooks/useRelatorioInadimplencia";
import { InadimplenciaCards } from "@/components/relatorios/InadimplenciaCards";
import { InadimplenciaPorCondominioChart } from "@/components/relatorios/InadimplenciaPorCondominioChart";
import { InadimplenciaPorFaixaChart } from "@/components/relatorios/InadimplenciaPorFaixaChart";
import { FiltrosInadimplencia } from "@/components/relatorios/FiltrosInadimplencia";
import { InadimplentesTable } from "@/components/relatorios/InadimplentesTable";
import {
  exportInadimplentesToCSV,
  exportInadimplenciaToPDF,
} from "@/lib/exportUtils";

export default function RelatorioInadimplencia() {
  const [filters, setFilters] = useState<InadimplenciaFilters>({});

  const { data: inadimplentes, isLoading: isLoadingInadimplentes } =
    useInadimplentes(filters);
  const { data: resumo, isLoading: isLoadingResumo } =
    useResumoInadimplencia(filters);
  const { data: porCondominio, isLoading: isLoadingCondominio } =
    useInadimplenciaPorCondominio(filters);
  const { data: porFaixa, isLoading: isLoadingFaixa } =
    useInadimplenciaPorFaixaAtraso(filters);

  const handleFiltersChange = useCallback((newFilters: InadimplenciaFilters) => {
    setFilters(newFilters);
  }, []);

  const handleExportCSV = () => {
    if (!inadimplentes || inadimplentes.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }
    exportInadimplentesToCSV(inadimplentes, "relatorio-inadimplencia");
    toast.success("Relatório exportado em CSV");
  };

  const handleExportPDF = () => {
    if (!inadimplentes || inadimplentes.length === 0 || !resumo) {
      toast.error("Não há dados para exportar");
      return;
    }
    exportInadimplenciaToPDF(
      resumo,
      inadimplentes,
      porCondominio || [],
      porFaixa || [],
      filters.condominio_id ? inadimplentes[0]?.condominio_nome : null,
      "relatorio-inadimplencia"
    );
    toast.success("Relatório exportado em PDF");
  };

  const isLoading =
    isLoadingInadimplentes ||
    isLoadingResumo ||
    isLoadingCondominio ||
    isLoadingFaixa;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Relatório de Inadimplência
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada de moradores em atraso por condomínio
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isLoading || !inadimplentes?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isLoading || !inadimplentes?.length}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <FiltrosInadimplencia filters={filters} onFiltersChange={handleFiltersChange} />

      <InadimplenciaCards resumo={resumo} isLoading={isLoadingResumo} />

      <div className="grid gap-6 md:grid-cols-2">
        <InadimplenciaPorFaixaChart data={porFaixa} isLoading={isLoadingFaixa} />
        <InadimplenciaPorCondominioChart
          data={porCondominio}
          isLoading={isLoadingCondominio}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Lista de Inadimplentes</h2>
        <InadimplentesTable data={inadimplentes} isLoading={isLoadingInadimplentes} />
      </div>
    </div>
  );
}
