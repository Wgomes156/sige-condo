import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign, Percent, TrendingUp } from "lucide-react";

interface ServicosCardsProps {
  stats: {
    totalServicos: number;
    servicosAtivos: number;
    totalCategorias: number;
    servicosPorTipo: {
      fixo: number;
      percentual: number;
      variavel: number;
    };
  };
}

export function ServicosCards({ stats }: ServicosCardsProps) {
  const cards = [
    {
      title: "Total de Serviços",
      value: stats.totalServicos,
      subtitle: `${stats.servicosAtivos} ativos`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Categorias",
      value: stats.totalCategorias,
      subtitle: "categorias cadastradas",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Valor Fixo",
      value: stats.servicosPorTipo.fixo,
      subtitle: "serviços com valor fixo",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Percentual",
      value: stats.servicosPorTipo.percentual,
      subtitle: "serviços percentuais",
      icon: Percent,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.subtitle}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
