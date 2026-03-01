import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Building2, MapPin } from "lucide-react";
import type { UnidadeMorador } from "@/hooks/usePortalMorador";

interface MinhasUnidadesProps {
  unidades: UnidadeMorador[];
  isLoading: boolean;
}

export function MinhasUnidades({ unidades, isLoading }: MinhasUnidadesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Unidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (unidades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Unidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma unidade vinculada à sua conta
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Entre em contato com a administração do condomínio para vincular sua unidade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Minhas Unidades
          <Badge variant="secondary">{unidades.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {unidades.map(unidade => (
            <div
              key={unidade.id}
              className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{unidade.codigo}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {unidade.bloco && (
                      <p>Bloco: {unidade.bloco}</p>
                    )}
                    {unidade.numero_unidade && (
                      <p>Unidade: {unidade.numero_unidade}</p>
                    )}
                    {unidade.condominios?.nome && (
                      <p className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3" />
                        {unidade.condominios.nome}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
