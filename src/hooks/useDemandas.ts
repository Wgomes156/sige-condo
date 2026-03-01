import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CategoriaDemanda {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  ordem: number;
}

export interface TemplateDemanda {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string | null;
  periodicidade: string;
  periodicidade_meses: number | null;
  obrigatorio: boolean;
  base_legal: string | null;
  documentos_necessarios: string[];
  alertar_antecedencia_dias: number;
  permite_prorrogacao: boolean;
  condicional: boolean;
  condicao_campo: string | null;
  condicao_valor: string | null;
  custo_estimado: number;
  ativo: boolean;
  categoria?: CategoriaDemanda;
}

export interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  contato_nome: string | null;
  observacoes: string | null;
  avaliacao: number;
  ativo: boolean;
}

export interface DemandaCondominio {
  id: string;
  condominio_id: string;
  template_id: string | null;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  periodicidade: string;
  periodicidade_meses: number | null;
  obrigatorio: boolean;
  base_legal: string | null;
  documentos_necessarios: string[];
  alertar_antecedencia_dias: number;
  permite_prorrogacao: boolean;
  custo_estimado: number;
  fornecedor_id: string | null;
  ultima_execucao: string | null;
  proxima_execucao: string | null;
  status: string;
  ativo: boolean;
  observacoes: string | null;
  criado_por: string | null;
  created_at: string;
  updated_at: string;
  categoria?: CategoriaDemanda;
  fornecedor?: Fornecedor;
}

export interface ExecucaoDemanda {
  id: string;
  demanda_id: string;
  data_execucao: string;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  custo: number;
  observacoes: string | null;
  documentos_anexados: string[];
  executado_por: string | null;
  created_at: string;
}

export interface ConfiguracaoDemanda {
  id: string;
  condominio_id: string;
  alertas_email: boolean;
  alertas_push: boolean;
  alertas_inapp: boolean;
  frequencia_urgente: string;
  frequencia_atencao: string;
  frequencia_informativo: string;
  notificar_sindico: boolean;
  notificar_conselho: boolean;
  notificar_administradora: boolean;
  calcular_proxima_automatico: boolean;
  ativar_servicos_condicionais: boolean;
  exigir_aprovacao: boolean;
  valor_aprovacao: number;
  exigir_documentos: boolean;
  bloquear_sem_documentos: boolean;
}

// Categorias
export function useCategoriasDemanda() {
  return useQuery({
    queryKey: ["categorias-demanda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_demanda")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return data as CategoriaDemanda[];
    },
  });
}

// Templates
export function useTemplatesDemanda() {
  return useQuery({
    queryKey: ["templates-demanda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates_demanda")
        .select(`*, categoria:categorias_demanda(*)`)
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as TemplateDemanda[];
    },
  });
}

// Fornecedores
export function useFornecedores() {
  return useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as Fornecedor[];
    },
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fornecedor: Omit<Fornecedor, "id" | "ativo" | "avaliacao">) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .insert(fornecedor)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor cadastrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar fornecedor");
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fornecedor }: Partial<Fornecedor> & { id: string }) => {
      const { data, error } = await supabase
        .from("fornecedores")
        .update(fornecedor)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Fornecedor atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar fornecedor");
    },
  });
}

// Demandas por Condomínio
export function useDemandasCondominio(condominioId: string | null) {
  return useQuery({
    queryKey: ["demandas-condominio", condominioId],
    queryFn: async () => {
      if (!condominioId) return [];
      const { data, error } = await supabase
        .from("demandas_condominio")
        .select(`*, categoria:categorias_demanda(*), fornecedor:fornecedores(*)`)
        .eq("condominio_id", condominioId)
        .eq("ativo", true)
        .order("proxima_execucao", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as DemandaCondominio[];
    },
    enabled: !!condominioId,
  });
}

export function useDemandaDetalhes(demandaId: string | null) {
  return useQuery({
    queryKey: ["demanda-detalhes", demandaId],
    queryFn: async () => {
      if (!demandaId) return null;
      const { data, error } = await supabase
        .from("demandas_condominio")
        .select(`*, categoria:categorias_demanda(*), fornecedor:fornecedores(*)`)
        .eq("id", demandaId)
        .single();
      if (error) throw error;
      return data as DemandaCondominio;
    },
    enabled: !!demandaId,
  });
}

export function useCreateDemanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (demanda: Omit<DemandaCondominio, "id" | "created_at" | "updated_at" | "categoria" | "fornecedor">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("demandas_condominio")
        .insert({ ...demanda, criado_por: userData.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["demandas-condominio", variables.condominio_id] });
      queryClient.invalidateQueries({ queryKey: ["demandas-dashboard"] });
      toast.success("Demanda criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar demanda");
    },
  });
}

