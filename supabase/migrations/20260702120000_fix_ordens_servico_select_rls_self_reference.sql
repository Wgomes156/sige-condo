-- Fix: as políticas de SELECT/UPDATE de ordens_servico usavam can_access_os(), que faz uma
-- subconsulta na própria tabela ordens_servico (self-join por id) para descobrir o condominio_id.
--
-- Quando o Gerente cria uma OS, o Supabase client sempre encadeia .insert().select() para
-- retornar a linha criada. O Postgres reavalia a política de SELECT sobre a linha recém-inserida
-- (para decidir o que incluir no RETURNING) e, como can_access_os() consulta ordens_servico de
-- novo para achar a linha por id, essa subconsulta não enxerga a linha ainda não totalmente
-- visível dentro do mesmo comando de INSERT — causando "new row violates row-level security
-- policy for table ordens_servico" mesmo com a política de INSERT correta.
--
-- A correção usa as colunas da própria linha (condominio_id, atribuido_a) diretamente na
-- política, sem subconsulta self-referencing — o mesmo padrão já usado com sucesso em
-- has_unidade_access (que consulta a tabela unidades, não a tabela filha sendo escrita).

DROP POLICY IF EXISTS "Visualizar OS permitidas" ON public.ordens_servico;
CREATE POLICY "Visualizar OS permitidas"
ON public.ordens_servico FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  atribuido_a = auth.uid()
);

DROP POLICY IF EXISTS "Gerenciar OS permitidas" ON public.ordens_servico;
CREATE POLICY "Gerenciar OS permitidas"
ON public.ordens_servico FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  atribuido_a = auth.uid()
);
