
-- Enum para status da proposta
CREATE TYPE proposta_status AS ENUM ('rascunho', 'enviada', 'em_analise', 'aprovada', 'recusada', 'expirada');

-- Enum para tipo de condomínio
CREATE TYPE condominio_tipo AS ENUM ('residencial', 'comercial', 'misto');

-- Enum para tipo de pacote
CREATE TYPE pacote_tipo AS ENUM ('basico', 'intermediario', 'completo', 'personalizado');

-- Enum para modelo de cobrança
CREATE TYPE cobranca_modelo AS ENUM ('por_unidade', 'valor_minimo', 'percentual', 'fixo_mensal', 'misto');

-- Enum para tipo de assinante
CREATE TYPE tipo_assinante AS ENUM ('sindico', 'administradora', 'testemunha');

-- Tabela principal de propostas
CREATE TABLE public.propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_proposta VARCHAR(50) UNIQUE NOT NULL,
  status proposta_status DEFAULT 'rascunho',
  
  -- Dados do Condomínio
  condominio_nome VARCHAR(255) NOT NULL,
  condominio_tipo condominio_tipo NOT NULL,
  condominio_endereco TEXT,
  condominio_cidade VARCHAR(100),
  condominio_estado CHAR(2),
  condominio_cep VARCHAR(10),
  condominio_qtd_unidades INT NOT NULL DEFAULT 1,
  condominio_qtd_blocos INT,
  condominio_qtd_funcionarios INT DEFAULT 0,
  condominio_estrutura JSONB,
  condominio_sindico_nome VARCHAR(255),
  condominio_sindico_telefone VARCHAR(20),
  condominio_sindico_email VARCHAR(255),
  condominio_cnpj VARCHAR(18),
  
  -- Responsável pela Contratação
  responsavel_nome VARCHAR(255) NOT NULL,
  responsavel_cargo VARCHAR(100),
  responsavel_telefone VARCHAR(20) NOT NULL,
  responsavel_email VARCHAR(255) NOT NULL,
  responsavel_contato_preferido VARCHAR(20) DEFAULT 'email',
  
  -- Tipo de Pacote
  pacote_tipo pacote_tipo NOT NULL DEFAULT 'basico',
  
  -- Modelo de Cobrança
  cobranca_modelo cobranca_modelo DEFAULT 'por_unidade',
  cobranca_valor_por_unidade DECIMAL(10,2),
  cobranca_valor_minimo DECIMAL(10,2),
  cobranca_percentual DECIMAL(5,2),
  cobranca_valor_fixo DECIMAL(10,2),
  
  -- Valores da Proposta
  valor_administracao DECIMAL(10,2) DEFAULT 0,
  valor_rh DECIMAL(10,2) DEFAULT 0,
  valor_sindico_profissional DECIMAL(10,2) DEFAULT 0,
  valor_servicos_extras DECIMAL(10,2) DEFAULT 0,
  valor_pacote DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Descrição
  resumo_servicos TEXT,
  diferenciais TEXT,
  observacoes TEXT,
  sla_atendimento VARCHAR(255),
  
  -- Prazo e Validade
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_validade DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  previsao_inicio_servicos DATE,
  
  -- Controle
  criado_por UUID REFERENCES auth.users(id),
  aprovado_por UUID REFERENCES auth.users(id),
  data_aprovacao TIMESTAMPTZ,
  motivo_recusa TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de serviços da proposta (vinculada à tabela servicos existente)
CREATE TABLE public.proposta_servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  servico_id UUID REFERENCES public.servicos(id),
  categoria_id UUID REFERENCES public.categorias_servico(id),
  servico_nome VARCHAR(255) NOT NULL,
  servico_descricao TEXT,
  selecionado BOOLEAN DEFAULT false,
  valor_unitario DECIMAL(10,2) DEFAULT 0,
  quantidade INT DEFAULT 1,
  valor_total DECIMAL(10,2) DEFAULT 0,
  personalizado BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de documentos da proposta
CREATE TABLE public.proposta_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(100) NOT NULL,
  nome_arquivo VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  tamanho_kb INT,
  obrigatorio BOOLEAN DEFAULT false,
  enviado BOOLEAN DEFAULT false,
  data_envio TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de histórico da proposta
CREATE TABLE public.proposta_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id),
  acao VARCHAR(100) NOT NULL,
  descricao TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de assinaturas da proposta
CREATE TABLE public.proposta_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id UUID NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  tipo_assinante tipo_assinante NOT NULL,
  nome_assinante VARCHAR(255) NOT NULL,
  cargo VARCHAR(100),
  assinatura_digital TEXT,
  ip_assinatura VARCHAR(50),
  data_assinatura TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_propostas_status ON public.propostas(status);
