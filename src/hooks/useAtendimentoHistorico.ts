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
      const { data, error } = await supabase
        .from("atendimento_historico")
        .select("*")
        .eq("atendimento_id", atendimentoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AtendimentoHistorico[];
    },
    enabled: !!atendimentoId,
  });
}

export function useCreateAtendimentoHistorico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novo: NovoHistoricoData) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("atendimento_historico")
        .insert({
          ...novo,
          criado_por: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atendimento_historico", data.atendimento_id] });
      toast.success("Registro de histórico adicionado!");
    },
    onError: (error) => {
      console.error("Erro ao criar histórico:", error);
      toast.error("Erro ao adicionar registro de histórico.");
    },
  });
}
