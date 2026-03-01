import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for input validation
const EmailCobrancaRequestSchema = z.object({
  boleto_id: z.string().uuid("boleto_id must be a valid UUID").optional(),
  boleto_ids: z.array(z.string().uuid("Each boleto_id must be a valid UUID"))
    .max(1000, "Maximum 1000 boletos per request")
    .optional(),
  tipo: z.enum(["cobranca", "lembrete", "inadimplencia"]).default("cobranca"),
}).refine(
  (data) => data.boleto_id || (data.boleto_ids && data.boleto_ids.length > 0),
  { message: "Either boleto_id or boleto_ids must be provided" }
);

type EmailCobrancaRequest = z.infer<typeof EmailCobrancaRequestSchema>;

interface Boleto {
  id: string;
  condominio_id: string;
  unidade: string;
  morador_nome: string | null;
  morador_email: string | null;
  valor: number;
  data_vencimento: string;
  referencia: string;
  status: string;
  condominios?: { nome: string };
}

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

const formatarData = (data: string): string => {
  return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
};

const gerarEmailCobranca = (boleto: Boleto, tipo: string): { subject: string; html: string } => {
  const condominioNome = boleto.condominios?.nome || "Condomínio";
  const moradorNome = boleto.morador_nome || "Morador";
  const valorFormatado = formatarMoeda(boleto.valor);
  const dataVencimento = formatarData(boleto.data_vencimento);

  if (tipo === "inadimplencia") {
    return {
      subject: `⚠️ Aviso de Inadimplência - ${condominioNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .highlight { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Aviso de Inadimplência</h1>
            </div>
            <div class="content">
              <p>Prezado(a) <strong>${moradorNome}</strong>,</p>
              
              <p>Identificamos que existe uma pendência financeira em seu cadastro referente ao ${condominioNome}.</p>
              
              <div class="highlight">
                <p><strong>Detalhes da Cobrança:</strong></p>
                <p>📍 Unidade: ${boleto.unidade}</p>
                <p>📅 Referência: ${boleto.referencia}</p>
                <p>📆 Vencimento: ${dataVencimento}</p>
                <p>💰 Valor: <strong>${valorFormatado}</strong></p>
              </div>
              
              <p>Solicitamos a regularização do débito o mais breve possível para evitar a aplicação de multas e juros, bem como eventuais medidas administrativas.</p>
              
              <p>Caso já tenha efetuado o pagamento, por favor desconsidere este aviso.</p>
              
              <p>Atenciosamente,<br><strong>Administração do ${condominioNome}</strong></p>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático. Em caso de dúvidas, entre em contato com a administração.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (tipo === "lembrete") {
    return {
      subject: `🔔 Lembrete de Vencimento - ${condominioNome}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .highlight { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Lembrete de Vencimento</h1>
            </div>
            <div class="content">
              <p>Prezado(a) <strong>${moradorNome}</strong>,</p>
              
              <p>Este é um lembrete amigável sobre o vencimento próximo da sua taxa condominial.</p>
              
              <div class="highlight">
                <p><strong>Detalhes:</strong></p>
                <p>📍 Condomínio: ${condominioNome}</p>
                <p>🏠 Unidade: ${boleto.unidade}</p>
                <p>📅 Referência: ${boleto.referencia}</p>
                <p>📆 Vencimento: ${dataVencimento}</p>
                <p>💰 Valor: <strong>${valorFormatado}</strong></p>
              </div>
              
              <p>Evite multas e juros efetuando o pagamento até a data de vencimento.</p>
              
              <p>Atenciosamente,<br><strong>Administração do ${condominioNome}</strong></p>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático. Em caso de dúvidas, entre em contato com a administração.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  // Default: cobranca
  return {
    subject: `📄 Boleto de Cobrança - ${condominioNome} - ${boleto.referencia}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .highlight { background: #eff6ff; border-left: 4px solid #1e3a5f; padding: 15px; margin: 20px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Boleto de Cobrança</h1>
          </div>
          <div class="content">
            <p>Prezado(a) <strong>${moradorNome}</strong>,</p>
            
            <p>Segue abaixo as informações do seu boleto de taxa condominial.</p>
            
            <div class="highlight">
              <p><strong>Detalhes da Cobrança:</strong></p>
              <p>📍 Condomínio: ${condominioNome}</p>
              <p>🏠 Unidade: ${boleto.unidade}</p>
              <p>📅 Referência: ${boleto.referencia}</p>
              <p>📆 Vencimento: ${dataVencimento}</p>
              <p>💰 Valor: <strong>${valorFormatado}</strong></p>
            </div>
            
            <p>Por favor, efetue o pagamento até a data de vencimento para evitar multas e juros.</p>
            
            <p>Atenciosamente,<br><strong>Administração do ${condominioNome}</strong></p>
          </div>
          <div class="footer">
            <p>Este é um e-mail automático. Em caso de dúvidas, entre em contato com a administração.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const resend = new Resend(resendApiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check user role - only admin and gerente can send billing emails
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData || !["admin", "gerente"].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Only admin and gerente can send billing emails." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body with Zod
    let validatedBody: EmailCobrancaRequest;
    try {
      const rawBody = await req.json();
      validatedBody = EmailCobrancaRequestSchema.parse(rawBody);
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ 
            error: "Invalid request data", 
            details: parseError.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { boleto_id, boleto_ids, tipo } = validatedBody;

    // Determine which boletos to process
    const idsToProcess: string[] = [];
    if (boleto_id) {
      idsToProcess.push(boleto_id);
    }
    if (boleto_ids && boleto_ids.length > 0) {
      idsToProcess.push(...boleto_ids);
    }

    // If gerente, validate they have access to the condominiums of the boletos
    if (roleData.role === "gerente") {
      const { data: boletos } = await supabase
        .from("boletos")
        .select("condominio_id")
        .in("id", idsToProcess);

      if (boletos && boletos.length > 0) {
        const { data: userAccess } = await supabase
          .from("user_condominio_access")
          .select("condominio_id")
          .eq("user_id", user.id);

        const accessibleCondoIds = new Set(userAccess?.map(a => a.condominio_id) || []);
        const unauthorizedBoletos = boletos.filter(b => !accessibleCondoIds.has(b.condominio_id));

        if (unauthorizedBoletos.length > 0) {
          return new Response(
            JSON.stringify({ error: "Some boletos belong to condominiums you don't have access to" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    console.log(`User ${user.id} (${roleData.role}) processando ${idsToProcess.length} boleto(s) para envio de e-mail (tipo: ${tipo})`);

    // Fetch boletos with condominio info
    const { data: boletos, error: boletosError } = await supabase
      .from("boletos")
      .select(`
        *,
        condominios(nome)
      `)
      .in("id", idsToProcess);

    if (boletosError) {
      console.error("Erro ao buscar boletos:", boletosError);
      throw new Error(`Erro ao buscar boletos: ${boletosError.message}`);
    }

    if (!boletos || boletos.length === 0) {
      throw new Error("Nenhum boleto encontrado com os IDs fornecidos");
    }

    const resultados: Array<{
      boleto_id: string;
      unidade: string;
      email: string | null;
      sucesso: boolean;
      erro?: string;
    }> = [];

    let enviados = 0;
    let erros = 0;

    for (const boleto of boletos as Boleto[]) {
      if (!boleto.morador_email) {
        console.log(`Boleto ${boleto.id} - Sem e-mail cadastrado para unidade ${boleto.unidade}`);
        resultados.push({
          boleto_id: boleto.id,
          unidade: boleto.unidade,
          email: null,
          sucesso: false,
          erro: "E-mail do morador não cadastrado",
        });
        erros++;
        continue;
      }

      try {
        const { subject, html } = gerarEmailCobranca(boleto, tipo);

        console.log(`Enviando e-mail para ${boleto.morador_email} (${boleto.unidade})`);

        const emailResponse = await resend.emails.send({
          from: "Manage Condo <onboarding@resend.dev>",
          to: [boleto.morador_email],
          subject,
          html,
        });

        console.log(`E-mail enviado com sucesso:`, emailResponse);

        resultados.push({
          boleto_id: boleto.id,
          unidade: boleto.unidade,
          email: boleto.morador_email,
          sucesso: true,
        });
        enviados++;
      } catch (emailError) {
        console.error(`Erro ao enviar e-mail para ${boleto.morador_email}:`, emailError);
        resultados.push({
          boleto_id: boleto.id,
          unidade: boleto.unidade,
          email: boleto.morador_email,
          sucesso: false,
          erro: emailError instanceof Error ? emailError.message : "Erro desconhecido",
        });
        erros++;
      }
    }

    console.log(`Envio concluído: ${enviados} enviado(s), ${erros} erro(s)`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Envio concluído: ${enviados} e-mail(s) enviado(s)`,
        enviados,
        erros,
        total: idsToProcess.length,
        resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro no envio de e-mails:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
