-- Fix: política de DELETE para visitantes_autorizados restringia apenas ao role 'admin',
-- enquanto INSERT e UPDATE já permitiam sindico/gerente via has_unidade_access.
-- Isso causava exclusão silenciosa (sem erro, sem efeito) para usuários sindico/gerente.

DROP POLICY IF EXISTS "Admin pode deletar visitantes" ON public.visitantes_autorizados;

CREATE POLICY "Admin e Gerentes podem deletar visitantes"
ON public.visitantes_autorizados FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);
