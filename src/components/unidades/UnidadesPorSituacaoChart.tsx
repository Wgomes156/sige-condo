import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import type { UnidadeCompleta } from "@/hooks/useUnidadesCompleto";

interface UnidadesPorSituacaoChartProps {
  unidades: UnidadeCompleta[];
}

const situacaoLabels: Record<string, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  em_reforma: "Em Reforma",
  desocupada: "Desocupada",
};

const situacaoColors: Record<string, string> = {
  ativa: "hsl(142, 76%, 36%)",
  inativa: "hsl(var(--muted-foreground))",
  em_reforma: "hsl(38, 92%, 50%)",
  desocupada: "hsl(var(--destructive))",
};

export function UnidadesPorSituacaoChart({ unidades }: UnidadesPorSituacaoChartProps) {
  const countBySituacao = unidades.reduce((acc, unidade) => {
    const situacao = unidade.situacao || "ativa";
    acc[situacao] = (acc[situacao] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(countBySituacao)
    .map(([situacao, count]) => ({
      situacao,
      name: situacaoLabels[situacao] || situacao,
      value: count,
      color: situacaoColors[situacao] || "hsl(var(--primary))",
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Situação</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground text-sm">Nenhuma unidade cadastrada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição por Situação</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => [`${value} unidade${value !== 1 ? "s" : ""}`, "Quantidade"]}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
