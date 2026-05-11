-- =====================================================
-- AUDITORIA DE SEGURANÇA: PREVENÇÃO DE DUPLICIDADE (RACE CONDITION)
-- =====================================================

-- Função para obter o próximo nosso_numero de forma atômica
-- Isso evita que dois usuários emitam o mesmo número simultaneamente
CREATE OR REPLACE FUNCTION public.get_next_nosso_numero(_conta_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num INTEGER;
BEGIN
  -- Bloqueia a linha da conta para evitar concorrência
  UPDATE public.contas_bancarias
  SET nosso_numero_atual = COALESCE(nosso_numero_atual, nosso_numero_inicio, 1) + 1
  WHERE id = _conta_id
  RETURNING (nosso_numero_atual - 1) INTO v_next_num;

  RETURN LPAD(v_next_num::TEXT, 8, '0');
END;
$$;
