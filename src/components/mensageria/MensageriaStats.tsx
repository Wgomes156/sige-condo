import { Send, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { EstatisticasMensageria } from "@/hooks/useMensageria";

interface Props {
  dados?: EstatisticasMensageria;
  isLoading: boolean;
}

export function MensageriaStats({ dados, isLoading }: Props) {
  const cards = [
    {
      title: "Total Enviado",
      value: isLoading ? null : (dados?.enviados ?? 0) + (dados?.lidos ?? 0),
      subtitle: `de ${dados?.total ?? 0} mensagens`,
      icon: Send,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Taxa de Entrega",
      value: isLoading ? null : `${dados?.taxa_entrega ?? 0}%`,
      subtitle: dados?.pendentes
        ? `${dados.pendentes} na fila`
        : "sem pendências",
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Falhas",
      value: isLoading ? null : dados?.falhos ?? 0,
      subtitle: dados?.falhos ? "aguardando retry" : "nenhuma falha",
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Lidas",
      value: isLoading ? null : dados?.lidos ?? 0,
      subtitle: dados?.total
        ? `${Math.round(((dados.lidos ?? 0) / dados.total) * 100)}% do total`
        : "—",
      icon: BookOpen,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
