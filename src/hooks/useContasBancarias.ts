import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ContaBancaria {
  id: string;
  created_at: string;
  updated_at: string;
  administradora_id: string | null;
  condominio_id: string | null;
  nome_conta: string;
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito: string | null;
  conta: string;
  conta_digito: string | null;
  tipo_conta: string;
  titular_nome: string;
  titular_documento: string;
  titular_tipo: string;
  convenio: string | null;
  carteira: string | null;
  variacao_carteira: string | null;
  codigo_cedente: string | null;
  nosso_numero_inicio: number | null;
  nosso_numero_atual: number | null;
  instrucoes_linha1: string | null;
  instrucoes_linha2: string | null;
  instrucoes_linha3: string | null;
  multa_percentual: number | null;
  juros_mensal: number | null;
  dias_protesto: number | null;
  ativa: boolean;
  conta_padrao: boolean;
  chave_pix: string | null;
  tipo_chave_pix: string | null;
  // Joined data
  condominio_nome?: string;
  administradora_nome?: string;
}

export interface NovaContaBancariaData {
  administradora_id?: string | null;
  condominio_id?: string | null;
  nome_conta: string;
  banco_codigo: string;
  banco_nome: string;
  agencia: string;
  agencia_digito?: string | null;
  conta: string;
  conta_digito?: string | null;
  tipo_conta: string;
  titular_nome: string;
  titular_documento: string;
  titular_tipo: string;
  convenio?: string | null;
  carteira?: string | null;
  variacao_carteira?: string | null;
  codigo_cedente?: string | null;
  nosso_numero_inicio?: number | null;
  instrucoes_linha1?: string | null;
  instrucoes_linha2?: string | null;
  instrucoes_linha3?: string | null;
  multa_percentual?: number | null;
  juros_mensal?: number | null;
  dias_protesto?: number | null;
  ativa?: boolean;
  conta_padrao?: boolean;
  chave_pix?: string | null;
  tipo_chave_pix?: string | null;
}

export function useContasBancarias() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("contas_bancarias")
        .select("*")
        .order("nome_conta");

      if (fetchError) throw fetchError;

      // Fetch condominio and administradora names separately
      const contasWithNames: ContaBancaria[] = [];

      for (const conta of data || []) {
        let condominio_nome: string | undefined;
        let administradora_nome: string | undefined;

        if (conta.condominio_id) {
          const { data: condData } = await supabase
            .from("condominios")
            .select("nome")
            .eq("id", conta.condominio_id)
            .single();
          condominio_nome = condData?.nome;
        }

        if (conta.administradora_id) {
          const { data: admData } = await supabase
            .from("administradoras")
            .select("nome")
            .eq("id", conta.administradora_id)
            .single();
          administradora_nome = admData?.nome;
        }

        contasWithNames.push({
          ...conta,
          condominio_nome,
          administradora_nome,
        });
      }

      setContas(contasWithNames);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao carregar contas";
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

  const criarConta = async (data: NovaContaBancariaData): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from("contas_bancarias")
        .insert(data);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Conta bancária criada com sucesso",
      });

      await fetchContas();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const atualizarConta = async (
    id: string,
    data: Partial<NovaContaBancariaData>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("contas_bancarias")
        .update(data)
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Conta bancária atualizada com sucesso",
      });

      await fetchContas();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar conta";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const excluirConta = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("contas_bancarias")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Sucesso",
        description: "Conta bancária excluída com sucesso",
      });

      await fetchContas();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao excluir conta";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  const definirContaPadrao = async (
    id: string,
    vinculoId: string,
    tipo: "administradora" | "condominio"
  ): Promise<boolean> => {
    try {
      // First, unset any existing default for this entity
      const filterColumn = tipo === "administradora" ? "administradora_id" : "condominio_id";
      
      await supabase
        .from("contas_bancarias")
        .update({ conta_padrao: false })
        .eq(filterColumn, vinculoId);

      // Then set the new default
      const { error: updateError } = await supabase
        .from("contas_bancarias")
        .update({ conta_padrao: true })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Conta definida como padrão",
      });

      await fetchContas();
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao definir conta padrão";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  return {
    contas,
    loading,
    error,
    fetchContas,
    criarConta,
    atualizarConta,
    excluirConta,
    definirContaPadrao,
  };
}
