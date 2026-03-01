import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";

type Proposta = Database["public"]["Tables"]["propostas"]["Row"];
type PropostaInsert = Database["public"]["Tables"]["propostas"]["Insert"];
type PropostaUpdate = Database["public"]["Tables"]["propostas"]["Update"];
type PropostaServico = Database["public"]["Tables"]["proposta_servicos"]["Row"];
type PropostaHistorico = Database["public"]["Tables"]["proposta_historico"]["Row"];

export interface PropostaComServicos extends Proposta {
  proposta_servicos?: PropostaServico[];
}

export interface PropostaStats {
  total: number;
  rascunho: number;
  enviadas: number;
  em_analise: number;
  aprovadas: number;
  recusadas: number;
  expiradas: number;
  valorTotal: number;
  valorAprovado: number;
}

export const usePropostas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Buscar todas as propostas com serviços
  const { data: propostas = [], isLoading, error } = useQuery({
    queryKey: ["propostas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propostas")
        .select(`
          *,
          proposta_servicos(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PropostaComServicos[];
    },
  });

  // Buscar proposta por ID com serviços
  const useProposta = (id: string | undefined) => {
    return useQuery({
      queryKey: ["proposta", id],
      queryFn: async () => {
        if (!id) return null;
        
        const { data, error } = await supabase
          .from("propostas")
          .select(`
            *,
            proposta_servicos(*)
          `)
          .eq("id", id)
          .single();

        if (error) throw error;
        return data as PropostaComServicos;
      },
      enabled: !!id,
    });
  };

  // Buscar histórico da proposta
  const useHistorico = (propostaId: string | undefined) => {
    return useQuery({
      queryKey: ["proposta-historico", propostaId],
      queryFn: async () => {
        if (!propostaId) return [];
        
        const { data, error } = await supabase
          .from("proposta_historico")
          .select("*")
          .eq("proposta_id", propostaId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data as PropostaHistorico[];
      },
      enabled: !!propostaId,
    });
  };

  // Gerar número da proposta
  const gerarNumeroProposta = async (): Promise<string> => {
    const { data, error } = await supabase.rpc("gerar_numero_proposta");
    if (error) {
      // Fallback se a função não existir
      const ano = new Date().getFullYear();
      const mes = String(new Date().getMonth() + 1).padStart(2, "0");
      const random = Math.floor(Math.random() * 9000) + 1000;
      return `PROP-${ano}${mes}-${random}`;
    }
    return data;
  };

  // Criar proposta
  const criarProposta = useMutation({
    mutationFn: async (dados: Omit<PropostaInsert, "numero_proposta" | "criado_por">) => {
      const numeroProposta = await gerarNumeroProposta();
      
      const { data, error } = await supabase
        .from("propostas")
        .insert({
          ...dados,
          numero_proposta: numeroProposta,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("proposta_historico").insert([{
        proposta_id: data.id,
        usuario_id: user?.id,
        acao: "criada",
        descricao: `Proposta ${numeroProposta} criada`,
        dados_novos: JSON.parse(JSON.stringify(data)),
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast({
        title: "Proposta criada",
        description: "A proposta foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar proposta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar proposta
  const atualizarProposta = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: PropostaUpdate }) => {
      // Buscar dados anteriores
      const { data: anterior } = await supabase
        .from("propostas")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("propostas")
        .update(dados)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("proposta_historico").insert([{
        proposta_id: id,
        usuario_id: user?.id,
        acao: "editada",
        descricao: "Proposta atualizada",
        dados_anteriores: JSON.parse(JSON.stringify(anterior)),
        dados_novos: JSON.parse(JSON.stringify(data)),
      }]);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      queryClient.invalidateQueries({ queryKey: ["proposta"] });
      toast({
        title: "Proposta atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Alterar status
  const alterarStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      motivo,
    }: {
      id: string;
      status: Database["public"]["Enums"]["proposta_status"];
      motivo?: string;
    }) => {
      const { data: anterior } = await supabase
        .from("propostas")
        .select("status")
        .eq("id", id)
        .single();

      const updateData: PropostaUpdate = {
        status,
        motivo_recusa: status === "recusada" ? motivo : null,
        aprovado_por: status === "aprovada" ? user?.id : null,
        data_aprovacao: status === "aprovada" ? new Date().toISOString() : null,
      };

      const { data, error } = await supabase
        .from("propostas")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar no histórico
      await supabase.from("proposta_historico").insert([{
        proposta_id: id,
        usuario_id: user?.id,
        acao: `status_${anterior?.status}_para_${status}`,
        descricao: motivo || `Status alterado para ${status}`,
      }]);

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      queryClient.invalidateQueries({ queryKey: ["proposta"] });
      toast({
        title: "Status atualizado",
        description: `A proposta agora está ${status}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Duplicar proposta
  const duplicarProposta = useMutation({
    mutationFn: async (id: string) => {
      // Buscar proposta original com serviços
      const { data: original, error: fetchError } = await supabase
        .from("propostas")
        .select(`*, proposta_servicos(*)`)
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const numeroProposta = await gerarNumeroProposta();

      // Criar nova proposta
      const { id: _, numero_proposta, status, criado_por, aprovado_por, data_aprovacao, motivo_recusa, created_at, updated_at, ...dadosProposta } = original;

      const { data: nova, error: insertError } = await supabase
        .from("propostas")
        .insert({
          ...dadosProposta,
          numero_proposta: numeroProposta,
          status: "rascunho" as const,
          criado_por: user?.id,
          data_emissao: new Date().toISOString().split("T")[0],
          data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Duplicar serviços
      if (original.proposta_servicos?.length) {
        const servicos = original.proposta_servicos.map((s: PropostaServico) => ({
          proposta_id: nova.id,
          servico_id: s.servico_id,
          categoria_id: s.categoria_id,
          servico_nome: s.servico_nome,
          servico_descricao: s.servico_descricao,
          selecionado: s.selecionado,
          valor_unitario: s.valor_unitario,
          quantidade: s.quantidade,
          valor_total: s.valor_total,
          personalizado: s.personalizado,
        }));

        await supabase.from("proposta_servicos").insert(servicos);
      }

      // Registrar no histórico
      await supabase.from("proposta_historico").insert([{
        proposta_id: nova.id,
        usuario_id: user?.id,
        acao: "duplicada",
        descricao: `Duplicada a partir de ${original.numero_proposta}`,
      }]);

      return nova;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast({
        title: "Proposta duplicada",
        description: "Uma cópia da proposta foi criada como rascunho.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao duplicar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excluir proposta
  const excluirProposta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("propostas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
      toast({
        title: "Proposta excluída",
        description: "A proposta foi removida.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gerenciar serviços da proposta
  const adicionarServicos = useMutation({
    mutationFn: async ({
      propostaId,
      servicos,
    }: {
      propostaId: string;
      servicos: Array<{
        servico_id?: string;
        categoria_id?: string;
        servico_nome: string;
        servico_descricao?: string;
        selecionado?: boolean;
        valor_unitario?: number;
        quantidade?: number;
        valor_total?: number;
        personalizado?: boolean;
      }>;
    }) => {
      const servicosComProposta = servicos.map((s) => ({
        ...s,
        proposta_id: propostaId,
      }));

      const { data, error } = await supabase
        .from("proposta_servicos")
        .insert(servicosComProposta)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposta"] });
    },
  });

  const atualizarServicoProposta = useMutation({
    mutationFn: async ({
      id,
      dados,
    }: {
      id: string;
      dados: Partial<PropostaServico>;
    }) => {
      const { data, error } = await supabase
        .from("proposta_servicos")
        .update(dados)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposta"] });
      queryClient.invalidateQueries({ queryKey: ["propostas"] });
    },
  });

  const removerServicoProposta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("proposta_servicos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposta"] });
    },
  });

  // Calcular estatísticas
  const calcularStats = (): PropostaStats => {
    const stats: PropostaStats = {
      total: propostas.length,
      rascunho: 0,
      enviadas: 0,
      em_analise: 0,
      aprovadas: 0,
      recusadas: 0,
      expiradas: 0,
      valorTotal: 0,
      valorAprovado: 0,
    };

    propostas.forEach((p) => {
      stats.valorTotal += Number(p.valor_total) || 0;
      
      switch (p.status) {
        case "rascunho":
          stats.rascunho++;
          break;
        case "enviada":
          stats.enviadas++;
          break;
        case "em_analise":
          stats.em_analise++;
          break;
        case "aprovada":
          stats.aprovadas++;
          stats.valorAprovado += Number(p.valor_total) || 0;
          break;
        case "recusada":
          stats.recusadas++;
          break;
        case "expirada":
          stats.expiradas++;
          break;
      }
    });

    return stats;
  };

  return {
    propostas,
    isLoading,
    error,
    useProposta,
    useHistorico,
    gerarNumeroProposta,
    criarProposta,
    atualizarProposta,
    alterarStatus,
    duplicarProposta,
    excluirProposta,
    adicionarServicos,
    atualizarServicoProposta,
    removerServicoProposta,
    calcularStats,
  };
};
