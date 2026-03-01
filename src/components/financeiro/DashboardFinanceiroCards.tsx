import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumoFinanceiro } from "@/hooks/useDashboardFinanceiro";

interface DashboardFinanceiroCardsProps {
  resumo?: ResumoFinanceiro;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function DashboardFinanceiroCards({
  resumo,
  isLoading,
}: DashboardFinanceiroCardsProps) {
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
              <Skeleton className="h-8 w-28 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Receitas",
      value: formatCurrency(resumo?.totalReceitas || 0),
      subtitle: `${formatCurrency(resumo?.receitasPendentes || 0)} pendentes`,
      icon: TrendingUp,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total Despesas",
      value: formatCurrency(resumo?.totalDespesas || 0),
      subtitle: `${formatCurrency(resumo?.despesasPendentes || 0)} pendentes`,
      icon: TrendingDown,
      iconColor: "text-red-600",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Saldo",
      value: formatCurrency(resumo?.saldo || 0),
      subtitle: resumo?.saldo && resumo.saldo >= 0 ? "Positivo" : "Negativo",
      icon: Wallet,
      iconColor:
        resumo?.saldo && resumo.saldo >= 0 ? "text-blue-600" : "text-red-600",
      bgColor:
        resumo?.saldo && resumo.saldo >= 0 ? "bg-blue-500/10" : "bg-red-500/10",
    },
    {
      title: "Em Atraso",
      value: formatCurrency(resumo?.totalAtrasados || 0),
      subtitle: `${resumo?.qtdAtrasados || 0} transações`,
      icon: AlertCircle,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
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
