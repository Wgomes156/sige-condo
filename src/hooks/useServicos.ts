import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CategoriaServico {
  id: string;
  nome_categoria: string;
  descricao: string | null;
  icone: string | null;
  cor: string | null;
  ordem_exibicao: number | null;
  ativo: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Servico {
  id: string;
  categoria_id: string | null;
  nome_servico: string;
  descricao: string | null;
  valor: string;
  tipo_valor: "fixo" | "percentual" | "variavel" | null;
  observacoes: string | null;
  ativo: boolean | null;
  criado_por: string | null;
  created_at: string | null;
  updated_at: string | null;
  categoria?: CategoriaServico;
}

export interface ServicoHistorico {
  id: string;
  servico_id: string | null;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  alterado_por: string | null;
  created_at: string | null;
}

export function useServicos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar categorias
  const { data: categorias = [], isLoading: loadingCategorias } = useQuery({
    queryKey: ["categorias-servico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_servico")
        .select("*")
        .eq("ativo", true)
        .order("ordem_exibicao", { ascending: true });

      if (error) throw error;
      return data as CategoriaServico[];
    },
  });

  // Buscar serviços
  const { data: servicos = [], isLoading: loadingServicos } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicos")
        .select(`
          *,
          categoria:categorias_servico(*)
        `)
        .order("nome_servico", { ascending: true });

      if (error) throw error;
      return data as Servico[];
    },
  });

  // Criar serviço
  const criarServico = useMutation({
    mutationFn: async (servico: Omit<Servico, "id" | "created_at" | "updated_at" | "categoria">) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("servicos")
        .insert({
          ...servico,
          criado_por: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast({
        title: "Serviço criado",
        description: "O serviço foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar serviço
  const atualizarServico = useMutation({
    mutationFn: async ({ id, ...servico }: Partial<Servico> & { id: string }) => {
      // Buscar valores anteriores para histórico
      const { data: servicoAnterior } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("servicos")
        .update(servico)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Registrar histórico de alterações
      const { data: userData } = await supabase.auth.getUser();
      const campos = Object.keys(servico) as (keyof typeof servico)[];
      
      for (const campo of campos) {
        if (servicoAnterior && servicoAnterior[campo] !== servico[campo]) {
          await supabase.from("servicos_historico").insert({
            servico_id: id,
            campo_alterado: campo,
            valor_anterior: String(servicoAnterior[campo] ?? ""),
            valor_novo: String(servico[campo] ?? ""),
            alterado_por: userData.user?.id,
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast({
        title: "Serviço atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excluir serviço
  const excluirServico = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("servicos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Criar categoria
  const criarCategoria = useMutation({
    mutationFn: async (categoria: Omit<CategoriaServico, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("categorias_servico")
        .insert(categoria)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-servico"] });
      toast({
        title: "Categoria criada",
        description: "A categoria foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Buscar histórico de um serviço
  const buscarHistorico = async (servicoId: string) => {
    const { data, error } = await supabase
      .from("servicos_historico")
      .select("*")
      .eq("servico_id", servicoId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as ServicoHistorico[];
  };

  // Agrupar serviços por categoria
  const servicosPorCategoria = categorias.map((categoria) => ({
    ...categoria,
    servicos: servicos.filter((s) => s.categoria_id === categoria.id),
  }));

  // Estatísticas
  const stats = {
    totalServicos: servicos.length,
    servicosAtivos: servicos.filter((s) => s.ativo).length,
    totalCategorias: categorias.length,
    servicosPorTipo: {
      fixo: servicos.filter((s) => s.tipo_valor === "fixo").length,
      percentual: servicos.filter((s) => s.tipo_valor === "percentual").length,
      variavel: servicos.filter((s) => s.tipo_valor === "variavel").length,
    },
  };

  return {
    categorias,
    servicos,
    servicosPorCategoria,
    stats,
    loading: loadingCategorias || loadingServicos,
    criarServico,
    atualizarServico,
    excluirServico,
    criarCategoria,
    buscarHistorico,
  };
}
