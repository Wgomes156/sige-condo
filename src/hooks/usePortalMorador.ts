import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnidadeMorador {
  id: string;
  codigo: string;
  bloco: string | null;
  numero_unidade: string | null;
  condominio_id: string;
  condominios?: { id: string; nome: string };
}

export interface BoletoMorador {
  id: string;
  unidade: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: "pendente" | "pago" | "atraso" | "cancelado";
  referencia: string;
  nosso_numero: string | null;
  condominios?: { nome: string };
}

// Hook para buscar unidades do morador
export function useUnidadesMorador() {
  return useQuery({
    queryKey: ["unidades-morador"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar os acessos do morador
      const { data: acessos, error: acessosError } = await supabase
        .from("user_unidade_access")
        .select("unidade_id, tipo_morador")
        .eq("user_id", user.id);

      if (acessosError) throw acessosError;
      if (!acessos || acessos.length === 0) return [];

      const unidadeIds = acessos.map(a => a.unidade_id);

      // Buscar as unidades
      const { data: unidades, error: unidadesError } = await supabase
        .from("unidades")
        .select(`
          id,
          codigo,
          bloco,
          numero_unidade,
          condominio_id,
          condominios:condominio_id(id, nome)
        `)
        .in("id", unidadeIds);

      if (unidadesError) throw unidadesError;
      return unidades as UnidadeMorador[];
    },
  });
}

// Hook para buscar boletos do morador
export function useBoletosMorador() {
  return useQuery({
    queryKey: ["boletos-morador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boletos")
        .select(`
          id,
          unidade,
          valor,
          data_vencimento,
          data_pagamento,
          status,
          referencia,
          nosso_numero,
          condominios:condominio_id(nome)
        `)
        .order("data_vencimento", { ascending: false });

      if (error) throw error;
      return data as BoletoMorador[];
    },
  });
}

// Hook para resumo do morador
export function useResumoMorador() {
  const { data: boletos } = useBoletosMorador();

  const resumo = {
    totalBoletos: boletos?.length || 0,
    boletosAbertos: boletos?.filter(b => b.status === "pendente" || b.status === "atraso").length || 0,
    boletosAtrasados: boletos?.filter(b => b.status === "atraso").length || 0,
    valorTotal: boletos?.filter(b => b.status === "pendente" || b.status === "atraso")
      .reduce((acc, b) => acc + Number(b.valor), 0) || 0,
  };

  return resumo;
}
