import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Auth: requer token de usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token inválido ou expirado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { entrega_id } = body;

    if (!entrega_id || typeof entrega_id !== "string") {
      return new Response(
        JSON.stringify({ error: "entrega_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validar que a entrega pertence ao usuário autenticado
    const { data: entrega, error: fetchError } = await supabase
      .from("mensageria_entregas")
      .select("id, destinatario_id, status, canal")
      .eq("id", entrega_id)
      .single();

    if (fetchError || !entrega) {
      return new Response(
        JSON.stringify({ error: "Entrega não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (entrega.destinatario_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Acesso negado: esta mensagem não é endereçada a você" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (entrega.status === "lido") {
      return new Response(
        JSON.stringify({ success: true, message: "Mensagem já estava marcada como lida" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Atualizar status para lido
    const { error: updateError } = await supabase
      .from("mensageria_entregas")
      .update({
        status: "lido",
        lido_em: new Date().toISOString(),
      })
      .eq("id", entrega_id);

    if (updateError) {
      throw new Error(`Erro ao atualizar entrega: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, entrega_id, lido_em: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em marcar-mensagem-lida:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
