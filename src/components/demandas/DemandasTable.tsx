import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, CheckCircle, Calendar, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DemandaCondominio, getStatusInfo, getPeriodicidadeLabel, calcularDiasRestantes } from "@/hooks/useDemandas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DemandasTableProps {
  demandas: DemandaCondominio[];
  isLoading: boolean;
  onVerDetalhes: (id: string) => void;
  onRegistrarExecucao: (id: string) => void;
}

export function DemandasTable({ demandas, isLoading, onVerDetalhes, onRegistrarExecucao }: DemandasTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (demandas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="font-semibold mb-1">Nenhuma demanda encontrada</h3>
        <p className="text-sm text-muted-foreground">
          Importe templates ou crie uma nova demanda personalizada.
        </p>
      </div>
    );
  }

  // Agrupar por categoria
  const demandasPorCategoria = demandas.reduce((acc, d) => {
    const catNome = d.categoria?.nome || "Sem categoria";
    if (!acc[catNome]) acc[catNome] = [];
    acc[catNome].push(d);
    return acc;
  }, {} as Record<string, DemandaCondominio[]>);

  return (
    <div className="space-y-6">
      {Object.entries(demandasPorCategoria).map(([categoria, items]) => (
        <div key={categoria} className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <span>{items[0]?.categoria?.icone ? getIconEmoji(items[0].categoria.icone) : "📁"}</span>
            <span>{categoria}</span>
            <span className="text-xs">({items.length})</span>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Periodicidade</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Próxima Execução</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((demanda) => {
                  const statusInfo = getStatusInfo(demanda.status);
                  const diasRestantes = calcularDiasRestantes(demanda.proxima_execucao);
                  
                  return (
                    <TableRow key={demanda.id}>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon} {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{demanda.nome}</p>
                          {demanda.obrigatorio && (
                            <span className="text-xs text-red-600">Obrigatório</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPeriodicidadeLabel(demanda.periodicidade)}</TableCell>
                      <TableCell>
                        {demanda.ultima_execucao
                          ? format(new Date(demanda.ultima_execucao), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {demanda.proxima_execucao ? (
                          <div>
                            <p>{format(new Date(demanda.proxima_execucao), "dd/MM/yyyy", { locale: ptBR })}</p>
                            {diasRestantes !== null && (
                              <p className={`text-xs ${diasRestantes < 0 ? "text-red-500" : diasRestantes <= 7 ? "text-yellow-600" : "text-muted-foreground"}`}>
                                {diasRestantes < 0
                                  ? `Atrasado há ${Math.abs(diasRestantes)} dias`
                                  : diasRestantes === 0
                                  ? "Vence hoje"
                                  : `Em ${diasRestantes} dias`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sob demanda</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {demanda.fornecedor?.nome || (
                          <span className="text-muted-foreground text-sm">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onVerDetalhes(demanda.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onRegistrarExecucao(demanda.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Marcar como Executado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onVerDetalhes(demanda.id)}>
                              <Calendar className="h-4 w-4 mr-2" />
                              Reagendar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
}

function getIconEmoji(iconName: string): string {
  const iconMap: Record<string, string> = {
    Droplets: "💧",
    Bug: "🐛",
    Building2: "🏗️",
    Flame: "🔥",
    FileText: "📄",
    TreePine: "🌳",
    Sparkles: "✨",
    Settings: "⚙️",
    Wrench: "🔧",
  };
  return iconMap[iconName] || "📁";
}
