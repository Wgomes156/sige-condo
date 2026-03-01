-- Atualizar a função que muda status de boletos vencidos para usar "atraso" em vez de "atrasado"
CREATE OR REPLACE FUNCTION public.atualizar_boletos_atrasados()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  quantidade_atualizada INTEGER;
BEGIN
  UPDATE boletos
  SET status = 'atraso', updated_at = now()
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
  
  GET DIAGNOSTICS quantidade_atualizada = ROW_COUNT;
  RETURN quantidade_atualizada;
END;
$function$;