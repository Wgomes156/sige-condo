import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type AuditAction = 
  | "create" 
  | "update" 
  | "delete" 
  | "login" 
  | "logout" 
  | "password_reset" 
  | "role_change"
  | "view";

export type AuditEntityType = 
  | "user"
  | "boleto"
  | "condominio"
  | "unidade"
  | "ordem_servico"
  | "comunicado"
  | "transacao"
  | "atendimento"
  | "acordo"
  | "proposta"
  | "demanda"
  | "ocorrencia"
  | "session";

interface AuditLogData {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityName?: string | null;
  details?: Json | null;
}

/**
 * Hook utilitário para registrar ações no sistema de auditoria
 */
export function useAuditLogger() {
  const logAction = async (data: AuditLogData): Promise<boolean> => {
    try {
      // Get current session
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        console.warn("useAuditLogger: Usuário não autenticado, log ignorado");
        return false;
      }

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      // Insert audit log
      const { error } = await supabase.from("audit_logs").insert([{
        user_id: user.id,
        user_email: user.email,
        user_role: roleData?.role || "operador",
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        entity_name: data.entityName || null,
        details: data.details || null,
        user_agent: navigator.userAgent,
      }]);

      if (error) {
        console.error("useAuditLogger: Erro ao registrar log:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("useAuditLogger: Exceção ao registrar log:", err);
      return false;
    }
  };

  // Funções auxiliares para ações comuns
  const logCreate = (entityType: AuditEntityType, entityId?: string, entityName?: string, details?: Json) =>
    logAction({ action: "create", entityType, entityId, entityName, details });

  const logUpdate = (entityType: AuditEntityType, entityId?: string, entityName?: string, details?: Json) =>
    logAction({ action: "update", entityType, entityId, entityName, details });

  const logDelete = (entityType: AuditEntityType, entityId?: string, entityName?: string, details?: Json) =>
    logAction({ action: "delete", entityType, entityId, entityName, details });

  const logLogin = (userEmail: string) =>
    logAction({ action: "login", entityType: "session", entityName: userEmail, details: { timestamp: new Date().toISOString() } });

  const logLogout = (userEmail: string) =>
    logAction({ action: "logout", entityType: "session", entityName: userEmail, details: { timestamp: new Date().toISOString() } });

  return {
    logAction,
    logCreate,
    logUpdate,
    logDelete,
    logLogin,
    logLogout,
  };
}

/**
 * Função standalone para registrar logs (para uso fora de componentes React)
 */
export async function auditLog(data: AuditLogData & { userId: string; userEmail?: string; userRole?: string }): Promise<boolean> {
  try {
    const { error } = await supabase.from("audit_logs").insert([{
      user_id: data.userId,
      user_email: data.userEmail || null,
      user_role: data.userRole || null,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId || null,
      entity_name: data.entityName || null,
      details: data.details || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    }]);

    if (error) {
      console.error("auditLog: Erro ao registrar log:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("auditLog: Exceção ao registrar log:", err);
    return false;
  }
}
