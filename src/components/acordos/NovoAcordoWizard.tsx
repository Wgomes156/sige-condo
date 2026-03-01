import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCondominios } from "@/hooks/useCondominios";
import { useUnidades } from "@/hooks/useUnidades";
import { useAcordos, DividaUnidade, SimulacaoAcordo, FormaPagamento, MetodoPagamento } from "@/hooks/useAcordos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  User,
  Calculator,
  FileText,
  AlertCircle,
} from "lucide-react";

interface NovoAcordoWizardProps {
  onClose: () => void;
}

const etapas = [
  { numero: 1, titulo: "Selecionar Unidade", icon: Building2 },
  { numero: 2, titulo: "Selecionar Dívidas", icon: AlertCircle },
  { numero: 3, titulo: "Dados do Cliente", icon: User },
  { numero: 4, titulo: "Simular Acordo", icon: Calculator },
  { numero: 5, titulo: "Revisão Final", icon: FileText },
];

export function NovoAcordoWizard({ onClose }: NovoAcordoWizardProps) {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [condominioId, setCondominioId] = useState("");
  const [unidadeId, setUnidadeId] = useState("");
  const [dividasSelecionadas, setDividasSelecionadas] = useState<string[]>([]);
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCpfCnpj, setClienteCpfCnpj] = useState("");
  const [clienteTelefone, setClienteTelefone] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [simulacaoSelecionada, setSimulacaoSelecionada] = useState<SimulacaoAcordo | null>(null);
  const [dataVencimento, setDataVencimento] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("boleto");
  const [observacoesInternas, setObservacoesInternas] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");

  const { data: condominios } = useCondominios();
  const { data: unidades } = useUnidades(condominioId || undefined);
  const { criarAcordo, simularAcordo, useDividasUnidade } = useAcordos();
  const { data: dividas, isLoading: loadingDividas } = useDividasUnidade(unidadeId || undefined);

  const unidadeSelecionada = unidades?.find((u) => u.id === unidadeId);
  const dividasParaAcordo = dividas?.filter((d) => dividasSelecionadas.includes(d.boleto_id)) || [];
  const simulacoes = dividasParaAcordo.length > 0 ? simularAcordo(dividasParaAcordo) : [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const podeAvancar = () => {
    switch (etapaAtual) {
      case 1:
        return !!condominioId && !!unidadeId;
      case 2:
        return dividasSelecionadas.length > 0;
      case 3:
        return !!clienteNome && !!clienteCpfCnpj;
      case 4:
        return !!simulacaoSelecionada && !!dataVencimento;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleAvancar = () => {
    if (etapaAtual < etapas.length) {
      setEtapaAtual(etapaAtual + 1);
    }
  };

  const handleVoltar = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const handleFinalizar = async () => {
    if (!simulacaoSelecionada) return;

    await criarAcordo.mutateAsync({
      unidade_id: unidadeId,
      condominio_id: condominioId,
      cliente_nome: clienteNome,
      cliente_cpf_cnpj: clienteCpfCnpj,
      cliente_telefone: clienteTelefone,
      cliente_email: clienteEmail,
      dividas: dividasParaAcordo,
      forma_pagamento: simulacaoSelecionada.parcelas === 1 ? "avista" : "parcelado",
      qtd_parcelas: simulacaoSelecionada.parcelas,
      desconto_percentual: simulacaoSelecionada.desconto_percentual,
      data_primeiro_vencimento: dataVencimento,
      metodo_pagamento: metodoPagamento,
      observacoes_internas: observacoesInternas,
      observacoes_cliente: observacoesCliente,
    });

    onClose();
  };

  const toggleDivida = (boletoId: string) => {
    setDividasSelecionadas((prev) =>
      prev.includes(boletoId)
        ? prev.filter((id) => id !== boletoId)
        : [...prev, boletoId]
    );
  };

  const selecionarTodas = () => {
    if (dividasSelecionadas.length === dividas?.length) {
      setDividasSelecionadas([]);
    } else {
      setDividasSelecionadas(dividas?.map((d) => d.boleto_id) || []);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center justify-between">
        {etapas.map((etapa, index) => {
          const Icon = etapa.icon;
          const isAtual = etapa.numero === etapaAtual;
          const isCompleta = etapa.numero < etapaAtual;

          return (
            <div key={etapa.numero} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  isAtual
                    ? "text-primary"
                    : isCompleta
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isAtual
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCompleta
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-muted-foreground"
                  }`}
                >
                  {isCompleta ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden text-sm font-medium md:inline">
                  {etapa.titulo}
                </span>
              </div>
              {index < etapas.length - 1 && (
                <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
              )}
            </div>
          );
        })}
      </div>

      {/* Conteúdo da Etapa */}
      <div className="min-h-[300px]">
        {/* Etapa 1: Selecionar Unidade */}
        {etapaAtual === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Condomínio</Label>
              <Select value={condominioId || undefined} onValueChange={(v) => { setCondominioId(v); setUnidadeId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o condomínio" />
                </SelectTrigger>
                <SelectContent>
                  {condominios?.filter(c => c.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {condominioId && (
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={unidadeId || undefined} onValueChange={setUnidadeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades?.filter(u => u.id).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.bloco ? `Bloco ${u.bloco} - ` : ""}Unidade {u.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* Etapa 2: Selecionar Dívidas */}
        {etapaAtual === 2 && (
          <div className="space-y-4">
            {loadingDividas ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : dividas?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <AlertCircle className="mb-2 h-8 w-8" />
                <p>Esta unidade não possui dívidas pendentes</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {dividasSelecionadas.length} de {dividas?.length} selecionadas
                  </p>
                  <Button variant="link" size="sm" onClick={selecionarTodas}>
                    {dividasSelecionadas.length === dividas?.length
                      ? "Desmarcar todas"
                      : "Selecionar todas"}
                  </Button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {dividas?.map((divida) => (
                    <Card
                      key={divida.boleto_id}
                      className={`cursor-pointer transition-colors ${
                        dividasSelecionadas.includes(divida.boleto_id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => toggleDivida(divida.boleto_id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Checkbox
                          checked={dividasSelecionadas.includes(divida.boleto_id)}
                          onCheckedChange={() => toggleDivida(divida.boleto_id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{divida.referencia}</p>
                            <p className="font-bold">{formatCurrency(divida.valor_total)}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Venc: {format(new Date(divida.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            {divida.dias_atraso > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {divida.dias_atraso} dias em atraso
                              </Badge>
                            )}
                          </div>
                          {(divida.valor_juros > 0 || divida.valor_multa > 0) && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Principal: {formatCurrency(divida.valor_original)} |
                              Juros: {formatCurrency(divida.valor_juros)} |
                              Multa: {formatCurrency(divida.valor_multa)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {dividasSelecionadas.length > 0 && (
                  <Card className="bg-muted">
                    <CardContent className="flex items-center justify-between p-4">
                      <span className="font-medium">Total Selecionado</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(
                          dividasParaAcordo.reduce((sum, d) => sum + d.valor_total, 0)
                        )}
                      </span>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Etapa 3: Dados do Cliente */}
        {etapaAtual === 3 && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ *</Label>
              <Input
                value={clienteCpfCnpj}
                onChange={(e) => setClienteCpfCnpj(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        )}

        {/* Etapa 4: Simular Acordo */}
        {etapaAtual === 4 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {simulacoes.map((sim, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-colors ${
                    simulacaoSelecionada?.tipo === sim.tipo
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => setSimulacaoSelecionada(sim)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{sim.descricao}</p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Original: {formatCurrency(sim.valor_original)}
                          </p>
                          <p className="text-green-600">
                            Desconto: -{sim.desconto_percentual}% ({formatCurrency(sim.desconto_valor)})
                          </p>
                        </div>
                      </div>
                      {simulacaoSelecionada?.tipo === sim.tipo && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="mt-4 border-t pt-4">
                      <p className="text-2xl font-bold">
                        {formatCurrency(sim.valor_final)}
                      </p>
                      {sim.parcelas > 1 && (
                        <p className="text-sm text-muted-foreground">
                          {sim.parcelas}x de {formatCurrency(sim.valor_parcela || 0)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {simulacaoSelecionada && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data do Primeiro Vencimento *</Label>
                  <Input
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={metodoPagamento}
                    onValueChange={(v) => setMetodoPagamento(v as MetodoPagamento)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao">Cartão</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Etapa 5: Revisão Final */}
        {etapaAtual === 5 && simulacaoSelecionada && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Unidade</p>
                    <p className="font-medium">
                      {unidadeSelecionada?.bloco
                        ? `Bloco ${unidadeSelecionada.bloco} - `
                        : ""}
                      Unidade {unidadeSelecionada?.codigo}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{clienteNome}</p>
                    <p className="text-sm text-muted-foreground">{clienteCpfCnpj}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Dívida Original</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(simulacaoSelecionada.valor_original)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Desconto</p>
                      <p className="text-lg font-bold text-green-600">
                        -{simulacaoSelecionada.desconto_percentual}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Negociado</p>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(simulacaoSelecionada.valor_final)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Parcelas</p>
                      <p className="font-medium">
                        {simulacaoSelecionada.parcelas}x de{" "}
                        {formatCurrency(
                          simulacaoSelecionada.valor_parcela ||
                            simulacaoSelecionada.valor_final
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Primeiro Vencimento</p>
                      <p className="font-medium">
                        {dataVencimento
                          ? format(new Date(dataVencimento + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Método</p>
                      <p className="font-medium capitalize">{metodoPagamento}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Observações Internas</Label>
                <Textarea
                  value={observacoesInternas}
                  onChange={(e) => setObservacoesInternas(e.target.value)}
                  placeholder="Notas visíveis apenas para a equipe..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações para o Cliente</Label>
                <Textarea
                  value={observacoesCliente}
                  onChange={(e) => setObservacoesCliente(e.target.value)}
                  placeholder="Informações que serão incluídas no termo..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="flex justify-between border-t pt-4">
        <Button
          variant="outline"
          onClick={etapaAtual === 1 ? onClose : handleVoltar}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {etapaAtual === 1 ? "Cancelar" : "Voltar"}
        </Button>
        {etapaAtual < etapas.length ? (
          <Button onClick={handleAvancar} disabled={!podeAvancar()}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleFinalizar} disabled={criarAcordo.isPending}>
            {criarAcordo.isPending ? "Criando..." : "Criar Acordo"}
          </Button>
        )}
      </div>
    </div>
  );
}
