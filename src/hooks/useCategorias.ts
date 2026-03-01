import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: "receita" | "despesa";
  cor: string | null;
  descricao: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInput {
  nome: string;
  tipo: "receita" | "despesa";
  cor?: string;
  descricao?: string;
}

export function useAllCategorias() {
  return useQuery({
    queryKey: ["categorias", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .order("tipo")
        .order("nome");

      if (error) throw error;
      return data as CategoriaFinanceira[];
    },
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoria: CategoriaInput) => {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .insert({ ...categoria, ativa: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar categoria:", error);
      toast.error("Erro ao criar categoria");
    },
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: CategoriaInput & { id: string }) => {
      const { data: result, error } = await supabase
        .from("categorias_financeiras")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar categoria:", error);
      toast.error("Erro ao atualizar categoria");
    },
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Instead of deleting, mark as inactive
      const { error } = await supabase
        .from("categorias_financeiras")
        .update({ ativa: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria excluída com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao excluir categoria:", error);
      toast.error("Erro ao excluir categoria");
    },
  });
}
