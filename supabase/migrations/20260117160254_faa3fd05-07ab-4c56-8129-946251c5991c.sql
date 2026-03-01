-- Criar tabela de transações financeiras
CREATE TABLE transacoes_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_financeiras(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  forma_pagamento TEXT,
  documento TEXT,
  unidade TEXT,
  morador_nome TEXT,
  observacoes TEXT,
  recorrente BOOLEAN DEFAULT false,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('mensal', 'trimestral', 'semestral', 'anual')),
  criado_por UUID,
  criado_por_nome TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_transacoes_financeiras_updated_at
  BEFORE UPDATE ON transacoes_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_transacoes_condominio ON transacoes_financeiras(condominio_id);
CREATE INDEX idx_transacoes_vencimento ON transacoes_financeiras(data_vencimento);
CREATE INDEX idx_transacoes_status ON transacoes_financeiras(status);
CREATE INDEX idx_transacoes_tipo ON transacoes_financeiras(tipo);

-- Adicionar categorias de despesa que faltam
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor) VALUES
  ('Manutenção', 'despesa', 'Serviços de manutenção predial', '#ef4444'),
  ('Limpeza', 'despesa', 'Serviços de limpeza', '#ec4899'),
  ('Segurança', 'despesa', 'Serviços de segurança e portaria', '#f59e0b'),
  ('Energia', 'despesa', 'Conta de luz áreas comuns', '#eab308'),
  ('Água', 'despesa', 'Conta de água áreas comuns', '#3b82f6'),
  ('Fornecedores', 'despesa', 'Pagamentos a fornecedores', '#6b7280');

-- Políticas RLS para transacoes_financeiras
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver transacoes"
  ON transacoes_financeiras FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios podem criar transacoes"
  ON transacoes_financeiras FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios podem atualizar transacoes"
  ON transacoes_financeiras FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins podem deletar transacoes"
  ON transacoes_financeiras FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));