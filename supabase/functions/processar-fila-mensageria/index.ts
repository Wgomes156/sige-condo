import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 50;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Auth: aceita token de usuário (admin/sindico/gerente) ou service role (cron)
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

    const agora = new Date().toISOString();

    // Buscar entregas pendentes ou com falha que estão prontas para retry
    const { data: entregas, error: fetchError } = await supabase
      .from("mensageria_entregas")
      .select("id, canal, tentativas")
      .in("status", ["pendente", "falhou"])
      .or(`proximo_retry.is.null,proximo_retry.lte.${agora}`)
      .order("criado_em", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Erro ao buscar fila: ${fetchError.message}`);
    }

    if (!entregas || entregas.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processadas: 0, erros: 0, message: "Fila vazia" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`Processando ${entregas.length} entregas na fila...`);

    let processadas = 0;
    let erros = 0;

    // Invocar enviar-mensagem para cada entrega
    for (const entrega of entregas) {
      try {
        const { error: invokeError } = await supabase.functions.invoke("enviar-mensagem", {
          body: { entrega_id: entrega.id },
          headers: { Authorization: `Bearer ${supabaseServiceKey}` },
        });

        if (invokeError) {
          console.error(`Erro ao invocar enviar-mensagem para ${entrega.id}:`, invokeError);
          erros++;
        } else {
          processadas++;
        }
      } catch (err) {
        console.error(`Exceção ao processar entrega ${entrega.id}:`, err);
        erros++;
      }
    }

    console.log(`Fila processada: ${processadas} ok, ${erros} erros`);

    return new Response(
      JSON.stringify({
        success: true,
        processadas,
        erros,
        total: entregas.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Erro em processar-fila-mensageria:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
