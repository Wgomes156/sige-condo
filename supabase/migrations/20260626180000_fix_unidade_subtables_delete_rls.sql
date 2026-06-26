-- Fix: políticas de DELETE nas tabelas filhas de unidades restringiam apenas ao role 'admin'.
-- INSERT e UPDATE já permitem sindico/gerente via has_unidade_access, mas DELETE não.
-- Aplica o mesmo padrão de has_unidade_access para DELETE em todas as tabelas filhas.

-- MORADORES_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar moradores" ON public.moradores_unidade;
CREATE POLICY "Admin e Gerentes podem deletar moradores"
ON public.moradores_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- VEICULOS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar veiculos" ON public.veiculos_unidade;
CREATE POLICY "Admin e Gerentes podem deletar veiculos"
ON public.veiculos_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- VAGAS_GARAGEM
DROP POLICY IF EXISTS "Admin pode deletar vagas" ON public.vagas_garagem;
CREATE POLICY "Admin e Gerentes podem deletar vagas"
ON public.vagas_garagem FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- ANIMAIS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar animais" ON public.animais_unidade;
CREATE POLICY "Admin e Gerentes podem deletar animais"
ON public.animais_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- ACESSOS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar acessos" ON public.acessos_unidade;
CREATE POLICY "Admin e Gerentes podem deletar acessos"
ON public.acessos_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- PROPRIETARIOS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar proprietarios" ON public.proprietarios_unidade;
CREATE POLICY "Admin e Gerentes podem deletar proprietarios"
ON public.proprietarios_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- INQUILINOS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar inquilinos" ON public.inquilinos_unidade;
CREATE POLICY "Admin e Gerentes podem deletar inquilinos"
ON public.inquilinos_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- DOCUMENTOS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar documentos" ON public.documentos_unidade;
CREATE POLICY "Admin e Gerentes podem deletar documentos"
ON public.documentos_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

-- OCORRENCIAS_UNIDADE
DROP POLICY IF EXISTS "Admin pode deletar ocorrencias" ON public.ocorrencias_unidade;
CREATE POLICY "Admin e Gerentes podem deletar ocorrencias"
ON public.ocorrencias_unidade FOR DELETE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);
