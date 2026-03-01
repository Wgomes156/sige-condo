import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TransacaoFinanceira {
  id: string;
  condominio_id: string;
  categoria_id: string | null;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "atraso" | "cancelado";
  forma_pagamento: string | null;
  documento: string | null;
  unidade: string | null;
  morador_nome: string | null;
  observacoes: string | null;
  recorrente: boolean;
  recorrencia_tipo: string | null;
  criado_por: string | null;
  criado_por_nome: string;
  created_at: string;
  updated_at: string;
  condominios?: { nome: string };
  categorias_financeiras?: { nome: string; cor: string };
}

export interface TransacaoFilters {
  condominio_id?: string;
  tipo?: "receita" | "despesa";
  status?: string;
  categoria_id?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export interface TransacaoInput {
  condominio_id: string;
  categoria_id?: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status?: string;
  forma_pagamento?: string;
  documento?: string;
  unidade?: string;
  morador_nome?: string;
  observacoes?: string;
  recorrente?: boolean;
  recorrencia_tipo?: string;
  criado_por?: string;
  criado_por_nome: string;
}

export function useTransacoes(filters: TransacaoFilters = {}) {
  return useQuery({
    queryKey: ["transacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .order("data_vencimento", { ascending: false });

      if (filters.condominio_id) {
        query = query.eq("condominio_id", filters.condominio_id);
      }
      if (filters.tipo) {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }
      if (filters.categoria_id) {
        query = query.eq("categoria_id", filters.categoria_id);
      }
      if (filters.dataInicio) {
        query = query.gte("data_vencimento", filters.dataInicio);
      }
      if (filters.dataFim) {
        query = query.lte("data_vencimento", filters.dataFim);
      }
      if (filters.busca) {
        query = query.or(
          `descricao.ilike.%${filters.busca}%,documento.ilike.%${filters.busca}%,morador_nome.ilike.%${filters.busca}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TransacaoFinanceira[];
    },
  });
}

export function useTransacao(id: string) {
  return useQuery({
    queryKey: ["transacao", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as TransacaoFinanceira | null;
    },
    enabled: !!id,
  });
}

export function useCreateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transacao: TransacaoInput) => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .insert(transacao)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-financeiro"] });
      toast.success("Transação criada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar transação:", error);
      toast.error("Erro ao criar transação");
    },
  });
}

export function useUpdateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<TransacaoInput> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("transacoes_financeiras")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-financeiro"] });
      toast.success("Transação atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar transação:", error);
      toast.error("Erro ao atualizar transação");
    },
  });
}

export function useDeleteTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-financeiro"] });
      toast.success("Transação excluída com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação");
    },
  });
}

export function useMarcarComoPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data_pagamento,
      forma_pagamento,
    }: {
      id: string;
      data_pagamento?: string;
      forma_pagamento?: string;
    }) => {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .update({
          status: "pago",
          data_pagamento: data_pagamento || new Date().toISOString().split("T")[0],
          forma_pagamento,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-financeiro"] });
      toast.success("Transação marcada como paga");
    },
    onError: (error) => {
      console.error("Erro ao marcar como pago:", error);
      toast.error("Erro ao marcar transação como paga");
    },
  });
}

export function useCategorias(tipo?: "receita" | "despesa") {
  return useQuery({
    queryKey: ["categorias", tipo],
    queryFn: async () => {
      let query = supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativa", true)
        .order("nome");

      if (tipo) {
        query = query.eq("tipo", tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}
