import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
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
      throw new Error("Only admins can manage users");
    }

    const { action, user_id, nome, email, password } = await req.json();

    if (!action || !user_id) {
      throw new Error("Missing required fields: action, user_id");
    }

    // Prevent admin from deleting themselves
    if (action === "delete" && user_id === callingUser.id) {
      throw new Error("Você não pode excluir sua própria conta");
    }

    let result;

    // Get target user info for audit log
    const { data: targetUserData } = await supabaseAdmin
      .from("profiles")
      .select("nome, email")
      .eq("user_id", user_id)
      .single();

    let auditDetails: Record<string, unknown> = {};

    switch (action) {
      case "delete":
        // Delete user from auth (cascades to profiles and related tables)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
        if (deleteError) throw deleteError;
        result = { message: "Usuário excluído com sucesso" };
        auditDetails = {
          deleted_user_email: targetUserData?.email,
          deleted_user_name: targetUserData?.nome,
        };
        break;

      case "update":
        // Update user metadata and profile
        if (email) {
          const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
            email,
            email_confirm: true,
          });
          if (emailError) throw emailError;
        }

        if (nome) {
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({ nome, email: email || undefined })
            .eq("user_id", user_id);
          if (profileError) throw profileError;
        }

        result = { message: "Usuário atualizado com sucesso" };
        auditDetails = {
          previous_name: targetUserData?.nome,
          previous_email: targetUserData?.email,
          new_name: nome || targetUserData?.nome,
          new_email: email || targetUserData?.email,
        };
        break;

      case "reset_password":
        if (!password) {
          throw new Error("Password is required for reset_password action");
        }
        
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password,
        });
        if (passwordError) throw passwordError;
        result = { message: "Senha alterada com sucesso" };
        auditDetails = {
          target_user_email: targetUserData?.email,
          target_user_name: targetUserData?.nome,
        };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log audit entry
    const { error: auditError } = await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: callingUser.id,
        user_email: callingUser.email,
        user_role: "admin",
        action: action === "reset_password" ? "password_reset" : action,
        entity_type: "user",
        entity_id: user_id,
        entity_name: targetUserData?.nome || null,
        details: auditDetails,
      });

    if (auditError) {
      console.error("Audit log error:", auditError);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
