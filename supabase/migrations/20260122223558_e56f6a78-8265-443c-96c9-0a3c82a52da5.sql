-- =====================================================
-- SECURITY HARDENING: Restrict access to sensitive data
-- =====================================================

-- 1. PROFILES: Only users can see their own profile, admins can see all
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admin pode gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios visualizam proprio perfil" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. ADMINISTRADORAS: Restrict to admins and managers with condominium access
DROP POLICY IF EXISTS "Authenticated users can view administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Visualizar administradoras permitidas" ON public.administradoras;

CREATE POLICY "Admins can view all administradoras"
ON public.administradoras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view linked administradoras"
ON public.administradoras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.condominios c
    JOIN public.user_condominio_access uca ON uca.condominio_id = c.id
    WHERE c.administradora_id = administradoras.id
    AND uca.user_id = auth.uid()
  )
);

-- 3. ATENDIMENTOS: Users see only their own tickets, admins/managers see by condominium
DROP POLICY IF EXISTS "Authenticated users can read atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Operadores podem ver atendimentos atribuidos" ON public.atendimentos;

CREATE POLICY "Admins can view all atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Operators see assigned atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (operador_id = auth.uid());

-- 4. BOLETOS: Residents only see their own unit's boletos
DROP POLICY IF EXISTS "Authenticated users can read boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem ver boletos permitidos" ON public.boletos;

CREATE POLICY "Admins can view all boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = boletos.condominio_id
    AND u.codigo = boletos.unidade
    AND uua.user_id = auth.uid()
  )
);

-- 5. CONDOMINIOS: Restrict sensitive fields visibility
-- Cannot drop columns, so we restrict by access level
DROP POLICY IF EXISTS "Authenticated users can read condominios" ON public.condominios;
DROP POLICY IF EXISTS "Usuarios podem ver condominios permitidos" ON public.condominios;

CREATE POLICY "Admins can view all condominios"
ON public.condominios FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view assigned condominios"
ON public.condominios FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), id));

CREATE POLICY "Residents can view own condominium basic info"
ON public.condominios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = condominios.id
    AND uua.user_id = auth.uid()
  )
);

-- 6. UNIDADES: Users only see their own unit
DROP POLICY IF EXISTS "Authenticated users can read unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuarios podem ver unidades permitidas" ON public.unidades;

CREATE POLICY "Admins can view all unidades"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium unidades"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit only"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), id));

-- 7. PROPRIETARIOS_UNIDADE: Only unit owners and admins
DROP POLICY IF EXISTS "Authenticated users can read proprietarios" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver proprietarios permitidos" ON public.proprietarios_unidade;

CREATE POLICY "Admins can view all proprietarios"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium proprietarios"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = proprietarios_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own proprietario"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 8. INQUILINOS_UNIDADE: Only unit tenants and admins/managers
DROP POLICY IF EXISTS "Authenticated users can read inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver inquilinos permitidos" ON public.inquilinos_unidade;

CREATE POLICY "Admins can view all inquilinos"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium inquilinos"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = inquilinos_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own inquilino"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 9. MORADORES_UNIDADE: Only unit residents and admins/managers
DROP POLICY IF EXISTS "Authenticated users can read moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver moradores permitidos" ON public.moradores_unidade;

CREATE POLICY "Admins can view all moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = moradores_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 10. TRANSACOES_FINANCEIRAS: Restrict to own unit transactions
DROP POLICY IF EXISTS "Authenticated users can read transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem ver transacoes permitidas" ON public.transacoes_financeiras;

CREATE POLICY "Admins can view all transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = transacoes_financeiras.condominio_id
    AND u.codigo = transacoes_financeiras.unidade
    AND uua.user_id = auth.uid()
  )
);

-- 11. VISITANTES_AUTORIZADOS: Only unit users and admins
DROP POLICY IF EXISTS "Authenticated users can read visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuarios podem ver visitantes permitidos" ON public.visitantes_autorizados;

CREATE POLICY "Admins can view all visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = visitantes_autorizados.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 12. ANEXOS: Restrict based on entity access
DROP POLICY IF EXISTS "Authenticated users can view anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuarios podem ver anexos" ON public.anexos;

CREATE POLICY "Admins can view all anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (
  CASE
    WHEN entidade_tipo = 'condominio' THEN public.has_condominio_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'unidade' THEN public.has_unidade_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'ordem_servico' THEN public.can_access_os(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'boleto' THEN public.can_access_boleto(auth.uid(), entidade_id::uuid)
    ELSE false
  END
);