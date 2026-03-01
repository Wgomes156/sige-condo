import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConfiguracaoCobranca {
  id: string;
  condominio_id: string;
  valor_padrao: number;
  dia_vencimento: number;
  categoria_id: string | null;
  descricao_padrao: string;
  ativa: boolean;
  ultima_geracao: string | null;
  created_at: string;
  updated_at: string;
  condominios?: { nome: string };
  categorias_financeiras?: { nome: string; cor: string };
}

export interface ConfiguracaoCobrancaInput {
  condominio_id: string;
  valor_padrao: number;
  dia_vencimento: number;
  categoria_id?: string;
  descricao_padrao?: string;
  ativa?: boolean;
}

export interface HistoricoGeracao {
  id: string;
  condominio_id: string;
  referencia: string;
  quantidade_boletos: number;
  valor_total: number;
  status: string;
  mensagem_erro: string | null;
  created_at: string;
  condominios?: { nome: string };
}

export function useConfiguracoesCobranca() {
  return useQuery({
    queryKey: ["configuracoes-cobranca"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_cobranca")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ConfiguracaoCobranca[];
    },
  });
}

export function useConfiguracaoCobranca(condominioId: string) {
  return useQuery({
    queryKey: ["configuracao-cobranca", condominioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("configuracoes_cobranca")
        .select(`
          *,
          condominios(nome),
          categorias_financeiras(nome, cor)
        `)
        .eq("condominio_id", condominioId)
        .maybeSingle();

      if (error) throw error;
      return data as ConfiguracaoCobranca | null;
    },
    enabled: !!condominioId,
  });
}

export function useCreateConfiguracaoCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: ConfiguracaoCobrancaInput) => {
      const { data, error } = await supabase
        .from("configuracoes_cobranca")
        .insert(config)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-cobranca"] });
      toast.success("Configuração de cobrança criada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar configuração:", error);
      toast.error("Erro ao criar configuração de cobrança");
    },
  });
}

export function useUpdateConfiguracaoCobranca() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<ConfiguracaoCobrancaInput> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("configuracoes_cobranca")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes-cobranca"] });
      toast.success("Configuração atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar configuração:", error);
      toast.error("Erro ao atualizar configuração");
    },
  });
}

export function useHistoricoGeracao(condominioId?: string) {
  return useQuery({
    queryKey: ["historico-geracao", condominioId],
    queryFn: async () => {
      let query = supabase
        .from("historico_geracao_boletos")
        .select(`
          *,
          condominios(nome)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HistoricoGeracao[];
    },
  });
}

export function useGerarBoletosManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { condominio_id?: string; referencia?: string }) => {
      const { data, error } = await supabase.functions.invoke("gerar-boletos-recorrentes", {
        body: params,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      queryClient.invalidateQueries({ queryKey: ["historico-geracao"] });
      queryClient.invalidateQueries({ queryKey: ["configuracoes-cobranca"] });
      toast.success(data.message || "Boletos gerados com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao gerar boletos:", error);
      toast.error("Erro ao gerar boletos");
    },
  });
}
