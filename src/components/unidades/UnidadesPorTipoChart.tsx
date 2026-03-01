import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { UnidadeCompleta } from "@/hooks/useUnidadesCompleto";

interface UnidadesPorTipoChartProps {
  unidades: UnidadeCompleta[];
}

const tipoLabels: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  loja: "Loja",
  escritorio: "Escritório",
  sala: "Sala",
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function UnidadesPorTipoChart({ unidades }: UnidadesPorTipoChartProps) {
  const countByTipo = unidades.reduce((acc, unidade) => {
    const tipo = unidade.tipo_unidade || "outros";
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(countByTipo)
    .map(([tipo, count]) => ({
      name: tipoLabels[tipo] || tipo,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
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
        <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`${value} unidade${value !== 1 ? "s" : ""}`, "Quantidade"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
