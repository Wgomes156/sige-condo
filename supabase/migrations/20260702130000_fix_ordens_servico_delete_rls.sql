-- Fix: política de DELETE de ordens_servico restringia apenas ao role 'admin',
-- enquanto INSERT/SELECT/UPDATE já permitem sindico/gerente via has_condominio_access.
-- Isso bloqueava a exclusão de OS por Gerentes/Síndicos com acesso ao condomínio.

DROP POLICY IF EXISTS "Admin pode deletar OS" ON public.ordens_servico;

CREATE POLICY "Admin e Gerentes podem deletar OS"
ON public.ordens_servico FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  atribuido_a = auth.uid()
);
