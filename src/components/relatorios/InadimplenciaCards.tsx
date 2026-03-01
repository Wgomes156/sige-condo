import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";
import { ResumoInadimplencia } from "@/hooks/useRelatorioInadimplencia";
import { Skeleton } from "@/components/ui/skeleton";

interface InadimplenciaCardsProps {
  resumo?: ResumoInadimplencia;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function InadimplenciaCards({ resumo, isLoading }: InadimplenciaCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Inadimplentes",
      value: resumo?.totalInadimplentes || 0,
      subtitle: "boletos em atraso",
      icon: Users,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Valor Total Devido",
      value: formatCurrency(resumo?.valorTotalDevido || 0),
      subtitle: "a receber",
      icon: DollarSign,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Média de Atraso",
      value: `${resumo?.mediaAtraso || 0} dias`,
      subtitle: "tempo médio de inadimplência",
      icon: Clock,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Maior Débito",
      value: formatCurrency(resumo?.maiorDebito || 0),
      subtitle: "maior valor em atraso",
      icon: TrendingUp,
      iconColor: "text-red-700",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
