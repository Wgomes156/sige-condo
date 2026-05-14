import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLogger } from "@/hooks/useAuditLogger";

export type CanalMensageria = "email" | "whatsapp" | "inapp";
export type StatusEntrega = "pendente" | "enviando" | "enviado" | "falhou" | "lido";

export interface MensageriaConfig {
  id: string;
  condominio_id: string;
  canal: CanalMensageria;
  ativo: boolean;
  config_json: Record<string, string>;
  criado_em: string;
  atualizado_em: string;
}

export interface MensageriaEntrega {
  id: string;
  condominio_id: string;
  comunicado_id: string | null;
  evento_tipo: string | null;
  destinatario_id: string | null;
  destinatario_nome: string | null;
  destinatario_email: string | null;
  destinatario_telefone: string | null;
  canal: CanalMensageria;
  assunto: string | null;
  mensagem: string;
  status: StatusEntrega;
  tentativas: number;
  enviado_em: string | null;
  lido_em: string | null;
  criado_em: string;
}

export interface EstatisticasMensageria {
  total: number;
  enviados: number;
  pendentes: number;
  falhos: number;
  lidos: number;
  taxa_entrega: number;
  por_canal: Record<CanalMensageria, number>;
}

export interface DispararMensagemInput {
  condominio_id: string | null;
  canais: CanalMensageria[];
  assunto: string;
  mensagem: string;
  comunicado_id?: string;
}

// ── Estatísticas ───────────────────────────────────────────────────────────

export function useEstatisticasMensageria(condominioId?: string) {
  return useQuery({
    queryKey: ["mensageria-estatisticas", condominioId],
    queryFn: async () => {
      let query = (supabase as any)
        .from("mensageria_entregas")
        .select("status, canal");

      if (condominioId) query = query.eq("condominio_id", condominioId);

      const { data, error } = await query;
      if (error) throw error;

      const entregas: Pick<MensageriaEntrega, "status" | "canal">[] = data || [];
      const total = entregas.length;
      const enviados = entregas.filter((e) => e.status === "enviado").length;
      const lidos = entregas.filter((e) => e.status === "lido").length;
      const pendentes = entregas.filter((e) => ["pendente", "enviando"].includes(e.status)).length;
      const falhos = entregas.filter((e) => e.status === "falhou").length;

      const por_canal = entregas.reduce(
        (acc, e) => {
          acc[e.canal] = (acc[e.canal] || 0) + 1;
          return acc;
        },
        {} as Record<CanalMensageria, number>,
      );

      return {
        total,
        enviados,
        pendentes,
        falhos,
        lidos,
        taxa_entrega: total > 0 ? Math.round(((enviados + lidos) / total) * 100) : 0,
        por_canal,
      } as EstatisticasMensageria;
    },
    refetchInterval: 30_000,
  });
}

// ── Configuração de canais ─────────────────────────────────────────────────

export function useConfiguracaoMensageria(condominioId: string | undefined) {
  return useQuery({
    queryKey: ["mensageria-config", condominioId],
    queryFn: async () => {
      if (!condominioId) return [] as MensageriaConfig[];

      const { data, error } = await (supabase as any)
        .from("mensageria_config")
        .select("*")
        .eq("condominio_id", condominioId);

      if (error) throw error;
      return (data || []) as MensageriaConfig[];
    },
    enabled: !!condominioId,
  });
}

