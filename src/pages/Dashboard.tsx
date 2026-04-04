import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Building2, Clock, ExternalLink, Home, FileText } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  useDashboardStats,
  useAtendimentosPorStatus,
  useAtendimentosPorCanal,
  useAtendimentosPorMotivo,
} from "@/hooks/useDashboard";
import { useCondominios } from "@/hooks/useCondominios";
import { useAuth } from "@/hooks/useAuth";

const COLORS_STATUS = ["#3B82F6", "#F59E0B", "#10B981", "#F97316"];
const COLORS_CANAL = ["#6366F1", "#EC4899", "#14B8A6", "#8B5CF6", "#F43F5E", "#06B6D4"];
const COLORS_MOTIVO = ["#0EA5E9", "#22C55E", "#EAB308", "#EF4444", "#A855F7", "#F97316", "#64748B"];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  loading 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ElementType; 
  description: string;
  loading?: boolean;
}) {
  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-secondary" />
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
  const hasData = data && data.length > 0;

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
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedCondominio, setSelectedCondominio] = useState<string>("todos");
  
  // Passa o ID do condomínio para os hooks (null se "todos")
  const condominioFilter = selectedCondominio !== "todos" ? selectedCondominio : null;
  
  const { data: condominios } = useCondominios();
  const { data: stats, isLoading: loadingStats } = useDashboardStats(condominioFilter);
  const { data: statusData, isLoading: loadingStatus } = useAtendimentosPorStatus(condominioFilter);
  const { data: canalData, isLoading: loadingCanal } = useAtendimentosPorCanal(condominioFilter);
  const { data: motivoData, isLoading: loadingMotivo } = useAtendimentosPorMotivo(condominioFilter);

  const handleCondominioChange = (value: string) => {
    setSelectedCondominio(value);
  };
  
  const selectedCondominioNome = condominios?.find(c => c.id === selectedCondominio)?.nome;
  
  // Pegar primeiro nome do usuário
  const primeiroNome = profile?.nome?.split(" ")[0] || "Usuário";

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Olá, {primeiroNome}! 👋
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {selectedCondominio !== "todos" && selectedCondominioNome 
              ? `Dados filtrados para: ${selectedCondominioNome}`
              : "Visão geral do sistema de atendimentos"}
          </p>
        </div>
        
        {/* Seletor de Condomínio */}
        <div className="flex items-center gap-2">
          <Select value={selectedCondominio} onValueChange={handleCondominioChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <Building2 className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Selecione um condomínio" />
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
          {selectedCondominio !== "todos" && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/condominio/${selectedCondominio}`)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Indicadores rápidos */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="OS em Andamento"
          value={stats?.emAndamento ?? 0}
          icon={Clock}
          description="Aguardando resolução"
          loading={loadingStats}
        />
        <StatCard
          title="Condomínios"
          value={stats?.totalCondominios ?? 0}
          icon={Building2}
          description="Total cadastrado"
          loading={loadingStats}
        />
        <StatCard
          title="Unidades"
          value={stats?.totalUnidades ?? 0}
          icon={Home}
          description="Total de unidades"
          loading={loadingStats}
        />
        <StatCard
          title="Boletos em Aberto"
          value={stats?.boletosEmAberto ?? 0}
          icon={FileText}
          description="Pendentes ou atrasados"
          loading={loadingStats}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
        <PieChartCard
          title="Atendimentos por Motivo"
          data={motivoData ?? []}
          colors={COLORS_MOTIVO}
          loading={loadingMotivo}
        />
      </div>
    </div>
  );
}
