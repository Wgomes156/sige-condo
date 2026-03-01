-- Criar tabela de categorias financeiras
CREATE TABLE categorias_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT,
  cor TEXT DEFAULT '#1a365d',
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_categorias_financeiras_updated_at
  BEFORE UPDATE ON categorias_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Categorias padrão
INSERT INTO categorias_financeiras (nome, tipo, descricao, cor) VALUES
  ('Taxa Condominial', 'receita', 'Mensalidade do condomínio', '#10b981'),
  ('Fundo de Reserva', 'receita', 'Contribuição para fundo de reserva', '#06b6d4'),
  ('Multas', 'receita', 'Multas por infração de regras', '#f97316'),
  ('Reserva de Espaço', 'receita', 'Aluguel de salão de festas', '#8b5cf6');

-- Criar tabela de boletos
CREATE TABLE boletos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias_financeiras(id),
  unidade TEXT NOT NULL,
  morador_nome TEXT,
  morador_telefone TEXT,
  morador_email TEXT,
  valor DECIMAL(12,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  referencia TEXT NOT NULL,
  nosso_numero TEXT UNIQUE,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_boletos_updated_at
  BEFORE UPDATE ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_boletos_condominio ON boletos(condominio_id);
CREATE INDEX idx_boletos_vencimento ON boletos(data_vencimento);
CREATE INDEX idx_boletos_status ON boletos(status);
CREATE INDEX idx_boletos_unidade ON boletos(unidade);

-- Função para atualizar status de boletos atrasados
CREATE OR REPLACE FUNCTION atualizar_boletos_atrasados()
RETURNS INTEGER AS $$
DECLARE
  quantidade_atualizada INTEGER;
BEGIN
  UPDATE boletos
  SET status = 'atrasado', updated_at = now()
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
  
  GET DIAGNOSTICS quantidade_atualizada = ROW_COUNT;
  RETURN quantidade_atualizada;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Políticas RLS para categorias_financeiras
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver categorias"
  ON categorias_financeiras FOR SELECT TO authenticated USING (true);

-- Políticas RLS para boletos
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios podem ver boletos"
  ON boletos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios podem criar boletos"
  ON boletos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios podem atualizar boletos"
  ON boletos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Admins podem deletar boletos"
  ON boletos FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));