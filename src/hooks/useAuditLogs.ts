import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AuditLogFilters {
  search: string;
  action: string;
  entityType: string;
  startDate: Date | null;
  endDate: Date | null;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLogs = useCallback(async (filters?: AuditLogFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.action && filters.action !== "all") {
        query = query.eq("action", filters.action);
      }

      if (filters?.entityType && filters.entityType !== "all") {
        query = query.eq("entity_type", filters.entityType);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        // Add 1 day to include the end date fully
        const endDate = new Date(filters.endDate);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("created_at", endDate.toISOString());
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) {
        throw fetchError;
      }

      let filteredData = data || [];

      // Client-side search filter (for user_email, entity_name, and details)
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((log) => {
          const emailMatch = log.user_email?.toLowerCase().includes(searchLower);
          const entityNameMatch = log.entity_name?.toLowerCase().includes(searchLower);
          const detailsMatch = log.details
            ? JSON.stringify(log.details).toLowerCase().includes(searchLower)
            : false;
          return emailMatch || entityNameMatch || detailsMatch;
        });
      }

      setLogs(filteredData as AuditLog[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar logs";
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    fetchLogs,
  };
}
