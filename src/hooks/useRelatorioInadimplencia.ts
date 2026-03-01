import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InadimplenteItem {
  id: string;
  condominio_id: string;
  condominio_nome: string;
  unidade: string;
  morador_nome: string | null;
  morador_telefone: string | null;
  morador_email: string | null;
  valor: number;
  data_vencimento: string;
  referencia: string;
  dias_atraso: number;
  categoria_nome: string | null;
}

export interface ResumoInadimplencia {
  totalInadimplentes: number;
  valorTotalDevido: number;
  mediaAtraso: number;
  maiorDebito: number;
}

export interface InadimplenciaPorCondominio {
  condominio_id: string;
  condominio_nome: string;
  quantidade_inadimplentes: number;
  valor_total: number;
}

export interface InadimplenciaPorFaixaAtraso {
  faixa: string;
  quantidade: number;
  valor_total: number;
  cor: string;
}

export interface InadimplenciaFilters {
  condominio_id?: string;
  faixa_atraso?: string;
  valor_minimo?: number;
  valor_maximo?: number;
  apenas_com_contato?: boolean;
}

function calcularDiasAtraso(dataVencimento: string): number {
  const vencimento = new Date(dataVencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);
  const diffTime = hoje.getTime() - vencimento.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getFaixaAtraso(dias: number): string {
  if (dias <= 30) return "1-30 dias";
  if (dias <= 60) return "31-60 dias";
  if (dias <= 90) return "61-90 dias";
  return "> 90 dias";
}

export function getCorFaixa(dias: number): string {
  if (dias <= 30) return "#eab308";
  if (dias <= 60) return "#f97316";
  if (dias <= 90) return "#ef4444";
  return "#991b1b";
}

function filtrarPorFaixa(dias: number, faixa?: string): boolean {
  if (!faixa) return true;
  switch (faixa) {
    case "1-30":
      return dias >= 1 && dias <= 30;
    case "31-60":
      return dias >= 31 && dias <= 60;
    case "61-90":
      return dias >= 61 && dias <= 90;
    case ">90":
      return dias > 90;
    default:
      return true;
  }
}

export function useInadimplentes(filters: InadimplenciaFilters = {}) {
  return useQuery({
    queryKey: ["inadimplentes", filters],
    queryFn: async () => {
      let query = supabase
        .from("boletos")
        .select(`
          id,
          condominio_id,
          unidade,
          morador_nome,
          morador_telefone,
          morador_email,
          valor,
          data_vencimento,
          referencia,
          condominios!inner(nome),
          categorias_financeiras(nome)
        `)
        .eq("status", "atraso")
        .order("data_vencimento", { ascending: true });

      if (filters.condominio_id) {
        query = query.eq("condominio_id", filters.condominio_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      let inadimplentes: InadimplenteItem[] = (data || []).map((boleto: any) => {
        const diasAtraso = calcularDiasAtraso(boleto.data_vencimento);
        return {
          id: boleto.id,
          condominio_id: boleto.condominio_id,
          condominio_nome: boleto.condominios?.nome || "",
          unidade: boleto.unidade,
          morador_nome: boleto.morador_nome,
          morador_telefone: boleto.morador_telefone,
          morador_email: boleto.morador_email,
          valor: Number(boleto.valor),
          data_vencimento: boleto.data_vencimento,
          referencia: boleto.referencia,
          dias_atraso: diasAtraso,
          categoria_nome: boleto.categorias_financeiras?.nome || null,
        };
      });

      // Apply filters
      if (filters.faixa_atraso) {
        inadimplentes = inadimplentes.filter((i) =>
          filtrarPorFaixa(i.dias_atraso, filters.faixa_atraso)
        );
      }

      if (filters.valor_minimo !== undefined) {
        inadimplentes = inadimplentes.filter((i) => i.valor >= filters.valor_minimo!);
      }

      if (filters.valor_maximo !== undefined) {
        inadimplentes = inadimplentes.filter((i) => i.valor <= filters.valor_maximo!);
      }

      if (filters.apenas_com_contato) {
        inadimplentes = inadimplentes.filter(
          (i) => i.morador_telefone || i.morador_email
        );
      }

      return inadimplentes.sort((a, b) => b.dias_atraso - a.dias_atraso);
    },
  });
}

export function useResumoInadimplencia(filters: InadimplenciaFilters = {}) {
  const { data: inadimplentes } = useInadimplentes(filters);

  return useQuery({
    queryKey: ["resumo-inadimplencia", filters, inadimplentes],
    queryFn: async () => {
      if (!inadimplentes || inadimplentes.length === 0) {
        return {
          totalInadimplentes: 0,
          valorTotalDevido: 0,
          mediaAtraso: 0,
          maiorDebito: 0,
        };
      }

      const valorTotal = inadimplentes.reduce((sum, i) => sum + i.valor, 0);
      const mediaAtraso =
        inadimplentes.reduce((sum, i) => sum + i.dias_atraso, 0) /
        inadimplentes.length;
      const maiorDebito = Math.max(...inadimplentes.map((i) => i.valor));

      return {
        totalInadimplentes: inadimplentes.length,
        valorTotalDevido: valorTotal,
        mediaAtraso: Math.round(mediaAtraso),
        maiorDebito,
      };
    },
    enabled: !!inadimplentes,
  });
}

export function useInadimplenciaPorCondominio(filters: InadimplenciaFilters = {}) {
  const { data: inadimplentes } = useInadimplentes(filters);

  return useQuery({
    queryKey: ["inadimplencia-por-condominio", filters, inadimplentes],
    queryFn: async () => {
      if (!inadimplentes || inadimplentes.length === 0) {
        return [];
      }

      const grouped = inadimplentes.reduce((acc, item) => {
        const key = item.condominio_id;
        if (!acc[key]) {
          acc[key] = {
            condominio_id: item.condominio_id,
            condominio_nome: item.condominio_nome,
            quantidade_inadimplentes: 0,
            valor_total: 0,
          };
        }
        acc[key].quantidade_inadimplentes += 1;
        acc[key].valor_total += item.valor;
        return acc;
      }, {} as Record<string, InadimplenciaPorCondominio>);

      return Object.values(grouped).sort((a, b) => b.valor_total - a.valor_total);
    },
    enabled: !!inadimplentes,
  });
}

export function useInadimplenciaPorFaixaAtraso(filters: InadimplenciaFilters = {}) {
  const { data: inadimplentes } = useInadimplentes(filters);

  return useQuery({
    queryKey: ["inadimplencia-por-faixa", filters, inadimplentes],
    queryFn: async () => {
      if (!inadimplentes || inadimplentes.length === 0) {
        return [];
      }

      const faixas: Record<string, InadimplenciaPorFaixaAtraso> = {
        "1-30 dias": { faixa: "1-30 dias", quantidade: 0, valor_total: 0, cor: "#eab308" },
        "31-60 dias": { faixa: "31-60 dias", quantidade: 0, valor_total: 0, cor: "#f97316" },
        "61-90 dias": { faixa: "61-90 dias", quantidade: 0, valor_total: 0, cor: "#ef4444" },
        "> 90 dias": { faixa: "> 90 dias", quantidade: 0, valor_total: 0, cor: "#991b1b" },
      };

      inadimplentes.forEach((item) => {
        const faixa = getFaixaAtraso(item.dias_atraso);
        faixas[faixa].quantidade += 1;
        faixas[faixa].valor_total += item.valor;
      });

      return Object.values(faixas).filter((f) => f.quantidade > 0);
    },
    enabled: !!inadimplentes,
  });
}
