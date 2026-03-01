import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Pencil,
  User,
  Car,
  Key,
  Users,
  PawPrint,
  ParkingCircle,
  AlertCircle,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  useUnidadeById,
  useProprietarioByUnidade,
  useInquilinoByUnidade,
  useMoradoresByUnidade,
  useVeiculosByUnidade,
  useAcessosByUnidade,
  useVisitantesByUnidade,
  useAnimaisByUnidade,
  useVagasByUnidade,
  useOcorrenciasByUnidade,
} from "@/hooks/useUnidadesCompleto";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useBoletos } from "@/hooks/useBoletos";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Inline forms
import { ProprietarioInlineForm } from "./forms/ProprietarioInlineForm";
import { InquilinoInlineForm } from "./forms/InquilinoInlineForm";
import { VeiculosInlineForm } from "./forms/VeiculosInlineForm";
import { AnimaisInlineForm } from "./forms/AnimaisInlineForm";
import { VisitantesInlineForm } from "./forms/VisitantesInlineForm";
import { DocumentosInlineForm } from "./forms/DocumentosInlineForm";

interface UnidadeDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId?: string;
  onEdit: (id: string) => void;
}

const situacaoLabels: Record<string, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
  em_reforma: "Em Reforma",
  desocupada: "Desocupada",
};

const tipoUnidadeLabels: Record<string, string> = {
  apartamento: "Apartamento",
  casa: "Casa",
  loja: "Loja",
  escritorio: "Escritório",
  sala: "Sala",
};

const tipoOcupacaoLabels: Record<string, string> = {
  moradia: "Moradia Própria",
  aluguel: "Aluguel",
  aluguel_temporada: "Aluguel por Temporada",
  desocupado: "Desocupado",
};

const statusFinanceiroLabels: Record<string, string> = {
  em_dia: "Em Dia",
  inadimplente: "Inadimplente",
  acordo: "Em Acordo",
};

