import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { OSPorCondominio } from "@/hooks/useDashboardOS";

interface OSPorCondominioChartProps {
  data?: OSPorCondominio[];
  isLoading: boolean;
}

export function OSPorCondominioChart({ data, isLoading }: OSPorCondominioChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Condomínios</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 Condomínios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  // Truncate long names
  const formattedData = chartData.map((item) => ({
    ...item,
    nome: item.condominio_nome.length > 15 
      ? item.condominio_nome.substring(0, 15) + "..." 
      : item.condominio_nome,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top 5 Condomínios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData} layout="vertical">
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nome"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, _, props) => [
                  value,
                  props.payload.condominio_nome,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar
                dataKey="quantidade"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
