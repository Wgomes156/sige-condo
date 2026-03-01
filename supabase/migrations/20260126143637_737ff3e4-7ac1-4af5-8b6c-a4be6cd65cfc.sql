
-- Criar enum para tipo de valor
CREATE TYPE public.tipo_valor_servico AS ENUM ('fixo', 'percentual', 'variavel');

-- Tabela de categorias de serviço
CREATE TABLE public.categorias_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_categoria TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'Package',
  cor TEXT DEFAULT '#3B82F6',
  ordem_exibicao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE public.servicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES public.categorias_servico(id) ON DELETE SET NULL,
  nome_servico TEXT NOT NULL,
  descricao TEXT,
  valor TEXT NOT NULL,
  tipo_valor tipo_valor_servico DEFAULT 'fixo',
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de histórico de alterações de serviços (auditoria)
CREATE TABLE public.servicos_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  servico_id UUID REFERENCES public.servicos(id) ON DELETE CASCADE,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  alterado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_servicos_categoria ON public.servicos(categoria_id);
CREATE INDEX idx_servicos_nome ON public.servicos(nome_servico);
CREATE INDEX idx_servicos_ativo ON public.servicos(ativo);
CREATE INDEX idx_servicos_historico_servico ON public.servicos_historico(servico_id);

-- Enable RLS
ALTER TABLE public.categorias_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos_historico ENABLE ROW LEVEL SECURITY;

-- RLS Policies para categorias_servico
CREATE POLICY "Categorias visíveis para autenticados"
  ON public.categorias_servico FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar categorias"
  ON public.categorias_servico FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies para servicos
CREATE POLICY "Serviços visíveis para autenticados"
  ON public.servicos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar serviços"
  ON public.servicos FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies para histórico
CREATE POLICY "Histórico visível para admin"
  ON public.servicos_historico FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Histórico criável por autenticados"
  ON public.servicos_historico FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_categorias_servico_updated_at
  BEFORE UPDATE ON public.categorias_servico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir categorias iniciais
INSERT INTO public.categorias_servico (nome_categoria, descricao, icone, cor, ordem_exibicao) VALUES
  ('Administração Condominial', 'Serviços de gestão e administração de condomínios', 'Building2', '#3B82F6', 1),
  ('Locação de Imóveis', 'Serviços relacionados a locação e gestão de aluguéis', 'Key', '#10B981', 2),
  ('Serviços Adicionais', 'Serviços complementares e sob demanda', 'Plus', '#8B5CF6', 3);

-- Inserir serviços iniciais
INSERT INTO public.servicos (categoria_id, nome_servico, descricao, valor, tipo_valor)
SELECT 
  c.id,
  s.nome,
  s.descricao,
  s.valor,
  s.tipo::tipo_valor_servico
FROM public.categorias_servico c
CROSS JOIN (
  VALUES
    -- Administração Condominial
    ('Administração Condominial', 'Taxa de Administração', 'Gestão completa do condomínio incluindo financeiro, pessoal e manutenção', '5% a 10% da arrecadação', 'percentual'),
    ('Administração Condominial', 'Assessoria Contábil', 'Contabilidade completa, balancetes e prestação de contas', 'R$ 800 a R$ 2.000/mês', 'fixo'),
    ('Administração Condominial', 'Gestão de Pessoal', 'Folha de pagamento, admissão, demissão e encargos', 'R$ 150 a R$ 300/funcionário', 'fixo'),
    ('Administração Condominial', 'Cobrança de Inadimplentes', 'Notificações, acordos e acompanhamento jurídico', '10% a 20% do valor recuperado', 'percentual'),
    ('Administração Condominial', 'Assembleia Ordinária', 'Organização, condução e ata de assembleia', 'R$ 300 a R$ 800/evento', 'fixo'),
    ('Administração Condominial', 'Assembleia Extraordinária', 'Assembleia para temas específicos e urgentes', 'R$ 400 a R$ 1.000/evento', 'fixo'),
    ('Administração Condominial', 'Consultoria Jurídica', 'Orientação legal para questões condominiais', 'R$ 200 a R$ 500/consulta', 'variavel'),
    ('Administração Condominial', 'Gestão de Contratos', 'Análise, negociação e acompanhamento de contratos', 'Incluso na taxa ou R$ 100/contrato', 'variavel'),
    -- Locação de Imóveis
    ('Locação de Imóveis', 'Administração de Locação', 'Gestão completa do imóvel locado', '8% a 12% do aluguel', 'percentual'),
    ('Locação de Imóveis', 'Taxa de Intermediação', 'Captação de inquilino e formalização do contrato', '1 aluguel (equivalente)', 'fixo'),
    ('Locação de Imóveis', 'Vistoria de Entrada', 'Documentação detalhada do estado do imóvel', 'R$ 200 a R$ 500', 'fixo'),
    ('Locação de Imóveis', 'Vistoria de Saída', 'Comparação com vistoria inicial e apuração de danos', 'R$ 200 a R$ 500', 'fixo'),
    ('Locação de Imóveis', 'Renovação de Contrato', 'Análise de mercado e renegociação de valores', 'R$ 150 a R$ 400', 'fixo'),
    ('Locação de Imóveis', 'Rescisão Contratual', 'Cálculos, quitação e documentação', 'R$ 200 a R$ 500', 'fixo'),
    ('Locação de Imóveis', 'Cobrança de Aluguel', 'Emissão de boletos e acompanhamento de pagamentos', 'Incluso ou R$ 30/boleto', 'variavel'),
    ('Locação de Imóveis', 'Análise de Ficha Cadastral', 'Verificação de crédito e referências do inquilino', 'R$ 100 a R$ 250', 'fixo'),
    -- Serviços Adicionais
    ('Serviços Adicionais', 'Implantação de Condomínio', 'Setup inicial, convenção e regimento interno', 'R$ 2.000 a R$ 5.000', 'fixo'),
    ('Serviços Adicionais', 'Auditoria Condominial', 'Análise completa das contas e processos', 'R$ 1.500 a R$ 4.000', 'fixo'),
    ('Serviços Adicionais', 'Previsão Orçamentária', 'Elaboração de orçamento anual detalhado', 'R$ 500 a R$ 1.500', 'fixo'),
    ('Serviços Adicionais', 'Certidões e Documentos', 'Obtenção de certidões negativas e documentos', 'R$ 50 a R$ 200/documento', 'variavel'),
    ('Serviços Adicionais', 'Mediação de Conflitos', 'Resolução de disputas entre moradores', 'R$ 200 a R$ 600/sessão', 'variavel'),
    ('Serviços Adicionais', 'Consultoria de Obras', 'Acompanhamento técnico de reformas', '3% a 5% do valor da obra', 'percentual'),
    ('Serviços Adicionais', 'Seguro Condominial', 'Cotação e gestão de apólices', 'Incluso ou comissão da seguradora', 'variavel'),
    ('Serviços Adicionais', 'Digitalização de Documentos', 'Organização e digitalização de arquivo', 'R$ 0,50 a R$ 2,00/página', 'variavel')
) AS s(categoria, nome, descricao, valor, tipo)
WHERE c.nome_categoria = s.categoria;
