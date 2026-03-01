import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export type TipoOcorrencia = 'manutencao' | 'seguranca' | 'convivencia' | 'outro';
export type StatusOcorrencia = 'aberta' | 'em_andamento' | 'resolvida' | 'cancelada';
export type PrioridadeOcorrencia = 'baixa' | 'media' | 'alta' | 'urgente';

export interface OcorrenciaCondominio {
  id: string;
  condominio_id: string;
  tipo_ocorrencia: TipoOcorrencia;
  categoria: string | null;
  titulo: string;
  descricao: string;
  local_ocorrencia: string | null;
  data_ocorrencia: string;
  data_resolucao: string | null;
  status: StatusOcorrencia;
  prioridade: PrioridadeOcorrencia;
  resolucao: string | null;
  custo_estimado: number | null;
  custo_real: number | null;
  registrado_por: string | null;
  atribuido_a: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  condominios?: {
    nome: string;
  };
}

export interface OcorrenciaCondominioInput {
  condominio_id: string;
  tipo_ocorrencia: TipoOcorrencia;
  categoria?: string;
  titulo: string;
  descricao: string;
  local_ocorrencia?: string;
  data_ocorrencia?: string;
  data_resolucao?: string;
  status?: StatusOcorrencia;
  prioridade?: PrioridadeOcorrencia;
  resolucao?: string;
  custo_estimado?: number;
  custo_real?: number;
  atribuido_a?: string;
  observacoes?: string;
}

export interface OcorrenciaFilters {
  condominio_id?: string;
  tipo_ocorrencia?: TipoOcorrencia;
  status?: StatusOcorrencia;
  prioridade?: PrioridadeOcorrencia;
  busca?: string;
}

export function useOcorrenciasCondominio(filters?: OcorrenciaFilters) {
  return useQuery({
    queryKey: ["ocorrencias-condominio", filters],
    queryFn: async () => {
      let query = supabase
        .from("ocorrencias_condominio")
        .select(`
          *,
          condominios:condominio_id (nome)
        `)
        .order("data_ocorrencia", { ascending: false });

      if (filters?.condominio_id) {
        query = query.eq("condominio_id", filters.condominio_id);
      }
      if (filters?.tipo_ocorrencia) {
        query = query.eq("tipo_ocorrencia", filters.tipo_ocorrencia);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.prioridade) {
        query = query.eq("prioridade", filters.prioridade);
      }
      if (filters?.busca) {
        query = query.or(`titulo.ilike.%${filters.busca}%,descricao.ilike.%${filters.busca}%,local_ocorrencia.ilike.%${filters.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OcorrenciaCondominio[];
    },
  });
}

export function useCreateOcorrenciaCondominio() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (ocorrencia: OcorrenciaCondominioInput) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("ocorrencias_condominio")
        .insert({
          ...ocorrencia,
          registrado_por: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ocorrencias-condominio"] });
      toast.success("Ocorrência registrada com sucesso!");
      logCreate("ocorrencia", data.id, data.titulo, {
        tipo: data.tipo_ocorrencia,
        prioridade: data.prioridade,
      });
    },
    onError: (error) => {
      toast.error("Erro ao registrar ocorrência: " + error.message);
    },
  });
}

export function useUpdateOcorrenciaCondominio() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({ id, ...ocorrencia }: Partial<OcorrenciaCondominioInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("ocorrencias_condominio")
        .update(ocorrencia)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ocorrencias-condominio"] });
      toast.success("Ocorrência atualizada com sucesso!");
      logUpdate("ocorrencia", data.id, data.titulo, { status: data.status });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar ocorrência: " + error.message);
    },
  });
}

export function useDeleteOcorrenciaCondominio() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar dados antes de deletar
      const { data: ocorrencia } = await supabase
        .from("ocorrencias_condominio")
        .select("titulo")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("ocorrencias_condominio")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, ocorrencia };
    },
    onSuccess: ({ id, ocorrencia }) => {
      queryClient.invalidateQueries({ queryKey: ["ocorrencias-condominio"] });
      toast.success("Ocorrência excluída com sucesso!");
      if (ocorrencia) {
        logDelete("ocorrencia", id, ocorrencia.titulo);
      }
    },
    onError: (error) => {
      toast.error("Erro ao excluir ocorrência: " + error.message);
    },
  });
}
