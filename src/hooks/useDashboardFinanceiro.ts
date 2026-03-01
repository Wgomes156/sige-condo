import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  receitasPendentes: number;
  despesasPendentes: number;
  totalAtrasados: number;
  qtdAtrasados: number;
}

export interface FluxoCaixaMensal {
  mes: string;
  mesFormatado: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface TransacaoPorCategoria {
  categoria: string;
  cor: string;
  valor: number;
  quantidade: number;
}

export function useResumoFinanceiro(condominioId?: string) {
  return useQuery({
    queryKey: ["dashboard-financeiro", "resumo", condominioId],
    queryFn: async () => {
      let query = supabase.from("transacoes_financeiras").select("*");

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transacoes = data || [];

      const receitasPagas = transacoes
        .filter((t) => t.tipo === "receita" && t.status === "pago")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const despesasPagas = transacoes
        .filter((t) => t.tipo === "despesa" && t.status === "pago")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const receitasPendentes = transacoes
        .filter((t) => t.tipo === "receita" && t.status === "pendente")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const despesasPendentes = transacoes
        .filter((t) => t.tipo === "despesa" && t.status === "pendente")
        .reduce((sum, t) => sum + Number(t.valor), 0);

      const atrasados = transacoes.filter((t) => t.status === "atraso");
      const totalAtrasados = atrasados.reduce((sum, t) => sum + Number(t.valor), 0);

      return {
        totalReceitas: receitasPagas,
        totalDespesas: despesasPagas,
        saldo: receitasPagas - despesasPagas,
        receitasPendentes,
        despesasPendentes,
        totalAtrasados,
        qtdAtrasados: atrasados.length,
      } as ResumoFinanceiro;
    },
  });
}

export function useFluxoCaixa(condominioId?: string, meses: number = 6) {
  return useQuery({
    queryKey: ["dashboard-financeiro", "fluxo-caixa", condominioId, meses],
    queryFn: async () => {
      const dataInicio = format(
        startOfMonth(subMonths(new Date(), meses - 1)),
        "yyyy-MM-dd"
      );

      let query = supabase
        .from("transacoes_financeiras")
        .select("*")
        .gte("data_vencimento", dataInicio)
        .in("status", ["pago", "pendente"]);

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transacoes = data || [];

      const fluxoPorMes: Record<string, FluxoCaixaMensal> = {};

      for (let i = meses - 1; i >= 0; i--) {
        const mesDate = subMonths(new Date(), i);
        const mesKey = format(mesDate, "yyyy-MM");
        const mesFormatado = format(mesDate, "MMM/yy");

        fluxoPorMes[mesKey] = {
          mes: mesKey,
          mesFormatado,
          receitas: 0,
          despesas: 0,
          saldo: 0,
        };
      }

      transacoes.forEach((t) => {
        const mesKey = format(new Date(t.data_vencimento), "yyyy-MM");
        if (fluxoPorMes[mesKey]) {
          if (t.tipo === "receita") {
            fluxoPorMes[mesKey].receitas += Number(t.valor);
          } else {
            fluxoPorMes[mesKey].despesas += Number(t.valor);
          }
        }
      });

      Object.values(fluxoPorMes).forEach((mes) => {
        mes.saldo = mes.receitas - mes.despesas;
      });

      return Object.values(fluxoPorMes);
    },
  });
}

export function useTransacoesPorCategoria(
  tipo: "receita" | "despesa",
  condominioId?: string
) {
  return useQuery({
    queryKey: ["dashboard-financeiro", "por-categoria", tipo, condominioId],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select(`
          valor,
          categorias_financeiras(nome, cor)
        `)
        .eq("tipo", tipo)
        .eq("status", "pago");

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const transacoes = data || [];

      const porCategoria: Record<string, TransacaoPorCategoria> = {};

      transacoes.forEach((t: any) => {
        const categoria = t.categorias_financeiras?.nome || "Sem categoria";
        const cor = t.categorias_financeiras?.cor || "#6b7280";

        if (!porCategoria[categoria]) {
          porCategoria[categoria] = {
            categoria,
            cor,
            valor: 0,
            quantidade: 0,
          };
        }

        porCategoria[categoria].valor += Number(t.valor);
        porCategoria[categoria].quantidade += 1;
      });

      return Object.values(porCategoria).sort((a, b) => b.valor - a.valor);
    },
  });
}

export function useTransacoesRecentes(limite: number = 5, condominioId?: string) {
  return useQuery({
    queryKey: ["dashboard-financeiro", "recentes", limite, condominioId],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .order("created_at", { ascending: false })
        .limit(limite);

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}
