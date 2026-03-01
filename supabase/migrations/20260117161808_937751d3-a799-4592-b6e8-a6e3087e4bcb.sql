-- Tabela de unidades/moradores para cada condomínio
CREATE TABLE public.unidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  bloco VARCHAR(50),
  morador_nome VARCHAR(255),
  morador_email VARCHAR(255),
  morador_telefone VARCHAR(20),
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(condominio_id, codigo, bloco)
);

-- Configuração de cobrança recorrente por condomínio
CREATE TABLE public.configuracoes_cobranca (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE UNIQUE,
  valor_padrao DECIMAL(12, 2) NOT NULL DEFAULT 0,
  dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento >= 1 AND dia_vencimento <= 28),
  categoria_id UUID REFERENCES public.categorias_financeiras(id),
  descricao_padrao VARCHAR(255) DEFAULT 'Taxa Condominial',
  ativa BOOLEAN DEFAULT true,
  ultima_geracao DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de geração de boletos
CREATE TABLE public.historico_geracao_boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  referencia VARCHAR(50) NOT NULL,
  quantidade_boletos INTEGER NOT NULL DEFAULT 0,
  valor_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'sucesso',
  mensagem_erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_unidades_condominio ON public.unidades(condominio_id);
CREATE INDEX idx_unidades_ativa ON public.unidades(ativa);
CREATE INDEX idx_configuracoes_cobranca_ativa ON public.configuracoes_cobranca(ativa);
CREATE INDEX idx_historico_geracao_condominio ON public.historico_geracao_boletos(condominio_id);

-- Trigger para updated_at
CREATE TRIGGER update_unidades_updated_at
  BEFORE UPDATE ON public.unidades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_cobranca_updated_at
  BEFORE UPDATE ON public.configuracoes_cobranca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_geracao_boletos ENABLE ROW LEVEL SECURITY;

-- Políticas para unidades
CREATE POLICY "Usuários autenticados podem ver unidades"
  ON public.unidades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar unidades"
  ON public.unidades FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar unidades"
  ON public.unidades FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar unidades"
  ON public.unidades FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para configurações de cobrança
CREATE POLICY "Usuários autenticados podem ver configurações"
  ON public.configuracoes_cobranca FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar configurações"
  ON public.configuracoes_cobranca FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar configurações"
  ON public.configuracoes_cobranca FOR UPDATE
  TO authenticated
  USING (true);

-- Políticas para histórico
CREATE POLICY "Usuários autenticados podem ver histórico"
  ON public.historico_geracao_boletos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Inserção de histórico permitida"
  ON public.historico_geracao_boletos FOR INSERT
  TO authenticated
  WITH CHECK (true);