CREATE INDEX idx_propostas_condominio ON public.propostas(condominio_nome);
CREATE INDEX idx_propostas_data_emissao ON public.propostas(data_emissao);
CREATE INDEX idx_propostas_criado_por ON public.propostas(criado_por);
CREATE INDEX idx_proposta_servicos_proposta ON public.proposta_servicos(proposta_id);
CREATE INDEX idx_proposta_servicos_servico ON public.proposta_servicos(servico_id);
CREATE INDEX idx_proposta_historico_proposta ON public.proposta_historico(proposta_id);

-- Trigger para updated_at
CREATE TRIGGER update_propostas_updated_at
  BEFORE UPDATE ON public.propostas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposta_assinaturas ENABLE ROW LEVEL SECURITY;

-- RLS Policies para propostas
CREATE POLICY "Admin pode gerenciar todas propostas"
  ON public.propostas FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente pode gerenciar propostas"
  ON public.propostas FOR ALL
  USING (has_role(auth.uid(), 'gerente'));

CREATE POLICY "Usuário pode ver suas próprias propostas"
  ON public.propostas FOR SELECT
  USING (criado_por = auth.uid());

CREATE POLICY "Usuário pode criar propostas"
  ON public.propostas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuário pode editar suas propostas em rascunho"
  ON public.propostas FOR UPDATE
  USING (criado_por = auth.uid() AND status = 'rascunho');

-- RLS Policies para proposta_servicos
CREATE POLICY "Acesso a serviços da proposta"
  ON public.proposta_servicos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = proposta_id
      AND (
        has_role(auth.uid(), 'admin') OR
        has_role(auth.uid(), 'gerente') OR
        p.criado_por = auth.uid()
      )
    )
  );

-- RLS Policies para proposta_documentos
CREATE POLICY "Acesso a documentos da proposta"
  ON public.proposta_documentos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = proposta_id
      AND (
        has_role(auth.uid(), 'admin') OR
        has_role(auth.uid(), 'gerente') OR
        p.criado_por = auth.uid()
      )
    )
  );

-- RLS Policies para proposta_historico
CREATE POLICY "Visualizar histórico da proposta"
  ON public.proposta_historico FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = proposta_id
      AND (
        has_role(auth.uid(), 'admin') OR
        has_role(auth.uid(), 'gerente') OR
        p.criado_por = auth.uid()
      )
    )
  );

CREATE POLICY "Criar histórico da proposta"
  ON public.proposta_historico FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies para proposta_assinaturas
CREATE POLICY "Acesso a assinaturas da proposta"
  ON public.proposta_assinaturas FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.propostas p
      WHERE p.id = proposta_id
      AND (
        has_role(auth.uid(), 'admin') OR
        has_role(auth.uid(), 'gerente') OR
        p.criado_por = auth.uid()
      )
    )
  );

-- Função para gerar número de proposta automático
CREATE OR REPLACE FUNCTION public.gerar_numero_proposta()
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
    CAST(SUBSTRING(numero_proposta FROM 'PROP-\d{6}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM propostas
  WHERE numero_proposta LIKE 'PROP-' || ano || mes || '-%';
  
  numero := 'PROP-' || ano || mes || '-' || LPAD(sequencia::TEXT, 4, '0');
  
  RETURN numero;
END;
$$;

-- Função para calcular valor total da proposta
CREATE OR REPLACE FUNCTION public.calcular_valor_total_proposta(proposta_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total DECIMAL(10,2) := 0;
  proposta RECORD;
  servicos_total DECIMAL(10,2) := 0;
BEGIN
  SELECT * INTO proposta FROM propostas WHERE id = proposta_uuid;
  
  -- Somar serviços selecionados
  SELECT COALESCE(SUM(valor_total), 0) INTO servicos_total
  FROM proposta_servicos
  WHERE proposta_id = proposta_uuid AND selecionado = true;
  
  -- Somar valores fixos
  total := servicos_total +
    COALESCE(proposta.valor_administracao, 0) +
    COALESCE(proposta.valor_rh, 0) +
    COALESCE(proposta.valor_sindico_profissional, 0) +
    COALESCE(proposta.valor_pacote, 0);
  
  -- Aplicar modelo de cobrança
  IF proposta.cobranca_modelo = 'por_unidade' AND proposta.cobranca_valor_por_unidade IS NOT NULL THEN
    total := proposta.condominio_qtd_unidades * proposta.cobranca_valor_por_unidade;
  END IF;
  
  -- Aplicar valor mínimo
  IF proposta.cobranca_valor_minimo IS NOT NULL AND total < proposta.cobranca_valor_minimo THEN
    total := proposta.cobranca_valor_minimo;
  END IF;
  
  RETURN total;
END;
$$;
