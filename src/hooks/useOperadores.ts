import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Operador {
  id: string;
  user_id: string;
  nome: string;
  email: string;
}

export function useOperadores() {
  return useQuery({
    queryKey: ["operadores"],
    queryFn: async () => {
      // Fetch profiles with roles (operador, gerente, admin)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, nome, email")
        .order("nome");

      if (profilesError) throw profilesError;

      // Fetch roles to filter operators
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["operador", "gerente", "admin"]);

      if (rolesError) throw rolesError;

      // Filter profiles that have operator-like roles
      const operadorUserIds = new Set((roles || []).map((r) => r.user_id));
      
      const operadores = (profiles || [])
        .filter((p) => operadorUserIds.has(p.user_id))
        .map((p) => ({
          id: p.id,
          user_id: p.user_id,
          nome: p.nome,
          email: p.email,
        }));

      return operadores;
    },
  });
}
