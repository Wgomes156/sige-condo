import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export type OsStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type OsPrioridade = 'urgente' | 'periodico' | 'nao_urgente';

export interface OrdemServico {
  id: string;
  numero_os: number;
  data_solicitacao: string;
  hora_solicitacao: string;
  solicitante: string;
  condominio_id: string | null;
  condominio_nome: string;
  descricao_servico: string;
  status: OsStatus;
  prioridade: OsPrioridade;
  data_atendimento: string | null;
  observacoes: string | null;
  criado_por: string | null;
  atribuido_a: string | null;
  atribuido_nome?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovaOrdemServicoData {
  data_solicitacao: string;
  hora_solicitacao: string;
  solicitante: string;
  condominio_id?: string | null;
  condominio_nome: string;
  descricao_servico: string;
  status?: OsStatus;
  prioridade: OsPrioridade;
  data_atendimento?: string | null;
  observacoes?: string | null;
  atribuido_a?: string | null;
}

export interface OrdemServicoFilters {
  search?: string;
  status?: OsStatus | "";
  prioridade?: OsPrioridade | "";
  condominio_id?: string;
  dataInicio?: string;
  dataFim?: string;
}

export function useOrdensServico(filters: OrdemServicoFilters = {}) {
  return useQuery({
    queryKey: ["ordens_servico", filters],
    queryFn: async () => {
      // Fetch ordens de servico
      let query = supabase
        .from("ordens_servico")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters.search) {
        query = query.or(
          `solicitante.ilike.%${filters.search}%,condominio_nome.ilike.%${filters.search}%,descricao_servico.ilike.%${filters.search}%`
        );
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.prioridade) {
        query = query.eq("prioridade", filters.prioridade);
      }

      if (filters.condominio_id) {
        query = query.eq("condominio_id", filters.condominio_id);
      }

      if (filters.dataInicio) {
        query = query.gte("data_solicitacao", filters.dataInicio);
      }

      if (filters.dataFim) {
        query = query.lte("data_solicitacao", filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles for atribuido_a names
      const atribuidoIds = [...new Set((data || []).map((os) => os.atribuido_a).filter(Boolean))];
      
      let profilesMap: Record<string, string> = {};
      if (atribuidoIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, nome")
          .in("user_id", atribuidoIds);
        
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p.nome;
          return acc;
        }, {} as Record<string, string>);
      }

      // Enrich ordens with atribuido_nome
      return (data || []).map((os) => ({
        ...os,
        atribuido_nome: os.atribuido_a ? profilesMap[os.atribuido_a] || null : null,
      })) as OrdemServico[];
    },
  });
}

export function useOrdemServico(id: string | null) {
  return useQuery({
    queryKey: ["ordem_servico", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as OrdemServico;
    },
    enabled: !!id,
  });
}

export function useCreateOrdemServico() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (novaOS: NovaOrdemServicoData) => {
      const { data: session } = await supabase.auth.getSession();
      
      const { data, error } = await supabase
        .from("ordens_servico")
        .insert({
          ...novaOS,
          criado_por: session?.session?.user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Ordem de Serviço criada com sucesso!");
      logCreate("ordem_servico", data.id, `OS #${data.numero_os} - ${data.condominio_nome}`, {
        prioridade: data.prioridade,
        status: data.status,
      });
    },
    onError: (error) => {
      console.error("Erro ao criar OS:", error);
      toast.error("Erro ao criar Ordem de Serviço");
    },
  });
}

export function useUpdateOrdemServico() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<NovaOrdemServicoData> & { id: string }) => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Ordem de Serviço atualizada com sucesso!");
      logUpdate("ordem_servico", data.id, `OS #${data.numero_os}`, {
        status: data.status,
        prioridade: data.prioridade,
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar OS:", error);
      toast.error("Erro ao atualizar Ordem de Serviço");
    },
  });
}

export function useDeleteOrdemServico() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async (id: string) => {
      // Buscar dados antes de deletar para o log
      const { data: os } = await supabase
        .from("ordens_servico")
        .select("numero_os, condominio_nome")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("ordens_servico")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, os };
    },
    onSuccess: ({ id, os }) => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
      toast.success("Ordem de Serviço excluída com sucesso!");
      if (os) {
        logDelete("ordem_servico", id, `OS #${os.numero_os} - ${os.condominio_nome}`);
      }
    },
    onError: (error) => {
      console.error("Erro ao excluir OS:", error);
      toast.error("Erro ao excluir Ordem de Serviço");
    },
  });
}
