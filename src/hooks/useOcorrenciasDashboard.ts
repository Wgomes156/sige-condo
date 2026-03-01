import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResumoOcorrencias {
  total: number;
  abertas: number;
  emAnalise: number;
  resolvidas: number;
  urgentes: number;
  registradasHoje: number;
  resolvidasEsteMes: number;
}

export interface OcorrenciaPorStatus {
  status: string;
  nome: string;
  quantidade: number;
  cor: string;
}

export interface OcorrenciaPorTipo {
  tipo: string;
  nome: string;
  quantidade: number;
}

export interface OcorrenciaPorPrioridade {
  prioridade: string;
  nome: string;
  quantidade: number;
  cor: string;
}

const STATUS_CONFIG: Record<string, { nome: string; cor: string }> = {
  aberta: { nome: "Aberta", cor: "hsl(217, 91%, 60%)" },
  em_analise: { nome: "Em Análise", cor: "hsl(38, 92%, 50%)" },
  resolvida: { nome: "Resolvida", cor: "hsl(142, 76%, 36%)" },
  arquivada: { nome: "Arquivada", cor: "hsl(var(--muted-foreground))" },
};

const TIPOS_CONFIG: Record<string, string> = {
  manutencao: "Manutenção",
  seguranca: "Segurança",
  convivencia: "Convivência",
  outros: "Outros",
};

const PRIORIDADE_CONFIG: Record<string, { nome: string; cor: string }> = {
  baixa: { nome: "Baixa", cor: "hsl(142, 76%, 36%)" },
  media: { nome: "Média", cor: "hsl(38, 92%, 50%)" },
  alta: { nome: "Alta", cor: "hsl(25, 95%, 53%)" },
  urgente: { nome: "Urgente", cor: "hsl(0, 84%, 60%)" },
};

export function useOcorrenciasDashboard(condominioId?: string) {
  const resumoQuery = useQuery({
    queryKey: ["ocorrencias-resumo", condominioId],
    queryFn: async (): Promise<ResumoOcorrencias> => {
      let query = supabase.from("ocorrencias_condominio").select("*");
      
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      return {
        total: data?.length || 0,
        abertas: data?.filter((o) => o.status === "aberta").length || 0,
        emAnalise: data?.filter((o) => o.status === "em_analise").length || 0,
        resolvidas: data?.filter((o) => o.status === "resolvida").length || 0,
        urgentes: data?.filter((o) => o.prioridade === "urgente" && o.status !== "resolvida" && o.status !== "arquivada").length || 0,
        registradasHoje: data?.filter((o) => new Date(o.created_at) >= hoje).length || 0,
        resolvidasEsteMes: data?.filter((o) => o.status === "resolvida" && new Date(o.updated_at) >= inicioMes).length || 0,
      };
    },
  });

  const porStatusQuery = useQuery({
    queryKey: ["ocorrencias-por-status", condominioId],
    queryFn: async (): Promise<OcorrenciaPorStatus[]> => {
      let query = supabase.from("ocorrencias_condominio").select("status");
      
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
      });

      return Object.entries(counts).map(([status, quantidade]) => ({
        status,
        nome: STATUS_CONFIG[status]?.nome || status,
        quantidade,
        cor: STATUS_CONFIG[status]?.cor || "hsl(var(--primary))",
      }));
    },
  });

  const porTipoQuery = useQuery({
    queryKey: ["ocorrencias-por-tipo", condominioId],
    queryFn: async (): Promise<OcorrenciaPorTipo[]> => {
      let query = supabase.from("ocorrencias_condominio").select("tipo_ocorrencia");
      
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((o) => {
        counts[o.tipo_ocorrencia] = (counts[o.tipo_ocorrencia] || 0) + 1;
      });

      return Object.entries(counts).map(([tipo, quantidade]) => ({
        tipo,
        nome: TIPOS_CONFIG[tipo] || tipo,
        quantidade,
      }));
    },
  });

  const porPrioridadeQuery = useQuery({
    queryKey: ["ocorrencias-por-prioridade", condominioId],
    queryFn: async (): Promise<OcorrenciaPorPrioridade[]> => {
      let query = supabase.from("ocorrencias_condominio").select("prioridade");
      
      if (condominioId) {
        query = query.eq("condominio_id", condominioId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((o) => {
        counts[o.prioridade] = (counts[o.prioridade] || 0) + 1;
      });

      return Object.entries(counts).map(([prioridade, quantidade]) => ({
        prioridade,
        nome: PRIORIDADE_CONFIG[prioridade]?.nome || prioridade,
        quantidade,
        cor: PRIORIDADE_CONFIG[prioridade]?.cor || "hsl(var(--primary))",
      }));
    },
  });

  return {
    resumo: resumoQuery.data,
    isLoadingResumo: resumoQuery.isLoading,
    porStatus: porStatusQuery.data,
    isLoadingPorStatus: porStatusQuery.isLoading,
    porTipo: porTipoQuery.data,
    isLoadingPorTipo: porTipoQuery.isLoading,
    porPrioridade: porPrioridadeQuery.data,
    isLoadingPorPrioridade: porPrioridadeQuery.isLoading,
  };
}
