import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Retry delays in seconds: 5min, 30min, 2h
const RETRY_DELAYS = [5 * 60, 30 * 60, 2 * 60 * 60];

interface Entrega {
  id: string;
  condominio_id: string;
  comunicado_id: string | null;
  destinatario_id: string | null;
  destinatario_nome: string | null;
  destinatario_email: string | null;
  destinatario_telefone: string | null;
  canal: "email" | "whatsapp" | "inapp";
  assunto: string | null;
  mensagem: string;
  status: string;
  tentativas: number;
}

interface MensageriaConfig {
  canal: string;
  ativo: boolean;
  config_json: Record<string, string>;
}

async function enviarEmail(
  resend: Resend,
  entrega: Entrega,
): Promise<{ ok: boolean; response: unknown }> {
  if (!entrega.destinatario_email) {
    throw new Error("E-mail do destinatário não informado");
  }

  const result = await resend.emails.send({
    from: "CondoPlus <onboarding@resend.dev>",
    to: [entrega.destinatario_email],
    subject: entrega.assunto || "Notificação do Condomínio",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: hsl(210,60%,22%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #1f2937; color: #9ca3af; padding: 16px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h2>${entrega.assunto || "Notificação"}</h2></div>
          <div class="content">
            <p>Olá${entrega.destinatario_nome ? `, <strong>${entrega.destinatario_nome}</strong>` : ""},</p>
            <div style="white-space:pre-wrap;">${entrega.mensagem}</div>
          </div>
          <div class="footer">Este é um e-mail automático do sistema CondoPlus.</div>
        </div>
      </body>
      </html>
    `,
  });

  return { ok: true, response: result };
}

async function enviarWhatsapp(
  config: MensageriaConfig,
  entrega: Entrega,
): Promise<{ ok: boolean; response: unknown }> {
  const { api_url, api_key, instance } = config.config_json;

  if (!api_url) throw new Error("config_json.api_url não configurado para WhatsApp");
  if (!entrega.destinatario_telefone) throw new Error("Telefone do destinatário não informado");

  const phone = entrega.destinatario_telefone.replace(/\D/g, "");
  const body: Record<string, unknown> = {
    number: phone,
    text: entrega.mensagem,
  };

  if (instance) body.instance = instance;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (api_key) headers["apikey"] = api_key;

  const url = `${api_url.replace(/\/$/, "")}/message/sendText${instance ? `/${instance}` : ""}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const responseData = await res.json().catch(() => ({ status: res.status }));

  if (!res.ok) {
    throw new Error(`WhatsApp API retornou ${res.status}: ${JSON.stringify(responseData)}`);
  }

  return { ok: true, response: responseData };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Auth: aceita token de usuário ou service role (chamadas internas)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;

    if (!isServiceRole) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!roleData || !["admin", "sindico", "gerente"].includes(roleData.role)) {
        return new Response(
          JSON.stringify({ error: "Permissão insuficiente" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const body = await req.json();
    const { entrega_id } = body;

    if (!entrega_id || typeof entrega_id !== "string") {
      return new Response(
        JSON.stringify({ error: "entrega_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Buscar entrega
    const { data: entrega, error: entregaError } = await supabase
      .from("mensageria_entregas")
      .select("*")
      .eq("id", entrega_id)
      .single();

    if (entregaError || !entrega) {
      return new Response(
        JSON.stringify({ error: "Entrega não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!["pendente", "falhou", "enviando"].includes(entrega.status)) {
      return new Response(
        JSON.stringify({ error: `Entrega com status '${entrega.status}' não pode ser reenviada` }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Marcar como enviando
    await supabase
      .from("mensageria_entregas")
      .update({ status: "enviando" })
      .eq("id", entrega_id);

    // Buscar config do canal para o condomínio
    const { data: config } = await supabase
      .from("mensageria_config")
      .select("*")
      .eq("condominio_id", entrega.condominio_id)
      .eq("canal", entrega.canal)
      .single();

    const novaTentativa = (entrega.tentativas ?? 0) + 1;
    let sucesso = false;
    let erroMsg: string | null = null;
    let providerResponse: unknown = null;
    let providerRequest: unknown = null;

    try {
      if (entrega.canal === "inapp") {
        // inapp: apenas marca como enviado
        sucesso = true;
        providerResponse = { canal: "inapp", message: "Notificação registrada" };
      } else if (entrega.canal === "email") {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        if (!resendApiKey) throw new Error("RESEND_API_KEY não configurada");
        const resend = new Resend(resendApiKey);
        const result = await enviarEmail(resend, entrega as Entrega);
        sucesso = result.ok;
        providerResponse = result.response;
        providerRequest = { to: entrega.destinatario_email, subject: entrega.assunto };
      } else if (entrega.canal === "whatsapp") {
        if (!config || !config.ativo) throw new Error("Canal WhatsApp não configurado ou inativo");
        providerRequest = { phone: entrega.destinatario_telefone };
        const result = await enviarWhatsapp(config as MensageriaConfig, entrega as Entrega);
        sucesso = result.ok;
        providerResponse = result.response;
      }
    } catch (err) {
      erroMsg = err instanceof Error ? err.message : String(err);
      sucesso = false;
    }

    // Calcular próximo retry se falhou
    let proximoRetry: string | null = null;
    let novoStatus: string;

    if (sucesso) {
      novoStatus = "enviado";
    } else if (novaTentativa < RETRY_DELAYS.length) {
      novoStatus = "falhou";
      const delaySec = RETRY_DELAYS[novaTentativa - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
      proximoRetry = new Date(Date.now() + delaySec * 1000).toISOString();
    } else {
      novoStatus = "falhou";
      proximoRetry = null; // esgotou retries
    }

    // Registrar log da tentativa
    await supabase.from("mensageria_logs").insert({
      entrega_id,
      tentativa: novaTentativa,
      status: novoStatus,
      provider_request: providerRequest,
      provider_response: providerResponse,
      erro: erroMsg,
    });

    // Atualizar entrega
    const updatePayload: Record<string, unknown> = {
      status: novoStatus,
      tentativas: novaTentativa,
      provider_response: providerResponse,
      proximo_retry: proximoRetry,
    };

    if (sucesso) {
      updatePayload.enviado_em = new Date().toISOString();
    }

    await supabase
      .from("mensageria_entregas")
      .update(updatePayload)
      .eq("id", entrega_id);

    return new Response(
      JSON.stringify({
        success: sucesso,
        entrega_id,
        status: novoStatus,
        tentativa: novaTentativa,
        proximo_retry: proximoRetry,
        erro: erroMsg,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em enviar-mensagem:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
