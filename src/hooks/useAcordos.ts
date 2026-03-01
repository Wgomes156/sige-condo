import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export type AcordoStatus = 'em_negociacao' | 'ativo' | 'quitado' | 'rompido' | 'cancelado';
export type AcordoParcelaStatus = 'pendente' | 'paga' | 'atrasada' | 'cancelada';
export type FormaPagamento = 'avista' | 'parcelado';
export type MetodoPagamento = 'boleto' | 'pix' | 'cartao' | 'debito_automatico' | 'dinheiro' | 'transferencia';

export interface Acordo {
  id: string;
  numero_acordo: string;
  unidade_id: string;
  condominio_id: string;
  status: AcordoStatus;
  data_criacao: string;
  data_assinatura?: string;
  data_quitacao?: string;
  data_rompimento?: string;
  motivo_rompimento?: string;
  responsavel_negociacao_id?: string;
  responsavel_acompanhamento_id?: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string;
  cliente_telefone?: string;
  cliente_email?: string;
  valor_total_divida: number;
  valor_principal: number;
  valor_juros: number;
  valor_multa: number;
  valor_correcao: number;
  periodo_divida_inicio?: string;
  periodo_divida_fim?: string;
  dias_atraso?: number;
  valor_total_negociado: number;
  desconto_juros: number;
  desconto_multa: number;
  desconto_correcao: number;
  desconto_avista: number;
  desconto_total: number;
  percentual_desconto?: number;
  forma_pagamento: FormaPagamento;
  qtd_parcelas: number;
  valor_entrada: number;
  valor_parcela?: number;
  data_primeiro_vencimento?: string;
  dia_vencimento?: number;
  metodo_pagamento?: MetodoPagamento;
  termo_acordo_url?: string;
  termo_assinado: boolean;
  aceite_digital: boolean;
  observacoes_internas?: string;
  observacoes_cliente?: string;
  data_ultimo_contato?: string;
  proxima_acao_agendada?: string;
  proxima_acao_descricao?: string;
  valor_recuperado: number;
  valor_pendente?: number;
  parcelas_pagas: number;
  parcelas_atrasadas: number;
  probabilidade_rompimento: number;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  unidade?: { id: string; codigo: string; bloco?: string };
  condominio?: { id: string; nome: string };
}

export interface AcordoParcelaOrigem {
  id: string;
  acordo_id: string;
  boleto_id?: string;
  numero_parcela?: string;
  competencia?: string;
  valor_original: number;
  valor_juros: number;
  valor_multa: number;
  valor_correcao: number;
  valor_total: number;
  data_vencimento_original?: string;
  dias_atraso?: number;
  incluida_acordo: boolean;
  created_at: string;
}

export interface AcordoParcelaNegociada {
  id: string;
  acordo_id: string;
  numero_parcela: number;
  descricao?: string;
  valor_parcela: number;
  valor_pago: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: AcordoParcelaStatus;
  dias_atraso: number;
  metodo_pagamento?: string;
  comprovante_url?: string;
  codigo_transacao?: string;
  enviado_cobranca: boolean;
  data_envio_cobranca?: string;
  created_at: string;
  updated_at: string;
}

export interface AcordoHistorico {
  id: string;
  acordo_id: string;
  usuario_id?: string;
  tipo_acao: string;
  descricao: string;
  dados_anteriores?: Record<string, unknown>;
  dados_novos?: Record<string, unknown>;
  parcela_id?: string;
  valor_envolvido?: number;
  ip_origem?: string;
  user_agent?: string;
  created_at: string;
}

export interface DividaUnidade {
  boleto_id: string;
  referencia: string;
  valor_original: number;
  valor_juros: number;
  valor_multa: number;
  valor_total: number;
  data_vencimento: string;
  dias_atraso: number;
}

export interface SimulacaoAcordo {
  tipo: string;
  descricao: string;
  valor_original: number;
  desconto_percentual: number;
  desconto_valor: number;
  valor_final: number;
  parcelas: number;
  valor_parcela?: number;
}

export interface AcordoStats {
  totalAcordos: number;
  acordosAtivos: number;
  acordosQuitados: number;
  acordosRompidos: number;
  valorRecuperado: number;
  valorPendente: number;
  taxaRecuperacao: number;
  emRisco: number;
}