export function useSalvarConfiguracao() {
  const queryClient = useQueryClient();
  const { logUpdate } = useAuditLogger();

  return useMutation({
    mutationFn: async (payload: {
      condominio_id: string;
      canal: CanalMensageria;
      ativo: boolean;
      config_json: Record<string, string>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("mensageria_config")
        .upsert(
          {
            condominio_id: payload.condominio_id,
            canal: payload.canal,
            ativo: payload.ativo,
            config_json: payload.config_json,
            atualizado_em: new Date().toISOString(),
          },
          { onConflict: "condominio_id,canal" },
        )
        .select()
        .single();

      if (error) throw error;
      return data as MensageriaConfig;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mensageria-config"] });
      toast.success("Configuração salva com sucesso!");
      logUpdate("comunicado", data.id, `Canal ${data.canal}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar configuração: ${error.message}`);
    },
  });
}

// ── Disparar mensagem (bulk) ───────────────────────────────────────────────

export function useDispararMensagem() {
  const queryClient = useQueryClient();
  const { logCreate } = useAuditLogger();

  return useMutation({
    mutationFn: async (input: DispararMensagemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar destinatários: unidades com morador cadastrado
      let unidadesQuery = (supabase as any)
        .from("unidades")
        .select("id, morador_nome, morador_email, morador_telefone, morador_id")
        .eq("ativa", true)
        .not("morador_nome", "is", null);

      if (input.condominio_id) {
        unidadesQuery = unidadesQuery.eq("condominio_id", input.condominio_id);
      }

      const { data: unidades, error: unidadesError } = await unidadesQuery;
      if (unidadesError) throw unidadesError;

      if (!unidades || unidades.length === 0) {
        throw new Error("Nenhum destinatário encontrado para os critérios selecionados");
      }

      // Montar registros de entrega para cada canal × destinatário
      const entregas: Record<string, unknown>[] = [];

      for (const unidade of unidades) {
        for (const canal of input.canais) {
          if (canal === "email" && !unidade.morador_email) continue;
          if (canal === "whatsapp" && !unidade.morador_telefone) continue;

          // Buscar condominio_id da unidade se não foi passado
          const condominioId = input.condominio_id;
          if (!condominioId) continue;

          entregas.push({
            condominio_id: condominioId,
            comunicado_id: input.comunicado_id || null,
            evento_tipo: "comunicado",
            destinatario_id: unidade.morador_id || null,
            destinatario_nome: unidade.morador_nome,
            destinatario_email: unidade.morador_email || null,
            destinatario_telefone: unidade.morador_telefone || null,
            canal,
            assunto: input.assunto,
            mensagem: input.mensagem,
            status: "pendente",
            criado_por: user.id,
          });
        }
      }

      if (entregas.length === 0) {
        throw new Error("Nenhum destinatário possui contato cadastrado para os canais selecionados");
      }

      const { data: inserted, error: insertError } = await (supabase as any)
        .from("mensageria_entregas")
        .insert(entregas)
        .select("id");

      if (insertError) throw insertError;

      return { total: entregas.length, ids: (inserted || []).map((r: any) => r.id) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["mensageria-estatisticas"] });
      queryClient.invalidateQueries({ queryKey: ["mensageria-entregas"] });
      toast.success(`${result.total} mensagens enfileiradas para envio!`);
      logCreate("comunicado", undefined, "Disparo mensageria", { total: result.total });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao disparar mensagens: ${error.message}`);
    },
  });
}

// ── Entregas inapp do usuário logado ──────────────────────────────────────

export function useEntregasInApp() {
  return useQuery({
    queryKey: ["mensageria-inapp"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as MensageriaEntrega[];

      const { data, error } = await (supabase as any)
        .from("mensageria_entregas")
        .select("*")
        .eq("canal", "inapp")
        .eq("destinatario_id", user.id)
        .order("criado_em", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as MensageriaEntrega[];
    },
    refetchInterval: 60_000,
  });
}

export function useMarcarLida() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entregaId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const { data, error } = await supabase.functions.invoke("marcar-mensagem-lida", {
        body: { entrega_id: entregaId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mensageria-inapp"] });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao marcar mensagem: ${error.message}`);
    },
  });
}

// ── Listagem de entregas (admin) ───────────────────────────────────────────

export function useMensageriaEntregas(filtros?: {
  condominioId?: string;
  status?: StatusEntrega;
  canal?: CanalMensageria;
}) {
  return useQuery({
    queryKey: ["mensageria-entregas", filtros],
    queryFn: async () => {
      let query = (supabase as any)
        .from("mensageria_entregas")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);

      if (filtros?.condominioId) query = query.eq("condominio_id", filtros.condominioId);
      if (filtros?.status) query = query.eq("status", filtros.status);
      if (filtros?.canal) query = query.eq("canal", filtros.canal);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MensageriaEntrega[];
    },
  });
}
