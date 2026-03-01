
-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA PERMISSÕES GRANULARES
-- =====================================================

-- 1. CONDOMINIOS - Admin e Gerentes com acesso atribuído
DROP POLICY IF EXISTS "Authenticated users can view condominios" ON public.condominios;
DROP POLICY IF EXISTS "Authenticated users can insert condominios" ON public.condominios;
DROP POLICY IF EXISTS "Authenticated users can update condominios" ON public.condominios;

CREATE POLICY "Visualizar condominios permitidos"
ON public.condominios FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), id)
);

CREATE POLICY "Admins podem criar condominios"
ON public.condominios FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerenciar condominios permitidos"
ON public.condominios FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), id)
);

CREATE POLICY "Admins podem deletar condominios"
ON public.condominios FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. UNIDADES - Admin, Gerentes do condomínio e Moradores da unidade
DROP POLICY IF EXISTS "Usuários autenticados podem ver unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem criar unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar unidades" ON public.unidades;

CREATE POLICY "Visualizar unidades permitidas"
ON public.unidades FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id) OR
  has_unidade_access(auth.uid(), id)
);

CREATE POLICY "Admin e Gerentes podem criar unidades"
ON public.unidades FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar unidades"
ON public.unidades FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admins podem deletar unidades"
ON public.unidades FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. ORDENS DE SERVIÇO - Admin, Gerentes do condomínio e Operadores atribuídos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar todas as OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem criar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem deletar OS" ON public.ordens_servico;

CREATE POLICY "Visualizar OS permitidas"
ON public.ordens_servico FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  can_access_os(auth.uid(), id)
);

CREATE POLICY "Admin e Gerentes podem criar OS"
ON public.ordens_servico FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id))
);

CREATE POLICY "Gerenciar OS permitidas"
ON public.ordens_servico FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  can_access_os(auth.uid(), id)
);

CREATE POLICY "Admin pode deletar OS"
ON public.ordens_servico FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 4. BOLETOS - Admin, Gerentes do condomínio e Moradores (próprios boletos)
DROP POLICY IF EXISTS "Usuarios podem ver boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem criar boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem atualizar boletos" ON public.boletos;
DROP POLICY IF EXISTS "Admins podem deletar boletos" ON public.boletos;

-- Função auxiliar para verificar acesso ao boleto
CREATE OR REPLACE FUNCTION public.can_access_boleto(_user_id uuid, _boleto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.boletos b
    JOIN public.user_condominio_access uca ON uca.condominio_id = b.condominio_id
    WHERE b.id = _boleto_id AND uca.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.boletos b
    JOIN public.unidades u ON u.condominio_id = b.condominio_id AND u.codigo = b.unidade
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE b.id = _boleto_id AND uua.user_id = _user_id
  )
$$;

CREATE POLICY "Visualizar boletos permitidos"
ON public.boletos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id) OR
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = boletos.condominio_id 
    AND u.codigo = boletos.unidade
    AND uua.user_id = auth.uid()
  )
);

CREATE POLICY "Admin e Gerentes podem criar boletos"
ON public.boletos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar boletos"
ON public.boletos FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin pode deletar boletos"
ON public.boletos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 5. TRANSAÇÕES FINANCEIRAS
DROP POLICY IF EXISTS "Usuarios podem ver transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem criar transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem atualizar transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Admins podem deletar transacoes" ON public.transacoes_financeiras;

CREATE POLICY "Visualizar transacoes permitidas"
ON public.transacoes_financeiras FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar transacoes"
ON public.transacoes_financeiras FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar transacoes"
ON public.transacoes_financeiras FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin pode deletar transacoes"
ON public.transacoes_financeiras FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 6. ATENDIMENTOS
DROP POLICY IF EXISTS "Authenticated users can view atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Authenticated users can insert atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Authenticated users can update atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Admins can delete atendimentos" ON public.atendimentos;

CREATE POLICY "Visualizar atendimentos permitidos"
ON public.atendimentos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  operador_id = auth.uid()
);

CREATE POLICY "Admin, Gerentes e Operadores podem criar atendimentos"
ON public.atendimentos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'gerente') OR
  has_role(auth.uid(), 'operador')
);

CREATE POLICY "Gerenciar atendimentos permitidos"
ON public.atendimentos FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  operador_id = auth.uid()
);

CREATE POLICY "Admin pode deletar atendimentos"
ON public.atendimentos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 7. TABELAS RELACIONADAS A UNIDADES (moradores, veículos, etc.)
-- Aplicar mesma lógica: Admin, Gerente do condomínio ou Morador da unidade

-- MORADORES_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir moradores" ON public.moradores_unidade;

CREATE POLICY "Visualizar moradores permitidos"
ON public.moradores_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar moradores"
ON public.moradores_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar moradores"
ON public.moradores_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar moradores"
ON public.moradores_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VEICULOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir veículos" ON public.veiculos_unidade;

