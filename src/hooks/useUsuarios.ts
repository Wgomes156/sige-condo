import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface Usuario {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  role: AppRole;
  created_at: string;
  condominios_acesso: {
    condominio_id: string;
    condominio_nome: string;
  }[];
  unidades_acesso: {
    unidade_id: string;
    unidade_codigo: string;
    tipo_morador: string;
  }[];
}

export interface NovoUsuarioData {
  nome: string;
  email: string;
  password: string;
  role: AppRole;
  condominios_ids?: string[];
  unidades_ids?: { unidade_id: string; tipo_morador: string }[];
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles with roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Fetch condominio access
      const { data: condominioAccess, error: condominioError } = await supabase
        .from("user_condominio_access")
        .select(`
          user_id,
          condominio_id,
          condominios:condominio_id (nome)
        `);

      if (condominioError) throw condominioError;

      // Fetch unidade access
      const { data: unidadeAccess, error: unidadeError } = await supabase
        .from("user_unidade_access")
        .select(`
          user_id,
          unidade_id,
          tipo_morador,
          unidades:unidade_id (codigo)
        `);

      if (unidadeError) throw unidadeError;

      // Combine data
      const usuariosData: Usuario[] = (profiles || []).map((profile) => {
        const userRole = roles?.find((r) => r.user_id === profile.user_id);
        const userCondominios = (condominioAccess || [])
          .filter((c) => c.user_id === profile.user_id)
          .map((c) => ({
            condominio_id: c.condominio_id,
            condominio_nome: (c.condominios as any)?.nome || "Desconhecido",
          }));
        const userUnidades = (unidadeAccess || [])
          .filter((u) => u.user_id === profile.user_id)
          .map((u) => ({
            unidade_id: u.unidade_id,
            unidade_codigo: (u.unidades as any)?.codigo || "Desconhecido",
            tipo_morador: u.tipo_morador,
          }));

        return {
          id: profile.id,
          user_id: profile.user_id,
          nome: profile.nome,
          email: profile.email,
          role: userRole?.role || "operador",
          created_at: profile.created_at,
          condominios_acesso: userCondominios,
          unidades_acesso: userUnidades,
        };
      });

      setUsuarios(usuariosData);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching usuarios:", err);
      setError(err.message);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const criarUsuario = async (data: NovoUsuarioData) => {
    try {
      // Use edge function to create user with admin privileges
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        throw new Error("Você precisa estar logado para criar usuários");
      }

      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: data.email,
          password: data.password,
          nome: data.nome,
          role: data.role,
          condominios_ids: data.condominios_ids,
          unidades_ids: data.unidades_ids,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }

      if (!response.data?.success) {
        const errorMsg = response.data?.error || "Erro ao criar usuário";
        // Traduzir mensagens comuns
        if (errorMsg.includes("already been registered") || errorMsg.includes("email_exists")) {
          throw new Error("Este e-mail já está cadastrado no sistema");
        }
        throw new Error(errorMsg);
      }

      toast.success("Usuário criado com sucesso!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error creating usuario:", err);
      toast.error(err.message || "Erro ao criar usuário");
      return { success: false, error: err.message };
    }
  };

  const excluirUsuario = async (userId: string) => {
    try {
      const response = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "delete", user_id: userId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao excluir usuário");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Erro ao excluir usuário");
      }

      toast.success("Usuário excluído com sucesso!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting usuario:", err);
      toast.error(err.message || "Erro ao excluir usuário");
      return { success: false, error: err.message };
    }
  };

  const editarUsuario = async (userId: string, nome: string, email: string) => {
    try {
      const response = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "update", user_id: userId, nome, email },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao editar usuário");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Erro ao editar usuário");
      }

      toast.success("Usuário atualizado com sucesso!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error editing usuario:", err);
      toast.error(err.message || "Erro ao editar usuário");
      return { success: false, error: err.message };
    }
  };

  const alterarSenha = async (userId: string, password: string) => {
    try {
      const response = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "reset_password", user_id: userId, password },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao alterar senha");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Erro ao alterar senha");
      }

      toast.success("Senha alterada com sucesso!");
      return { success: true };
    } catch (err: any) {
      console.error("Error changing password:", err);
      toast.error(err.message || "Erro ao alterar senha");
      return { success: false, error: err.message };
    }
  };

  const atualizarRole = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Role atualizada com sucesso!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast.error(err.message || "Erro ao atualizar role");
      return { success: false, error: err.message };
    }
  };

  const atribuirCondominio = async (userId: string, condominioId: string) => {
    try {
      const { error } = await supabase
        .from("user_condominio_access")
        .insert({ user_id: userId, condominio_id: condominioId });

      if (error) throw error;

      toast.success("Acesso ao condomínio atribuído!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error assigning condominio:", err);
      toast.error(err.message || "Erro ao atribuir condomínio");
      return { success: false, error: err.message };
    }
  };

  const removerCondominio = async (userId: string, condominioId: string) => {
    try {
      const { error } = await supabase
        .from("user_condominio_access")
        .delete()
        .eq("user_id", userId)
        .eq("condominio_id", condominioId);

      if (error) throw error;

      toast.success("Acesso ao condomínio removido!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error removing condominio:", err);
      toast.error(err.message || "Erro ao remover condomínio");
      return { success: false, error: err.message };
    }
  };

  const atribuirUnidade = async (
    userId: string,
    unidadeId: string,
    tipoMorador: string
  ) => {
    try {
      const { error } = await supabase
        .from("user_unidade_access")
        .insert({
          user_id: userId,
          unidade_id: unidadeId,
          tipo_morador: tipoMorador,
        });

      if (error) throw error;

      toast.success("Acesso à unidade atribuído!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error assigning unidade:", err);
      toast.error(err.message || "Erro ao atribuir unidade");
      return { success: false, error: err.message };
    }
  };

  const removerUnidade = async (userId: string, unidadeId: string) => {
    try {
      const { error } = await supabase
        .from("user_unidade_access")
        .delete()
        .eq("user_id", userId)
        .eq("unidade_id", unidadeId);

      if (error) throw error;

      toast.success("Acesso à unidade removido!");
      await fetchUsuarios();
      return { success: true };
    } catch (err: any) {
      console.error("Error removing unidade:", err);
      toast.error(err.message || "Erro ao remover unidade");
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    criarUsuario,
    excluirUsuario,
    editarUsuario,
    alterarSenha,
    atualizarRole,
    atribuirCondominio,
    removerCondominio,
    atribuirUnidade,
    removerUnidade,
  };
}
