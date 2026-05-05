-- =====================================================
-- Adiciona suporte ao tipo 'transacao' nas políticas RLS de anexos
-- Transações financeiras são acessíveis a quem tem acesso ao condomínio
-- =====================================================

-- Atualiza a política de SELECT para anexos adicionando 'transacao'
DROP POLICY IF EXISTS "Users can view accessible anexos" ON public.anexos;

CREATE POLICY "Users can view accessible anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (
  CASE
    WHEN entidade_tipo = 'condominio' THEN public.has_condominio_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'unidade' THEN public.has_unidade_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'ordem_servico' THEN public.can_access_os(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'boleto' THEN public.can_access_boleto(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'transacao' THEN EXISTS (
      SELECT 1 FROM public.transacoes_financeiras tf
      WHERE tf.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), tf.condominio_id)
    )
    WHEN entidade_tipo = 'atendimento' THEN EXISTS (
      SELECT 1 FROM public.atendimentos a
      WHERE a.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), a.condominio_id)
    )
    WHEN entidade_tipo = 'atendimento_historico' THEN EXISTS (
      SELECT 1 FROM public.atendimento_historico ah
      JOIN public.atendimentos a ON a.id = ah.atendimento_id
      WHERE ah.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), a.condominio_id)
    )
    ELSE false
  END
);

-- Garante que usuários autenticados podem inserir anexos do tipo 'transacao'
-- (reutiliza a política existente de insert se houver, ou cria uma nova)
DROP POLICY IF EXISTS "Users can insert anexos" ON public.anexos;
DROP POLICY IF EXISTS "Authenticated users can insert anexos" ON public.anexos;

CREATE POLICY "Authenticated users can insert anexos"
ON public.anexos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Garante que usuários podem deletar apenas seus próprios anexos
DROP POLICY IF EXISTS "Users can delete own anexos" ON public.anexos;
DROP POLICY IF EXISTS "Admins can delete any anexo" ON public.anexos;

CREATE POLICY "Users can delete own anexos"
ON public.anexos FOR DELETE
TO authenticated
USING (criado_por = auth.uid());

CREATE POLICY "Admins can delete any anexo"
ON public.anexos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
