import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bell, 
  AlertCircle, 
  Wrench, 
  Users, 
  DollarSign,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Comunicado } from "@/hooks/useComunicados";

interface MeusComunicadosProps {
  comunicados: Comunicado[];
  isLoading: boolean;
}

const tipoConfig = {
  aviso: { 
    label: "Aviso", 
    variant: "outline" as const, 
    icon: Bell,
    color: "text-blue-500"
  },
  urgente: { 
    label: "Urgente", 
    variant: "destructive" as const, 
    icon: AlertCircle,
    color: "text-destructive"
  },
  manutencao: { 
    label: "Manutenção", 
    variant: "secondary" as const, 
    icon: Wrench,
    color: "text-orange-500"
  },
  assembleia: { 
    label: "Assembleia", 
    variant: "default" as const, 
    icon: Users,
    color: "text-purple-500"
  },
  financeiro: { 
    label: "Financeiro", 
    variant: "outline" as const, 
    icon: DollarSign,
    color: "text-green-500"
  },
};

export function MeusComunicados({ comunicados, isLoading }: MeusComunicadosProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comunicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comunicados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comunicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum comunicado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Ordenar: urgentes primeiro
  const comunicadosOrdenados = [...comunicados].sort((a, b) => {
    if (a.tipo === "urgente" && b.tipo !== "urgente") return -1;
    if (a.tipo !== "urgente" && b.tipo === "urgente") return 1;
    return new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Comunicados
          <Badge variant="secondary">{comunicados.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comunicadosOrdenados.map(comunicado => {
            const config = tipoConfig[comunicado.tipo];
            const Icon = config.icon;
            
            return (
              <div 
                key={comunicado.id} 
                className={`p-4 rounded-lg border ${
                  comunicado.tipo === "urgente" 
                    ? "border-destructive bg-destructive/5" 
                    : "bg-muted/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full bg-background ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{comunicado.titulo}</h3>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {comunicado.conteudo}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(comunicado.data_publicacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                      {comunicado.condominios?.nome && (
                        <span>{comunicado.condominios.nome}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
