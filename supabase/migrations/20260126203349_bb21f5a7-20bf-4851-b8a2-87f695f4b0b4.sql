-- ====================================
-- MÓDULO DE ACORDOS DE PAGAMENTO
-- ====================================

-- Enum para status do acordo
CREATE TYPE public.acordo_status AS ENUM (
  'em_negociacao', 
  'ativo', 
  'quitado', 
  'rompido', 
  'cancelado'
);

-- Enum para status da parcela
CREATE TYPE public.acordo_parcela_status AS ENUM (
  'pendente', 
  'paga', 
  'atrasada', 
  'cancelada'
);

-- Enum para forma de pagamento
CREATE TYPE public.acordo_forma_pagamento AS ENUM (
  'avista', 
  'parcelado'
);

-- Enum para método de pagamento
CREATE TYPE public.acordo_metodo_pagamento AS ENUM (
  'boleto', 
  'pix', 
  'cartao', 
  'debito_automatico', 
  'dinheiro', 
  'transferencia'
);

-- Enum para tipo de ação no histórico
CREATE TYPE public.acordo_tipo_acao AS ENUM (
  'criacao', 
  'edicao', 
  'assinatura', 
  'pagamento_parcela', 
  'atraso_parcela', 
  'quitacao', 
  'rompimento', 
  'cancelamento',
  'contato_realizado', 
  'acao_agendada', 
  'desconto_aplicado',
  'documento_anexado'
);

-- Enum para tipo de alerta
CREATE TYPE public.acordo_tipo_alerta AS ENUM (
  'vencimento_proximo', 
  'parcela_vencida', 
  'risco_rompimento',
  'acao_agendada', 
  'documento_pendente', 
  'contato_necessario'
);

-- Enum para prioridade de alerta
CREATE TYPE public.acordo_prioridade AS ENUM (
  'baixa', 
  'media', 
  'alta', 
  'critica'
);

