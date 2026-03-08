import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

interface DashboardStats {
  totalHoje: number;
  totalSemana: number;
  totalMes: number;
  emAndamento: number;
  finalizadosHoje: number;
  totalCondominios: number;
  totalUnidades: number;
  boletosEmAberto: number;
}

interface ChartData {
  name: string;
  value: number;
}

export function useDashboardStats(condominioId?: string | null) {
  return useQuery({
    queryKey: ["dashboard-stats", condominioId],
    queryFn: async (): Promise<DashboardStats> => {
      const hoje = startOfDay(new Date());
      const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
      const inicioMes = startOfMonth(new Date());

      // Atendimentos de hoje
      let queryHoje = supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", hoje.toISOString());
      if (condominioId) queryHoje = queryHoje.eq("condominio_id", condominioId);
      const { count: totalHoje } = await queryHoje;

      // Atendimentos da semana
      let querySemana = supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioSemana.toISOString());
      if (condominioId) querySemana = querySemana.eq("condominio_id", condominioId);
      const { count: totalSemana } = await querySemana;

      // Atendimentos do mês
      let queryMes = supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", inicioMes.toISOString());
      if (condominioId) queryMes = queryMes.eq("condominio_id", condominioId);
      const { count: totalMes } = await queryMes;

      // Em andamento
      let queryAndamento = supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("status", "Em andamento");
      if (condominioId) queryAndamento = queryAndamento.eq("condominio_id", condominioId);
      const { count: emAndamento } = await queryAndamento;

      // Finalizados hoje
      let queryFinalizados = supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .in("status", ["Finalizado", "Com Contrato", "Finalizado sem contrato"])
        .gte("updated_at", hoje.toISOString());
      if (condominioId) queryFinalizados = queryFinalizados.eq("condominio_id", condominioId);
      const { count: finalizadosHoje } = await queryFinalizados;

      // Total de condomínios (só mostra se não está filtrado)
      const { count: totalCondominios } = await supabase
        .from("condominios")
        .select("*", { count: "exact", head: true });

      // Total de unidades
      let queryUnidades = supabase
        .from("unidades")
        .select("*", { count: "exact", head: true });
      if (condominioId) queryUnidades = queryUnidades.eq("condominio_id", condominioId);
      const { count: totalUnidades } = await queryUnidades;

      // Boletos em aberto (pendente ou atrasado)
      let queryBoletos = supabase
        .from("boletos")
        .select("*", { count: "exact", head: true })
        .in("status", ["pendente", "atraso"]);
      if (condominioId) queryBoletos = queryBoletos.eq("condominio_id", condominioId);
      const { count: boletosEmAberto } = await queryBoletos;

      return {
        totalHoje: totalHoje ?? 0,
        totalSemana: totalSemana ?? 0,
        totalMes: totalMes ?? 0,
        emAndamento: emAndamento ?? 0,
        finalizadosHoje: finalizadosHoje ?? 0,
        totalCondominios: condominioId ? 1 : (totalCondominios ?? 0),
        totalUnidades: totalUnidades ?? 0,
        boletosEmAberto: boletosEmAberto ?? 0,
      };
    },
  });
}

export function useAtendimentosPorStatus(condominioId?: string | null) {
  return useQuery({
    queryKey: ["atendimentos-por-status", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      let query = supabase.from("atendimentos").select("status");
      if (condominioId) query = query.eq("condominio_id", condominioId);

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.status] = (counts[item.status] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
}

export function useAtendimentosPorCanal(condominioId?: string | null) {
  return useQuery({
    queryKey: ["atendimentos-por-canal", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      let query = supabase.from("atendimentos").select("canal");
      if (condominioId) query = query.eq("condominio_id", condominioId);

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.canal] = (counts[item.canal] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
}

export function useAtendimentosPorMotivo(condominioId?: string | null) {
  return useQuery({
    queryKey: ["atendimentos-por-motivo", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      let query = supabase.from("atendimentos").select("motivo");
      if (condominioId) query = query.eq("condominio_id", condominioId);

      const { data, error } = await query;

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.motivo] = (counts[item.motivo] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
}
