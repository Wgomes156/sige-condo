import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface DashboardDemandasCardsProps {
  stats: {
    total: number;
    urgentes: number;
    atencao: number;
    emDia: number;
    vencidas: number;
    sobDemanda: number;
  } | undefined;
}

export function DashboardDemandasCards({ stats }: DashboardDemandasCardsProps) {
  const cards = [
    {
      title: "Urgentes",
      value: stats?.urgentes || 0,
      description: "Vencem em até 7 dias",
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    {
      title: "Atenção",
      value: stats?.atencao || 0,
      description: "Vencem em 8-30 dias",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
    {
      title: "Em Dia",
      value: stats?.emDia || 0,
      description: "Mais de 30 dias",
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      title: "Vencidas",
      value: stats?.vencidas || 0,
      description: "Requer ação imediata",
      icon: XCircle,
      color: "text-gray-700 dark:text-gray-300",
      bgColor: "bg-gray-100 dark:bg-gray-800",
    },
    {
      title: "Sob Demanda",
      value: stats?.sobDemanda || 0,
      description: "Sem periodicidade fixa",
      icon: HelpCircle,
      color: "text-gray-400",
      bgColor: "bg-gray-50 dark:bg-gray-900",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className={card.bgColor}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
