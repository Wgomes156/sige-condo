import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for input validation
const GeracaoBoletosRequestSchema = z.object({
  condominio_id: z.string().uuid("condominio_id must be a valid UUID").optional(),
  referencia: z.string()
    .max(50, "referencia must be less than 50 characters")
    .regex(/^[\w\/\s\-áàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$/i, "referencia contains invalid characters")
    .optional(),
}).optional();

type GeracaoBoletosRequest = z.infer<typeof GeracaoBoletosRequestSchema>;

interface ConfiguracaoCobranca {
  id: string;
  condominio_id: string;
  valor_padrao: number;
  dia_vencimento: number;
  categoria_id: string | null;
  descricao_padrao: string;
  ativa: boolean;
  ultima_geracao: string | null;
  condominios: { nome: string };
}

interface Unidade {
  id: string;
  condominio_id: string;
  codigo: string;
  bloco: string | null;
  morador_nome: string | null;
  morador_email: string | null;
  morador_telefone: string | null;
  ativa: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Check user role - only admin and gerente can generate boletos
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData || !["admin", "gerente"].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ error: "Insufficient permissions. Only admin and gerente can generate boletos." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body with Zod
    let condominioIdFiltro: string | null = null;
    let referenciaManual: string | null = null;
    
    if (req.method === "POST") {
      try {
        const rawBody = await req.json();
        const validated = GeracaoBoletosRequestSchema.parse(rawBody);
        condominioIdFiltro = validated?.condominio_id || null;
        referenciaManual = validated?.referencia || null;
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
        // No body or empty body is acceptable, use defaults
      }
    }

    // If gerente, validate access to the specified condominio
    if (condominioIdFiltro && roleData.role === "gerente") {
      const { data: hasAccess } = await supabase
        .from("user_condominio_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("condominio_id", condominioIdFiltro)
        .single();

      if (!hasAccess) {
        return new Response(
          JSON.stringify({ error: "No access to this condominium" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If gerente without filter, restrict to their condominiums only
    if (!condominioIdFiltro && roleData.role === "gerente") {
      const { data: accessibleCondos } = await supabase
        .from("user_condominio_access")
        .select("condominio_id")
        .eq("user_id", user.id);

      if (!accessibleCondos || accessibleCondos.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "No condominiums accessible to this user",
            boletos_gerados: 0 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`User ${user.id} (${roleData.role}) iniciando geração de boletos recorrentes...`);
    console.log("Filtro condomínio:", condominioIdFiltro);
    console.log("Referência manual:", referenciaManual);

    // Get current date info for reference
    const hoje = new Date();
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    const mesReferencia = referenciaManual || 
      `${proximoMes.toLocaleString("pt-BR", { month: "long" })}/${proximoMes.getFullYear()}`.replace(/^\w/, c => c.toUpperCase());
    
    // Calculate due date for next month
    const calcularDataVencimento = (diaVencimento: number): string => {
      const dataVencimento = new Date(proximoMes.getFullYear(), proximoMes.getMonth(), diaVencimento);
      return dataVencimento.toISOString().split("T")[0];
    };

    // Fetch active billing configurations
    let configQuery = supabase
      .from("configuracoes_cobranca")
      .select(`
        *,
        condominios(nome)
      `)
      .eq("ativa", true);

    if (condominioIdFiltro) {
      configQuery = configQuery.eq("condominio_id", condominioIdFiltro);
    }

    const { data: configuracoes, error: configError } = await configQuery;

    if (configError) {
      console.error("Erro ao buscar configurações:", configError);
      throw new Error(`Erro ao buscar configurações: ${configError.message}`);
    }

    if (!configuracoes || configuracoes.length === 0) {
      console.log("Nenhuma configuração de cobrança ativa encontrada");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Nenhuma configuração de cobrança ativa encontrada",
          boletos_gerados: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${configuracoes.length} configuração(ões) encontrada(s)`);

    let totalBoletosGerados = 0;
    const resultados: Array<{ condominio: string; boletos: number; erro?: string }> = [];

    for (const config of configuracoes as ConfiguracaoCobranca[]) {
      console.log(`Processando condomínio: ${config.condominios?.nome || config.condominio_id}`);

      // Fetch active units for this condominium
      const { data: unidades, error: unidadesError } = await supabase
        .from("unidades")
        .select("*")
        .eq("condominio_id", config.condominio_id)
        .eq("ativa", true);

      if (unidadesError) {
        console.error(`Erro ao buscar unidades:`, unidadesError);
        resultados.push({
          condominio: config.condominios?.nome || config.condominio_id,
          boletos: 0,
          erro: unidadesError.message,
        });
        continue;
      }

      if (!unidades || unidades.length === 0) {
        console.log(`Nenhuma unidade ativa encontrada para ${config.condominios?.nome}`);
        resultados.push({
          condominio: config.condominios?.nome || config.condominio_id,
          boletos: 0,
          erro: "Nenhuma unidade ativa cadastrada",
        });
        continue;
      }

      console.log(`${unidades.length} unidade(s) encontrada(s)`);

      const dataVencimento = calcularDataVencimento(config.dia_vencimento);

      // Prepare boletos for batch insert
      const boletos = (unidades as Unidade[]).map((unidade, index) => ({
        condominio_id: config.condominio_id,
        categoria_id: config.categoria_id,
        unidade: unidade.bloco ? `${unidade.codigo} - ${unidade.bloco}` : unidade.codigo,
        morador_nome: unidade.morador_nome,
        morador_email: unidade.morador_email,
        morador_telefone: unidade.morador_telefone,
        valor: config.valor_padrao,
        data_vencimento: dataVencimento,
        referencia: mesReferencia,
        nosso_numero: `${Date.now()}${String(index).padStart(4, "0")}`,
        status: "pendente",
      }));

      // Insert boletos
      const { data: boletosInseridos, error: insertError } = await supabase
        .from("boletos")
        .insert(boletos)
        .select();

      if (insertError) {
        console.error(`Erro ao inserir boletos:`, insertError);
        
        // Log error in history
        await supabase.from("historico_geracao_boletos").insert({
          condominio_id: config.condominio_id,
          referencia: mesReferencia,
          quantidade_boletos: 0,
          valor_total: 0,
          status: "erro",
          mensagem_erro: insertError.message,
        });

        resultados.push({
          condominio: config.condominios?.nome || config.condominio_id,
          boletos: 0,
          erro: insertError.message,
        });
        continue;
      }

      const qtdBoletos = boletosInseridos?.length || 0;
      const valorTotal = qtdBoletos * config.valor_padrao;
      totalBoletosGerados += qtdBoletos;

      console.log(`${qtdBoletos} boleto(s) gerado(s) para ${config.condominios?.nome}`);

      // Update last generation date
      await supabase
        .from("configuracoes_cobranca")
        .update({ ultima_geracao: hoje.toISOString().split("T")[0] })
        .eq("id", config.id);

      // Log success in history
      await supabase.from("historico_geracao_boletos").insert({
        condominio_id: config.condominio_id,
        referencia: mesReferencia,
        quantidade_boletos: qtdBoletos,
        valor_total: valorTotal,
        status: "sucesso",
      });

      resultados.push({
        condominio: config.condominios?.nome || config.condominio_id,
        boletos: qtdBoletos,
      });
    }

    console.log(`Total de boletos gerados: ${totalBoletosGerados}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Geração concluída: ${totalBoletosGerados} boleto(s) gerado(s)`,
        boletos_gerados: totalBoletosGerados,
        referencia: mesReferencia,
        resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na geração de boletos:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