-- ====================================
-- TABELA PRINCIPAL: ACORDOS
-- ====================================
CREATE TABLE public.acordos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_acordo VARCHAR(50) UNIQUE NOT NULL,
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE RESTRICT,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE RESTRICT,
  
  -- Status e Controle
  status public.acordo_status DEFAULT 'em_negociacao',
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_assinatura DATE,
  data_quitacao DATE,
  data_rompimento DATE,
  motivo_rompimento TEXT,
  
  -- Responsáveis
  responsavel_negociacao_id UUID REFERENCES auth.users(id),
  responsavel_acompanhamento_id UUID REFERENCES auth.users(id),
  cliente_nome VARCHAR(255) NOT NULL,
  cliente_cpf_cnpj VARCHAR(18) NOT NULL,
  cliente_telefone VARCHAR(20),
  cliente_email VARCHAR(255),
  
  -- Valores da Dívida Original
  valor_total_divida DECIMAL(12,2) NOT NULL,
  valor_principal DECIMAL(12,2) NOT NULL,
  valor_juros DECIMAL(12,2) DEFAULT 0,
  valor_multa DECIMAL(12,2) DEFAULT 0,
  valor_correcao DECIMAL(12,2) DEFAULT 0,
  periodo_divida_inicio DATE,
  periodo_divida_fim DATE,
  dias_atraso INTEGER,
  
  -- Condições do Acordo
  valor_total_negociado DECIMAL(12,2) NOT NULL,
  desconto_juros DECIMAL(12,2) DEFAULT 0,
  desconto_multa DECIMAL(12,2) DEFAULT 0,
  desconto_correcao DECIMAL(12,2) DEFAULT 0,
  desconto_avista DECIMAL(12,2) DEFAULT 0,
  desconto_total DECIMAL(12,2) DEFAULT 0,
  percentual_desconto DECIMAL(5,2),
  
  -- Forma de Pagamento
  forma_pagamento public.acordo_forma_pagamento NOT NULL,
  qtd_parcelas INTEGER DEFAULT 1,
  valor_entrada DECIMAL(12,2) DEFAULT 0,
  valor_parcela DECIMAL(12,2),
  data_primeiro_vencimento DATE,
  dia_vencimento INTEGER,
  metodo_pagamento public.acordo_metodo_pagamento,
  
  -- Documentação
  termo_acordo_url VARCHAR(500),
  termo_assinado BOOLEAN DEFAULT false,
  aceite_digital BOOLEAN DEFAULT false,
  aceite_ip VARCHAR(50),
  aceite_data_hora TIMESTAMPTZ,
  
  -- Observações
  observacoes_internas TEXT,
  observacoes_cliente TEXT,
  
  -- Controle de Acompanhamento
  data_ultimo_contato DATE,
  proxima_acao_agendada DATE,
  proxima_acao_descricao VARCHAR(255),
  
  -- Indicadores
  valor_recuperado DECIMAL(12,2) DEFAULT 0,
  valor_pendente DECIMAL(12,2),
  parcelas_pagas INTEGER DEFAULT 0,
  parcelas_atrasadas INTEGER DEFAULT 0,
  probabilidade_rompimento DECIMAL(5,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- TABELA: PARCELAS DE ORIGEM (BOLETOS)
-- ====================================
CREATE TABLE public.acordo_parcelas_origem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id UUID NOT NULL REFERENCES public.acordos(id) ON DELETE CASCADE,
  
  -- Referência ao boleto original
  boleto_id UUID REFERENCES public.boletos(id) ON DELETE SET NULL,
  numero_parcela VARCHAR(50),
  competencia DATE,
  
  -- Valores
  valor_original DECIMAL(12,2) NOT NULL,
  valor_juros DECIMAL(12,2) DEFAULT 0,
  valor_multa DECIMAL(12,2) DEFAULT 0,
  valor_correcao DECIMAL(12,2) DEFAULT 0,
  valor_total DECIMAL(12,2) NOT NULL,
  
  -- Datas
  data_vencimento_original DATE,
  dias_atraso INTEGER,
  
  -- Controle
  incluida_acordo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- TABELA: PARCELAS NEGOCIADAS
-- ====================================
CREATE TABLE public.acordo_parcelas_negociadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id UUID NOT NULL REFERENCES public.acordos(id) ON DELETE CASCADE,
  
  -- Identificação
  numero_parcela INTEGER NOT NULL,
  descricao VARCHAR(255),
  
  -- Valores
  valor_parcela DECIMAL(12,2) NOT NULL,
  valor_pago DECIMAL(12,2) DEFAULT 0,
  
  -- Datas
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  -- Status
  status public.acordo_parcela_status DEFAULT 'pendente',
  dias_atraso INTEGER DEFAULT 0,
  
  -- Pagamento
  metodo_pagamento VARCHAR(50),
  comprovante_url VARCHAR(500),
  codigo_transacao VARCHAR(100),
  
  -- Controle
  enviado_cobranca BOOLEAN DEFAULT false,
  data_envio_cobranca DATE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- TABELA: HISTÓRICO DO ACORDO
-- ====================================
CREATE TABLE public.acordo_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id UUID NOT NULL REFERENCES public.acordos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Ação
  tipo_acao public.acordo_tipo_acao NOT NULL,
  descricao TEXT NOT NULL,
  
  -- Dados da ação
  dados_anteriores JSONB,
  dados_novos JSONB,
  
  -- Detalhes adicionais
  parcela_id UUID REFERENCES public.acordo_parcelas_negociadas(id) ON DELETE SET NULL,
  valor_envolvido DECIMAL(12,2),
  
  -- Controle
  ip_origem VARCHAR(50),
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- TABELA: ALERTAS DO ACORDO
-- ====================================
CREATE TABLE public.acordo_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acordo_id UUID NOT NULL REFERENCES public.acordos(id) ON DELETE CASCADE,
  
  -- Tipo de Alerta
  tipo_alerta public.acordo_tipo_alerta NOT NULL,
  
  -- Configuração
  dias_antecedencia INTEGER,
  prioridade public.acordo_prioridade DEFAULT 'media',
  
  -- Status
  enviado BOOLEAN DEFAULT false,
  data_envio TIMESTAMPTZ,
  lido BOOLEAN DEFAULT false,
  data_leitura TIMESTAMPTZ,
  
  -- Destinatários
  destinatario_usuario_id UUID REFERENCES auth.users(id),
  destinatario_email VARCHAR(255),
  destinatario_telefone VARCHAR(20),
  
  -- Conteúdo
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Ação sugerida
  acao_sugerida VARCHAR(255),
  url_acao VARCHAR(500),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================
-- FUNÇÃO: GERAR NÚMERO DO ACORDO
-- ====================================
CREATE OR REPLACE FUNCTION public.gerar_numero_acordo()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano TEXT;
  mes TEXT;
  sequencia INT;
  numero TEXT;
BEGIN
  ano := to_char(CURRENT_DATE, 'YYYY');
  mes := to_char(CURRENT_DATE, 'MM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_acordo FROM 'AC-\d{6}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM acordos
  WHERE numero_acordo LIKE 'AC-' || ano || mes || '-%';
  
  numero := 'AC-' || ano || mes || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN numero;
END;
$$;

-- ====================================
-- FUNÇÃO: VERIFICAR ACESSO AO ACORDO
-- ====================================
CREATE OR REPLACE FUNCTION public.has_acordo_access(_user_id UUID, _acordo_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.acordos a
    JOIN public.user_condominio_access uca ON uca.condominio_id = a.condominio_id
    WHERE a.id = _acordo_id AND uca.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.acordos
    WHERE id = _acordo_id AND (responsavel_negociacao_id = _user_id OR responsavel_acompanhamento_id = _user_id)
  );
$$;

-- ====================================
-- TRIGGER: ATUALIZAR updated_at
-- ====================================
CREATE TRIGGER update_acordos_updated_at
  BEFORE UPDATE ON public.acordos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_acordo_parcelas_negociadas_updated_at
  BEFORE UPDATE ON public.acordo_parcelas_negociadas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================
-- ÍNDICES
-- ====================================
CREATE INDEX idx_acordos_numero ON public.acordos(numero_acordo);
CREATE INDEX idx_acordos_unidade ON public.acordos(unidade_id);
CREATE INDEX idx_acordos_condominio ON public.acordos(condominio_id);
CREATE INDEX idx_acordos_status ON public.acordos(status);
CREATE INDEX idx_acordos_data_criacao ON public.acordos(data_criacao);
CREATE INDEX idx_acordos_responsavel ON public.acordos(responsavel_acompanhamento_id);

CREATE INDEX idx_acordo_parcelas_origem_acordo ON public.acordo_parcelas_origem(acordo_id);
CREATE INDEX idx_acordo_parcelas_negociadas_acordo ON public.acordo_parcelas_negociadas(acordo_id);
CREATE INDEX idx_acordo_parcelas_negociadas_vencimento ON public.acordo_parcelas_negociadas(data_vencimento);
CREATE INDEX idx_acordo_parcelas_negociadas_status ON public.acordo_parcelas_negociadas(status);

CREATE INDEX idx_acordo_historico_acordo ON public.acordo_historico(acordo_id);
CREATE INDEX idx_acordo_historico_tipo ON public.acordo_historico(tipo_acao);

CREATE INDEX idx_acordo_alertas_acordo ON public.acordo_alertas(acordo_id);
CREATE INDEX idx_acordo_alertas_enviado ON public.acordo_alertas(enviado);
CREATE INDEX idx_acordo_alertas_prioridade ON public.acordo_alertas(prioridade);

-- ====================================
-- RLS: HABILITAR
-- ====================================
ALTER TABLE public.acordos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acordo_parcelas_origem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acordo_parcelas_negociadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acordo_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acordo_alertas ENABLE ROW LEVEL SECURITY;

-- ====================================
-- RLS: ACORDOS
-- ====================================
CREATE POLICY "Admin pode gerenciar todos os acordos"
  ON public.acordos FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente pode gerenciar acordos do seu condomínio"
  ON public.acordos FOR ALL
  USING (has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Operador pode visualizar acordos atribuídos"
  ON public.acordos FOR SELECT
  USING (
    responsavel_negociacao_id = auth.uid() OR 
    responsavel_acompanhamento_id = auth.uid()
  );

-- ====================================
-- RLS: PARCELAS ORIGEM
-- ====================================
CREATE POLICY "Visualizar parcelas origem permitidas"
  ON public.acordo_parcelas_origem FOR SELECT
  USING (has_acordo_access(auth.uid(), acordo_id));

CREATE POLICY "Criar parcelas origem permitidas"
  ON public.acordo_parcelas_origem FOR INSERT
  WITH CHECK (has_acordo_access(auth.uid(), acordo_id));

-- ====================================
-- RLS: PARCELAS NEGOCIADAS
-- ====================================
CREATE POLICY "Visualizar parcelas negociadas permitidas"
  ON public.acordo_parcelas_negociadas FOR SELECT
  USING (has_acordo_access(auth.uid(), acordo_id));

CREATE POLICY "Gerenciar parcelas negociadas permitidas"
  ON public.acordo_parcelas_negociadas FOR ALL
  USING (has_acordo_access(auth.uid(), acordo_id));

-- ====================================
-- RLS: HISTÓRICO
-- ====================================
CREATE POLICY "Visualizar histórico permitido"
  ON public.acordo_historico FOR SELECT
  USING (has_acordo_access(auth.uid(), acordo_id));

CREATE POLICY "Criar histórico permitido"
  ON public.acordo_historico FOR INSERT
  WITH CHECK (has_acordo_access(auth.uid(), acordo_id));

-- ====================================
-- RLS: ALERTAS
-- ====================================
CREATE POLICY "Admin pode gerenciar todos alertas"
  ON public.acordo_alertas FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Visualizar alertas permitidos"
  ON public.acordo_alertas FOR SELECT
  USING (
    has_acordo_access(auth.uid(), acordo_id) OR 
    destinatario_usuario_id = auth.uid()
  );

CREATE POLICY "Criar alertas permitidos"
  ON public.acordo_alertas FOR INSERT
  WITH CHECK (has_acordo_access(auth.uid(), acordo_id));

CREATE POLICY "Atualizar alertas próprios"
  ON public.acordo_alertas FOR UPDATE
  USING (destinatario_usuario_id = auth.uid());