export function useUpdateDemanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...demanda }: Partial<DemandaCondominio> & { id: string }) => {
      const { data, error } = await supabase
        .from("demandas_condominio")
        .update(demanda)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandas-condominio"] });
      queryClient.invalidateQueries({ queryKey: ["demandas-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["demanda-detalhes"] });
      toast.success("Demanda atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar demanda");
    },
  });
}

export function useDeleteDemanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("demandas_condominio")
        .update({ ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandas-condominio"] });
      queryClient.invalidateQueries({ queryKey: ["demandas-dashboard"] });
      toast.success("Demanda removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover demanda");
    },
  });
}

// Importar demandas de templates para um condomínio
export function useImportarTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ condominioId, templateIds }: { condominioId: string; templateIds: string[] }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data: templates, error: fetchError } = await supabase
        .from("templates_demanda")
        .select("*")
        .in("id", templateIds);
      
      if (fetchError) throw fetchError;
      if (!templates || templates.length === 0) throw new Error("Nenhum template encontrado");

      const demandas = templates.map((t) => ({
        condominio_id: condominioId,
        template_id: t.id,
        categoria_id: t.categoria_id,
        nome: t.nome,
        descricao: t.descricao,
        periodicidade: t.periodicidade,
        periodicidade_meses: t.periodicidade_meses,
        obrigatorio: t.obrigatorio,
        base_legal: t.base_legal,
        documentos_necessarios: t.documentos_necessarios,
        alertar_antecedencia_dias: t.alertar_antecedencia_dias,
        permite_prorrogacao: t.permite_prorrogacao,
        custo_estimado: t.custo_estimado,
        status: t.periodicidade === 'sob_demanda' ? 'sob_demanda' : 'em_dia',
        criado_por: userData.user?.id,
      }));

      const { error } = await supabase.from("demandas_condominio").insert(demandas);
      if (error) throw error;
      
      return { count: demandas.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["demandas-condominio", variables.condominioId] });
      queryClient.invalidateQueries({ queryKey: ["demandas-dashboard"] });
      toast.success(`${data.count} demandas importadas com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao importar templates");
    },
  });
}

// Execuções
export function useExecucoesDemanda(demandaId: string | null) {
  return useQuery({
    queryKey: ["execucoes-demanda", demandaId],
    queryFn: async () => {
      if (!demandaId) return [];
      const { data, error } = await supabase
        .from("execucoes_demanda")
        .select("*")
        .eq("demanda_id", demandaId)
        .order("data_execucao", { ascending: false });
      if (error) throw error;
      return data as ExecucaoDemanda[];
    },
    enabled: !!demandaId,
  });
}

export function useRegistrarExecucao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      demandaId,
      execucao,
      calcularProxima,
    }: {
      demandaId: string;
      execucao: Omit<ExecucaoDemanda, "id" | "created_at" | "demanda_id">;
      calcularProxima: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // Inserir execução
      const { error: execError } = await supabase.from("execucoes_demanda").insert({
        demanda_id: demandaId,
        ...execucao,
        executado_por: userData.user?.id,
      });
      if (execError) throw execError;

      // Atualizar demanda
      const updateData: Record<string, unknown> = {
        ultima_execucao: execucao.data_execucao,
      };

      if (calcularProxima) {
        // Buscar demanda para calcular próxima execução
        const { data: demanda } = await supabase
          .from("demandas_condominio")
          .select("periodicidade_meses")
          .eq("id", demandaId)
          .single();
        
        if (demanda?.periodicidade_meses) {
          const dataExec = new Date(execucao.data_execucao);
          dataExec.setMonth(dataExec.getMonth() + demanda.periodicidade_meses);
          updateData.proxima_execucao = dataExec.toISOString().split("T")[0];
          updateData.status = "em_dia";
        }
      }

      const { error: updateError } = await supabase
        .from("demandas_condominio")
        .update(updateData)
        .eq("id", demandaId);
      
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demandas-condominio"] });
      queryClient.invalidateQueries({ queryKey: ["demandas-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["demanda-detalhes"] });
      queryClient.invalidateQueries({ queryKey: ["execucoes-demanda"] });
      toast.success("Execução registrada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar execução");
    },
  });
}

// Dashboard Stats
export function useDemandasDashboard(condominioId: string | null) {
  return useQuery({
    queryKey: ["demandas-dashboard", condominioId],
    queryFn: async () => {
      if (!condominioId) {
        // Buscar todas as demandas (para admin)
        const { data, error } = await supabase
          .from("demandas_condominio")
          .select("id, status, proxima_execucao, categoria_id")
          .eq("ativo", true);
        if (error) throw error;
        return calcularStats(data);
      }
      
      const { data, error } = await supabase
        .from("demandas_condominio")
        .select("id, status, proxima_execucao, categoria_id")
        .eq("condominio_id", condominioId)
        .eq("ativo", true);
      if (error) throw error;
      return calcularStats(data);
    },
  });
}

function calcularStats(demandas: { id: string; status: string; proxima_execucao: string | null; categoria_id: string | null }[] | null) {
  if (!demandas) return { total: 0, urgentes: 0, atencao: 0, emDia: 0, vencidas: 0, sobDemanda: 0 };
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  let urgentes = 0;
  let atencao = 0;
  let emDia = 0;
  let vencidas = 0;
  let sobDemanda = 0;

  demandas.forEach((d) => {
    if (!d.proxima_execucao || d.status === "sob_demanda") {
      sobDemanda++;
      return;
    }
    
    const proxima = new Date(d.proxima_execucao);
    const dias = Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dias < 0) vencidas++;
    else if (dias <= 7) urgentes++;
    else if (dias <= 30) atencao++;
    else emDia++;
  });

  return {
    total: demandas.length,
    urgentes,
    atencao,
    emDia,
    vencidas,
    sobDemanda,
  };
}

// Configurações
export function useConfiguracaoDemanda(condominioId: string | null) {
  return useQuery({
    queryKey: ["configuracao-demanda", condominioId],
    queryFn: async () => {
      if (!condominioId) return null;
      const { data, error } = await supabase
        .from("configuracoes_demanda")
        .select("*")
        .eq("condominio_id", condominioId)
        .maybeSingle();
      if (error) throw error;
      return data as ConfiguracaoDemanda | null;
    },
    enabled: !!condominioId,
  });
}

export function useSaveConfiguracaoDemanda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Omit<ConfiguracaoDemanda, "id">) => {
      const { data: existing } = await supabase
        .from("configuracoes_demanda")
        .select("id")
        .eq("condominio_id", config.condominio_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("configuracoes_demanda")
          .update(config)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("configuracoes_demanda")
          .insert(config);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["configuracao-demanda", variables.condominio_id] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });
}

// Utilitários
export function getStatusInfo(status: string) {
  switch (status) {
    case "vencido":
      return { label: "Vencido", color: "bg-gray-900 text-white", icon: "⚫" };
    case "urgente":
      return { label: "Urgente", color: "bg-red-500 text-white", icon: "🔴" };
    case "atencao":
      return { label: "Atenção", color: "bg-yellow-500 text-white", icon: "🟡" };
    case "em_dia":
      return { label: "Em dia", color: "bg-green-500 text-white", icon: "🟢" };
    case "sob_demanda":
      return { label: "Sob demanda", color: "bg-gray-400 text-white", icon: "⚪" };
    default:
      return { label: status, color: "bg-gray-500 text-white", icon: "⚪" };
  }
}

export function getPeriodicidadeLabel(periodicidade: string) {
  const labels: Record<string, string> = {
    mensal: "Mensal",
    trimestral: "Trimestral",
    semestral: "Semestral",
    anual: "Anual",
    bienal: "Bienal",
    sob_demanda: "Sob demanda",
    personalizada: "Personalizada",
  };
  return labels[periodicidade] || periodicidade;
}

export function calcularDiasRestantes(proximaExecucao: string | null): number | null {
  if (!proximaExecucao) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const proxima = new Date(proximaExecucao);
  return Math.ceil((proxima.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}
