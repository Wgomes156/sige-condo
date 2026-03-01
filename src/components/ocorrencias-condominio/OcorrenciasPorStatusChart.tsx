import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { OcorrenciaPorStatus } from "@/hooks/useOcorrenciasDashboard";

interface OcorrenciasPorStatusChartProps {
  data?: OcorrenciaPorStatus[];
  isLoading: boolean;
}

export function OcorrenciasPorStatusChart({ data, isLoading }: OcorrenciasPorStatusChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <Skeleton className="h-40 w-40 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const filteredData = data?.filter((d) => d.quantidade > 0) || [];

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px]">
          <p className="text-muted-foreground text-sm">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Por Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="quantidade"
              nameKey="nome"
              label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} ocorrência${value !== 1 ? "s" : ""}`, "Quantidade"]}
            />
            <Legend formatter={(value) => value} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