export function UnidadeDetalhesDialog({
  open,
  onOpenChange,
  unidadeId,
  onEdit,
}: UnidadeDetalhesDialogProps) {
  const { data: unidade, isLoading } = useUnidadeById(unidadeId);
  const { data: proprietario } = useProprietarioByUnidade(unidadeId);
  const { data: inquilino } = useInquilinoByUnidade(unidadeId);
  const { data: moradores } = useMoradoresByUnidade(unidadeId);
  const { data: veiculos } = useVeiculosByUnidade(unidadeId);
  const { data: acessos } = useAcessosByUnidade(unidadeId);
  const { data: visitantes } = useVisitantesByUnidade(unidadeId);
  const { data: animais } = useAnimaisByUnidade(unidadeId);
  const { data: vagas } = useVagasByUnidade(unidadeId);
  const { data: ocorrencias } = useOcorrenciasByUnidade(unidadeId);
  const { data: boletos, isLoading: isLoadingBoletos } = useBoletos(
    unidadeId ? { unidade: "" } : {}
  );
  
  // Filter boletos by unidade_id
  const boletosUnidade = boletos?.filter((b) => b.unidade_id === unidadeId) || [];

  if (isLoading || !unidade) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <Skeleton className="h-6 w-48" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {unidade.codigo} - {unidade.condominios?.nome}
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={() => onEdit(unidade.id)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Tabs defaultValue="geral" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
              <TabsTrigger value="inquilino">Inquilino</TabsTrigger>
              <TabsTrigger value="veiculos">Veículos</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="acesso">Acesso</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            {/* Aba Geral */}
            <TabsContent value="geral" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Identificação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{tipoUnidadeLabels[unidade.tipo_unidade]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bloco:</span>
                      <span>{unidade.bloco || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Andar:</span>
                      <span>{unidade.andar ? `${unidade.andar}º` : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Situação:</span>
                      <Badge variant="outline">{situacaoLabels[unidade.situacao]}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Ocupação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span>{tipoOcupacaoLabels[unidade.tipo_ocupacao]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Resp. Financeiro:</span>
                      <span className="capitalize">{unidade.responsavel_financeiro}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status Financeiro:</span>
                      <Badge
                        variant={
                          unidade.status_financeiro === "em_dia"
                            ? "default"
                            : unidade.status_financeiro === "inadimplente"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {statusFinanceiroLabels[unidade.status_financeiro]}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Moradores:</span>
                      <span>{unidade.quantidade_moradores}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {(unidade.observacoes_gerais || unidade.observacoes_internas) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {unidade.observacoes_gerais && (
                      <div>
                        <p className="text-muted-foreground mb-1">Gerais:</p>
                        <p>{unidade.observacoes_gerais}</p>
                      </div>
                    )}
                    {unidade.observacoes_internas && (
                      <div>
                        <p className="text-muted-foreground mb-1">Internas:</p>
                        <p>{unidade.observacoes_internas}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Aba Pessoas */}
            <TabsContent value="pessoas" className="space-y-4 mt-4">
              {/* Proprietário */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <User className="h-4 w-4" />
                  <CardTitle className="text-sm">Proprietário</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProprietarioInlineForm
                    unidadeId={unidade.id}
                    proprietario={proprietario || null}
                  />
                </CardContent>
              </Card>

              {/* Lista de Moradores */}
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Users className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Moradores ({moradores?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {moradores && moradores.length > 0 ? (
                    <div className="space-y-2">
                      {moradores.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{m.nome_completo}</p>
                            <p className="text-muted-foreground text-xs">
                              {m.parentesco} • {m.tipo_vinculo}
                            </p>
                          </div>
                          {m.telefone && <span className="text-muted-foreground">{m.telefone}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum morador cadastrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Inquilino */}
            <TabsContent value="inquilino" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <User className="h-4 w-4" />
                  <CardTitle className="text-sm">Inquilino</CardTitle>
                </CardHeader>
                <CardContent>
                  <InquilinoInlineForm
                    unidadeId={unidade.id}
                    inquilino={inquilino || null}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Veículos */}
            <TabsContent value="veiculos" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Car className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Veículos ({veiculos?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VeiculosInlineForm
                    unidadeId={unidade.id}
                    veiculos={veiculos || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Financeiro */}
            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Boletos ({boletosUnidade.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingBoletos ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : boletosUnidade.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Referência</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pagamento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {boletosUnidade.map((boleto) => (
                            <TableRow key={boleto.id}>
                              <TableCell className="text-sm">{boleto.referencia}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(boleto.data_vencimento), "dd/MM/yyyy")}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {boleto.valor.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    boleto.status === "pago"
                                      ? "default"
                                      : boleto.status === "atraso"
                                      ? "destructive"
                                      : boleto.status === "cancelado"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {boleto.status === "pago"
                                    ? "Pago"
                                    : boleto.status === "atraso"
                                    ? "Atrasado"
                                    : boleto.status === "cancelado"
                                    ? "Cancelado"
                                    : "Pendente"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {boleto.data_pagamento
                                  ? format(new Date(boleto.data_pagamento), "dd/MM/yyyy")
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum boleto encontrado para esta unidade
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="acesso" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Key className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Dispositivos de Acesso ({acessos?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {acessos && acessos.length > 0 ? (
                    <div className="space-y-2">
                      {acessos.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium capitalize">{a.tipo_acesso.replace("_", " ")}</p>
                            <p className="text-muted-foreground text-xs">{a.codigo_identificacao}</p>
                          </div>
                          <Badge variant={a.ativo ? "default" : "secondary"}>
                            {a.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum dispositivo cadastrado</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Users className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Visitantes Autorizados ({visitantes?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VisitantesInlineForm
                    unidadeId={unidade.id}
                    visitantes={visitantes || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Documentos */}
            <TabsContent value="documentos" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <CardTitle className="text-sm">Documentos da Unidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <DocumentosInlineForm unidadeId={unidade.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Outros */}
            <TabsContent value="outros" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <PawPrint className="h-4 w-4" />
                    <CardTitle className="text-sm">
                      Animais ({animais?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimaisInlineForm
                      unidadeId={unidade.id}
                      animais={animais || []}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <ParkingCircle className="h-4 w-4" />
                    <CardTitle className="text-sm">
                      Vagas de Garagem ({vagas?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vagas && vagas.length > 0 ? (
                      <div className="space-y-2">
                        {vagas.map((v) => (
                          <div key={v.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div>
                              <p className="font-medium">Vaga {v.numero_vaga}</p>
                              <p className="text-muted-foreground text-xs">
                                {v.tipo} {v.coberta && "• Coberta"}
                              </p>
                            </div>
                            {v.localizacao && (
                              <span className="text-muted-foreground text-xs">{v.localizacao}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma vaga cadastrada</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <CardTitle className="text-sm">
                    Histórico de Ocorrências ({ocorrencias?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ocorrencias && ocorrencias.length > 0 ? (
                    <div className="space-y-3">
                      {ocorrencias.slice(0, 5).map((o) => (
                        <div key={o.id} className="border rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{o.tipo_ocorrencia}</span>
                            <Badge variant={o.resolvida ? "default" : "destructive"}>
                              {o.resolvida ? "Resolvida" : "Pendente"}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs mb-1">
                            {format(new Date(o.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm">{o.descricao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma ocorrência registrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
