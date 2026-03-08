import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface RelatorioFilters {
  dataInicio?: Date;
  dataFim?: Date;
}

export interface AtendimentoPorOperador {
  operador_nome: string;
  total: number;
  finalizados: number;
  em_andamento: number;
}

export interface AtendimentoPorCondominio {
  condominio_nome: string;
  total: number;
}

export interface AtendimentoPorMotivo {
  motivo: string;
  total: number;
}

export interface AtendimentoPorCanal {
  canal: string;
  total: number;
}

export interface AtendimentoPorStatus {
  status: string;
  total: number;
}

export interface ResumoGeral {
  totalAtendimentos: number;
  totalFinalizados: number;
  totalEmAndamento: number;
  totalCondominios: number;
  totalOperadores: number;
}

export interface AtendimentoExport {
  id: string;
  data: string;
  hora: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_email: string | null;
  condominio_nome: string;
  operador_nome: string;
  canal: string;
  status: string;
  motivo: string;
  observacoes: string | null;
}

export function useRelatorioResumo(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["relatorio-resumo", filters],
    queryFn: async () => {
      let query = supabase.from("atendimentos").select("*");

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data: atendimentos, error } = await query;
      if (error) throw error;

      const { data: condominios } = await supabase
        .from("condominios")
        .select("id");

      const operadores = new Set(atendimentos?.map((a) => a.operador_nome) || []);

      const resumo: ResumoGeral = {
        totalAtendimentos: atendimentos?.length || 0,
        totalFinalizados: atendimentos?.filter((a) => ["Finalizado", "Com Contrato", "Finalizado sem contrato"].includes(a.status)).length || 0,
        totalEmAndamento: atendimentos?.filter((a) => a.status === "Em andamento").length || 0,
        totalCondominios: condominios?.length || 0,
        totalOperadores: operadores.size,
      };

      return resumo;
    },
  });
}

export function useRelatorioPorOperador(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["relatorio-operador", filters],
    queryFn: async () => {
      let query = supabase.from("atendimentos").select("operador_nome, status");

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      const porOperador = new Map<string, AtendimentoPorOperador>();

      data?.forEach((a) => {
        const existing = porOperador.get(a.operador_nome) || {
          operador_nome: a.operador_nome,
          total: 0,
          finalizados: 0,
          em_andamento: 0,
        };
        existing.total++;
        if (["Finalizado", "Com Contrato", "Finalizado sem contrato"].includes(a.status)) existing.finalizados++;
        if (a.status === "Em andamento") existing.em_andamento++;
        porOperador.set(a.operador_nome, existing);
      });

      return Array.from(porOperador.values()).sort((a, b) => b.total - a.total);
    },
  });
}

export function useRelatorioPorCondominio(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["relatorio-condominio", filters],
    queryFn: async () => {
      let query = supabase.from("atendimentos").select("condominio_nome");

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      const porCondominio = new Map<string, number>();

      data?.forEach((a) => {
        porCondominio.set(a.condominio_nome, (porCondominio.get(a.condominio_nome) || 0) + 1);
      });

      return Array.from(porCondominio.entries())
        .map(([condominio_nome, total]) => ({ condominio_nome, total }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

export function useRelatorioPorMotivo(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["relatorio-motivo", filters],
    queryFn: async () => {
      let query = supabase.from("atendimentos").select("motivo");

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      const porMotivo = new Map<string, number>();

      data?.forEach((a) => {
        porMotivo.set(a.motivo, (porMotivo.get(a.motivo) || 0) + 1);
      });

      return Array.from(porMotivo.entries())
        .map(([motivo, total]) => ({ motivo, total }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

export function useRelatorioPorCanal(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["relatorio-canal", filters],
    queryFn: async () => {
      let query = supabase.from("atendimentos").select("canal");

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      const porCanal = new Map<string, number>();

      data?.forEach((a) => {
        porCanal.set(a.canal, (porCanal.get(a.canal) || 0) + 1);
      });

      return Array.from(porCanal.entries())
        .map(([canal, total]) => ({ canal, total }))
        .sort((a, b) => b.total - a.total);
    },
  });
}

export function useAtendimentosExport(filters: RelatorioFilters) {
  return useQuery({
    queryKey: ["atendimentos-export", filters],
    queryFn: async () => {
      let query = supabase
        .from("atendimentos")
        .select("id, data, hora, cliente_nome, cliente_telefone, cliente_email, condominio_nome, operador_nome, canal, status, motivo, observacoes")
        .order("data", { ascending: false });

      if (filters.dataInicio) {
        query = query.gte("data", format(filters.dataInicio, "yyyy-MM-dd"));
      }
      if (filters.dataFim) {
        query = query.lte("data", format(filters.dataFim, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as AtendimentoExport[];
    },
    enabled: false,
  });
}
