import { useState } from "react";
import { Plus, ClipboardList, FileSpreadsheet, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebounce } from "@/hooks/useDebounce";
import { useOrdensServico, OrdemServico, OrdemServicoFilters } from "@/hooks/useOrdensServico";
import { useDashboardOS } from "@/hooks/useDashboardOS";
import { OSTable } from "@/components/ordens-servico/OSTable";
import { NovaOSForm } from "@/components/ordens-servico/NovaOSForm";
import { OSDetalhes } from "@/components/ordens-servico/OSDetalhes";
import { FiltrosOS } from "@/components/ordens-servico/FiltrosOS";
import { DashboardOSCards } from "@/components/ordens-servico/DashboardOSCards";
import { OSPorStatusChart } from "@/components/ordens-servico/OSPorStatusChart";
import { OSPorPrioridadeChart } from "@/components/ordens-servico/OSPorPrioridadeChart";
import { OSPorCondominioChart } from "@/components/ordens-servico/OSPorCondominioChart";
import { exportOSToCSV, exportOSToPDF } from "@/lib/exportUtils";
import { useAuth } from "@/hooks/useAuth";

export default function OrdensServico() {
  const [filters, setFilters] = useState<OrdemServicoFilters>({});
  const [showForm, setShowForm] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [selectedOS, setSelectedOS] = useState<OrdemServico | null>(null);
  const { userRole } = useAuth();

  const debouncedSearch = useDebounce(filters.search || "", 300);
  const { data: ordensServico, isLoading } = useOrdensServico({
    ...filters,
    search: debouncedSearch,
  });
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardOS();
  const canCreate = userRole !== "morador";

  const handleEdit = (os: OrdemServico) => {
    setSelectedOS(os);
    setShowForm(true);
  };

  const handleView = (os: OrdemServico) => {
    setSelectedOS(os);
    setShowDetalhes(true);
  };

  const handleNewOS = () => {
    setSelectedOS(null);
    setShowForm(true);
  };

  const handleFormClose = (open: boolean) => {
    setShowForm(open);
    if (!open) setSelectedOS(null);
  };

  const handleDetalhesClose = (open: boolean) => {
    setShowDetalhes(open);
    if (!open) setSelectedOS(null);
  };

  const handleExportCSV = () => {
    if (!ordensServico?.length) {
      toast.error("Nenhuma ordem de serviço para exportar");
      return;
    }
    const filename = `ordens-servico-${format(new Date(), "yyyy-MM-dd")}`;
    exportOSToCSV(ordensServico, filename);
    toast.success("Exportação CSV realizada com sucesso!");
  };

  const handleExportPDF = () => {
    if (!ordensServico?.length) {
      toast.error("Nenhuma ordem de serviço para exportar");
      return;
    }
    const filename = `ordens-servico-${format(new Date(), "yyyy-MM-dd")}`;
    exportOSToPDF(ordensServico, filename);
    toast.success("Exportação PDF realizada com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Ordens de Serviço
          </h1>
          <p className="text-muted-foreground">
            Gerencie as ordens de serviço dos condomínios
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={!ordensServico?.length}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={!ordensServico?.length}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          {canCreate && (
            <Button onClick={handleNewOS}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ordem de Serviço
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <DashboardOSCards resumo={dashboardData?.resumo} isLoading={isLoadingDashboard} />

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        <OSPorStatusChart data={dashboardData?.porStatus} isLoading={isLoadingDashboard} />
        <OSPorPrioridadeChart data={dashboardData?.porPrioridade} isLoading={isLoadingDashboard} />
        <OSPorCondominioChart data={dashboardData?.porCondominio} isLoading={isLoadingDashboard} />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <FiltrosOS filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Ordens de Serviço ({ordensServico?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OSTable
            ordensServico={ordensServico}
            isLoading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <NovaOSForm
        open={showForm}
        onOpenChange={handleFormClose}
        ordemServico={selectedOS}
      />

      {/* Detalhes Sheet */}
      <OSDetalhes
        open={showDetalhes}
        onOpenChange={handleDetalhesClose}
        ordemServico={selectedOS}
      />
    </div>
  );
}
