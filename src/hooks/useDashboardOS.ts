import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays } from "date-fns";

export interface ResumoOS {
  total: number;
  abertas: number;
  emAndamento: number;
  concluidas: number;
  canceladas: number;
  urgentes: number;
  periodicas: number;
  naoUrgentes: number;
  tempoMedioAtendimento: number;
  concluidasEsteMes: number;
  abertasHoje: number;
}

export interface OSPorStatus {
  status: string;
  label: string;
  quantidade: number;
  cor: string;
}

export interface OSPorPrioridade {
  prioridade: string;
  label: string;
  quantidade: number;
  cor: string;
}

export interface OSPorCondominio {
  condominio_nome: string;
  quantidade: number;
}

export function useDashboardOS() {
  return useQuery({
    queryKey: ["dashboard_os"],
    queryFn: async () => {
      const { data: ordensServico, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const os = ordensServico || [];
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      // Calcular tempo médio de atendimento (dias entre solicitação e atendimento para concluídas)
      const concluidas = os.filter((o) => o.status === "concluida" && o.data_atendimento);
      let tempoMedioAtendimento = 0;
      
      if (concluidas.length > 0) {
        const tempoTotal = concluidas.reduce((acc, o) => {
          const dataSolicitacao = new Date(o.data_solicitacao);
          const dataAtendimento = new Date(o.data_atendimento!);
          return acc + differenceInDays(dataAtendimento, dataSolicitacao);
        }, 0);
        tempoMedioAtendimento = Math.round(tempoTotal / concluidas.length);
      }

      // Contadores por status
      const abertas = os.filter((o) => o.status === "aberta").length;
      const emAndamento = os.filter((o) => o.status === "em_andamento").length;
      const concluidasTotal = os.filter((o) => o.status === "concluida").length;
      const canceladas = os.filter((o) => o.status === "cancelada").length;

      // Contadores por prioridade
      const urgentes = os.filter((o) => o.prioridade === "urgente").length;
      const periodicas = os.filter((o) => o.prioridade === "periodico").length;
      const naoUrgentes = os.filter((o) => o.prioridade === "nao_urgente").length;

      // Concluídas este mês
      const concluidasEsteMes = os.filter((o) => {
        if (o.status !== "concluida" || !o.data_atendimento) return false;
        const dataAtend = new Date(o.data_atendimento);
        return dataAtend >= primeiroDiaMes;
      }).length;

      // Abertas hoje
      const abertasHoje = os.filter((o) => {
        const dataSolic = new Date(o.data_solicitacao);
        dataSolic.setHours(0, 0, 0, 0);
        return dataSolic.getTime() === hoje.getTime();
      }).length;

      const resumo: ResumoOS = {
        total: os.length,
        abertas,
        emAndamento,
        concluidas: concluidasTotal,
        canceladas,
        urgentes,
        periodicas,
        naoUrgentes,
        tempoMedioAtendimento,
        concluidasEsteMes,
        abertasHoje,
      };

      // Dados para gráfico por status
      const porStatus: OSPorStatus[] = [
        { status: "aberta", label: "Abertas", quantidade: abertas, cor: "#3b82f6" },
        { status: "em_andamento", label: "Em Andamento", quantidade: emAndamento, cor: "#f59e0b" },
        { status: "concluida", label: "Concluídas", quantidade: concluidasTotal, cor: "#22c55e" },
        { status: "cancelada", label: "Canceladas", quantidade: canceladas, cor: "#ef4444" },
      ];

      // Dados para gráfico por prioridade
      const porPrioridade: OSPorPrioridade[] = [
        { prioridade: "urgente", label: "Urgentes", quantidade: urgentes, cor: "#ef4444" },
        { prioridade: "periodico", label: "Periódicas", quantidade: periodicas, cor: "#3b82f6" },
        { prioridade: "nao_urgente", label: "Não Urgentes", quantidade: naoUrgentes, cor: "#22c55e" },
      ];

      // Top condomínios com mais OS
      const condominiosMap = new Map<string, number>();
      os.forEach((o) => {
        const current = condominiosMap.get(o.condominio_nome) || 0;
        condominiosMap.set(o.condominio_nome, current + 1);
      });
      
      const porCondominio: OSPorCondominio[] = Array.from(condominiosMap.entries())
        .map(([condominio_nome, quantidade]) => ({ condominio_nome, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5);

      return {
        resumo,
        porStatus,
        porPrioridade,
        porCondominio,
      };
    },
  });
}
