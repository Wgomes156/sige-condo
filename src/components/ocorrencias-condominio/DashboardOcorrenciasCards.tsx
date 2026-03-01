import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileWarning, CheckCircle2, Clock, Search, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResumoOcorrencias } from "@/hooks/useOcorrenciasDashboard";

interface DashboardOcorrenciasCardsProps {
  resumo?: ResumoOcorrencias;
  isLoading: boolean;
}

export function DashboardOcorrenciasCards({ resumo, isLoading }: DashboardOcorrenciasCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total",
      value: resumo?.total || 0,
      subtitle: `${resumo?.registradasHoje || 0} hoje`,
      icon: FileWarning,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Abertas",
      value: resumo?.abertas || 0,
      subtitle: "Aguardando análise",
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Em Análise",
      value: resumo?.emAnalise || 0,
      subtitle: "Sendo investigadas",
      icon: Search,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Resolvidas",
      value: resumo?.resolvidas || 0,
      subtitle: `${resumo?.resolvidasEsteMes || 0} este mês`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Urgentes",
      value: resumo?.urgentes || 0,
      subtitle: "Atenção imediata",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Hoje",
      value: resumo?.registradasHoje || 0,
      subtitle: "Registradas hoje",
      icon: Calendar,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
