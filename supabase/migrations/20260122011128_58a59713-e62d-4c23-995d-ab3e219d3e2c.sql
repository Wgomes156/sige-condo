-- Adicionar campos de proprietário, inquilino e responsável financeiro na tabela unidades
ALTER TABLE public.unidades
ADD COLUMN IF NOT EXISTS proprietario_nome text,
ADD COLUMN IF NOT EXISTS proprietario_cpf text,
ADD COLUMN IF NOT EXISTS proprietario_telefone text,
ADD COLUMN IF NOT EXISTS proprietario_email text,
ADD COLUMN IF NOT EXISTS inquilino_nome text,
ADD COLUMN IF NOT EXISTS inquilino_cpf text,
ADD COLUMN IF NOT EXISTS inquilino_telefone text,
ADD COLUMN IF NOT EXISTS inquilino_email text,
ADD COLUMN IF NOT EXISTS resp_financeiro_nome text,
ADD COLUMN IF NOT EXISTS resp_financeiro_cpf text,
ADD COLUMN IF NOT EXISTS resp_financeiro_telefone text,
ADD COLUMN IF NOT EXISTS resp_financeiro_email text,
ADD COLUMN IF NOT EXISTS resp_financeiro_opcao_envio text DEFAULT 'email';

-- Comentários para documentação
COMMENT ON COLUMN public.unidades.proprietario_nome IS 'Nome completo do proprietário';
COMMENT ON COLUMN public.unidades.proprietario_cpf IS 'CPF do proprietário';
COMMENT ON COLUMN public.unidades.proprietario_telefone IS 'Telefone do proprietário';
COMMENT ON COLUMN public.unidades.proprietario_email IS 'E-mail do proprietário';
COMMENT ON COLUMN public.unidades.inquilino_nome IS 'Nome completo do inquilino';
COMMENT ON COLUMN public.unidades.inquilino_cpf IS 'CPF do inquilino';
COMMENT ON COLUMN public.unidades.inquilino_telefone IS 'Telefone do inquilino';
COMMENT ON COLUMN public.unidades.inquilino_email IS 'E-mail do inquilino';
COMMENT ON COLUMN public.unidades.resp_financeiro_nome IS 'Nome do responsável financeiro para envio de boleto';
COMMENT ON COLUMN public.unidades.resp_financeiro_cpf IS 'CPF do responsável financeiro';
COMMENT ON COLUMN public.unidades.resp_financeiro_telefone IS 'Telefone do responsável financeiro';
COMMENT ON COLUMN public.unidades.resp_financeiro_email IS 'E-mail do responsável financeiro';
COMMENT ON COLUMN public.unidades.resp_financeiro_opcao_envio IS 'Opção de envio de boleto: impresso, whatsapp, email, sms';