
-- Função para atualizar o status financeiro da unidade baseado nos boletos
CREATE OR REPLACE FUNCTION public.atualizar_status_financeiro_unidade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unidade_id UUID;
  v_tem_boletos_pendentes BOOLEAN;
  v_tem_acordo_ativo BOOLEAN;
BEGIN
  -- Buscar a unidade pelo código e condomínio
  SELECT u.id INTO v_unidade_id
  FROM unidades u
  WHERE u.codigo = COALESCE(NEW.unidade, OLD.unidade)
    AND u.condominio_id = COALESCE(NEW.condominio_id, OLD.condominio_id);
  
  -- Se não encontrou a unidade, sair
  IF v_unidade_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Verificar se há boletos pendentes ou em atraso para esta unidade
  SELECT EXISTS (
    SELECT 1 FROM boletos b
    JOIN unidades u ON u.codigo = b.unidade AND u.condominio_id = b.condominio_id
    WHERE u.id = v_unidade_id
      AND b.status IN ('pendente', 'atraso')
  ) INTO v_tem_boletos_pendentes;
  
  -- Verificar se há acordo ativo para esta unidade
  SELECT EXISTS (
    SELECT 1 FROM acordos a
    WHERE a.unidade_id = v_unidade_id
      AND a.status = 'ativo'
  ) INTO v_tem_acordo_ativo;
  
  -- Atualizar o status financeiro da unidade com cast para o ENUM
  IF v_tem_acordo_ativo THEN
    UPDATE unidades SET status_financeiro = 'acordo'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  ELSIF v_tem_boletos_pendentes THEN
    UPDATE unidades SET status_financeiro = 'inadimplente'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  ELSE
    UPDATE unidades SET status_financeiro = 'em_dia'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Atualizar todas as unidades existentes com base nos boletos atuais
UPDATE unidades u
SET status_financeiro = (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM acordos a WHERE a.unidade_id = u.id AND a.status = 'ativo'
    ) THEN 'acordo'
    WHEN EXISTS (
      SELECT 1 FROM boletos b 
      WHERE b.unidade = u.codigo 
        AND b.condominio_id = u.condominio_id 
        AND b.status IN ('pendente', 'atraso')
    ) THEN 'inadimplente'
    ELSE 'em_dia'
  END
)::status_financeiro_unidade,
updated_at = now();
