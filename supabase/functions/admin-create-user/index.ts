import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the calling user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      throw new Error("Invalid token");
    }

    // Check if calling user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    // Get request body
    const { email, password, nome, role, condominios_ids, unidades_ids } = await req.json();

    if (!email || !password || !nome || !role) {
      throw new Error("Missing required fields: email, password, nome, role");
    }

    // Create the new user with admin API
    const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nome,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUserData.user) {
      throw new Error("Failed to create user");
    }

    const newUserId = newUserData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUserId,
        nome,
        email,
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Continue anyway, trigger might have created it
    }

    // Create or update user role
    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({
        user_id: newUserId,
        role,
      }, { onConflict: "user_id" });

    if (roleInsertError) {
      console.error("Role insertion error:", roleInsertError);
    }

    // Add condominio access for gerente
    if (role === "gerente" && condominios_ids?.length) {
      const condominioInserts = condominios_ids.map((condId: string) => ({
        user_id: newUserId,
        condominio_id: condId,
      }));

      const { error: condError } = await supabaseAdmin
        .from("user_condominio_access")
        .insert(condominioInserts);

      if (condError) {
        console.error("Condominio access error:", condError);
      }
    }

    // Add unidade access for morador
    if (role === "morador" && unidades_ids?.length) {
      const unidadeInserts = unidades_ids.map((u: { unidade_id: string; tipo_morador: string }) => ({
        user_id: newUserId,
        unidade_id: u.unidade_id,
        tipo_morador: u.tipo_morador,
      }));

      const { error: unidadeError } = await supabaseAdmin
        .from("user_unidade_access")
        .insert(unidadeInserts);

      if (unidadeError) {
        console.error("Unidade access error:", unidadeError);
      }
    }

    // Log audit entry for user creation
    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: callingUser.id,
        user_email: callingUser.email,
        user_role: "admin",
        action: "create",
        entity_type: "user",
        entity_id: newUserId,
        entity_name: nome,
        details: {
          created_email: email,
          assigned_role: role,
          condominios_count: condominios_ids?.length || 0,
          unidades_count: unidades_ids?.length || 0,
        },
      });

    if (auditError) {
      console.error("Audit log error:", auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUserId,
        message: "Usuário criado com sucesso",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
