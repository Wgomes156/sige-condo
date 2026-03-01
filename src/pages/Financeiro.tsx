import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, DollarSign, FileSpreadsheet, Upload } from "lucide-react";
import {
  useResumoFinanceiro,
  useFluxoCaixa,
  useTransacoesPorCategoria,
} from "@/hooks/useDashboardFinanceiro";
import { useTransacoes, TransacaoFilters } from "@/hooks/useFinanceiro";
import { DashboardFinanceiroCards } from "@/components/financeiro/DashboardFinanceiroCards";
import { FluxoCaixaChart } from "@/components/financeiro/FluxoCaixaChart";
import { CategoriasPieChart } from "@/components/financeiro/CategoriasPieChart";
import { FiltrosFinanceiro } from "@/components/financeiro/FiltrosFinanceiro";
import { TransacoesTable } from "@/components/financeiro/TransacoesTable";
import { NovaTransacaoForm } from "@/components/financeiro/NovaTransacaoForm";
import { ExportarExtratoDialog } from "@/components/financeiro/ExportarExtratoDialog";
import { ImportarExtratoDialog } from "@/components/financeiro/ImportarExtratoDialog";
import { toast } from "sonner";

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNovaTransacao, setShowNovaTransacao] = useState(false);
  const [showExportarExtrato, setShowExportarExtrato] = useState(false);
  const [tipoNovaTransacao, setTipoNovaTransacao] = useState<"receita" | "despesa">("receita");
  const [receitasFilters, setReceitasFilters] = useState<TransacaoFilters>({
    tipo: "receita",
  });
  const [despesasFilters, setDespesasFilters] = useState<TransacaoFilters>({
    tipo: "despesa",
  });

  const { data: resumo, isLoading: isLoadingResumo } = useResumoFinanceiro();
  const { data: fluxoCaixa, isLoading: isLoadingFluxo } = useFluxoCaixa();
  const { data: receitasPorCategoria, isLoading: isLoadingReceitasCat } =
    useTransacoesPorCategoria("receita");
  const { data: despesasPorCategoria, isLoading: isLoadingDespesasCat } =
    useTransacoesPorCategoria("despesa");

  const { data: receitas, isLoading: isLoadingReceitas } =
    useTransacoes(receitasFilters);
  const { data: despesas, isLoading: isLoadingDespesas } =
    useTransacoes(despesasFilters);

  const handleReceitasFiltersChange = useCallback(
    (filters: TransacaoFilters) => {
      setReceitasFilters({ ...filters, tipo: "receita" });
    },
    []
  );

  const handleDespesasFiltersChange = useCallback(
    (filters: TransacaoFilters) => {
      setDespesasFilters({ ...filters, tipo: "despesa" });
    },
    []
  );

  const handleNovaReceita = () => {
    setTipoNovaTransacao("receita");
    setShowNovaTransacao(true);
  };

  const handleNovaDespesa = () => {
    setTipoNovaTransacao("despesa");
    setShowNovaTransacao(true);
  };

  const handleExportCSV = (tipo: "receita" | "despesa") => {
    const data = tipo === "receita" ? receitas : despesas;
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const headers = [
      "Data Vencimento",
      "Descrição",
      "Condomínio",
      "Categoria",
      "Valor",
      "Status",
    ];

    const rows = data.map((item) => [
      item.data_vencimento,
      item.descricao,
      item.condominios?.nome || "",
      item.categorias_financeiras?.nome || "",
      item.valor.toString().replace(".", ","),
      item.status,
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tipo === "receita" ? "receitas" : "despesas"}.csv`;
    link.click();
    toast.success("Exportado com sucesso");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Gestão financeira dos condomínios
          </p>
        </div>
        <div className="flex gap-2">
          <ImportarExtratoDialog />
          <ExportarExtratoDialog />
          <Button variant="outline" onClick={handleNovaDespesa}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Despesa
          </Button>
          <Button onClick={handleNovaReceita}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="receitas">Contas a Receber</TabsTrigger>
          <TabsTrigger value="despesas">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <DashboardFinanceiroCards resumo={resumo} isLoading={isLoadingResumo} />

          <div className="grid gap-6 lg:grid-cols-2">
            <FluxoCaixaChart data={fluxoCaixa} isLoading={isLoadingFluxo} />
            <div className="grid gap-6">
              <CategoriasPieChart
                data={receitasPorCategoria}
                isLoading={isLoadingReceitasCat}
                title="Receitas por Categoria"
              />
              <CategoriasPieChart
                data={despesasPorCategoria}
                isLoading={isLoadingDespesasCat}
                title="Despesas por Categoria"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receitas" className="space-y-6 mt-6">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV("receita")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>

          <FiltrosFinanceiro
            filters={receitasFilters}
            onFiltersChange={handleReceitasFiltersChange}
            tipo="receita"
          />

          <TransacoesTable data={receitas} isLoading={isLoadingReceitas} />
        </TabsContent>

        <TabsContent value="despesas" className="space-y-6 mt-6">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCSV("despesa")}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>

          <FiltrosFinanceiro
            filters={despesasFilters}
            onFiltersChange={handleDespesasFiltersChange}
            tipo="despesa"
          />

          <TransacoesTable data={despesas} isLoading={isLoadingDespesas} />
        </TabsContent>
      </Tabs>

      <NovaTransacaoForm
        open={showNovaTransacao}
        onOpenChange={setShowNovaTransacao}
        tipoInicial={tipoNovaTransacao}
      />
    </div>
  );
}
