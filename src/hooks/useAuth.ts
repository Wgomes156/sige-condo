import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { auditLog } from "@/hooks/useAuditLogger";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
}

type UserRole = "admin" | "gerente" | "operador" | "morador" | null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async (userId: string) => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (mounted) setProfile(profileData);

        // Fetch role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (mounted) setUserRole(roleData?.role || "operador");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            if (mounted) fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error("Error getting session:", error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome: nome,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Registrar login no audit log
    if (!error && data?.user) {
      // Buscar role para incluir no log
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .maybeSingle();
      
      auditLog({
        userId: data.user.id,
        userEmail: data.user.email,
        userRole: roleData?.role || "operador",
        action: "login",
        entityType: "session",
        entityName: email,
        details: { timestamp: new Date().toISOString(), method: "password" },
      });
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    // Capturar dados do usuário antes do logout para registrar no audit
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;
    
    // Buscar role se tiver usuário logado
    let currentRole: string | null = null;
    if (currentUser) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      currentRole = roleData?.role || "operador";
    }

    // Quando a sessão expira/invalida do lado do servidor, o endpoint pode responder 403
    // com "session_not_found". Nesses casos, para o usuário o efeito desejado é o mesmo:
    // sair do sistema. Então tratamos como sucesso.
    try {
      const { error } = await supabase.auth.signOut();
      
      // Registrar logout no audit log (mesmo que tenha erro de sessão)
      if (currentUser) {
        auditLog({
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: currentRole || undefined,
          action: "logout",
          entityType: "session",
          entityName: currentUser.email || "Unknown",
          details: { timestamp: new Date().toISOString() },
        });
      }
      
      if (error) {
        const msg = (error as any)?.message ?? "";
        const code = (error as any)?.code ?? "";

        if (code === "session_not_found" || msg.toLowerCase().includes("session_not_found")) {
          return { error: null };
        }

        // Algumas versões retornam apenas a mensagem sem code
        if (msg.toLowerCase().includes("session from session_id claim") || msg.toLowerCase().includes("does not exist")) {
          return { error: null };
        }
      }
      return { error };
    } catch {
      // Se algo der errado no request, ainda assim consideramos logout local como sucesso.
      return { error: null };
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth?type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    profile,
    userRole,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };
}
