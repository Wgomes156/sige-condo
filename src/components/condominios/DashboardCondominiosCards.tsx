import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, Users, Calculator, MapPin, Briefcase } from "lucide-react";
import { useCondominios } from "@/hooks/useCondominios";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DashboardCondominiosCards() {
  const { data: condominios, isLoading: loadingCondominios } = useCondominios();
  
  const { data: unidades, isLoading: loadingUnidades } = useQuery({
    queryKey: ["unidades-dashboard-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("id");
      if (error) throw error;
      return data;
    },
  });

  const totalCondominios = condominios?.length || 0;
  const totalUnidades = unidades?.length || 0;
  const mediaUnidadesPorCondominio = totalCondominios > 0 
    ? (totalUnidades / totalCondominios).toFixed(1) 
    : "0";
  const condominiosComSindico = condominios?.filter(c => c.tem_sindico === true).length || 0;
  const condominiosComAdministradora = condominios?.filter(c => c.tem_administradora === true).length || 0;
  
  // Contar UFs únicas
  const ufsUnicas = condominios 
    ? [...new Set(condominios.map(c => c.uf).filter(Boolean))].length 
    : 0;

  const isLoading = loadingCondominios || loadingUnidades;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Condomínios</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingCondominios ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalCondominios}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Condomínios cadastrados
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Unidades</CardTitle>
          <Home className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingUnidades ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{totalUnidades}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Unidades cadastradas
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média de Unidades</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{mediaUnidadesPorCondominio}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Por condomínio
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Com Síndico</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingCondominios ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{condominiosComSindico}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Condomínios com síndico
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Com Administradora</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingCondominios ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{condominiosComAdministradora}</div>
          )}
          <p className="text-xs text-muted-foreground">
            Com administradora vinculada
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estados (UF)</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loadingCondominios ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-bold">{ufsUnicas}</div>
          )}
          <p className="text-xs text-muted-foreground">
            UFs com condomínios
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
