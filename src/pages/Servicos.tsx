import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FileDown, FileSpreadsheet } from "lucide-react";
import { useServicos, Servico } from "@/hooks/useServicos";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { ServicosCards } from "@/components/servicos/ServicosCards";
import { FiltrosServicos } from "@/components/servicos/FiltrosServicos";
import { ServicosTable } from "@/components/servicos/ServicosTable";
import { ServicoFormDialog } from "@/components/servicos/ServicoFormDialog";
import { ExcluirServicoDialog } from "@/components/servicos/ExcluirServicoDialog";
import { HistoricoServicoDialog } from "@/components/servicos/HistoricoServicoDialog";
import { exportarServicosPDF, exportarServicosCSV } from "@/lib/servicosExportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Servicos() {
  const {
    categorias,
    servicosPorCategoria,
    stats,
    loading,
    criarServico,
    atualizarServico,
    excluirServico,
    buscarHistorico,
  } = useServicos();
  const { userRole } = useAuth();

  // Estados de filtros
  const [busca, setBusca] = useState("");
  const canCreate = userRole !== "morador";
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const buscaDebounced = useDebounce(busca, 300);

  // Estados dos modais
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);

  // Handlers
  const handleNovoServico = () => {
    setServicoSelecionado(null);
    setFormDialogOpen(true);
  };

  const handleEditarServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setFormDialogOpen(true);
  };

  const handleExcluirServico = (servico: Servico) => {
    setServicoSelecionado(servico);
    setDeleteDialogOpen(true);
  };

  const handleViewHistory = (servico: Servico) => {
    setServicoSelecionado(servico);
    setHistoricoDialogOpen(true);
  };

  const handleSubmitForm = async (data: Partial<Servico>) => {
    if (servicoSelecionado) {
      await atualizarServico.mutateAsync({ id: servicoSelecionado.id, ...data });
    } else {
      await criarServico.mutateAsync(data as Omit<Servico, "id" | "created_at" | "updated_at" | "categoria">);
    }
    setFormDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (servicoSelecionado) {
      await excluirServico.mutateAsync(servicoSelecionado.id);
      setDeleteDialogOpen(false);
    }
  };

  const handleExportPDF = () => {
    exportarServicosPDF(servicosPorCategoria);
  };

  const handleExportCSV = () => {
    exportarServicosCSV(servicosPorCategoria);
  };

  // Ajustar filtros para tratar "__all__" como vazio
  const categoriaFiltro = filtroCategoria === "__all__" ? "" : filtroCategoria;
  const tipoFiltro = filtroTipo === "__all__" ? "" : filtroTipo;

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Serviços e Preços
            </h1>
            <p className="text-muted-foreground">
              Gerencie a tabela de serviços e valores da administradora
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canCreate && (
              <Button onClick={handleNovoServico}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            )}
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <ServicosCards stats={stats} />

        {/* Filtros */}
        <Card className="p-4">
          <FiltrosServicos
            categorias={categorias}
            busca={busca}
            setBusca={setBusca}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
          />
        </Card>

        {/* Tabela de Serviços */}
        <ServicosTable
          servicosPorCategoria={servicosPorCategoria}
          onEdit={handleEditarServico}
          onDelete={handleExcluirServico}
          onViewHistory={handleViewHistory}
          filtroCategoria={categoriaFiltro}
          filtroBusca={buscaDebounced}
          filtroTipo={tipoFiltro}
        />

        {/* Dialogs */}
        <ServicoFormDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          servico={servicoSelecionado}
          categorias={categorias}
          onSubmit={handleSubmitForm}
          loading={criarServico.isPending || atualizarServico.isPending}
        />

        <ExcluirServicoDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          servico={servicoSelecionado}
          onConfirm={handleConfirmDelete}
          loading={excluirServico.isPending}
        />

        <HistoricoServicoDialog
          open={historicoDialogOpen}
          onOpenChange={setHistoricoDialogOpen}
          servico={servicoSelecionado}
          buscarHistorico={buscarHistorico}
        />
      </div>
    </MainLayout>
  );
}
