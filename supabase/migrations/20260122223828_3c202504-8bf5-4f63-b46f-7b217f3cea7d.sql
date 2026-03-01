-- Restrict categorias_financeiras to admins and managers only
DROP POLICY IF EXISTS "Visualizar categorias" ON public.categorias_financeiras;

CREATE POLICY "Admins can view categorias"
ON public.categorias_financeiras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view categorias"
ON public.categorias_financeiras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_condominio_access
    WHERE user_id = auth.uid()
  )
);