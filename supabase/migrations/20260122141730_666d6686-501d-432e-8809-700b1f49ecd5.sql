-- 1. Atualizar enum de roles para incluir novos papéis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'morador';

-- 2. Criar tabela de acesso por condomínio (para gerentes)
CREATE TABLE IF NOT EXISTS public.user_condominio_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, condominio_id)
);

-- 3. Criar tabela de acesso por unidade (para moradores)
CREATE TABLE IF NOT EXISTS public.user_unidade_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  tipo_morador TEXT NOT NULL DEFAULT 'proprietario' CHECK (tipo_morador IN ('proprietario', 'inquilino', 'dependente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, unidade_id)
);

-- 4. Adicionar coluna de operador atribuído na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS atribuido_a UUID REFERENCES auth.users(id);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.user_condominio_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unidade_access ENABLE ROW LEVEL SECURITY;

-- 6. Criar função para verificar acesso ao condomínio
CREATE OR REPLACE FUNCTION public.has_condominio_access(_user_id uuid, _condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso aos condomínios atribuídos
    SELECT 1 FROM public.user_condominio_access 
    WHERE user_id = _user_id AND condominio_id = _condominio_id
  );
$$;

-- 7. Criar função para verificar acesso à unidade
CREATE OR REPLACE FUNCTION public.has_unidade_access(_user_id uuid, _unidade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso às unidades do seu condomínio
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = _user_id AND u.id = _unidade_id
  ) OR EXISTS (
    -- Morador tem acesso à sua unidade
    SELECT 1 FROM public.user_unidade_access 
    WHERE user_id = _user_id AND unidade_id = _unidade_id
  );
$$;

-- 8. Criar função para verificar se operador pode ver OS
CREATE OR REPLACE FUNCTION public.can_access_os(_user_id uuid, _os_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso às OS do seu condomínio
    SELECT 1 FROM public.ordens_servico os
    JOIN public.user_condominio_access uca ON uca.condominio_id = os.condominio_id
    WHERE os.id = _os_id AND uca.user_id = _user_id
  ) OR EXISTS (
    -- Operador atribuído pode ver sua OS
    SELECT 1 FROM public.ordens_servico 
    WHERE id = _os_id AND atribuido_a = _user_id
  );
$$;

-- 9. Políticas para user_condominio_access
CREATE POLICY "Admins podem gerenciar acessos condomínio"
ON public.user_condominio_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver seus próprios acessos"
ON public.user_condominio_access
FOR SELECT
USING (auth.uid() = user_id);

-- 10. Políticas para user_unidade_access
CREATE POLICY "Admins e gerentes podem gerenciar acessos unidade"
ON public.user_unidade_access
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE uca.user_id = auth.uid() AND uua.id = user_unidade_access.id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid() AND u.id = user_unidade_access.unidade_id
  )
);

CREATE POLICY "Moradores podem ver seus próprios acessos"
ON public.user_unidade_access
FOR SELECT
USING (auth.uid() = user_id);

-- 11. Política para admins gerenciarem roles
CREATE POLICY "Admins podem inserir roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));