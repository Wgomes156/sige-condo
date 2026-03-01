import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  History,
  CreditCard,
  AlertTriangle,
  Play,
} from "lucide-react";
import { useAcordos, AcordoStatus, AcordoParcelaStatus } from "@/hooks/useAcordos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AcordoDetalhesDialogProps {
  acordoId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<AcordoStatus, { label: string; color: string; icon: React.ElementType }> = {
  em_negociacao: { label: "Em Negociação", color: "bg-yellow-500/20 text-yellow-600", icon: Clock },
  ativo: { label: "Ativo", color: "bg-blue-500/20 text-blue-600", icon: FileText },
  quitado: { label: "Quitado", color: "bg-green-500/20 text-green-600", icon: CheckCircle2 },
  rompido: { label: "Rompido", color: "bg-red-500/20 text-red-600", icon: XCircle },
  cancelado: { label: "Cancelado", color: "bg-gray-500/20 text-gray-600", icon: XCircle },
};

const parcelaStatusConfig: Record<AcordoParcelaStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-600" },
  paga: { label: "Paga", color: "bg-green-500/20 text-green-600" },
  atrasada: { label: "Atrasada", color: "bg-red-500/20 text-red-600" },
  cancelada: { label: "Cancelada", color: "bg-gray-500/20 text-gray-600" },
};

