import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDemandaDetalhes, useExecucoesDemanda, getStatusInfo, getPeriodicidadeLabel } from "@/hooks/useDemandas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Calendar, Edit, FileText, Phone, Mail, Building2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DemandaDetalhesDialogProps {
  demandaId: string | null;
  onClose: () => void;
  onRegistrarExecucao: (id: string) => void;
}

export function DemandaDetalhesDialog({ demandaId, onClose, onRegistrarExecucao }: DemandaDetalhesDialogProps) {
  const { data: demanda, isLoading: loadingDemanda } = useDemandaDetalhes(demandaId);
  const { data: execucoes = [], isLoading: loadingExecucoes } = useExecucoesDemanda(demandaId);

  if (!demandaId) return null;

  const statusInfo = demanda ? getStatusInfo(demanda.status) : null;

  return (
    <Dialog open={!!demandaId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {loadingDemanda ? (
              <Skeleton className="h-6 w-64" />
            ) : (
              <>
                <span>{demanda?.nome}</span>
                {statusInfo && (
                  <Badge className={statusInfo.color}>
                    {statusInfo.icon} {statusInfo.label}
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {loadingDemanda ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : demanda ? (
            <div className="space-y-6 pb-6">
              {/* Informações Gerais */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações Gerais
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span>{demanda.categoria?.nome || "Não definida"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Periodicidade:</span>
                    <span>{getPeriodicidadeLabel(demanda.periodicidade)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Obrigatório:</span>
                    <span>{demanda.obrigatorio ? "Sim" : "Não"}</span>
                  </div>
                  {demanda.base_legal && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Legal:</span>
                      <span>{demanda.base_legal}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alerta:</span>
                    <span>{demanda.alertar_antecedencia_dias} dias antes</span>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Datas
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Execução:</span>
                    <span>
                      {demanda.ultima_execucao
                        ? format(new Date(demanda.ultima_execucao), "dd/MM/yyyy", { locale: ptBR })
                        : "Nunca executado"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Próxima Execução:</span>
                    <span className={demanda.status === "vencido" || demanda.status === "urgente" ? "text-red-500 font-medium" : ""}>
                      {demanda.proxima_execucao
                        ? format(new Date(demanda.proxima_execucao), "dd/MM/yyyy", { locale: ptBR })
                        : "Sob demanda"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fornecedor */}
              {demanda.fornecedor && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Fornecedor
                  </h3>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                    <div className="font-medium">{demanda.fornecedor.nome}</div>
                    {demanda.fornecedor.telefone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {demanda.fornecedor.telefone}
                      </div>
                    )}
                    {demanda.fornecedor.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {demanda.fornecedor.email}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custo */}
              {demanda.custo_estimado > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">💰 Custo Estimado</h3>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    R$ {demanda.custo_estimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              )}

              {/* Documentos Necessários */}
              {demanda.documentos_necessarios && demanda.documentos_necessarios.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">📄 Documentos Necessários</h3>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {demanda.documentos_necessarios.map((doc, i) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Observações */}
              {demanda.observacoes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">📝 Observações</h3>
                  <div className="bg-muted/50 rounded-lg p-4 text-sm">
                    {demanda.observacoes}
                  </div>
                </div>
              )}

              <Separator />

              {/* Histórico de Execuções */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Histórico de Execuções
                </h3>
                {loadingExecucoes ? (
                  <Skeleton className="h-20 w-full" />
                ) : execucoes.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    Nenhuma execução registrada
                  </div>
                ) : (
                  <div className="space-y-2">
                    {execucoes.slice(0, 5).map((exec) => (
                      <div key={exec.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {format(new Date(exec.data_execucao), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            {exec.fornecedor_nome && (
                              <p className="text-muted-foreground text-xs">{exec.fornecedor_nome}</p>
                            )}
                          </div>
                          {exec.custo > 0 && (
                            <span className="text-muted-foreground">
                              R$ {exec.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        {exec.observacoes && (
                          <p className="mt-2 text-xs text-muted-foreground">{exec.observacoes}</p>
                        )}
                      </div>
                    ))}
                    {execucoes.length > 5 && (
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver histórico completo ({execucoes.length} execuções)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </ScrollArea>

        <div className="flex justify-between gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button onClick={() => demanda && onRegistrarExecucao(demanda.id)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar como Executado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