interface UseAcordosFilters {
  condominioId?: string;
  status?: AcordoStatus;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export function useAcordos(filters?: UseAcordosFilters) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Listar acordos
  const { data: acordos, isLoading, error } = useQuery({
    queryKey: ["acordos", filters],
    queryFn: async () => {
      let query = supabase
        .from("acordos")
        .select(`
          *,
          unidade:unidades(id, codigo, bloco),
          condominio:condominios(id, nome)
        `)
        .order("created_at", { ascending: false });

      if (filters?.condominioId) {
        query = query.eq("condominio_id", filters.condominioId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.dataInicio) {
        query = query.gte("data_criacao", filters.dataInicio);
      }
      if (filters?.dataFim) {
        query = query.lte("data_criacao", filters.dataFim);
      }
      if (filters?.busca) {
        query = query.or(`numero_acordo.ilike.%${filters.busca}%,cliente_nome.ilike.%${filters.busca}%,cliente_cpf_cnpj.ilike.%${filters.busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Acordo[];
    },
  });

  // Query: Estatísticas
  const { data: stats } = useQuery({
    queryKey: ["acordos-stats", filters?.condominioId],
    queryFn: async () => {
      let query = supabase.from("acordos").select("*");
      if (filters?.condominioId) {
        query = query.eq("condominio_id", filters.condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const acordosList = data || [];
      const ativos = acordosList.filter(a => a.status === 'ativo');
      const quitados = acordosList.filter(a => a.status === 'quitado');
      const rompidos = acordosList.filter(a => a.status === 'rompido');
      const emRisco = acordosList.filter(a => a.probabilidade_rompimento >= 50);

      const valorRecuperado = acordosList.reduce((sum, a) => sum + Number(a.valor_recuperado || 0), 0);
      const valorPendente = ativos.reduce((sum, a) => sum + Number(a.valor_pendente || 0), 0);
      const valorTotalNegociado = acordosList.reduce((sum, a) => sum + Number(a.valor_total_negociado || 0), 0);

      return {
        totalAcordos: acordosList.length,
        acordosAtivos: ativos.length,
        acordosQuitados: quitados.length,
        acordosRompidos: rompidos.length,
        valorRecuperado,
        valorPendente,
        taxaRecuperacao: valorTotalNegociado > 0 ? (valorRecuperado / valorTotalNegociado) * 100 : 0,
        emRisco: emRisco.length,
      } as AcordoStats;
    },
  });

  // Query: Buscar acordo por ID
  const useAcordoById = (acordoId?: string) => useQuery({
    queryKey: ["acordo", acordoId],
    queryFn: async () => {
      if (!acordoId) return null;
      const { data, error } = await supabase
        .from("acordos")
        .select(`
          *,
          unidade:unidades(id, codigo, bloco, condominio_id),
          condominio:condominios(id, nome)
        `)
        .eq("id", acordoId)
        .maybeSingle();

      if (error) throw error;
      return data as Acordo | null;
    },
    enabled: !!acordoId,
  });

  // Query: Parcelas do acordo
  const useAcordoParcelas = (acordoId?: string) => useQuery({
    queryKey: ["acordo-parcelas", acordoId],
    queryFn: async () => {
      if (!acordoId) return [];
      const { data, error } = await supabase
        .from("acordo_parcelas_negociadas")
        .select("*")
        .eq("acordo_id", acordoId)
        .order("numero_parcela", { ascending: true });

      if (error) throw error;
      return data as AcordoParcelaNegociada[];
    },
    enabled: !!acordoId,
  });

  // Query: Histórico do acordo
  const useAcordoHistorico = (acordoId?: string) => useQuery({
    queryKey: ["acordo-historico", acordoId],
    queryFn: async () => {
      if (!acordoId) return [];
      const { data, error } = await supabase
        .from("acordo_historico")
        .select("*")
        .eq("acordo_id", acordoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AcordoHistorico[];
    },
    enabled: !!acordoId,
  });

  // Query: Dívidas de uma unidade (boletos pendentes/atrasados)
  const useDividasUnidade = (unidadeId?: string) => useQuery({
    queryKey: ["dividas-unidade", unidadeId],
    queryFn: async () => {
      if (!unidadeId) return [];
      
      // Buscar dados da unidade
      const { data: unidade } = await supabase
        .from("unidades")
        .select("codigo, condominio_id")
        .eq("id", unidadeId)
        .single();

      if (!unidade) return [];

      // Buscar boletos pendentes/atrasados dessa unidade
      const { data: boletos, error } = await supabase
        .from("boletos")
        .select("*")
        .eq("condominio_id", unidade.condominio_id)
        .eq("unidade", unidade.codigo)
        .in("status", ["pendente", "atraso"])
        .order("data_vencimento", { ascending: true });

      if (error) throw error;

      const hoje = new Date();
      return (boletos || []).map(b => {
        const vencimento = new Date(b.data_vencimento);
        const diasAtraso = Math.max(0, Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
        // Cálculos simplificados de juros/multa
        const valorOriginal = Number(b.valor);
        const valorJuros = diasAtraso > 0 ? valorOriginal * 0.01 * Math.floor(diasAtraso / 30) : 0;
        const valorMulta = diasAtraso > 0 ? valorOriginal * 0.02 : 0;

        return {
          boleto_id: b.id,
          referencia: b.referencia,
          valor_original: valorOriginal,
          valor_juros: valorJuros,
          valor_multa: valorMulta,
          valor_total: valorOriginal + valorJuros + valorMulta,
          data_vencimento: b.data_vencimento,
          dias_atraso: diasAtraso,
        } as DividaUnidade;
      });
    },
    enabled: !!unidadeId,
  });

  // Função: Simular acordo
  const simularAcordo = (dividas: DividaUnidade[]): SimulacaoAcordo[] => {
    const valorTotal = dividas.reduce((sum, d) => sum + d.valor_total, 0);

    return [
      {
        tipo: 'avista',
        descricao: 'Pagamento à vista com 30% de desconto',
        valor_original: valorTotal,
        desconto_percentual: 30,
        desconto_valor: valorTotal * 0.30,
        valor_final: valorTotal * 0.70,
        parcelas: 1,
      },
      {
        tipo: 'parcelado_3x',
        descricao: 'Parcelado em 3x com 15% de desconto',
        valor_original: valorTotal,
        desconto_percentual: 15,
        desconto_valor: valorTotal * 0.15,
        valor_final: valorTotal * 0.85,
        parcelas: 3,
        valor_parcela: (valorTotal * 0.85) / 3,
      },
      {
        tipo: 'parcelado_6x',
        descricao: 'Parcelado em 6x com 10% de desconto',
        valor_original: valorTotal,
        desconto_percentual: 10,
        desconto_valor: valorTotal * 0.10,
        valor_final: valorTotal * 0.90,
        parcelas: 6,
        valor_parcela: (valorTotal * 0.90) / 6,
      },
      {
        tipo: 'parcelado_12x',
        descricao: 'Parcelado em 12x com 5% de desconto',
        valor_original: valorTotal,
        desconto_percentual: 5,
        desconto_valor: valorTotal * 0.05,
        valor_final: valorTotal * 0.95,
        parcelas: 12,
        valor_parcela: (valorTotal * 0.95) / 12,
      },
    ];
  };

  // Mutation: Criar acordo
  const criarAcordo = useMutation({
    mutationFn: async (dados: {
      unidade_id: string;
      condominio_id: string;
      cliente_nome: string;
      cliente_cpf_cnpj: string;
      cliente_telefone?: string;
      cliente_email?: string;
      dividas: DividaUnidade[];
      forma_pagamento: FormaPagamento;
      qtd_parcelas: number;
      desconto_percentual: number;
      valor_entrada?: number;
      data_primeiro_vencimento: string;
      dia_vencimento?: number;
      metodo_pagamento?: MetodoPagamento;
      observacoes_internas?: string;
      observacoes_cliente?: string;
    }) => {
      // Gerar número do acordo
      const { data: numeroAcordo } = await supabase.rpc('gerar_numero_acordo');

      // Calcular valores
      const valorTotalDivida = dados.dividas.reduce((sum, d) => sum + d.valor_total, 0);
      const valorPrincipal = dados.dividas.reduce((sum, d) => sum + d.valor_original, 0);
      const valorJuros = dados.dividas.reduce((sum, d) => sum + d.valor_juros, 0);
      const valorMulta = dados.dividas.reduce((sum, d) => sum + d.valor_multa, 0);
      const descontoTotal = valorTotalDivida * (dados.desconto_percentual / 100);
      const valorNegociado = valorTotalDivida - descontoTotal;
      const valorParcela = valorNegociado / dados.qtd_parcelas;
      const diasAtraso = Math.max(...dados.dividas.map(d => d.dias_atraso));

      // Criar acordo
      const { data: acordo, error: acordoError } = await supabase
        .from("acordos")
        .insert({
          numero_acordo: numeroAcordo,
          unidade_id: dados.unidade_id,
          condominio_id: dados.condominio_id,
          status: 'em_negociacao',
          responsavel_negociacao_id: user?.id,
          responsavel_acompanhamento_id: user?.id,
          cliente_nome: dados.cliente_nome,
          cliente_cpf_cnpj: dados.cliente_cpf_cnpj,
          cliente_telefone: dados.cliente_telefone,
          cliente_email: dados.cliente_email,
          valor_total_divida: valorTotalDivida,
          valor_principal: valorPrincipal,
          valor_juros: valorJuros,
          valor_multa: valorMulta,
          valor_correcao: 0,
          periodo_divida_inicio: dados.dividas[0]?.data_vencimento,
          periodo_divida_fim: dados.dividas[dados.dividas.length - 1]?.data_vencimento,
          dias_atraso: diasAtraso,
          valor_total_negociado: valorNegociado,
          desconto_juros: valorJuros * (dados.desconto_percentual / 100),
          desconto_multa: valorMulta * (dados.desconto_percentual / 100),
          desconto_total: descontoTotal,
          percentual_desconto: dados.desconto_percentual,
          forma_pagamento: dados.forma_pagamento,
          qtd_parcelas: dados.qtd_parcelas,
          valor_entrada: dados.valor_entrada || 0,
          valor_parcela: valorParcela,
          data_primeiro_vencimento: dados.data_primeiro_vencimento,
          dia_vencimento: dados.dia_vencimento,
          metodo_pagamento: dados.metodo_pagamento,
          observacoes_internas: dados.observacoes_internas,
          observacoes_cliente: dados.observacoes_cliente,
          valor_pendente: valorNegociado,
        })
        .select()
        .single();

      if (acordoError) throw acordoError;

      // Criar parcelas de origem (referência aos boletos)
      const parcelasOrigem = dados.dividas.map(d => ({
        acordo_id: acordo.id,
        boleto_id: d.boleto_id,
        numero_parcela: d.referencia,
        valor_original: d.valor_original,
        valor_juros: d.valor_juros,
        valor_multa: d.valor_multa,
        valor_correcao: 0,
        valor_total: d.valor_total,
        data_vencimento_original: d.data_vencimento,
        dias_atraso: d.dias_atraso,
        incluida_acordo: true,
      }));

      const { error: origemError } = await supabase
        .from("acordo_parcelas_origem")
        .insert(parcelasOrigem);

      if (origemError) throw origemError;

      // Gerar parcelas negociadas
      const parcelasNegociadas = [];
      let dataVencimento = new Date(dados.data_primeiro_vencimento);

      for (let i = 1; i <= dados.qtd_parcelas; i++) {
        parcelasNegociadas.push({
          acordo_id: acordo.id,
          numero_parcela: i,
          descricao: `Parcela ${i}/${dados.qtd_parcelas}`,
          valor_parcela: valorParcela,
          data_vencimento: dataVencimento.toISOString().split('T')[0],
          status: 'pendente' as AcordoParcelaStatus,
        });
        dataVencimento.setMonth(dataVencimento.getMonth() + 1);
      }

      const { error: parcelasError } = await supabase
        .from("acordo_parcelas_negociadas")
        .insert(parcelasNegociadas);

      if (parcelasError) throw parcelasError;

      // Registrar no histórico
      await supabase.from("acordo_historico").insert({
        acordo_id: acordo.id,
        usuario_id: user?.id,
        tipo_acao: 'criacao',
        descricao: `Acordo criado com ${dados.qtd_parcelas} parcela(s) e ${dados.desconto_percentual}% de desconto`,
        dados_novos: acordo,
      });

      return acordo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acordos"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-stats"] });
      toast({
        title: "Acordo criado",
        description: "O acordo foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar acordo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation: Atualizar status do acordo
  const atualizarStatus = useMutation({
    mutationFn: async ({ acordoId, status, motivo }: { acordoId: string; status: AcordoStatus; motivo?: string }) => {
      const updateData: Record<string, unknown> = { status };

      if (status === 'ativo') {
        updateData.data_assinatura = new Date().toISOString().split('T')[0];
      } else if (status === 'quitado') {
        updateData.data_quitacao = new Date().toISOString().split('T')[0];
      } else if (status === 'rompido') {
        updateData.data_rompimento = new Date().toISOString().split('T')[0];
        updateData.motivo_rompimento = motivo;
      }

      const { error } = await supabase
        .from("acordos")
        .update(updateData)
        .eq("id", acordoId);

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("acordo_historico").insert({
        acordo_id: acordoId,
        usuario_id: user?.id,
        tipo_acao: status === 'quitado' ? 'quitacao' : status === 'rompido' ? 'rompimento' : 'edicao',
        descricao: `Status alterado para ${status}${motivo ? `. Motivo: ${motivo}` : ''}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acordos"] });
      queryClient.invalidateQueries({ queryKey: ["acordo"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-stats"] });
      toast({
        title: "Status atualizado",
        description: "O status do acordo foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation: Registrar pagamento de parcela
  const registrarPagamento = useMutation({
    mutationFn: async ({
      parcelaId,
      acordoId,
      valorPago,
      dataPagamento,
      metodoPagamento,
      codigoTransacao,
    }: {
      parcelaId: string;
      acordoId: string;
      valorPago: number;
      dataPagamento: string;
      metodoPagamento?: string;
      codigoTransacao?: string;
    }) => {
      // Atualizar parcela
      const { error: parcelaError } = await supabase
        .from("acordo_parcelas_negociadas")
        .update({
          status: 'paga',
          valor_pago: valorPago,
          data_pagamento: dataPagamento,
          metodo_pagamento: metodoPagamento,
          codigo_transacao: codigoTransacao,
          dias_atraso: 0,
        })
        .eq("id", parcelaId);

      if (parcelaError) throw parcelaError;

      // Buscar acordo atual
      const { data: acordo } = await supabase
        .from("acordos")
        .select("*")
        .eq("id", acordoId)
        .single();

      if (!acordo) throw new Error("Acordo não encontrado");

      const novoValorRecuperado = Number(acordo.valor_recuperado) + valorPago;
      const novoValorPendente = Number(acordo.valor_pendente) - valorPago;
      const novasParcelasPagas = acordo.parcelas_pagas + 1;

      // Verificar se quitou
      const updateData: Record<string, unknown> = {
        valor_recuperado: novoValorRecuperado,
        valor_pendente: novoValorPendente,
        parcelas_pagas: novasParcelasPagas,
      };

      if (novoValorPendente <= 0) {
        updateData.status = 'quitado';
        updateData.data_quitacao = new Date().toISOString().split('T')[0];
      }

      const { error: acordoError } = await supabase
        .from("acordos")
        .update(updateData)
        .eq("id", acordoId);

      if (acordoError) throw acordoError;

      // Registrar no histórico
      await supabase.from("acordo_historico").insert({
        acordo_id: acordoId,
        usuario_id: user?.id,
        tipo_acao: novoValorPendente <= 0 ? 'quitacao' : 'pagamento_parcela',
        descricao: novoValorPendente <= 0 
          ? 'Acordo quitado integralmente'
          : `Pagamento de parcela registrado`,
        parcela_id: parcelaId,
        valor_envolvido: valorPago,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acordos"] });
      queryClient.invalidateQueries({ queryKey: ["acordo"] });
      queryClient.invalidateQueries({ queryKey: ["acordo-parcelas"] });
      queryClient.invalidateQueries({ queryKey: ["acordos-stats"] });
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    acordos,
    isLoading,
    error,
    stats,
    criarAcordo,
    atualizarStatus,
    registrarPagamento,
    simularAcordo,
    useAcordoById,
    useAcordoParcelas,
    useAcordoHistorico,
    useDividasUnidade,
  };
}
