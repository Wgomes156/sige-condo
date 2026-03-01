import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { OcorrenciaPorPrioridade } from "@/hooks/useOcorrenciasDashboard";

interface OcorrenciasPorPrioridadeChartProps {
  data?: OcorrenciaPorPrioridade[];
  isLoading: boolean;
}

export function OcorrenciasPorPrioridadeChart({ data, isLoading }: OcorrenciasPorPrioridadeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredData = data?.filter((d) => d.quantidade > 0) || [];

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Prioridade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar por prioridade
  const ordem = ["baixa", "media", "alta", "urgente"];
  const sortedData = [...filteredData].sort(
    (a, b) => ordem.indexOf(a.prioridade) - ordem.indexOf(b.prioridade)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por Prioridade</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sortedData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="nome" width={70} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value} ocorrência${value !== 1 ? "s" : ""}`, "Quantidade"]}
            />
            <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
