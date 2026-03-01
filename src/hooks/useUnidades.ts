import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Unidade {
  id: string;
  condominio_id: string;
  codigo: string;
  bloco: string | null;
  morador_nome: string | null;
  morador_email: string | null;
  morador_telefone: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
  condominios?: { nome: string };
}

export interface UnidadeInput {
  condominio_id: string;
  codigo: string;
  bloco?: string;
  morador_nome?: string;
  morador_email?: string;
  morador_telefone?: string;
  ativa?: boolean;
}

export function useUnidades(condominioId?: string) {
  return useQuery({
    queryKey: ["unidades", condominioId],
    queryFn: async () => {
      let query = supabase
        .from("unidades")
        .select(`
          *,
          condominios(nome)
        `)
        .order("codigo", { ascending: true });

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Unidade[];
    },
  });
}

export function useCreateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unidade: UnidadeInput) => {
      const { data, error } = await supabase
        .from("unidades")
        .insert(unidade)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade cadastrada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar unidade:", error);
      toast.error("Erro ao cadastrar unidade");
    },
  });
}

export function useCreateUnidadesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unidades: UnidadeInput[]) => {
      const { data, error } = await supabase
        .from("unidades")
        .insert(unidades)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success(`${data.length} unidades cadastradas com sucesso`);
    },
    onError: (error) => {
      console.error("Erro ao criar unidades:", error);
      toast.error("Erro ao cadastrar unidades em lote");
    },
  });
}

export function useUpdateUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<UnidadeInput> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("unidades")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar unidade:", error);
      toast.error("Erro ao atualizar unidade");
    },
  });
}

export function useDeleteUnidade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidade excluída com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao excluir unidade:", error);
      toast.error("Erro ao excluir unidade");
    },
  });
}
