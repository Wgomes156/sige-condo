import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export interface Boleto {
  id: string;
  condominio_id: string;
  categoria_id: string | null;
  unidade_id: string | null;
  unidade: string;
  morador_nome: string | null;
  morador_email: string | null;
  morador_telefone: string | null;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "atraso" | "cancelado";
  nosso_numero: string | null;
  referencia: string;
  observacoes: string | null;
  multa_percentual: number | null;
  juros_dia: number | null;
  desconto_valor: number | null;
  desconto_ate: string | null;
  instrucoes: string | null;
  created_at: string;
  updated_at: string;
  condominios?: { nome: string };
  categorias_financeiras?: { nome: string; cor: string };
  unidades?: { id: string; codigo: string; bloco: string | null };
}

export interface BoletoFilters {
  condominio_id?: string;
  status?: string;
  categoria_id?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
  unidade?: string;
}

export interface BoletoInput {
  condominio_id: string;
  categoria_id?: string;
  conta_bancaria_id?: string;
  unidade_id?: string;
  unidade: string;
  morador_nome?: string;
  morador_email?: string;
  morador_telefone?: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status?: string;
  nosso_numero?: string | null;
  referencia: string;
  observacoes?: string;
  multa_percentual?: number;
  juros_dia?: number;
  desconto_valor?: number;
  desconto_ate?: string;
  instrucoes?: string;
}

export function useBoletos(filters: BoletoFilters = {}) {
  return useQuery({
    queryKey: ["boletos", filters],
    queryFn: async () => {
      // Atualiza automaticamente boletos vencidos para status "atraso"
      await supabase.rpc("atualizar_boletos_atrasados");

      let query = supabase
        .from("boletos")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor),
          unidades(id, codigo, bloco)
        `)
        .order("data_vencimento", { ascending: false });

      if (filters.condominio_id) {
        query = query.eq("condominio_id", filters.condominio_id);
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
      if (filters.unidade) {
        query = query.ilike("unidade", `%${filters.unidade}%`);
      }
      if (filters.busca) {
        query = query.or(
          `unidade.ilike.%${filters.busca}%,morador_nome.ilike.%${filters.busca}%,nosso_numero.ilike.%${filters.busca}%,referencia.ilike.%${filters.busca}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Boleto[];
    },
  });
}

export function useBoleto(id: string) {
  return useQuery({
    queryKey: ["boleto", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boletos")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Boleto | null;
    },
    enabled: !!id,
  });
}

export function useCreateBoleto() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (boleto: BoletoInput) => {
      // Strip fields that don't exist in the boletos table schema
      // (multa_percentual, juros_dia, desconto_valor, desconto_ate, instrucoes
      //  are in the TS interface but not in the actual DB table)
      const {
        multa_percentual,
        juros_dia,
        desconto_valor,
        desconto_ate,
        instrucoes,
        ...dbFields
      } = boleto as any;

      // Encode financial fields into observacoes so they're not lost
      const extraInfo = [
        multa_percentual != null ? `Multa: ${multa_percentual}%` : null,
        juros_dia != null ? `Juros: ${juros_dia}%/dia` : null,
        desconto_valor != null ? `Desconto: R$${desconto_valor}` : null,
        desconto_ate ? `Desc.até: ${desconto_ate}` : null,
        instrucoes ? instrucoes : null,
      ].filter(Boolean).join(" | ");

      const payload = {
        ...dbFields,
        observacoes: [dbFields.observacoes, extraInfo].filter(Boolean).join(" | ") || undefined,
      };

      const { data, error } = await supabase
        .from("boletos")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto cadastrado com sucesso");
      logCreate("boleto", data.id, `${data.unidade} - ${data.referencia}`, {
        valor: data.valor,
        vencimento: data.data_vencimento,
      });
    },
    onError: (error: any) => {
      console.error("Erro ao criar boleto — detalhes:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        full: error,
      });
      if (error?.code === "23505" && error?.message?.includes("nosso_numero")) {
        toast.error("Nosso Número duplicado. Tente emitir novamente.");
      } else {
        toast.error(`Erro ao cadastrar boleto: ${error?.message || "erro desconhecido"}`);
      }
    },
  });
}

export function useCreateBoletosBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boletos: BoletoInput[]) => {
      const sanitized = boletos.map(({ multa_percentual, juros_dia, desconto_valor, desconto_ate, instrucoes, ...rest }: any) => rest);
      const { data, error } = await supabase
        .from("boletos")
        .insert(sanitized)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success(`${data.length} boletos cadastrados com sucesso`);
    },
    onError: (error) => {
      console.error("Erro ao criar boletos:", error);
      toast.error("Erro ao cadastrar boletos em lote");
    },
  });
}

export function useUpdateBoleto() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<BoletoInput> & { id: string }) => {
      // Strip non-existent DB columns before update
      const { multa_percentual, juros_dia, desconto_valor, desconto_ate, instrucoes, ...dbData } = data as any;
      const { data: result, error } = await supabase
        .from("boletos")
        .update(dbData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto atualizado com sucesso");
      logUpdate("boleto", data.id, `${data.unidade} - ${data.referencia}`, {
        status: data.status,
        valor: data.valor,
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar boleto:", error);
      toast.error("Erro ao atualizar boleto");
    },
  });
}

export function useDeleteBoleto() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar dados antes de deletar para o log
      const { data: boleto } = await supabase
        .from("boletos")
        .select("unidade, referencia, valor")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("boletos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, boleto };
    },
    onSuccess: ({ id, boleto }) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto excluído com sucesso");
      if (boleto) {
        logDelete("boleto", id, `${boleto.unidade} - ${boleto.referencia}`);
      }
    },
    onError: (error) => {
      console.error("Erro ao excluir boleto:", error);
      toast.error("Erro ao excluir boleto");
    },
  });
}

export function useMarcarBoletoPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data_pagamento,
    }: {
      id: string;
      data_pagamento?: string;
    }) => {
      const { data, error } = await supabase
        .from("boletos")
        .update({
          status: "pago",
          data_pagamento: data_pagamento || new Date().toISOString().split("T")[0],
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto marcado como pago");
    },
    onError: (error) => {
      console.error("Erro ao marcar como pago:", error);
      toast.error("Erro ao marcar boleto como pago");
    },
  });
}

export function useCancelarBoleto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("boletos")
        .update({ status: "cancelado" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto cancelado");
    },
    onError: (error) => {
      console.error("Erro ao cancelar boleto:", error);
      toast.error("Erro ao cancelar boleto");
    },
  });
}

export function useResumoBoletos(condominioId?: string) {
  return useQuery({
    queryKey: ["resumo-boletos", condominioId],
    queryFn: async () => {
      let query = supabase.from("boletos").select("valor, status, data_vencimento");
      
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const hoje = new Date().toISOString().split("T")[0];
      
      const totalBoletos = data.length;
      const totalPendente = data
        .filter((b) => b.status === "pendente")
        .reduce((sum, b) => sum + b.valor, 0);
      const totalPago = data
        .filter((b) => b.status === "pago")
        .reduce((sum, b) => sum + b.valor, 0);
      const totalAtrasado = data
        .filter((b) => b.status === "atraso" || (b.status === "pendente" && b.data_vencimento < hoje))
        .reduce((sum, b) => sum + b.valor, 0);
      const quantidadeAtrasados = data.filter(
        (b) => b.status === "atraso" || (b.status === "pendente" && b.data_vencimento < hoje)
      ).length;

      return {
        totalBoletos,
        totalPendente,
        totalPago,
        totalAtrasado,
        quantidadeAtrasados,
      };
    },
  });
}
