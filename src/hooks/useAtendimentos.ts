import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export interface Atendimento {
  id: string;
  data: string;
  hora: string;
  operador_id: string | null;
  operador_nome: string;
  canal: string;
  status: string;
  motivo: string;
  observacoes: string | null;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  condominio_id: string | null;
  condominio_nome: string;
  created_at: string;
  updated_at: string;
}

export interface NovoAtendimentoData {
  data: string;
  hora: string;
  operador_nome: string;
  canal: string;
  status: string;
  motivo: string;
  observacoes?: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email?: string;
  condominio_nome: string;
  condominio_id?: string;
}

export interface AtendimentoFilters {
  busca?: string;
  status?: string;
  canal?: string;
  motivo?: string;
  operador?: string;
  dataInicio?: string;
  dataFim?: string;
}

export function useAtendimentos(filters?: AtendimentoFilters) {
  return useQuery({
    queryKey: ["atendimentos", filters],
    queryFn: async () => {
      let query = supabase
        .from("atendimentos")
        .select("*")
        .order("created_at", { ascending: false });

      // Aplicar filtros
      if (filters?.busca) {
        const busca = `%${filters.busca}%`;
        query = query.or(
          `cliente_nome.ilike.${busca},cliente_telefone.ilike.${busca},cliente_email.ilike.${busca},condominio_nome.ilike.${busca},operador_nome.ilike.${busca}`
        );
      }

      if (filters?.status && filters.status !== "todos") {
        query = query.eq("status", filters.status);
      }

      if (filters?.canal && filters.canal !== "todos") {
        query = query.eq("canal", filters.canal);
      }

      if (filters?.motivo && filters.motivo !== "todos") {
        query = query.eq("motivo", filters.motivo);
      }

      if (filters?.operador) {
        query = query.ilike("operador_nome", `%${filters.operador}%`);
      }

      if (filters?.dataInicio) {
        query = query.gte("data", filters.dataInicio);
      }

      if (filters?.dataFim) {
        query = query.lte("data", filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Atendimento[];
    },
  });
}

export function useCreateAtendimento() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (novoAtendimento: NovoAtendimentoData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("atendimentos")
        .insert({
          ...novoAtendimento,
          operador_id: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      toast.success("Atendimento registrado com sucesso!");
      logCreate("atendimento", data.id, `${data.cliente_nome} - ${data.condominio_nome}`, {
        canal: data.canal,
        motivo: data.motivo,
      });
    },
    onError: (error) => {
      console.error("Erro ao criar atendimento:", error);
      toast.error("Erro ao registrar atendimento. Verifique se você está logado.");
    },
  });
}

export interface UpdateAtendimentoData extends NovoAtendimentoData {
  id: string;
}

export function useUpdateAtendimento() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateAtendimentoData) => {
      const { data, error } = await supabase
        .from("atendimentos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      toast.success("Atendimento atualizado com sucesso!");
      logUpdate("atendimento", data.id, `${data.cliente_nome}`, {
        status: data.status,
      });
    },
    onError: (error) => {
      console.error("Erro ao atualizar atendimento:", error);
      toast.error("Erro ao atualizar atendimento.");
    },
  });
}

export function useDeleteAtendimento() {
  const queryClient = useQueryClient();
  const { logDelete } = useAuditLogger();

  return useMutation({
    mutationFn: async (atendimento: Atendimento) => {
      const { error } = await supabase
        .from("atendimentos")
        .delete()
        .eq("id", atendimento.id);

      if (error) throw error;
      return atendimento;
    },
    onSuccess: (atendimento) => {
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      toast.success("Atendimento excluído com sucesso!");
      logDelete("atendimento", atendimento.id, `${atendimento.cliente_nome} - ${atendimento.condominio_nome}`);
    },
    onError: (error) => {
      console.error("Erro ao excluir atendimento:", error);
      toast.error("Erro ao excluir atendimento.");
    },
  });
}
