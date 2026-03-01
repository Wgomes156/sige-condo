-- Permitir que admins vejam todos os perfis
CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins atualizem perfis (para gestão)
CREATE POLICY "Admins podem atualizar perfis"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));