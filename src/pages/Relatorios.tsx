import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileBarChart,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Users,
  Building2,
  Headphones,
  TrendingUp,
  CheckCircle2,
  Clock,
  Phone,
} from "lucide-react";
import {
  useRelatorioResumo,
  useRelatorioPorOperador,
  useRelatorioPorCondominio,
  useRelatorioPorMotivo,
  useRelatorioPorCanal,
  RelatorioFilters,
} from "@/hooks/useRelatorios";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#1a365d", "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4"];

const periodOptions = [
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "last-month", label: "Mês Passado" },
  { value: "quarter", label: "Último Trimestre" },
  { value: "custom", label: "Personalizado" },
];

export default function Relatorios() {
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case "week":
        return { dataInicio: startOfWeek(now, { locale: ptBR }), dataFim: endOfWeek(now, { locale: ptBR }) };
      case "month":
        return { dataInicio: startOfMonth(now), dataFim: endOfMonth(now) };
      case "last-month":
        const lastMonth = subMonths(now, 1);
        return { dataInicio: startOfMonth(lastMonth), dataFim: endOfMonth(lastMonth) };
      case "quarter":
        return { dataInicio: subMonths(now, 3), dataFim: now };
      case "custom":
        return {
          dataInicio: customStart ? new Date(customStart) : undefined,
          dataFim: customEnd ? new Date(customEnd) : undefined,
        };
      default:
        return {};
    }
  };

  const filters: RelatorioFilters = getDateRange();

  const { data: resumo, isLoading: loadingResumo } = useRelatorioResumo(filters);
  const { data: porOperador, isLoading: loadingOperador } = useRelatorioPorOperador(filters);
  const { data: porCondominio, isLoading: loadingCondominio } = useRelatorioPorCondominio(filters);
  const { data: porMotivo, isLoading: loadingMotivo } = useRelatorioPorMotivo(filters);
  const { data: porCanal, isLoading: loadingCanal } = useRelatorioPorCanal(filters);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("atendimentos")
        .select("id, data, hora, cliente_nome, cliente_telefone, cliente_email, condominio_nome, operador_nome, canal, status, motivo, observacoes")
        .order("data", { ascending: false });

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error("Nenhum dado encontrado para exportar");
        return;
      }

      const filename = `atendimentos_${format(new Date(), "yyyy-MM-dd_HH-mm")}`;
      exportToCSV(data, filename);
      toast.success(`${data.length} registros exportados com sucesso!`);
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      let query = supabase
        .from("atendimentos")
        .select("id, data, hora, cliente_nome, cliente_telefone, cliente_email, condominio_nome, operador_nome, canal, status, motivo, observacoes")
        .order("data", { ascending: false });

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!resumo) {
        toast.error("Aguarde os dados carregarem");
        return;
      }

      const filename = `relatorio_atendimentos_${format(new Date(), "yyyy-MM-dd_HH-mm")}`;
      exportToPDF(
        data || [],
        resumo,
        porOperador || [],
        porCondominio || [],
        porMotivo || [],
        filters.dataInicio,
        filters.dataFim,
        filename
      );
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsExporting(false);
    }
  };

  const motivoChartData = porMotivo?.map((m, i) => ({
    name: m.motivo,
    value: m.total,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const canalChartData = porCanal?.map((c, i) => ({
    name: c.canal,
    value: c.total,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const operadorChartData = porOperador?.slice(0, 6).map((op) => ({
    name: op.operador_nome.split(" ")[0],
    total: op.total,
    finalizados: op.finalizados,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-muted-foreground">
            Analise dados e exporte relatórios do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            Período do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-48">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div className="w-full md:w-48">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="w-full md:w-48">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          {filters.dataInicio && filters.dataFim && (
            <p className="text-sm text-muted-foreground mt-3">
              Exibindo dados de{" "}
              <span className="font-medium">{format(filters.dataInicio, "dd/MM/yyyy")}</span> até{" "}
              <span className="font-medium">{format(filters.dataFim, "dd/MM/yyyy")}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Atendimentos</p>
                {loadingResumo ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{resumo?.totalAtendimentos || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Finalizados</p>
                {loadingResumo ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{resumo?.totalFinalizados || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Clock className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                {loadingResumo ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{resumo?.totalEmAndamento || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Building2 className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Condomínios</p>
                {loadingResumo ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{resumo?.totalCondominios || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Operadores</p>
                {loadingResumo ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{resumo?.totalOperadores || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Motivos Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Headphones className="h-4 w-4 text-secondary" />
              Motivos de Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMotivo ? (
              <Skeleton className="h-48 w-full" />
            ) : motivoChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={motivoChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {motivoChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canais Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-secondary" />
              Canais de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCanal ? (
              <Skeleton className="h-48 w-full" />
            ) : canalChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={canalChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {canalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operadores Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              Performance Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOperador ? (
              <Skeleton className="h-48 w-full" />
            ) : operadorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={operadorChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#1a365d" name="Total" />
                  <Bar dataKey="finalizados" fill="#10b981" name="Finalizados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Operadores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-secondary" />
              Ranking de Operadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOperador ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : porOperador && porOperador.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Finalizados</TableHead>
                    <TableHead className="text-right">Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porOperador.slice(0, 5).map((op, i) => (
                    <TableRow key={op.operador_nome}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {i < 3 && (
                            <Badge variant={i === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                              {i + 1}
                            </Badge>
                          )}
                          {op.operador_nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{op.total}</TableCell>
                      <TableCell className="text-center">{op.finalizados}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {op.total > 0 ? ((op.finalizados / op.total) * 100).toFixed(0) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Condomínios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-secondary" />
              Condomínios mais Atendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCondominio ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : porCondominio && porCondominio.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Condomínio</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {porCondominio.slice(0, 5).map((c, i) => (
                    <TableRow key={c.condominio_nome}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {i < 3 && (
                            <Badge variant={i === 0 ? "default" : "secondary"} className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                              {i + 1}
                            </Badge>
                          )}
                          {c.condominio_nome}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{c.total}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground">
                Sem dados no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
