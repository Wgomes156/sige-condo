import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AtendimentoHistorico {
  id: string;
  atendimento_id: string;
  data: string;
  hora: string;
  detalhes: string;
  status: string;
  criado_por: string | null;
  created_at: string;
}

export interface NovoHistoricoData {
  atendimento_id: string;
  data: string;
  hora: string;
  detalhes: string;
  status: string;
}

export function useAtendimentoHistorico(atendimentoId: string | undefined) {
  return useQuery({
    queryKey: ["atendimento_historico", atendimentoId],
    queryFn: async () => {
      if (!atendimentoId) return [];
      console.log("[useAtendimentoHistorico] Buscando histórico para:", atendimentoId);
      const { data, error } = await supabase
        .from("atendimento_historico")
        .select("*")
        .eq("atendimento_id", atendimentoId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useAtendimentoHistorico] Erro ao buscar:", error);
        throw error;
      }
      console.log("[useAtendimentoHistorico] Resultados:", data?.length, "registros");
      return data as AtendimentoHistorico[];
    },
    enabled: !!atendimentoId,
  });
}

export function useCreateAtendimentoHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novo: NovoHistoricoData) => {
      console.log("[useCreateAtendimentoHistorico] Iniciando criação:", novo);
      const { data: userData } = await supabase.auth.getUser();
      console.log("[useCreateAtendimentoHistorico] Usuário:", userData.user?.id);

      const { data, error } = await supabase
        .from("atendimento_historico")
        .insert({
          ...novo,
          criado_por: userData.user?.id,
        })
        .select()
        .single();

      if (error) {
        console.error("[useCreateAtendimentoHistorico] Erro no Supabase:", error);
        throw error;
      }

      console.log("[useCreateAtendimentoHistorico] Registro criado com sucesso:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("[useCreateAtendimentoHistorico] onSuccess - invalidando cache para:", data.atendimento_id);
      queryClient.invalidateQueries({ queryKey: ["atendimento_historico", data.atendimento_id] });
      toast.success("Registro de histórico adicionado!");
    },
    onError: (error) => {
      console.error("[useCreateAtendimentoHistorico] onError:", error);
      toast.error("Erro ao adicionar registro de histórico.");
    },
  });
}
export function useUpdateAtendimentoHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<NovoHistoricoData> & { id: string }) => {
      const { data, error } = await supabase
        .from("atendimento_historico")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atendimento_historico", data.atendimento_id] });
      toast.success("Histórico atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar histórico:", error);
      toast.error("Erro ao atualizar registro de histórico.");
    },
  });
}

export function useDeleteAtendimentoHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: AtendimentoHistorico) => {
      // 1. Buscar anexos vinculados a este histórico
      const { data: anexos } = await supabase
        .from("anexos")
        .select("*")
        .eq("entidade_tipo", "atendimento_historico")
        .eq("entidade_id", item.id);

      // 2. Deletar arquivos do Storage e registros na tabela anexos
      if (anexos && anexos.length > 0) {
        for (const anexo of anexos) {
          await supabase.storage.from("anexos").remove([anexo.storage_path]);
          await supabase.from("anexos").delete().eq("id", anexo.id);
        }
      }

      // 3. Deletar o registro do histórico
      const { error } = await supabase
        .from("atendimento_historico")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      return item;
    },
    onSuccess: (item) => {
      queryClient.invalidateQueries({ queryKey: ["atendimento_historico", item.atendimento_id] });
      queryClient.invalidateQueries({ queryKey: ["anexos", "atendimento_historico"] });
      toast.success("Histórico e seus anexos excluídos!");
    },
    onError: (error) => {
      console.error("Erro ao excluir histórico:", error);
      toast.error("Erro ao excluir registro de histórico.");
    },
  });
}
