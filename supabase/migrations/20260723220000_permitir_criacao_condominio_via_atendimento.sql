-- Atendimentos criados/editados sem condominio_id vinculado descartavam
-- silenciosamente os dados de condomínio preenchidos no formulário, pois
-- só Admins podiam inserir em `condominios`. Libera INSERT para os mesmos
-- papéis que já podem criar atendimentos (admin, gerente, operador) e
-- garante que quem criar o condomínio por essa via receba acesso a ele,
-- já que `has_condominio_access` (usada em SELECT/UPDATE de condominios)
-- exige uma linha em `user_condominio_access` para não-admins.

DROP POLICY IF EXISTS "Admins podem criar condominios" ON public.condominios;

CREATE POLICY "Admin, Gerentes e Operadores podem criar condominios"
ON public.condominios FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'gerente') OR
  has_role(auth.uid(), 'operador')
);

CREATE OR REPLACE FUNCTION public.grant_condominio_access_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.user_condominio_access (user_id, condominio_id)
    VALUES (auth.uid(), NEW.id)
    ON CONFLICT (user_id, condominio_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_grant_condominio_access_to_creator ON public.condominios;

CREATE TRIGGER trg_grant_condominio_access_to_creator
AFTER INSERT ON public.condominios
FOR EACH ROW
EXECUTE FUNCTION public.grant_condominio_access_to_creator();
