import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export interface Comunicado {
  id: string;
  condominio_id: string;
  titulo: string;
  conteudo: string;
  tipo: "aviso" | "urgente" | "manutencao" | "assembleia" | "financeiro";
  data_publicacao: string;
  data_expiracao: string | null;
  criado_por: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  condominios?: { nome: string };
}

export interface ComunicadoInput {
  condominio_id: string;
  titulo: string;
  conteudo: string;
  tipo: Comunicado["tipo"];
  data_expiracao?: string | null;
}

// Hook para buscar comunicados (morador)
export function useComunicadosMorador() {
  return useQuery({
    queryKey: ["comunicados-morador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados" as any)
        .select("*")
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false });

      if (error) throw error;
      
      // Buscar nomes dos condomínios separadamente
      const comunicados = data || [];
      const condominioIds = [...new Set(comunicados.map((c: any) => c.condominio_id))];
      
      if (condominioIds.length > 0) {
        const { data: condominiosData } = await supabase
          .from("condominios")
          .select("id, nome")
          .in("id", condominioIds);
        
        const condominiosMap = new Map(condominiosData?.map(c => [c.id, c.nome]) || []);
        
        return comunicados.map((c: any) => ({
          ...c,
          condominios: { nome: condominiosMap.get(c.condominio_id) || "" }
        })) as unknown as Comunicado[];
      }
      
      return comunicados as unknown as Comunicado[];
    },
  });
}

// Hook para buscar comunicados (admin/gerente)
export function useComunicados(condominioId?: string) {
  return useQuery({
    queryKey: ["comunicados", condominioId],
    queryFn: async () => {
      let query = supabase
        .from("comunicados" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const comunicados = data || [];
      const condominioIds = [...new Set(comunicados.map((c: any) => c.condominio_id))];
      
      if (condominioIds.length > 0) {
        const { data: condominiosData } = await supabase
          .from("condominios")
          .select("id, nome")
          .in("id", condominioIds);
        
        const condominiosMap = new Map(condominiosData?.map(c => [c.id, c.nome]) || []);
        
        return comunicados.map((c: any) => ({
          ...c,
          condominios: { nome: condominiosMap.get(c.condominio_id) || "" }
        })) as unknown as Comunicado[];
      }
      
      return comunicados as unknown as Comunicado[];
    },
  });
}

// Hook para criar comunicado
export function useCreateComunicado() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (input: ComunicadoInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("comunicados" as any)
        .insert({
          ...input,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      toast.success("Comunicado publicado com sucesso!");
      logCreate("comunicado", data.id, data.titulo, { tipo: data.tipo });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao publicar comunicado: ${error.message}`);
    },
  });
}

// Hook para atualizar comunicado
export function useUpdateComunicado() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Comunicado> & { id: string }) => {
      const { data, error } = await supabase
        .from("comunicados" as any)
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      toast.success("Comunicado atualizado!");
      logUpdate("comunicado", data.id, data.titulo);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar comunicado: ${error.message}`);
    },
  });
}

// Hook para deletar comunicado
export function useDeleteComunicado() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar dados antes de deletar
      const { data: comunicado } = await supabase
        .from("comunicados" as any)
        .select("titulo")
        .eq("id", id)
        .single() as { data: { titulo: string } | null };

      const { error } = await supabase
        .from("comunicados" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, comunicado };
    },
    onSuccess: ({ id, comunicado }) => {
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      toast.success("Comunicado removido!");
      if (comunicado) {
        logDelete("comunicado", id, comunicado.titulo);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover comunicado: ${error.message}`);
    },
  });
}
