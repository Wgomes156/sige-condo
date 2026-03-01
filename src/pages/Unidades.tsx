import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Building2, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { useUnidadesCompletas, ProprietarioUnidade, InquilinoUnidade } from "@/hooks/useUnidadesCompleto";
import { UnidadesTable } from "@/components/unidades/UnidadesTable";
import { UnidadeFormDialog } from "@/components/unidades/UnidadeFormDialog";
import { UnidadeDetalhesDialog } from "@/components/unidades/UnidadeDetalhesDialog";
import { DashboardUnidadesCards } from "@/components/unidades/DashboardUnidadesCards";
import { UnidadesPorTipoChart } from "@/components/unidades/UnidadesPorTipoChart";
import { UnidadesPorSituacaoChart } from "@/components/unidades/UnidadesPorSituacaoChart";
import { exportUnidadesToCSV, exportUnidadesToPDF, UnidadeExportData } from "@/lib/unidadesExportUtils";
import { supabase } from "@/integrations/supabase/client";

export default function Unidades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [condominioFilter, setCondominioFilter] = useState<string>("todos");
  const [situacaoFilter, setSituacaoFilter] = useState<string>("todas");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [statusFinanceiroFilter, setStatusFinanceiroFilter] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string | undefined>();
  const [editUnidadeId, setEditUnidadeId] = useState<string | undefined>();

  const { data: condominios } = useCondominios();
  const { data: unidades, isLoading } = useUnidadesCompletas(
    condominioFilter !== "todos" ? condominioFilter : undefined
  );

  const filteredUnidades = unidades?.filter((unidade) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      unidade.codigo.toLowerCase().includes(term) ||
      unidade.bloco?.toLowerCase().includes(term) ||
      unidade.numero_unidade?.toLowerCase().includes(term) ||
      unidade.endereco?.toLowerCase().includes(term) ||
      unidade.nome_localizacao?.toLowerCase().includes(term) ||
      unidade.morador_nome?.toLowerCase().includes(term) ||
      unidade.morador_email?.toLowerCase().includes(term) ||
      unidade.morador_telefone?.toLowerCase().includes(term) ||
      unidade.condominios?.nome?.toLowerCase().includes(term);

    const matchesSituacao =
      situacaoFilter === "todas" || unidade.situacao === situacaoFilter;

    const matchesTipo =
      tipoFilter === "todos" || unidade.tipo_unidade === tipoFilter;

    const matchesStatusFinanceiro =
      statusFinanceiroFilter === "todos" || unidade.status_financeiro === statusFinanceiroFilter;

    return matchesSearch && matchesSituacao && matchesTipo && matchesStatusFinanceiro;
  });

  // Buscar proprietários e inquilinos para exportação
  const unidadeIds = useMemo(() => 
    filteredUnidades?.map(u => u.id) || [], 
    [filteredUnidades]
  );

  const { data: proprietarios } = useQuery({
    queryKey: ["proprietarios-export", unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("proprietarios_unidade")
        .select("*")
        .in("unidade_id", unidadeIds);
      if (error) throw error;
      return data as ProprietarioUnidade[];
    },
    enabled: unidadeIds.length > 0,
  });

  const { data: inquilinos } = useQuery({
    queryKey: ["inquilinos-export", unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return [];
      const { data, error } = await supabase
        .from("inquilinos_unidade")
        .select("*")
        .in("unidade_id", unidadeIds);
      if (error) throw error;
      return data as InquilinoUnidade[];
    },
    enabled: unidadeIds.length > 0,
  });

  // Mapear dados para exportação
  const exportData: UnidadeExportData[] = useMemo(() => {
    if (!filteredUnidades) return [];
    return filteredUnidades.map(unidade => ({
      unidade,
      proprietario: proprietarios?.find(p => p.unidade_id === unidade.id) || null,
      inquilino: inquilinos?.find(i => i.unidade_id === unidade.id) || null,
    }));
  }, [filteredUnidades, proprietarios, inquilinos]);

  const handleView = (id: string) => {
    setSelectedUnidadeId(id);
    setDetalhesOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditUnidadeId(id);
    setFormOpen(true);
  };

  const handleNewUnidade = () => {
    setEditUnidadeId(undefined);
    setFormOpen(true);
  };

  const handleExportCSV = () => {
    const filename = `unidades_${format(new Date(), "yyyy-MM-dd")}`;
    exportUnidadesToCSV(exportData, filename);
  };

  const handleExportPDF = () => {
    const resumo = {
      total: exportData.length,
      ativas: exportData.filter((d) => d.unidade.situacao === "ativa").length,
      desocupadas: exportData.filter((d) => d.unidade.situacao === "desocupada").length,
      alugadas: exportData.filter((d) => d.unidade.tipo_ocupacao === "aluguel" || d.unidade.tipo_ocupacao === "aluguel_temporada").length,
      inadimplentes: exportData.filter((d) => d.unidade.status_financeiro === "inadimplente").length,
    };
    const filename = `unidades_${format(new Date(), "yyyy-MM-dd")}`;
    exportUnidadesToPDF(exportData, resumo, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Cadastro de Unidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie as unidades, proprietários, inquilinos e acessos
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleNewUnidade}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <DashboardUnidadesCards unidades={unidades || []} />

      {/* Gráficos de distribuição */}
      <div className="grid gap-4 md:grid-cols-2">
        <UnidadesPorTipoChart unidades={unidades || []} />
        <UnidadesPorSituacaoChart unidades={unidades || []} />
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, bloco, morador, condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={condominioFilter} onValueChange={setCondominioFilter}>
          <SelectTrigger className="w-full md:w-[220px]">
            <SelectValue placeholder="Condomínio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os condomínios</SelectItem>
            {condominios?.map((cond) => (
              <SelectItem key={cond.id} value={cond.id}>
                {cond.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="apartamento">Apartamento</SelectItem>
            <SelectItem value="casa">Casa</SelectItem>
            <SelectItem value="loja">Loja</SelectItem>
            <SelectItem value="escritorio">Escritório</SelectItem>
            <SelectItem value="sala">Sala</SelectItem>
          </SelectContent>
        </Select>
        <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as situações</SelectItem>
            <SelectItem value="ativa">Ativa</SelectItem>
            <SelectItem value="inativa">Inativa</SelectItem>
            <SelectItem value="em_reforma">Em Reforma</SelectItem>
            <SelectItem value="desocupada">Desocupada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFinanceiroFilter} onValueChange={setStatusFinanceiroFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Status Financeiro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="em_dia">Em dia</SelectItem>
            <SelectItem value="inadimplente">Inadimplente</SelectItem>
            <SelectItem value="acordo">Acordo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Exibindo{" "}
          <span className="font-medium text-foreground">
            {filteredUnidades?.length || 0}
          </span>{" "}
          de{" "}
          <span className="font-medium text-foreground">
            {unidades?.length || 0}
          </span>{" "}
          unidade{unidades?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabela */}
      <UnidadesTable
        unidades={filteredUnidades || []}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
      />

      {/* Dialog de Formulário */}
      <UnidadeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        unidadeId={editUnidadeId}
      />

      {/* Dialog de Detalhes */}
      <UnidadeDetalhesDialog
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        unidadeId={selectedUnidadeId}
        onEdit={(id) => {
          setDetalhesOpen(false);
          handleEdit(id);
        }}
      />
    </div>
  );
}
