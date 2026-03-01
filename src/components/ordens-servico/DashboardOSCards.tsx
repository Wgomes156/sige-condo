import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, Calendar, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumoOS } from "@/hooks/useDashboardOS";

interface DashboardOSCardsProps {
  resumo?: ResumoOS;
  isLoading: boolean;
}

export function DashboardOSCards({ resumo, isLoading }: DashboardOSCardsProps) {
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
      title: "Total de OS",
      value: resumo?.total || 0,
      subtitle: `${resumo?.abertasHoje || 0} abertas hoje`,
      icon: ClipboardList,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Abertas",
      value: resumo?.abertas || 0,
      subtitle: "Aguardando atendimento",
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Em Andamento",
      value: resumo?.emAndamento || 0,
      subtitle: "Sendo executadas",
      icon: Timer,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Concluídas",
      value: resumo?.concluidas || 0,
      subtitle: `${resumo?.concluidasEsteMes || 0} este mês`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Urgentes",
      value: resumo?.urgentes || 0,
      subtitle: "Prioridade alta",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Tempo Médio",
      value: `${resumo?.tempoMedioAtendimento || 0}d`,
      subtitle: "Para conclusão",
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