CREATE POLICY "Visualizar veiculos permitidos"
ON public.veiculos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar veiculos"
ON public.veiculos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar veiculos"
ON public.veiculos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar veiculos"
ON public.veiculos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VAGAS_GARAGEM
DROP POLICY IF EXISTS "Usuários autenticados podem ver vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem criar vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir vagas" ON public.vagas_garagem;

CREATE POLICY "Visualizar vagas permitidas"
ON public.vagas_garagem FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar vagas"
ON public.vagas_garagem FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar vagas"
ON public.vagas_garagem FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar vagas"
ON public.vagas_garagem FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ANIMAIS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir animais" ON public.animais_unidade;

CREATE POLICY "Visualizar animais permitidos"
ON public.animais_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar animais"
ON public.animais_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar animais"
ON public.animais_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar animais"
ON public.animais_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VISITANTES_AUTORIZADOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem criar visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir visitantes" ON public.visitantes_autorizados;

CREATE POLICY "Visualizar visitantes permitidos"
ON public.visitantes_autorizados FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar visitantes"
ON public.visitantes_autorizados FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar visitantes"
ON public.visitantes_autorizados FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar visitantes"
ON public.visitantes_autorizados FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ACESSOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir acessos" ON public.acessos_unidade;

CREATE POLICY "Visualizar acessos permitidos"
ON public.acessos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar acessos"
ON public.acessos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar acessos"
ON public.acessos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar acessos"
ON public.acessos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- PROPRIETARIOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir proprietários" ON public.proprietarios_unidade;

CREATE POLICY "Visualizar proprietarios permitidos"
ON public.proprietarios_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar proprietarios"
ON public.proprietarios_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar proprietarios"
ON public.proprietarios_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar proprietarios"
ON public.proprietarios_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- INQUILINOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir inquilinos" ON public.inquilinos_unidade;

CREATE POLICY "Visualizar inquilinos permitidos"
ON public.inquilinos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar inquilinos"
ON public.inquilinos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar inquilinos"
ON public.inquilinos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar inquilinos"
ON public.inquilinos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- DOCUMENTOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver documentos" ON public.documentos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar documentos" ON public.documentos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir documentos" ON public.documentos_unidade;

CREATE POLICY "Visualizar documentos permitidos"
ON public.documentos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar documentos"
ON public.documentos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar documentos"
ON public.documentos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- OCORRENCIAS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir ocorrências" ON public.ocorrencias_unidade;

CREATE POLICY "Visualizar ocorrencias permitidas"
ON public.ocorrencias_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar ocorrencias"
ON public.ocorrencias_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar ocorrencias"
ON public.ocorrencias_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar ocorrencias"
ON public.ocorrencias_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- CONFIGURACOES_COBRANCA
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações" ON public.configuracoes_cobranca;
DROP POLICY IF EXISTS "Usuários autenticados podem criar configurações" ON public.configuracoes_cobranca;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar configurações" ON public.configuracoes_cobranca;

CREATE POLICY "Visualizar configuracoes permitidas"
ON public.configuracoes_cobranca FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar configuracoes"
ON public.configuracoes_cobranca FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar configuracoes"
ON public.configuracoes_cobranca FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

-- HISTORICO_GERACAO_BOLETOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON public.historico_geracao_boletos;
DROP POLICY IF EXISTS "Inserção de histórico permitida" ON public.historico_geracao_boletos;

CREATE POLICY "Visualizar historico permitido"
ON public.historico_geracao_boletos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar historico"
ON public.historico_geracao_boletos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

-- ANEXOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar anexos" ON public.anexos;

CREATE POLICY "Visualizar anexos autenticados"
ON public.anexos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Criar anexos autenticados"
ON public.anexos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Deletar anexos admin"
ON public.anexos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- CATEGORIAS_FINANCEIRAS (leitura para todos autenticados, escrita admin)
DROP POLICY IF EXISTS "Usuarios podem ver categorias" ON public.categorias_financeiras;

CREATE POLICY "Visualizar categorias"
ON public.categorias_financeiras FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode criar categorias"
ON public.categorias_financeiras FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar categorias"
ON public.categorias_financeiras FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode deletar categorias"
ON public.categorias_financeiras FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ADMINISTRADORAS
DROP POLICY IF EXISTS "Authenticated users can view administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Authenticated users can insert administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Authenticated users can update administradoras" ON public.administradoras;

CREATE POLICY "Visualizar administradoras"
ON public.administradoras FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode criar administradoras"
ON public.administradoras FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar administradoras"
ON public.administradoras FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode deletar administradoras"
ON public.administradoras FOR DELETE
USING (has_role(auth.uid(), 'admin'));
