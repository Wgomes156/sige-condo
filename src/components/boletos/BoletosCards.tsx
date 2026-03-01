import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface BoletosCardsProps {
  resumo: {
    totalBoletos: number;
    totalPendente: number;
    totalPago: number;
    totalAtrasado: number;
    quantidadeAtrasados: number;
  } | undefined;
  isLoading: boolean;
}

export function BoletosCards({ resumo, isLoading }: BoletosCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Boletos",
      value: resumo?.totalBoletos || 0,
      icon: FileText,
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "A Receber",
      value: resumo?.totalPendente || 0,
      icon: Clock,
      iconColor: "text-amber-600",
      bgColor: "bg-amber-500/10",
      isCurrency: true,
    },
    {
      title: "Recebido",
      value: resumo?.totalPago || 0,
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
      isCurrency: true,
    },
    {
      title: "Em Atraso",
      value: resumo?.totalAtrasado || 0,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
      isCurrency: true,
      subtitle: resumo?.quantidadeAtrasados
        ? `${resumo.quantidadeAtrasados} boleto${resumo.quantidadeAtrasados !== 1 ? "s" : ""}`
        : undefined,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.isCurrency
                  ? card.value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : card.value}
              </div>
              {card.subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
