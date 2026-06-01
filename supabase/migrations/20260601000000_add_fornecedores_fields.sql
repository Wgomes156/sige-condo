-- Migration para adicionar novos campos em fornecedores
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS numero_fornecedor serial,
ADD COLUMN IF NOT EXISTS dados_bancarios text,
ADD COLUMN IF NOT EXISTS tipos_servico text[] DEFAULT '{}';
