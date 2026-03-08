import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

interface DashboardCondominioStats {
  totalHoje: number;
  totalSemana: number;
  totalMes: number;
  emAndamento: number;
  finalizadosHoje: number;
  totalUnidades: number;
  unidadesAtivas: number;
  unidadesDesocupadas: number;
  unidadesInadimplentes: number;
  totalMoradores: number;
  totalVeiculos: number;
  totalVagas: number;
  osAbertas: number;
  osConcluidas: number;
}

interface ChartData {
  name: string;
  value: number;
}

export function useDashboardCondominioStats(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard-condominio-stats", condominioId],
    queryFn: async (): Promise<DashboardCondominioStats> => {
      if (!condominioId) {
        return {
          totalHoje: 0,
          totalSemana: 0,
          totalMes: 0,
          emAndamento: 0,
          finalizadosHoje: 0,
          totalUnidades: 0,
          unidadesAtivas: 0,
          unidadesDesocupadas: 0,
          unidadesInadimplentes: 0,
          totalMoradores: 0,
          totalVeiculos: 0,
          totalVagas: 0,
          osAbertas: 0,
          osConcluidas: 0,
        };
      }

      const hoje = startOfDay(new Date());
      const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
      const inicioMes = startOfMonth(new Date());

      // Atendimentos de hoje
      const { count: totalHoje } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .gte("created_at", hoje.toISOString());

      // Atendimentos da semana
      const { count: totalSemana } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .gte("created_at", inicioSemana.toISOString());

      // Atendimentos do mês
      const { count: totalMes } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .gte("created_at", inicioMes.toISOString());

      // Em andamento
      const { count: emAndamento } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .eq("status", "Em andamento");

      // Finalizados hoje
      const { count: finalizadosHoje } = await supabase
        .from("atendimentos")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .in("status", ["Finalizado", "Com Contrato", "Finalizado sem contrato"])
        .gte("updated_at", hoje.toISOString());

      // Total de unidades
      const { count: totalUnidades } = await supabase
        .from("unidades")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId);

      // Unidades ativas
      const { count: unidadesAtivas } = await supabase
        .from("unidades")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .eq("situacao", "ativa");

      // Unidades desocupadas
      const { count: unidadesDesocupadas } = await supabase
        .from("unidades")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .eq("situacao", "desocupada");

      // Unidades inadimplentes
      const { count: unidadesInadimplentes } = await supabase
        .from("unidades")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .eq("status_financeiro", "inadimplente");

      // Buscar IDs das unidades do condomínio para queries relacionadas
      const { data: unidadesData } = await supabase
        .from("unidades")
        .select("id")
        .eq("condominio_id", condominioId);

      const unidadeIds = unidadesData?.map((u) => u.id) || [];

      let totalMoradores = 0;
      let totalVeiculos = 0;
      let totalVagas = 0;

      if (unidadeIds.length > 0) {
        const { count: moradores } = await supabase
          .from("moradores_unidade")
          .select("*", { count: "exact", head: true })
          .in("unidade_id", unidadeIds);
        totalMoradores = moradores ?? 0;

        const { count: veiculos } = await supabase
          .from("veiculos_unidade")
          .select("*", { count: "exact", head: true })
          .in("unidade_id", unidadeIds);
        totalVeiculos = veiculos ?? 0;

        const { count: vagas } = await supabase
          .from("vagas_garagem")
          .select("*", { count: "exact", head: true })
          .in("unidade_id", unidadeIds);
        totalVagas = vagas ?? 0;
      }

      // Ordens de Serviço
      const { count: osAbertas } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .in("status", ["aberta", "em_andamento"]);

      const { count: osConcluidas } = await supabase
        .from("ordens_servico")
        .select("*", { count: "exact", head: true })
        .eq("condominio_id", condominioId)
        .eq("status", "concluida");

      return {
        totalHoje: totalHoje ?? 0,
        totalSemana: totalSemana ?? 0,
        totalMes: totalMes ?? 0,
        emAndamento: emAndamento ?? 0,
        finalizadosHoje: finalizadosHoje ?? 0,
        totalUnidades: totalUnidades ?? 0,
        unidadesAtivas: unidadesAtivas ?? 0,
        unidadesDesocupadas: unidadesDesocupadas ?? 0,
        unidadesInadimplentes: unidadesInadimplentes ?? 0,
        totalMoradores,
        totalVeiculos,
        totalVagas,
        osAbertas: osAbertas ?? 0,
        osConcluidas: osConcluidas ?? 0,
      };
    },
    enabled: !!condominioId,
  });
}

export function useAtendimentosPorStatusCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["atendimentos-por-status-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("atendimentos")
        .select("status")
        .eq("condominio_id", condominioId);

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
    enabled: !!condominioId,
  });
}

export function useAtendimentosPorCanalCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["atendimentos-por-canal-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("atendimentos")
        .select("canal")
        .eq("condominio_id", condominioId);

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
    enabled: !!condominioId,
  });
}

export function useAtendimentosPorMotivoCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["atendimentos-por-motivo-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("atendimentos")
        .select("motivo")
        .eq("condominio_id", condominioId);

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
    enabled: !!condominioId,
  });
}

export function useUnidadesPorSituacaoCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["unidades-por-situacao-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("unidades")
        .select("situacao")
        .eq("condominio_id", condominioId);

      if (error) throw error;

      const situacaoLabels: Record<string, string> = {
        ativa: "Ativa",
        inativa: "Inativa",
        em_reforma: "Em Reforma",
        desocupada: "Desocupada",
      };

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        const label = situacaoLabels[item.situacao || "ativa"] || item.situacao;
        counts[label] = (counts[label] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!condominioId,
  });
}

export function useUnidadesPorTipoCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["unidades-por-tipo-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("unidades")
        .select("tipo_unidade")
        .eq("condominio_id", condominioId);

      if (error) throw error;

      const tipoLabels: Record<string, string> = {
        apartamento: "Apartamento",
        casa: "Casa",
        loja: "Loja",
        escritorio: "Escritório",
        sala: "Sala",
      };

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        const label = tipoLabels[item.tipo_unidade || "apartamento"] || item.tipo_unidade;
        counts[label] = (counts[label] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!condominioId,
  });
}

export function useOSPorStatusCondominio(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["os-por-status-condominio", condominioId],
    queryFn: async (): Promise<ChartData[]> => {
      if (!condominioId) return [];

      const { data, error } = await supabase
        .from("ordens_servico")
        .select("status")
        .eq("condominio_id", condominioId);

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        aberta: "Aberta",
        em_andamento: "Em Andamento",
        concluida: "Concluída",
        cancelada: "Cancelada",
      };

      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        const label = statusLabels[item.status || "aberta"] || item.status;
        counts[label] = (counts[label] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name,
        value,
      }));
    },
    enabled: !!condominioId,
  });
}
