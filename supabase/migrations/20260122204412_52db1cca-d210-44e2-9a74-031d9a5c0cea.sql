-- Fix RLS infinite recursion on public.user_unidade_access
-- The existing policy references user_unidade_access inside its own USING clause, causing recursion.

DROP POLICY IF EXISTS "Admins e gerentes podem gerenciar acessos unidade" ON public.user_unidade_access;

-- Moradores: podem ver somente seus próprios vínculos
-- (mantém compatibilidade caso já exista)
DROP POLICY IF EXISTS "Moradores podem ver seus próprios acessos" ON public.user_unidade_access;
CREATE POLICY "Moradores podem ver seus próprios acessos"
ON public.user_unidade_access
FOR SELECT
USING (auth.uid() = user_id);

-- Admin: pode ver/gerenciar tudo
CREATE POLICY "Admins podem ver acessos unidade"
ON public.user_unidade_access
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins podem gerenciar acessos unidade"
ON public.user_unidade_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Gerente: pode ver/gerenciar acessos de unidades que pertencem aos seus condomínios
CREATE POLICY "Gerentes podem ver acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem gerenciar acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem atualizar acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem remover acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);