import { supabase } from "@/integrations/supabase/client";

type Canal = "email" | "whatsapp" | "inapp";

interface ConfigCanal {
  canal: Canal;
  ativo: boolean;
}

interface EntregaInsert {
  condominio_id: string;
  evento_tipo: string;
  destinatario_id: string | null;
  destinatario_nome: string;
  destinatario_email: string | null;
  destinatario_telefone: string | null;
  canal: Canal;
  assunto: string;
  mensagem: string;
  status: "pendente";
  criado_por: string | null;
}

async function obterCanaisAtivos(condominioId: string): Promise<Canal[]> {
  const { data } = await (supabase as any)
    .from("mensageria_config")
    .select("canal, ativo")
    .eq("condominio_id", condominioId)
    .eq("ativo", true);

  if (!data || data.length === 0) {
    // Se não há config cadastrada, usa inapp como fallback
    return ["inapp"];
  }

  return (data as ConfigCanal[]).map((c) => c.canal);
}

async function inserirEntregas(entregas: EntregaInsert[]): Promise<void> {
  if (entregas.length === 0) return;

  const { error } = await (supabase as any)
    .from("mensageria_entregas")
    .insert(entregas);

  if (error) {
    console.error("[mensageriaEventos] Erro ao inserir entregas:", error);
    throw new Error(`Falha ao enfileirar notificações: ${error.message}`);
  }
}

async function dispararFila(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? Deno?.env?.get?.("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    await supabase.functions.invoke("processar-fila-mensageria", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch (err) {
    // Não propagar erro do disparo — as entregas já foram inseridas e serão
    // processadas no próximo ciclo do cron.
    console.warn("[mensageriaEventos] Aviso ao disparar fila:", err);
  }
}

async function obterUsuarioAtual(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Notificação: Encomenda chegou ─────────────────────────────────────────────

export interface NotificarEncomendaParams {
  condominio_id: string;
  morador_id: string;
  morador_nome: string;
  morador_email: string;
  morador_telefone?: string;
  unidade: string;
  descricao: string;
}

export async function notificarEncomendaChegou(params: NotificarEncomendaParams): Promise<void> {
  const {
    condominio_id,
    morador_id,
    morador_nome,
    morador_email,
    morador_telefone,
    unidade,
    descricao,
  } = params;

  const assunto = `Encomenda disponível para retirada — Unidade ${unidade}`;
  const mensagem =
    `Olá, ${morador_nome}!\n\n` +
    `Uma encomenda chegou para a sua unidade (${unidade}) e está disponível para retirada na portaria.\n\n` +
    `Descrição: ${descricao}\n\n` +
    `Por favor, retire o mais breve possível. Em caso de dúvidas, entre em contato com a administração.`;

  const canais = await obterCanaisAtivos(condominio_id);
  const criadoPor = await obterUsuarioAtual();

  const entregas: EntregaInsert[] = canais
    .filter((canal) => {
      if (canal === "email" && !morador_email) return false;
      if (canal === "whatsapp" && !morador_telefone) return false;
      return true;
    })
    .map((canal) => ({
      condominio_id,
      evento_tipo: "encomenda_chegou",
      destinatario_id: morador_id,
      destinatario_nome: morador_nome,
      destinatario_email: morador_email || null,
      destinatario_telefone: morador_telefone || null,
      canal,
      assunto,
      mensagem,
      status: "pendente" as const,
      criado_por: criadoPor,
    }));

  await inserirEntregas(entregas);
  await dispararFila();
}

// ── Notificação: Boleto vencendo ──────────────────────────────────────────────

export interface NotificarBoletoVencendoParams {
  condominio_id: string;
  morador_id: string;
  morador_nome: string;
  morador_email: string;
  morador_telefone?: string;
  valor: number;
  vencimento: string;
  dias: number;
}

export async function notificarBoletoVencendo(params: NotificarBoletoVencendoParams): Promise<void> {
  const {
    condominio_id,
    morador_id,
    morador_nome,
    morador_email,
    morador_telefone,
    valor,
    vencimento,
    dias,
  } = params;

  const valorFormatado = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataFormatada = new Date(vencimento + "T12:00:00").toLocaleDateString("pt-BR");

  const diasTexto =
    dias === 0
      ? "vence hoje"
      : dias === 1
      ? "vence amanhã"
      : `vence em ${dias} dias`;

  const assunto = `Lembrete: boleto ${diasTexto} — ${valorFormatado}`;
  const mensagem =
    `Olá, ${morador_nome}!\n\n` +
    `Este é um lembrete sobre o seu boleto condominial:\n\n` +
    `• Valor: ${valorFormatado}\n` +
    `• Vencimento: ${dataFormatada} (${diasTexto})\n\n` +
    `Efetue o pagamento até a data de vencimento para evitar multas e juros.\n\n` +
    `Caso já tenha pago, desconsidere este aviso.`;

  const canais = await obterCanaisAtivos(condominio_id);
  const criadoPor = await obterUsuarioAtual();

  const entregas: EntregaInsert[] = canais
    .filter((canal) => {
      if (canal === "email" && !morador_email) return false;
      if (canal === "whatsapp" && !morador_telefone) return false;
      return true;
    })
    .map((canal) => ({
      condominio_id,
      evento_tipo: "boleto_vencendo",
      destinatario_id: morador_id,
      destinatario_nome: morador_nome,
      destinatario_email: morador_email || null,
      destinatario_telefone: morador_telefone || null,
      canal,
      assunto,
      mensagem,
      status: "pendente" as const,
      criado_por: criadoPor,
    }));

  await inserirEntregas(entregas);
  await dispararFila();
}

// ── Notificação: OS atualizada ────────────────────────────────────────────────

export interface NotificarOSAtualizadaParams {
  condominio_id: string;
  solicitante_id: string;
  solicitante_nome: string;
  solicitante_email: string;
  solicitante_telefone?: string;
  numero_os: string;
  novo_status: string;
}

const STATUS_LABELS: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  aguardando: "Aguardando",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export async function notificarOSAtualizada(params: NotificarOSAtualizadaParams): Promise<void> {
  const {
    condominio_id,
    solicitante_id,
    solicitante_nome,
    solicitante_email,
    solicitante_telefone,
    numero_os,
    novo_status,
  } = params;

  const statusLabel = STATUS_LABELS[novo_status] ?? novo_status;
  const assunto = `Ordem de Serviço #${numero_os} — Status atualizado: ${statusLabel}`;
  const mensagem =
    `Olá, ${solicitante_nome}!\n\n` +
    `A sua Ordem de Serviço foi atualizada:\n\n` +
    `• Número: #${numero_os}\n` +
    `• Novo status: ${statusLabel}\n\n` +
    `Para acompanhar os detalhes, acesse o portal do condomínio ou entre em contato com a administração.`;

  const canais = await obterCanaisAtivos(condominio_id);
  const criadoPor = await obterUsuarioAtual();

  const entregas: EntregaInsert[] = canais
    .filter((canal) => {
      if (canal === "email" && !solicitante_email) return false;
      if (canal === "whatsapp" && !solicitante_telefone) return false;
      return true;
    })
    .map((canal) => ({
      condominio_id,
      evento_tipo: "os_atualizada",
      destinatario_id: solicitante_id,
      destinatario_nome: solicitante_nome,
      destinatario_email: solicitante_email || null,
      destinatario_telefone: solicitante_telefone || null,
      canal,
      assunto,
      mensagem,
      status: "pendente" as const,
      criado_por: criadoPor,
    }));

  await inserirEntregas(entregas);
  await dispararFila();
}
