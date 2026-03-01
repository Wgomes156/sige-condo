import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileDown, RefreshCw } from "lucide-react";
import { usePropostas, PropostaComServicos } from "@/hooks/usePropostas";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { PropostasCards } from "@/components/propostas/PropostasCards";
import { PropostasTableExpanded } from "@/components/propostas/PropostasTableExpanded";
import { FiltrosPropostas } from "@/components/propostas/FiltrosPropostas";
import { PropostaDetalhesDialog } from "@/components/propostas/PropostaDetalhesDialog";
import { NovaPropostaWizard } from "@/components/propostas/NovaPropostaWizard";
import { exportPropostasToCSV } from "@/lib/propostasExportUtils";
import { Database } from "@/integrations/supabase/types";

export default function Propostas() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [propostaSelecionada, setPropostaSelecionada] = useState<PropostaComServicos | null>(null);
  const [propostaEdicao, setPropostaEdicao] = useState<PropostaComServicos | null>(null);
  const { userRole } = useAuth();
  
  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("__all__");
  const [filtroPacote, setFiltroPacote] = useState("__all__");
  const [filtroTipoCondominio, setFiltroTipoCondominio] = useState("__all__");
  
  const buscaDebounced = useDebounce(busca, 300);
  const canCreate = userRole !== "morador";

  const {
    propostas,
    isLoading,
    calcularStats,
    duplicarProposta,
    alterarStatus,
    excluirProposta,
  } = usePropostas();

  const stats = calcularStats();

  // Filtrar propostas
  const propostasFiltradas = useMemo(() => {
    return propostas.filter((p) => {
      // Busca textual
      if (buscaDebounced) {
        const termo = buscaDebounced.toLowerCase();
        const match =
          p.numero_proposta.toLowerCase().includes(termo) ||
          p.condominio_nome.toLowerCase().includes(termo) ||
          p.responsavel_nome.toLowerCase().includes(termo) ||
          p.responsavel_email.toLowerCase().includes(termo);
        if (!match) return false;
      }
      
      // Filtro por status
      if (filtroStatus !== "__all__" && p.status !== filtroStatus) {
        return false;
      }
      
      // Filtro por pacote
      if (filtroPacote !== "__all__" && p.pacote_tipo !== filtroPacote) {
        return false;
      }
      
      // Filtro por tipo de condomínio
      if (filtroTipoCondominio !== "__all__" && p.condominio_tipo !== filtroTipoCondominio) {
        return false;
      }
      
      return true;
    });
  }, [propostas, buscaDebounced, filtroStatus, filtroPacote, filtroTipoCondominio]);

  const handleView = (proposta: PropostaComServicos) => {
    setPropostaSelecionada(proposta);
    setDetalhesOpen(true);
  };

  const handleEdit = (proposta: PropostaComServicos) => {
    setPropostaEdicao(proposta);
    setWizardOpen(true);
  };

  const handleDuplicate = (id: string) => {
    duplicarProposta.mutate(id);
  };

  const handleChangeStatus = (
    id: string,
    status: Database["public"]["Enums"]["proposta_status"],
    motivo?: string
  ) => {
    alterarStatus.mutate({ id, status, motivo });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta proposta?")) {
      excluirProposta.mutate(id);
    }
  };

  const handleExportCSV = () => {
    exportPropostasToCSV(propostasFiltradas as any);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setPropostaEdicao(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Propostas Comerciais</h1>
            <p className="text-muted-foreground">
              Gerencie suas propostas de administração condominial
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            {canCreate && (
              <Button onClick={() => setWizardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Proposta
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard Cards */}
        <PropostasCards stats={stats} />

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltrosPropostas
              busca={busca}
              onBuscaChange={setBusca}
              status={filtroStatus}
              onStatusChange={setFiltroStatus}
              pacote={filtroPacote}
              onPacoteChange={setFiltroPacote}
              tipoCondominio={filtroTipoCondominio}
              onTipoCondominioChange={setFiltroTipoCondominio}
            />
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">
              Propostas ({propostasFiltradas.length})
            </CardTitle>
            {isLoading && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <PropostasTableExpanded
              propostas={propostasFiltradas}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onChangeStatus={handleChangeStatus}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>

        {/* Dialogs */}
        <PropostaDetalhesDialog
          proposta={propostaSelecionada}
          open={detalhesOpen}
          onOpenChange={setDetalhesOpen}
        />

        <NovaPropostaWizard
          open={wizardOpen}
          onOpenChange={handleCloseWizard}
          propostaEdicao={propostaEdicao}
        />
      </div>
    </MainLayout>
  );
}
