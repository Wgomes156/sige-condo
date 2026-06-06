-- =====================================================
-- AUDITORIA DE PERFORMANCE: ÍNDICES ADICIONAIS
-- =====================================================

-- 1. Atendimentos: Busca por condomínio e status
CREATE INDEX IF NOT EXISTS idx_atendimentos_condominio ON public.atendimentos(condominio_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON public.atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON public.atendimentos(created_at DESC);

-- 2. Boletos: Composite index para performance em listagens financeiras
CREATE INDEX IF NOT EXISTS idx_boletos_status_vencimento ON public.boletos(status, data_vencimento);
CREATE INDEX IF NOT EXISTS idx_boletos_nosso_numero ON public.boletos(nosso_numero);

-- 3. Transações Financeiras: Busca por período e tipo
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes_financeiras(data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes_financeiras(tipo);

-- 4. Audit Logs: Filtro por entidade
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- 5. Unidades: Busca por bloco e código
CREATE INDEX IF NOT EXISTS idx_unidades_bloco_codigo ON public.unidades(condominio_id, bloco, codigo);

-- 6. Moradores: Busca por CPF
CREATE INDEX IF NOT EXISTS idx_moradores_cpf ON public.moradores_unidade(cpf);
