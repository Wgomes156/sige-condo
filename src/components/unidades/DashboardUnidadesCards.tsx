import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, AlertTriangle, Users, DollarSign, Car, ParkingCircle, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UnidadeCompleta } from "@/hooks/useUnidadesCompleto";

interface DashboardUnidadesCardsProps {
  unidades: UnidadeCompleta[];
}

export function DashboardUnidadesCards({ unidades }: DashboardUnidadesCardsProps) {
  const unidadeIds = unidades.map((u) => u.id);

  // Fetch moradores count
  const { data: moradoresCount = 0 } = useQuery({
    queryKey: ["moradores-count", unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("moradores_unidade")
        .select("*", { count: "exact", head: true })
        .in("unidade_id", unidadeIds);
      if (error) throw error;
      return count || 0;
    },
    enabled: unidadeIds.length > 0,
  });

  // Fetch veículos count
  const { data: veiculosCount = 0 } = useQuery({
    queryKey: ["veiculos-count", unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("veiculos_unidade")
        .select("*", { count: "exact", head: true })
        .in("unidade_id", unidadeIds);
      if (error) throw error;
      return count || 0;
    },
    enabled: unidadeIds.length > 0,
  });

  // Fetch vagas count
  const { data: vagasCount = 0 } = useQuery({
    queryKey: ["vagas-count", unidadeIds],
    queryFn: async () => {
      if (unidadeIds.length === 0) return 0;
      const { count, error } = await supabase
        .from("vagas_garagem")
        .select("*", { count: "exact", head: true })
        .in("unidade_id", unidadeIds);
      if (error) throw error;
      return count || 0;
    },
    enabled: unidadeIds.length > 0,
  });

  const totalUnidades = unidades.length;
  const unidadesAtivas = unidades.filter((u) => u.situacao === "ativa").length;
  const unidadesDesocupadas = unidades.filter((u) => u.situacao === "desocupada").length;
  const unidadesAlugadas = unidades.filter((u) => u.tipo_ocupacao === "aluguel" || u.tipo_ocupacao === "aluguel_temporada").length;
  const unidadesInadimplentes = unidades.filter((u) => u.status_financeiro === "inadimplente").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUnidades}</div>
          <p className="text-xs text-muted-foreground">unidades</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ativas</CardTitle>
          <Home className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{unidadesAtivas}</div>
          <p className="text-xs text-muted-foreground">
            {totalUnidades > 0 ? ((unidadesAtivas / totalUnidades) * 100).toFixed(0) : 0}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Desocupadas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">{unidadesDesocupadas}</div>
          <p className="text-xs text-muted-foreground">sem ocupação</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alugadas</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{unidadesAlugadas}</div>
          <p className="text-xs text-muted-foreground">com inquilinos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
          <DollarSign className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{unidadesInadimplentes}</div>
          <p className="text-xs text-muted-foreground">débitos pendentes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Moradores</CardTitle>
          <UserCheck className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{moradoresCount}</div>
          <p className="text-xs text-muted-foreground">cadastrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Veículos</CardTitle>
          <Car className="h-4 w-4 text-cyan-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-600">{veiculosCount}</div>
          <p className="text-xs text-muted-foreground">registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vagas</CardTitle>
          <ParkingCircle className="h-4 w-4 text-violet-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-violet-600">{vagasCount}</div>
          <p className="text-xs text-muted-foreground">de garagem</p>
        </CardContent>
      </Card>
    </div>
  );
}
