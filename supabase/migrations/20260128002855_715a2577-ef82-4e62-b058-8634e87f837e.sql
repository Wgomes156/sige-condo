-- Função para gerar nosso_numero único baseado em timestamp + sequencial
CREATE OR REPLACE FUNCTION public.gerar_nosso_numero()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_mes TEXT;
  sequencia INT;
  numero TEXT;
BEGIN
  ano_mes := to_char(CURRENT_DATE, 'YYMM');
  
  -- Buscar o próximo número sequencial do mês
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(nosso_numero FROM '\d{4}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM boletos
  WHERE nosso_numero LIKE ano_mes || '-%';
  
  numero := ano_mes || '-' || LPAD(sequencia::TEXT, 6, '0');
  
  RETURN numero;
END;
$$;

-- Trigger para gerar nosso_numero automaticamente quando não informado
CREATE OR REPLACE FUNCTION public.boleto_gerar_nosso_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se nosso_numero não foi informado ou é vazio, gerar automaticamente
  IF NEW.nosso_numero IS NULL OR TRIM(NEW.nosso_numero) = '' THEN
    NEW.nosso_numero := gerar_nosso_numero();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_gerar_nosso_numero ON boletos;
CREATE TRIGGER trigger_gerar_nosso_numero
  BEFORE INSERT ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION boleto_gerar_nosso_numero();