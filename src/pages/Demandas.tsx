import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useCondominios } from "@/hooks/useCondominios";
import { useDemandasCondominio, useDemandasDashboard, useCategoriasDemanda } from "@/hooks/useDemandas";
import { DashboardDemandasCards } from "@/components/demandas/DashboardDemandasCards";
import { FiltrosDemandas } from "@/components/demandas/FiltrosDemandas";
import { DemandasTable } from "@/components/demandas/DemandasTable";
import { NovaDemandaDialog } from "@/components/demandas/NovaDemandaDialog";
import { ImportarTemplatesDialog } from "@/components/demandas/ImportarTemplatesDialog";
import { DemandaDetalhesDialog } from "@/components/demandas/DemandaDetalhesDialog";
import { RegistrarExecucaoDialog } from "@/components/demandas/RegistrarExecucaoDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, FileDown } from "lucide-react";

export default function Demandas() {
  const { data: condominios = [] } = useCondominios();
  const [selectedCondominio, setSelectedCondominio] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  
  const [novaDemandaOpen, setNovaDemandaOpen] = useState(false);
  const [importarTemplatesOpen, setImportarTemplatesOpen] = useState(false);
  const [demandaDetalhesId, setDemandaDetalhesId] = useState<string | null>(null);
  const [registrarExecucaoId, setRegistrarExecucaoId] = useState<string | null>(null);

  const { data: demandas = [], isLoading } = useDemandasCondominio(selectedCondominio || null);
  const { data: stats } = useDemandasDashboard(selectedCondominio || null);
  const { data: categorias = [] } = useCategoriasDemanda();

  // Filtrar demandas
  const demandasFiltradas = demandas.filter((d) => {
    if (filtroStatus !== "todos" && d.status !== filtroStatus) return false;
    if (filtroCategoria !== "todas" && d.categoria_id !== filtroCategoria) return false;
    if (busca && !d.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Demandas - Manutenções e Serviços</h1>
            <p className="text-muted-foreground">
              Controle de obrigações legais, técnicas e manutenção preventiva
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportarTemplatesOpen(true)} disabled={!selectedCondominio}>
              <Download className="h-4 w-4 mr-2" />
              Importar Templates
            </Button>
            <Button onClick={() => setNovaDemandaOpen(true)} disabled={!selectedCondominio}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Demanda
            </Button>
          </div>
        </div>

        {/* Seletor de Condomínio */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="w-full md:w-80">
            <Select value={selectedCondominio} onValueChange={setSelectedCondominio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um condomínio" />
              </SelectTrigger>
              <SelectContent>
                {condominios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCondominio && (
            <Button variant="ghost" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          )}
        </div>

        {selectedCondominio ? (
          <>
            {/* Dashboard Cards */}
            <DashboardDemandasCards stats={stats} />

            {/* Filtros */}
            <FiltrosDemandas
              busca={busca}
              setBusca={setBusca}
              filtroStatus={filtroStatus}
              setFiltroStatus={setFiltroStatus}
              filtroCategoria={filtroCategoria}
              setFiltroCategoria={setFiltroCategoria}
              categorias={categorias}
            />

            {/* Tabela de Demandas */}
            <DemandasTable
              demandas={demandasFiltradas}
              isLoading={isLoading}
              onVerDetalhes={setDemandaDetalhesId}
              onRegistrarExecucao={setRegistrarExecucaoId}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-xl font-semibold mb-2">Selecione um Condomínio</h2>
            <p className="text-muted-foreground max-w-md">
              Para visualizar e gerenciar as demandas de manutenção, selecione um condomínio na lista acima.
            </p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <NovaDemandaDialog
        open={novaDemandaOpen}
        onOpenChange={setNovaDemandaOpen}
        condominioId={selectedCondominio}
      />

      <ImportarTemplatesDialog
        open={importarTemplatesOpen}
        onOpenChange={setImportarTemplatesOpen}
        condominioId={selectedCondominio}
        demandasExistentes={demandas}
      />

      <DemandaDetalhesDialog
        demandaId={demandaDetalhesId}
        onClose={() => setDemandaDetalhesId(null)}
        onRegistrarExecucao={(id) => {
          setDemandaDetalhesId(null);
          setRegistrarExecucaoId(id);
        }}
      />

      <RegistrarExecucaoDialog
        demandaId={registrarExecucaoId}
        onClose={() => setRegistrarExecucaoId(null)}
      />
    </MainLayout>
  );
}
