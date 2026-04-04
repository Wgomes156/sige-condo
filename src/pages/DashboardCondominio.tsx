import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Building2,
  Clock,
  CheckCircle,
  Calendar,
  CalendarDays,
  Home,
  Users,
  Car,
  ParkingCircle,
  Wrench,
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  useDashboardCondominioStats,
  useAtendimentosPorStatusCondominio,
  useAtendimentosPorCanalCondominio,
  useUnidadesPorSituacaoCondominio,
  useUnidadesPorTipoCondominio,
  useOSPorStatusCondominio,
} from "@/hooks/useDashboardCondominio";

const COLORS_STATUS = ["#3B82F6", "#F59E0B", "#10B981", "#F97316"];
const COLORS_CANAL = ["#6366F1", "#EC4899", "#14B8A6", "#8B5CF6", "#F43F5E", "#06B6D4"];
const COLORS_SITUACAO = ["#10B981", "#F59E0B", "#EF4444", "#6B7280"];
const COLORS_TIPO = ["#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];
const COLORS_OS = ["#EF4444", "#F59E0B", "#10B981", "#6B7280"];

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  loading,
  colorClass = "text-secondary",
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description: string;
  loading?: boolean;
  colorClass?: string;
}) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-3xl font-bold text-foreground">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function PieChartCard({
  title,
  data,
  colors,
  loading,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  loading?: boolean;
}) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function BarChartCard({
  title,
  data,
  colors,
  loading,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors: string[];
  loading?: boolean;
}) {
  const hasData = data && data.length > 0 && data.some((d) => d.value > 0);

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardCondominio() {
  const { id } = useParams<{ id: string }>();

  // Buscar dados do condomínio
  const { data: condominio, isLoading: loadingCondominio } = useQuery({
    queryKey: ["condominio-detalhes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condominios")
        .select("*, administradoras(nome)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: stats, isLoading: loadingStats } = useDashboardCondominioStats(id);
  const { data: statusData, isLoading: loadingStatus } = useAtendimentosPorStatusCondominio(id);
  const { data: canalData, isLoading: loadingCanal } = useAtendimentosPorCanalCondominio(id);
  const { data: situacaoData, isLoading: loadingSituacao } = useUnidadesPorSituacaoCondominio(id);
  const { data: tipoData, isLoading: loadingTipo } = useUnidadesPorTipoCondominio(id);
  const { data: osData, isLoading: loadingOS } = useOSPorStatusCondominio(id);

  if (loadingCondominio) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!condominio) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Condomínio não encontrado</h2>
        <Link to="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                {condominio.nome}
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Dashboard completo do condomínio
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Condomínio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Endereço</p>
                <p className="text-sm text-muted-foreground">
                  {condominio.endereco}, {condominio.numero}
                </p>
                <p className="text-sm text-muted-foreground">
                  {condominio.bairro} - {condominio.cidade}/{condominio.uf}
                </p>
                <p className="text-sm text-muted-foreground">CEP: {condominio.cep}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Contato</p>
                <p className="text-sm text-muted-foreground">
                  {condominio.administradora_telefone || "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">E-mail</p>
                <p className="text-sm text-muted-foreground">
                  {condominio.administradora_email || "Não informado"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Administradora</p>
                <p className="text-sm text-muted-foreground">
                  {condominio.administradoras?.nome || condominio.nome_administradora || "Não informada"}
                </p>
                {condominio.sindico_nome && (
                  <p className="text-sm text-muted-foreground">
                    Síndico: {condominio.sindico_nome}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores de Atendimentos */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          Atendimentos
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Atendimentos Hoje"
            value={stats?.totalHoje ?? 0}
            icon={Headphones}
            description="Total do dia"
            loading={loadingStats}
          />
          <StatCard
            title="Esta Semana"
            value={stats?.totalSemana ?? 0}
            icon={Calendar}
            description="Total da semana"
            loading={loadingStats}
          />
          <StatCard
            title="Este Mês"
            value={stats?.totalMes ?? 0}
            icon={CalendarDays}
            description="Total do mês"
            loading={loadingStats}
          />
          <StatCard
            title="Em Andamento"
            value={stats?.emAndamento ?? 0}
            icon={Clock}
            description="Aguardando resolução"
            loading={loadingStats}
            colorClass="text-amber-500"
          />
          <StatCard
            title="Finalizados Hoje"
            value={stats?.finalizadosHoje ?? 0}
            icon={CheckCircle}
            description="Resolvidos hoje"
            loading={loadingStats}
            colorClass="text-green-500"
          />
        </div>
      </div>

      {/* Indicadores de Unidades */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Home className="h-5 w-5" />
          Unidades
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <StatCard
            title="Total de Unidades"
            value={stats?.totalUnidades ?? 0}
            icon={Home}
            description="Cadastradas"
            loading={loadingStats}
          />
          <StatCard
            title="Ativas"
            value={stats?.unidadesAtivas ?? 0}
            icon={CheckCircle}
            description="Em funcionamento"
            loading={loadingStats}
            colorClass="text-green-500"
          />
          <StatCard
            title="Desocupadas"
            value={stats?.unidadesDesocupadas ?? 0}
            icon={Home}
            description="Disponíveis"
            loading={loadingStats}
            colorClass="text-amber-500"
          />
          <StatCard
            title="Inadimplentes"
            value={stats?.unidadesInadimplentes ?? 0}
            icon={AlertTriangle}
            description="Com pendências"
            loading={loadingStats}
            colorClass="text-red-500"
          />
          <StatCard
            title="Moradores"
            value={stats?.totalMoradores ?? 0}
            icon={Users}
            description="Cadastrados"
            loading={loadingStats}
            colorClass="text-blue-500"
          />
          <StatCard
            title="Veículos"
            value={stats?.totalVeiculos ?? 0}
            icon={Car}
            description="Registrados"
            loading={loadingStats}
            colorClass="text-purple-500"
          />
          <StatCard
            title="Vagas"
            value={stats?.totalVagas ?? 0}
            icon={ParkingCircle}
            description="Cadastradas"
            loading={loadingStats}
            colorClass="text-cyan-500"
          />
        </div>
      </div>

      {/* Indicadores de Ordens de Serviço */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Ordens de Serviço
        </h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <StatCard
            title="OS Abertas/Em Andamento"
            value={stats?.osAbertas ?? 0}
            icon={Clock}
            description="Pendentes de conclusão"
            loading={loadingStats}
            colorClass="text-amber-500"
          />
          <StatCard
            title="OS Concluídas"
            value={stats?.osConcluidas ?? 0}
            icon={CheckCircle}
            description="Finalizadas"
            loading={loadingStats}
            colorClass="text-green-500"
          />
        </div>
      </div>

      {/* Gráficos de Atendimentos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Análise de Atendimentos</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <PieChartCard
            title="Atendimentos por Status"
            data={statusData ?? []}
            colors={COLORS_STATUS}
            loading={loadingStatus}
          />
          <PieChartCard
            title="Atendimentos por Canal"
            data={canalData ?? []}
            colors={COLORS_CANAL}
            loading={loadingCanal}
          />
        </div>
      </div>

      {/* Gráficos de Unidades */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Análise de Unidades</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <BarChartCard
            title="Unidades por Situação"
            data={situacaoData ?? []}
            colors={COLORS_SITUACAO}
            loading={loadingSituacao}
          />
          <PieChartCard
            title="Unidades por Tipo"
            data={tipoData ?? []}
            colors={COLORS_TIPO}
            loading={loadingTipo}
          />
        </div>
      </div>

      {/* Gráfico de OS */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Análise de Ordens de Serviço</h3>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <BarChartCard
            title="OS por Status"
            data={osData ?? []}
            colors={COLORS_OS}
            loading={loadingOS}
          />
        </div>
      </div>
    </div>
  );
}
