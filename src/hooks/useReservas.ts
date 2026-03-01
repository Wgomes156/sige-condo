import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReservaStatus = "pendente" | "confirmada" | "cancelada" | "concluida" | "recusada";

export interface Reserva {
  id: string;
  numero_reserva: string;
  condominio_id: string;
  unidade_id: string;
  area_comum_id: string;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_email: string | null;
  responsavel_cpf: string | null;
  data_inicio: string;
  data_fim: string;
  horario_inicio: string;
  horario_fim: string;
  tem_convidados: boolean;
  total_convidados: number;
  status: ReservaStatus;
  valor_taxa: number;
  taxa_paga: boolean;
  data_pagamento: string | null;
  observacoes: string | null;
  motivo_recusa: string | null;
  aprovado_por: string | null;
  data_aprovacao: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  area_comum?: { nome: string; capacidade: number | null };
  unidade?: { codigo: string };
  condominio?: { nome: string };
}

export interface ReservaConvidado {
  id: string;
  reserva_id: string;
  nome: string;
  cpf: string;
  telefone: string | null;
  status_acesso: "liberado" | "bloqueado" | "pendente";
  entrada_registrada: boolean;
  hora_entrada: string | null;
  hora_saida: string | null;
  created_at: string;
}

export interface ReservaFilters {
  condominioId?: string;
  status?: ReservaStatus;
  areaComumId?: string;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}

export function useReservas(filters: ReservaFilters = {}) {
  return useQuery({
    queryKey: ["reservas", filters],
    queryFn: async () => {
      let query = supabase
        .from("reservas" as any)
        .select(`
          *,
          area_comum:areas_comuns!area_comum_id(nome, capacidade),
          unidade:unidades!unidade_id(codigo),
          condominio:condominios!condominio_id(nome)
        `)
        .order("data_inicio", { ascending: false });

      if (filters.condominioId) query = query.eq("condominio_id", filters.condominioId);
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.areaComumId) query = query.eq("area_comum_id", filters.areaComumId);
      if (filters.dataInicio) query = query.gte("data_inicio", filters.dataInicio);
      if (filters.dataFim) query = query.lte("data_inicio", filters.dataFim);
      if (filters.busca) {
        query = query.or(
          `numero_reserva.ilike.%${filters.busca}%,responsavel_nome.ilike.%${filters.busca}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Reserva[];
    },
  });
}

export function useReserva(id: string | null) {
  return useQuery({
    queryKey: ["reserva", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("reservas" as any)
        .select(`
          *,
          area_comum:areas_comuns!area_comum_id(nome, capacidade, valor_taxa),
          unidade:unidades!unidade_id(codigo),
          condominio:condominios!condominio_id(nome)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as Reserva;
    },
    enabled: !!id,
  });
}

export interface ReservaInsert {
  condominio_id: string;
  unidade_id: string;
  area_comum_id: string;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_email?: string | null;
  responsavel_cpf?: string | null;
  data_inicio: string;
  data_fim: string;
  horario_inicio: string;
  horario_fim: string;
  tem_convidados?: boolean;
  total_convidados?: number;
  valor_taxa?: number;
  observacoes?: string | null;
  criado_por?: string;
}

export function useCreateReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reserva,
      convidados,
    }: {
      reserva: ReservaInsert;
      convidados?: { nome: string; cpf: string; telefone?: string }[];
    }) => {
      const { data, error } = await supabase
        .from("reservas" as any)
        .insert(reserva as any)
        .select()
        .single();
      if (error) throw error;

      const reservaData = data as unknown as Reserva;

      if (convidados && convidados.length > 0) {
        const convidadosInsert = convidados.map((c) => ({
          reserva_id: reservaData.id,
          nome: c.nome,
          cpf: c.cpf,
          telefone: c.telefone || null,
        }));
        const { error: convError } = await supabase
          .from("reserva_convidados" as any)
          .insert(convidadosInsert as any);
        if (convError) throw convError;
      }

      return reservaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      toast.success("Reserva criada com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao criar reserva:", error);
      toast.error(error.message || "Erro ao criar reserva.");
    },
  });
}

export function useUpdateReservaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      motivo_recusa,
    }: {
      id: string;
      status: ReservaStatus;
      motivo_recusa?: string;
    }) => {
      const updateData: any = { status };
      if (motivo_recusa) updateData.motivo_recusa = motivo_recusa;
      if (status === "confirmada") updateData.data_aprovacao = new Date().toISOString();

      const { data, error } = await supabase
        .from("reservas" as any)
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      toast.success("Status da reserva atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });
}

export function useDeleteReserva() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservas" as any)
        .update({ status: "cancelada" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservas"] });
      toast.success("Reserva cancelada!");
    },
    onError: () => toast.error("Erro ao cancelar reserva."),
  });
}

// Convidados
export function useReservaConvidados(reservaId: string | null) {
  return useQuery({
    queryKey: ["reserva_convidados", reservaId],
    queryFn: async () => {
      if (!reservaId) return [];
      const { data, error } = await supabase
        .from("reserva_convidados" as any)
        .select("*")
        .eq("reserva_id", reservaId)
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as unknown as ReservaConvidado[];
    },
    enabled: !!reservaId,
  });
}

// Verificar disponibilidade
export function useVerificarDisponibilidade() {
  return useMutation({
    mutationFn: async ({
      area_comum_id,
      data_inicio,
      data_fim,
      horario_inicio,
      horario_fim,
      excludeReservaId,
    }: {
      area_comum_id: string;
      data_inicio: string;
      data_fim: string;
      horario_inicio: string;
      horario_fim: string;
      excludeReservaId?: string;
    }) => {
      let query = supabase
        .from("reservas" as any)
        .select("id, numero_reserva, data_inicio, data_fim, horario_inicio, horario_fim")
        .eq("area_comum_id", area_comum_id)
        .in("status", ["pendente", "confirmada"])
        .lte("data_inicio", data_fim)
        .gte("data_fim", data_inicio);

      if (excludeReservaId) {
        query = query.neq("id", excludeReservaId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar por horário
      const conflitos = (data as any[])?.filter((r: any) => {
        return r.horario_inicio < horario_fim && r.horario_fim > horario_inicio;
      });

      return { disponivel: !conflitos || conflitos.length === 0, conflitos };
    },
  });
}
