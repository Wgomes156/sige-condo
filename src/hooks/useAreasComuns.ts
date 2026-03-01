import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AreaComum {
  id: string;
  condominio_id: string;
  nome: string;
  descricao: string | null;
  capacidade: number | null;
  valor_taxa: number | null;
  ativa: boolean | null;
  imagem_url: string | null;
  regras: string | null;
  created_at: string;
  updated_at: string;
}

export interface AreaComumInsert {
  condominio_id: string;
  nome: string;
  descricao?: string | null;
  capacidade?: number | null;
  valor_taxa?: number | null;
  ativa?: boolean;
  imagem_url?: string | null;
  regras?: string | null;
}

export function useAreasComuns(condominioId?: string) {
  return useQuery({
    queryKey: ["areas_comuns", condominioId],
    queryFn: async () => {
      let query = supabase
        .from("areas_comuns" as any)
        .select("*")
        .eq("ativa", true)
        .order("nome", { ascending: true });

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AreaComum[];
    },
    enabled: !!condominioId,
  });
}

export function useAllAreasComuns(condominioId?: string) {
  return useQuery({
    queryKey: ["areas_comuns_all", condominioId],
    queryFn: async () => {
      let query = supabase
        .from("areas_comuns" as any)
        .select("*")
        .order("nome", { ascending: true });

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AreaComum[];
    },
    enabled: !!condominioId,
  });
}

export function useCreateAreaComum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (area: AreaComumInsert) => {
      const { data, error } = await supabase
        .from("areas_comuns" as any)
        .insert(area as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AreaComum;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas_comuns"] });
      queryClient.invalidateQueries({ queryKey: ["areas_comuns_all"] });
      toast.success("Área comum cadastrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao cadastrar área:", error);
      toast.error("Erro ao cadastrar área comum.");
    },
  });
}

export function useUpdateAreaComum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<AreaComumInsert> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("areas_comuns" as any)
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result as unknown as AreaComum;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas_comuns"] });
      queryClient.invalidateQueries({ queryKey: ["areas_comuns_all"] });
      toast.success("Área comum atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar área comum."),
  });
}

export function useDeleteAreaComum() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("areas_comuns" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas_comuns"] });
      queryClient.invalidateQueries({ queryKey: ["areas_comuns_all"] });
      toast.success("Área comum removida!");
    },
    onError: () => toast.error("Erro ao remover área comum."),
  });
}