export function AcordoDetalhesDialog({
  acordoId,
  open,
  onOpenChange,
}: AcordoDetalhesDialogProps) {
  const [pagamentoDialogOpen, setPagamentoDialogOpen] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<string | null>(null);
  const [valorPago, setValorPago] = useState("");
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metodoPagamentoParcela, setMetodoPagamentoParcela] = useState("pix");
  const [codigoTransacao, setCodigoTransacao] = useState("");
  const [ativarDialogOpen, setAtivarDialogOpen] = useState(false);
  const [romperDialogOpen, setRomperDialogOpen] = useState(false);
  const [motivoRompimento, setMotivoRompimento] = useState("");

  const {
    useAcordoById,
    useAcordoParcelas,
    useAcordoHistorico,
    atualizarStatus,
    registrarPagamento,
  } = useAcordos();

  const { data: acordo, isLoading: loadingAcordo } = useAcordoById(acordoId || undefined);
  const { data: parcelas, isLoading: loadingParcelas } = useAcordoParcelas(acordoId || undefined);
  const { data: historico, isLoading: loadingHistorico } = useAcordoHistorico(acordoId || undefined);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleRegistrarPagamento = async () => {
    if (!parcelaSelecionada || !acordoId) return;

    await registrarPagamento.mutateAsync({
      parcelaId: parcelaSelecionada,
      acordoId,
      valorPago: parseFloat(valorPago),
      dataPagamento,
      metodoPagamento: metodoPagamentoParcela,
      codigoTransacao,
    });

    setPagamentoDialogOpen(false);
    setParcelaSelecionada(null);
    setValorPago("");
    setCodigoTransacao("");
  };

  const handleAtivarAcordo = async () => {
    if (!acordoId) return;
    await atualizarStatus.mutateAsync({ acordoId, status: "ativo" });
    setAtivarDialogOpen(false);
  };

  const handleRomperAcordo = async () => {
    if (!acordoId) return;
    await atualizarStatus.mutateAsync({
      acordoId,
      status: "rompido",
      motivo: motivoRompimento,
    });
    setRomperDialogOpen(false);
    setMotivoRompimento("");
  };

  const abrirPagamento = (parcelaId: string, valorParcela: number) => {
    setParcelaSelecionada(parcelaId);
    setValorPago(valorParcela.toFixed(2));
    setPagamentoDialogOpen(true);
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {loadingAcordo ? (
                <Skeleton className="h-6 w-48" />
              ) : (
                <>
                  Acordo {acordo?.numero_acordo}
                  {acordo && (
                    <Badge className={statusConfig[acordo.status].color}>
                      {statusConfig[acordo.status].label}
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Visualize e gerencie os detalhes do acordo de pagamento.
            </DialogDescription>
          </DialogHeader>

          {loadingAcordo ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : acordo ? (
            <div className="space-y-6">
              {/* Ações rápidas */}
              {acordo.status === "em_negociacao" && (
                <div className="flex gap-2">
                  <Button onClick={() => setAtivarDialogOpen(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    Ativar Acordo
                  </Button>
                </div>
              )}
              {acordo.status === "ativo" && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => setRomperDialogOpen(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Romper Acordo
                  </Button>
                </div>
              )}

              {/* Resumo */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Valor Negociado</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(acordo.valor_total_negociado)}
                    </p>
                    {acordo.percentual_desconto && acordo.percentual_desconto > 0 && (
                      <p className="text-xs text-green-600">
                        -{acordo.percentual_desconto.toFixed(0)}% de desconto
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Valor Recuperado</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(acordo.valor_recuperado)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Valor Pendente</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(acordo.valor_pendente || 0)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Parcelas</p>
                    <p className="text-xl font-bold">
                      {acordo.parcelas_pagas}/{acordo.qtd_parcelas}
                    </p>
                    {acordo.parcelas_atrasadas > 0 && (
                      <p className="text-xs text-red-600">
                        {acordo.parcelas_atrasadas} atrasada(s)
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="parcelas">
                <TabsList>
                  <TabsTrigger value="parcelas">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Parcelas
                  </TabsTrigger>
                  <TabsTrigger value="detalhes">
                    <FileText className="mr-2 h-4 w-4" />
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="historico">
                    <History className="mr-2 h-4 w-4" />
                    Histórico
                  </TabsTrigger>
                </TabsList>

                {/* Parcelas */}
                <TabsContent value="parcelas" className="mt-4">
                  {loadingParcelas ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelas?.map((parcela) => (
                          <TableRow key={parcela.id}>
                            <TableCell className="font-medium">
                              {parcela.numero_parcela}/{acordo.qtd_parcelas}
                            </TableCell>
                            <TableCell>
                              {format(new Date(parcela.data_vencimento), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(parcela.valor_parcela)}
                            </TableCell>
                            <TableCell>
                              <Badge className={parcelaStatusConfig[parcela.status].color}>
                                {parcelaStatusConfig[parcela.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {parcela.data_pagamento
                                ? format(new Date(parcela.data_pagamento), "dd/MM/yyyy", {
                                    locale: ptBR,
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {parcela.status === "pendente" ||
                              parcela.status === "atrasada" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    abrirPagamento(parcela.id, parcela.valor_parcela)
                                  }
                                >
                                  <DollarSign className="mr-1 h-3 w-3" />
                                  Pagar
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Detalhes */}
                <TabsContent value="detalhes" className="mt-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Dados do Cliente</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium">{acordo.cliente_nome}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                          <p className="font-medium">{acordo.cliente_cpf_cnpj}</p>
                        </div>
                        {acordo.cliente_telefone && (
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <p className="font-medium">{acordo.cliente_telefone}</p>
                          </div>
                        )}
                        {acordo.cliente_email && (
                          <div>
                            <p className="text-sm text-muted-foreground">E-mail</p>
                            <p className="font-medium">{acordo.cliente_email}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Dados da Dívida</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Principal</span>
                          <span>{formatCurrency(acordo.valor_principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Juros</span>
                          <span>{formatCurrency(acordo.valor_juros)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Multa</span>
                          <span>{formatCurrency(acordo.valor_multa)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 font-bold">
                          <span>Total da Dívida</span>
                          <span>{formatCurrency(acordo.valor_total_divida)}</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Desconto Aplicado</span>
                          <span>-{formatCurrency(acordo.desconto_total)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 text-lg font-bold">
                          <span>Valor Negociado</span>
                          <span>{formatCurrency(acordo.valor_total_negociado)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {acordo.observacoes_internas && (
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="text-base">Observações Internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{acordo.observacoes_internas}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Histórico */}
                <TabsContent value="historico" className="mt-4">
                  {loadingHistorico ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    <div className="space-y-4">
                      {historico?.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-l-2 border-muted pl-4"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.descricao}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                          {item.valor_envolvido && (
                            <Badge variant="secondary">
                              {formatCurrency(item.valor_envolvido)}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {historico?.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum registro no histórico
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Acordo não encontrado
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Pagamento */}
      <AlertDialog open={pagamentoDialogOpen} onOpenChange={setPagamentoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Informe os dados do pagamento da parcela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor Pago</Label>
              <Input
                type="number"
                step="0.01"
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Método de Pagamento</Label>
              <Select
                value={metodoPagamentoParcela}
                onValueChange={setMetodoPagamentoParcela}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Código da Transação (opcional)</Label>
              <Input
                value={codigoTransacao}
                onChange={(e) => setCodigoTransacao(e.target.value)}
                placeholder="ID ou comprovante"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegistrarPagamento}
              disabled={registrarPagamento.isPending}
            >
              {registrarPagamento.isPending ? "Salvando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Ativar Acordo */}
      <AlertDialog open={ativarDialogOpen} onOpenChange={setAtivarDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar Acordo</AlertDialogTitle>
            <AlertDialogDescription>
              Ao ativar o acordo, ele passará a ter efeito e as parcelas começarão a
              vencer nas datas programadas. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAtivarAcordo}
              disabled={atualizarStatus.isPending}
            >
              {atualizarStatus.isPending ? "Ativando..." : "Ativar Acordo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Romper Acordo */}
      <AlertDialog open={romperDialogOpen} onOpenChange={setRomperDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Romper Acordo
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Ao romper o acordo, todas as parcelas
              pendentes serão canceladas e a dívida original poderá ser cobrada
              novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label>Motivo do Rompimento *</Label>
            <Textarea
              value={motivoRompimento}
              onChange={(e) => setMotivoRompimento(e.target.value)}
              placeholder="Descreva o motivo do rompimento..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRomperAcordo}
              disabled={atualizarStatus.isPending || !motivoRompimento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {atualizarStatus.isPending ? "Processando..." : "Romper Acordo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
