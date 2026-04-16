-- Adiciona suporte a Chave Pix nas contas bancárias
ALTER TABLE contas_bancarias
  ADD COLUMN IF NOT EXISTS chave_pix TEXT,
  ADD COLUMN IF NOT EXISTS tipo_chave_pix TEXT;

-- Adiciona campos de encargos, desconto e instrucoes nos boletos
ALTER TABLE boletos
  ADD COLUMN IF NOT EXISTS multa_percentual NUMERIC DEFAULT 2,
  ADD COLUMN IF NOT EXISTS juros_dia NUMERIC DEFAULT 0.033,
  ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC,
  ADD COLUMN IF NOT EXISTS desconto_ate DATE,
  ADD COLUMN IF NOT EXISTS instrucoes TEXT;

-- Comentários
COMMENT ON COLUMN contas_bancarias.chave_pix IS 'Chave Pix (CPF, CNPJ, e-mail, telefone ou aleatória)';
COMMENT ON COLUMN contas_bancarias.tipo_chave_pix IS 'Tipo da chave Pix: cpf, cnpj, email, telefone, aleatoria';
COMMENT ON COLUMN boletos.multa_percentual IS 'Percentual de multa por atraso (default 2%)';
COMMENT ON COLUMN boletos.juros_dia IS 'Juros ao dia (default 0.033%)';
COMMENT ON COLUMN boletos.desconto_valor IS 'Valor do desconto se pago antes da data de desconto';
COMMENT ON COLUMN boletos.desconto_ate IS 'Data limite para aplicar o desconto';
COMMENT ON COLUMN boletos.instrucoes IS 'Instruções para o banco / sacado';
