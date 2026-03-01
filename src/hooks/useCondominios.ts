import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export type Condominio = Tables<"condominios">;
export type CondominioInsert = TablesInsert<"condominios">;
export type CondominioUpdate = TablesUpdate<"condominios">;

export interface CondominioFilters {
  busca?: string;
  cidade?: string;
  tipo_imovel?: string;
  tem_sindico?: boolean;
  tem_administradora?: boolean;
}

export function useCondominios(filters: CondominioFilters = {}) {
  return useQuery({
    queryKey: ["condominios", filters],
    queryFn: async () => {
      let query = supabase
        .from("condominios")
        .select("*")
        .order("nome", { ascending: true });

      if (filters.busca) {
        query = query.or(
          `nome.ilike.%${filters.busca}%,cnpj.ilike.%${filters.busca}%,endereco.ilike.%${filters.busca}%,cidade.ilike.%${filters.busca}%,sindico_nome.ilike.%${filters.busca}%`
        );
      }

      if (filters.cidade) {
        query = query.ilike("cidade", `%${filters.cidade}%`);
      }

      if (filters.tipo_imovel) {
        query = query.eq("tipo_imovel", filters.tipo_imovel);
      }

      if (filters.tem_sindico !== undefined) {
        query = query.eq("tem_sindico", filters.tem_sindico);
      }

      if (filters.tem_administradora !== undefined) {
        query = query.eq("tem_administradora", filters.tem_administradora);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    },
  });
}

export function useCondominio(id: string | null) {
  return useQuery({
    queryKey: ["condominio", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("condominios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCondominio() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (condominio: CondominioInsert) => {
      const { data, error } = await supabase
        .from("condominios")
        .insert(condominio)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
      toast.success("Condomínio cadastrado com sucesso!");
      logCreate("condominio", data.id, data.nome, {
        cidade: data.cidade,
        qtd_unidades: data.quantidade_unidades,
      });
    },
    onError: (error) => {
      console.error("Erro ao cadastrar condomínio:", error);
      toast.error("Erro ao cadastrar condomínio. Tente novamente.");
    },
  });
}

export function useUpdateCondominio() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({ id, ...condominio }: CondominioUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("condominios")
        .update(condominio)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
      toast.success("Condomínio atualizado com sucesso!");
      logUpdate("condominio", data.id, data.nome);
    },
    onError: (error) => {
      console.error("Erro ao atualizar condomínio:", error);
      toast.error("Erro ao atualizar condomínio. Tente novamente.");
    },
  });
}

export function useDeleteCondominio() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async ({ id, nome }: { id: string; nome: string }) => {
      const { error } = await supabase
        .from("condominios")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      return { id, nome };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condominios"] });
      toast.success("Condomínio excluído com sucesso!");
      logDelete("condominio", data.id, data.nome);
    },
    onError: (error) => {
      console.error("Erro ao excluir condomínio:", error);
      toast.error("Erro ao excluir condomínio. Verifique se não há dados vinculados.");
    },
  });
}
