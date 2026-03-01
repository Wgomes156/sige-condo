import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, Clock, CheckCircle2, XCircle, AlertTriangle, DollarSign } from "lucide-react";
import { PropostaStats } from "@/hooks/usePropostas";

interface PropostasCardsProps {
  stats: PropostaStats;
}

export function PropostasCards({ stats }: PropostasCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = [
    {
      title: "Total de Propostas",
      value: stats.total,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      title: "Rascunhos",
      value: stats.rascunho,
      icon: FileText,
      color: "text-slate-600",
      bgColor: "bg-slate-50 dark:bg-slate-950/30",
    },
    {
      title: "Enviadas",
      value: stats.enviadas,
      icon: Send,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      title: "Em Análise",
      value: stats.em_analise,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Aprovadas",
      value: stats.aprovadas,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Recusadas",
      value: stats.recusadas,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/30",
    },
    {
      title: "Expiradas",
      value: stats.expiradas,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      title: "Valor Aprovado",
      value: formatCurrency(stats.valorAprovado),
      subtitle: "mensal",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground truncate">
              {card.title}
            </CardTitle>
            <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{card.value}</div>
            {card.subtitle && (
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
