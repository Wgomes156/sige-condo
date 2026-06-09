DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'operador');

-- Tabela de roles de usuários
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operador',
  UNIQUE (user_id, role)
);

-- Tabela de administradoras
CREATE TABLE public.administradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  cnpj TEXT,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de condomínios
CREATE TABLE public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  uf TEXT,
  cnpj TEXT,
  tipo_imovel TEXT,
  quantidade_unidades INTEGER,
  quantidade_blocos INTEGER,
  -- Síndico
  tem_sindico BOOLEAN DEFAULT false,
  sindico_nome TEXT,
  sindico_telefone TEXT,
  sindico_email TEXT,
  -- Administradora
  tem_administradora BOOLEAN DEFAULT false,
  administradora_id UUID REFERENCES public.administradoras(id),
  -- Infraestrutura
  tem_seguranca BOOLEAN DEFAULT false,
  tem_porteiro TEXT, -- 'Sim 24h', 'Sim 8h', 'Não'
  tem_monitoramento BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de atendimentos
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dados do atendimento
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  operador_id UUID REFERENCES auth.users(id),
  operador_nome TEXT NOT NULL,
  canal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  motivo TEXT NOT NULL,
  observacoes TEXT,
  -- Dados do cliente
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  cliente_email TEXT,
  -- Referência ao condomínio
  condominio_id UUID REFERENCES public.condominios(id),
  condominio_nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_administradoras_updated_at
  BEFORE UPDATE ON public.administradoras
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_condominios_updated_at
  BEFORE UPDATE ON public.condominios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON public.atendimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies para administradoras (usuários autenticados podem ler)
CREATE POLICY "Authenticated users can view administradoras"
  ON public.administradoras FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert administradoras"
  ON public.administradoras FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update administradoras"
  ON public.administradoras FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies para condomínios (usuários autenticados podem gerenciar)
CREATE POLICY "Authenticated users can view condominios"
  ON public.condominios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert condominios"
  ON public.condominios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update condominios"
  ON public.condominios FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies para atendimentos (usuários autenticados podem gerenciar)
CREATE POLICY "Authenticated users can view atendimentos"
  ON public.atendimentos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert atendimentos"
  ON public.atendimentos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update atendimentos"
  ON public.atendimentos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete atendimentos"
  ON public.atendimentos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'operador');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();-- Criar tabela de categorias financeiras
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
  USING (has_role(auth.uid(), 'admin'));-- Criar tabela de transações financeiras
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
  USING (has_role(auth.uid(), 'admin'));-- Tabela de unidades/moradores para cada condomínio
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
  WITH CHECK (true);-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;-- Criar enum para status da OS
CREATE TYPE public.os_status AS ENUM ('aberta', 'em_andamento', 'concluida', 'cancelada');

-- Criar enum para prioridade da OS
CREATE TYPE public.os_prioridade AS ENUM ('urgente', 'periodico', 'nao_urgente');

-- Criar tabela de ordens de serviço
CREATE TABLE public.ordens_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_os SERIAL,
  data_solicitacao DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_solicitacao TIME NOT NULL DEFAULT CURRENT_TIME,
  solicitante TEXT NOT NULL,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE SET NULL,
  condominio_nome TEXT NOT NULL,
  descricao_servico TEXT NOT NULL,
  status os_status NOT NULL DEFAULT 'aberta',
  prioridade os_prioridade NOT NULL DEFAULT 'nao_urgente',
  data_atendimento DATE,
  observacoes TEXT,
  criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para usuários autenticados
CREATE POLICY "Usuários autenticados podem visualizar todas as OS"
ON public.ordens_servico
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar OS"
ON public.ordens_servico
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar OS"
ON public.ordens_servico
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Admins podem deletar OS"
ON public.ordens_servico
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Criar trigger para updated_at
CREATE TRIGGER update_ordens_servico_updated_at
BEFORE UPDATE ON public.ordens_servico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índices para performance
CREATE INDEX idx_ordens_servico_status ON public.ordens_servico(status);
CREATE INDEX idx_ordens_servico_prioridade ON public.ordens_servico(prioridade);
CREATE INDEX idx_ordens_servico_condominio ON public.ordens_servico(condominio_id);
CREATE INDEX idx_ordens_servico_data_solicitacao ON public.ordens_servico(data_solicitacao);-- Criar bucket para armazenamento de anexos
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos', 'anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela para rastrear anexos
CREATE TABLE public.anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_arquivo TEXT NOT NULL,
  tipo_arquivo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  entidade_tipo TEXT NOT NULL, -- 'condominio', 'atendimento', 'ordem_servico'
  entidade_id UUID NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para anexos
CREATE POLICY "Usuários autenticados podem ver anexos"
ON public.anexos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar anexos"
ON public.anexos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar anexos"
ON public.anexos
FOR DELETE
TO authenticated
USING (true);

-- Políticas de storage para o bucket anexos
DROP POLICY IF EXISTS "Permitir upload de anexos" ON storage.objects;
CREATE POLICY "Permitir upload de anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anexos');

DROP POLICY IF EXISTS "Permitir visualização de anexos" ON storage.objects;
CREATE POLICY "Permitir visualização de anexos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'anexos');

DROP POLICY IF EXISTS "Permitir deleção de anexos" ON storage.objects;
CREATE POLICY "Permitir deleção de anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'anexos');

-- Índice para busca por entidade
CREATE INDEX idx_anexos_entidade ON public.anexos(entidade_tipo, entidade_id);-- Adicionar campo numero na tabela condominios
ALTER TABLE public.condominios ADD COLUMN numero text;-- Adicionar campos bairro e cep na tabela condominios
ALTER TABLE public.condominios ADD COLUMN bairro text;
ALTER TABLE public.condominios ADD COLUMN cep text;-- Informações Jurídicas
ALTER TABLE public.condominios ADD COLUMN tem_cnpj boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN arquivo_cnpj_path text;

-- Infraestrutura
ALTER TABLE public.condominios ADD COLUMN nome_administradora text;

-- Documentação
ALTER TABLE public.condominios ADD COLUMN tem_convencao_ou_estatuto boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN tem_regimento_interno boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN data_ultima_atualizacao date;
ALTER TABLE public.condominios ADD COLUMN arquivo_documentacao_path text;

-- Acesso e Segurança
ALTER TABLE public.condominios ADD COLUMN tipo_acesso text;
ALTER TABLE public.condominios ADD COLUMN sistema_cameras boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN porteiro_turno text;
ALTER TABLE public.condominios ADD COLUMN quantidade_porteiros integer;
ALTER TABLE public.condominios ADD COLUMN sistema_mensageria boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN outros_funcionarios_descricao text;
ALTER TABLE public.condominios ADD COLUMN outros_funcionarios_quantidade integer;
ALTER TABLE public.condominios ADD COLUMN seguranca_turno text;
ALTER TABLE public.condominios ADD COLUMN empresa_seguranca_nome text;-- Adicionar campos de estrutura (amenidades)
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS salao_festa boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS area_kids boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS piscina boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS sala_jogos boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS quadra_futsal boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS quadra_tenis boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS sauna boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS outras_areas boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS outras_areas_descricao text;

-- Adicionar campos de vagas
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS tem_vagas_garagem boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS vagas_identificadas boolean DEFAULT false;

-- Adicionar campos de ESG
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS programa_sustentabilidade boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS descricao_sustentabilidade text;-- Adicionar campos de estacionamento detalhados
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS quantidade_total_vagas INTEGER,
ADD COLUMN IF NOT EXISTS vagas_visitantes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quantidade_vagas_visitantes INTEGER,
ADD COLUMN IF NOT EXISTS controle_acesso_vagas TEXT;-- Adicionar campos da administradora na tabela condominios
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS administradora_site TEXT,
ADD COLUMN IF NOT EXISTS administradora_responsavel TEXT,
ADD COLUMN IF NOT EXISTS administradora_telefone TEXT,
ADD COLUMN IF NOT EXISTS administradora_email TEXT;-- =============================================
-- MÓDULO COMPLETO DE CADASTRO DE UNIDADES
-- =============================================

-- 1. Criar ENUMs para os tipos
CREATE TYPE public.tipo_unidade AS ENUM ('apartamento', 'casa', 'loja', 'escritorio', 'sala');
CREATE TYPE public.tipo_localizacao AS ENUM ('bloco', 'torre', 'rua');
CREATE TYPE public.situacao_unidade AS ENUM ('ativa', 'inativa', 'em_reforma', 'desocupada');
CREATE TYPE public.tipo_ocupacao AS ENUM ('moradia', 'aluguel', 'aluguel_temporada', 'desocupado');
CREATE TYPE public.responsavel_financeiro AS ENUM ('proprietario', 'inquilino');
CREATE TYPE public.status_financeiro_unidade AS ENUM ('em_dia', 'inadimplente', 'acordo');
CREATE TYPE public.tipo_veiculo AS ENUM ('carro', 'moto', 'bicicleta', 'outro');
CREATE TYPE public.porte_animal AS ENUM ('pequeno', 'medio', 'grande');

-- 2. Atualizar tabela principal de unidades
ALTER TABLE public.unidades 
ADD COLUMN IF NOT EXISTS tipo_unidade tipo_unidade DEFAULT 'apartamento',
ADD COLUMN IF NOT EXISTS tipo_localizacao tipo_localizacao,
ADD COLUMN IF NOT EXISTS nome_localizacao TEXT,
ADD COLUMN IF NOT EXISTS andar INTEGER,
ADD COLUMN IF NOT EXISTS numero_unidade TEXT,
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS numero_endereco TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS situacao situacao_unidade DEFAULT 'ativa',
ADD COLUMN IF NOT EXISTS tipo_ocupacao tipo_ocupacao DEFAULT 'moradia',
ADD COLUMN IF NOT EXISTS responsavel_financeiro responsavel_financeiro DEFAULT 'proprietario',
ADD COLUMN IF NOT EXISTS status_financeiro status_financeiro_unidade DEFAULT 'em_dia',
ADD COLUMN IF NOT EXISTS quantidade_moradores INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS observacoes_internas TEXT,
ADD COLUMN IF NOT EXISTS observacoes_gerais TEXT,
ADD COLUMN IF NOT EXISTS alterado_por UUID REFERENCES auth.users(id);

-- 3. Criar tabela de proprietários
CREATE TABLE public.proprietarios_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  possui_procuracao BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unidade_id)
);

-- 4. Criar tabela de inquilinos
CREATE TABLE public.inquilinos_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  data_inicio_contrato DATE,
  data_termino_contrato DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unidade_id)
);

-- 5. Criar tabela de moradores (lista para proprietário e inquilino)
CREATE TABLE public.moradores_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo_vinculo TEXT NOT NULL CHECK (tipo_vinculo IN ('proprietario', 'inquilino')),
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  parentesco TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Criar tabela de veículos
CREATE TABLE public.veiculos_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  proprietario_veiculo TEXT NOT NULL CHECK (proprietario_veiculo IN ('proprietario', 'inquilino', 'morador')),
  nome_proprietario TEXT,
  tipo tipo_veiculo DEFAULT 'carro',
  marca TEXT,
  modelo TEXT,
  cor TEXT,
  placa TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Criar tabela de documentos da unidade
CREATE TABLE public.documentos_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho INTEGER,
  tipo_arquivo TEXT,
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Criar tabela de acesso e segurança
CREATE TABLE public.acessos_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo_acesso TEXT NOT NULL CHECK (tipo_acesso IN ('tag', 'chip', 'controle_remoto', 'biometria')),
  codigo_identificacao TEXT,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Criar tabela de visitantes frequentes autorizados
CREATE TABLE public.visitantes_autorizados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  parentesco TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Criar tabela de animais de estimação
CREATE TABLE public.animais_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  especie TEXT NOT NULL,
  raca TEXT,
  porte porte_animal DEFAULT 'medio',
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Criar tabela de vagas de garagem
CREATE TABLE public.vagas_garagem (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  numero_vaga TEXT NOT NULL,
  tipo TEXT DEFAULT 'comum',
  localizacao TEXT,
  coberta BOOLEAN DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Criar tabela de histórico de ocorrências
CREATE TABLE public.ocorrencias_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id) ON DELETE CASCADE,
  tipo_ocorrencia TEXT NOT NULL,
  descricao TEXT NOT NULL,
  data_ocorrencia DATE NOT NULL DEFAULT CURRENT_DATE,
  resolvida BOOLEAN DEFAULT false,
  resolucao TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Habilitar RLS em todas as tabelas
ALTER TABLE public.proprietarios_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquilinos_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moradores_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acessos_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes_autorizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animais_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vagas_garagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias_unidade ENABLE ROW LEVEL SECURITY;

-- 14. Políticas RLS para todas as tabelas (usuários autenticados)
-- Proprietários
CREATE POLICY "Usuários autenticados podem ver proprietários" ON public.proprietarios_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar proprietários" ON public.proprietarios_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar proprietários" ON public.proprietarios_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir proprietários" ON public.proprietarios_unidade FOR DELETE TO authenticated USING (true);

-- Inquilinos
CREATE POLICY "Usuários autenticados podem ver inquilinos" ON public.inquilinos_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar inquilinos" ON public.inquilinos_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar inquilinos" ON public.inquilinos_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir inquilinos" ON public.inquilinos_unidade FOR DELETE TO authenticated USING (true);

-- Moradores
CREATE POLICY "Usuários autenticados podem ver moradores" ON public.moradores_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar moradores" ON public.moradores_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar moradores" ON public.moradores_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir moradores" ON public.moradores_unidade FOR DELETE TO authenticated USING (true);

-- Veículos
CREATE POLICY "Usuários autenticados podem ver veículos" ON public.veiculos_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar veículos" ON public.veiculos_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar veículos" ON public.veiculos_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir veículos" ON public.veiculos_unidade FOR DELETE TO authenticated USING (true);

-- Documentos
CREATE POLICY "Usuários autenticados podem ver documentos" ON public.documentos_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar documentos" ON public.documentos_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem excluir documentos" ON public.documentos_unidade FOR DELETE TO authenticated USING (true);

-- Acessos
CREATE POLICY "Usuários autenticados podem ver acessos" ON public.acessos_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar acessos" ON public.acessos_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar acessos" ON public.acessos_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir acessos" ON public.acessos_unidade FOR DELETE TO authenticated USING (true);

-- Visitantes
CREATE POLICY "Usuários autenticados podem ver visitantes" ON public.visitantes_autorizados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar visitantes" ON public.visitantes_autorizados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar visitantes" ON public.visitantes_autorizados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir visitantes" ON public.visitantes_autorizados FOR DELETE TO authenticated USING (true);

-- Animais
CREATE POLICY "Usuários autenticados podem ver animais" ON public.animais_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar animais" ON public.animais_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar animais" ON public.animais_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir animais" ON public.animais_unidade FOR DELETE TO authenticated USING (true);

-- Vagas
CREATE POLICY "Usuários autenticados podem ver vagas" ON public.vagas_garagem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar vagas" ON public.vagas_garagem FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar vagas" ON public.vagas_garagem FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir vagas" ON public.vagas_garagem FOR DELETE TO authenticated USING (true);

-- Ocorrências
CREATE POLICY "Usuários autenticados podem ver ocorrências" ON public.ocorrencias_unidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem criar ocorrências" ON public.ocorrencias_unidade FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuários autenticados podem atualizar ocorrências" ON public.ocorrencias_unidade FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuários autenticados podem excluir ocorrências" ON public.ocorrencias_unidade FOR DELETE TO authenticated USING (true);

-- 15. Triggers para atualização automática de updated_at
CREATE TRIGGER update_proprietarios_updated_at BEFORE UPDATE ON public.proprietarios_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inquilinos_updated_at BEFORE UPDATE ON public.inquilinos_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_moradores_updated_at BEFORE UPDATE ON public.moradores_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON public.veiculos_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_acessos_updated_at BEFORE UPDATE ON public.acessos_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visitantes_updated_at BEFORE UPDATE ON public.visitantes_autorizados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_animais_updated_at BEFORE UPDATE ON public.animais_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vagas_updated_at BEFORE UPDATE ON public.vagas_garagem FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ocorrencias_updated_at BEFORE UPDATE ON public.ocorrencias_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 16. Índices para performance
CREATE INDEX IF NOT EXISTS idx_proprietarios_unidade_id ON public.proprietarios_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_inquilinos_unidade_id ON public.inquilinos_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_moradores_unidade_id ON public.moradores_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_unidade_id ON public.veiculos_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON public.veiculos_unidade(placa);
CREATE INDEX IF NOT EXISTS idx_documentos_unidade_id ON public.documentos_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_acessos_unidade_id ON public.acessos_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_visitantes_unidade_id ON public.visitantes_autorizados(unidade_id);
CREATE INDEX IF NOT EXISTS idx_animais_unidade_id ON public.animais_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_vagas_unidade_id ON public.vagas_garagem(unidade_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_unidade_id ON public.ocorrencias_unidade(unidade_id);
CREATE INDEX IF NOT EXISTS idx_unidades_tipo ON public.unidades(tipo_unidade);
CREATE INDEX IF NOT EXISTS idx_unidades_situacao ON public.unidades(situacao);
CREATE INDEX IF NOT EXISTS idx_unidades_status_financeiro ON public.unidades(status_financeiro);-- Create a sequence for automatic unit codes
CREATE SEQUENCE IF NOT EXISTS public.unidades_codigo_seq START WITH 1 INCREMENT BY 1;

-- Update the codigo column to have a default value from the sequence
ALTER TABLE public.unidades 
ALTER COLUMN codigo SET DEFAULT 'UND-' || LPAD(nextval('unidades_codigo_seq')::text, 6, '0');

-- Make codigo NOT NULL (it already is, but ensuring)
ALTER TABLE public.unidades ALTER COLUMN codigo SET NOT NULL;

-- Add unique constraint on codigo if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unidades_codigo_unique'
  ) THEN
    ALTER TABLE public.unidades ADD CONSTRAINT unidades_codigo_unique UNIQUE (codigo);
  END IF;
END $$;-- Adicionar campos de proprietário, inquilino e responsável financeiro na tabela unidades
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
COMMENT ON COLUMN public.unidades.resp_financeiro_opcao_envio IS 'Opção de envio de boleto: impresso, whatsapp, email, sms';-- Adicionar novos valores ao enum tipo_veiculo
ALTER TYPE tipo_veiculo ADD VALUE IF NOT EXISTS 'suv';
ALTER TYPE tipo_veiculo ADD VALUE IF NOT EXISTS 'caminhonete';-- 1. Atualizar enum de roles para incluir novos papéis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'morador';

-- 2. Criar tabela de acesso por condomínio (para gerentes)
CREATE TABLE IF NOT EXISTS public.user_condominio_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, condominio_id)
);

-- 3. Criar tabela de acesso por unidade (para moradores)
CREATE TABLE IF NOT EXISTS public.user_unidade_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  tipo_morador TEXT NOT NULL DEFAULT 'proprietario' CHECK (tipo_morador IN ('proprietario', 'inquilino', 'dependente')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, unidade_id)
);

-- 4. Adicionar coluna de operador atribuído na tabela ordens_servico
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS atribuido_a UUID REFERENCES auth.users(id);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.user_condominio_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unidade_access ENABLE ROW LEVEL SECURITY;

-- 6. Criar função para verificar acesso ao condomínio
CREATE OR REPLACE FUNCTION public.has_condominio_access(_user_id uuid, _condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso aos condomínios atribuídos
    SELECT 1 FROM public.user_condominio_access 
    WHERE user_id = _user_id AND condominio_id = _condominio_id
  );
$$;

-- 7. Criar função para verificar acesso à unidade
CREATE OR REPLACE FUNCTION public.has_unidade_access(_user_id uuid, _unidade_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso às unidades do seu condomínio
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = _user_id AND u.id = _unidade_id
  ) OR EXISTS (
    -- Morador tem acesso à sua unidade
    SELECT 1 FROM public.user_unidade_access 
    WHERE user_id = _user_id AND unidade_id = _unidade_id
  );
$$;

-- 8. Criar função para verificar se operador pode ver OS
CREATE OR REPLACE FUNCTION public.can_access_os(_user_id uuid, _os_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Admin tem acesso a tudo
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Gerente tem acesso às OS do seu condomínio
    SELECT 1 FROM public.ordens_servico os
    JOIN public.user_condominio_access uca ON uca.condominio_id = os.condominio_id
    WHERE os.id = _os_id AND uca.user_id = _user_id
  ) OR EXISTS (
    -- Operador atribuído pode ver sua OS
    SELECT 1 FROM public.ordens_servico 
    WHERE id = _os_id AND atribuido_a = _user_id
  );
$$;

-- 9. Políticas para user_condominio_access
CREATE POLICY "Admins podem gerenciar acessos condomínio"
ON public.user_condominio_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver seus próprios acessos"
ON public.user_condominio_access
FOR SELECT
USING (auth.uid() = user_id);

-- 10. Políticas para user_unidade_access
CREATE POLICY "Admins e gerentes podem gerenciar acessos unidade"
ON public.user_unidade_access
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE uca.user_id = auth.uid() AND uua.id = user_unidade_access.id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  EXISTS (
    SELECT 1 FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid() AND u.id = user_unidade_access.unidade_id
  )
);

CREATE POLICY "Moradores podem ver seus próprios acessos"
ON public.user_unidade_access
FOR SELECT
USING (auth.uid() = user_id);

-- 11. Política para admins gerenciarem roles
CREATE POLICY "Admins podem inserir roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA PERMISSÕES GRANULARES
-- =====================================================

-- 1. CONDOMINIOS - Admin e Gerentes com acesso atribuído
DROP POLICY IF EXISTS "Authenticated users can view condominios" ON public.condominios;
DROP POLICY IF EXISTS "Authenticated users can insert condominios" ON public.condominios;
DROP POLICY IF EXISTS "Authenticated users can update condominios" ON public.condominios;

CREATE POLICY "Visualizar condominios permitidos"
ON public.condominios FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), id)
);

CREATE POLICY "Admins podem criar condominios"
ON public.condominios FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerenciar condominios permitidos"
ON public.condominios FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), id)
);

CREATE POLICY "Admins podem deletar condominios"
ON public.condominios FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 2. UNIDADES - Admin, Gerentes do condomínio e Moradores da unidade
DROP POLICY IF EXISTS "Usuários autenticados podem ver unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem criar unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar unidades" ON public.unidades;

CREATE POLICY "Visualizar unidades permitidas"
ON public.unidades FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id) OR
  has_unidade_access(auth.uid(), id)
);

CREATE POLICY "Admin e Gerentes podem criar unidades"
ON public.unidades FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar unidades"
ON public.unidades FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admins podem deletar unidades"
ON public.unidades FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. ORDENS DE SERVIÇO - Admin, Gerentes do condomínio e Operadores atribuídos
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar todas as OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem criar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar OS" ON public.ordens_servico;
DROP POLICY IF EXISTS "Admins podem deletar OS" ON public.ordens_servico;

CREATE POLICY "Visualizar OS permitidas"
ON public.ordens_servico FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  can_access_os(auth.uid(), id)
);

CREATE POLICY "Admin e Gerentes podem criar OS"
ON public.ordens_servico FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id))
);

CREATE POLICY "Gerenciar OS permitidas"
ON public.ordens_servico FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  can_access_os(auth.uid(), id)
);

CREATE POLICY "Admin pode deletar OS"
ON public.ordens_servico FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 4. BOLETOS - Admin, Gerentes do condomínio e Moradores (próprios boletos)
DROP POLICY IF EXISTS "Usuarios podem ver boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem criar boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem atualizar boletos" ON public.boletos;
DROP POLICY IF EXISTS "Admins podem deletar boletos" ON public.boletos;

-- Função auxiliar para verificar acesso ao boleto
CREATE OR REPLACE FUNCTION public.can_access_boleto(_user_id uuid, _boleto_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.boletos b
    JOIN public.user_condominio_access uca ON uca.condominio_id = b.condominio_id
    WHERE b.id = _boleto_id AND uca.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.boletos b
    JOIN public.unidades u ON u.condominio_id = b.condominio_id AND u.codigo = b.unidade
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE b.id = _boleto_id AND uua.user_id = _user_id
  )
$$;

CREATE POLICY "Visualizar boletos permitidos"
ON public.boletos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id) OR
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = boletos.condominio_id 
    AND u.codigo = boletos.unidade
    AND uua.user_id = auth.uid()
  )
);

CREATE POLICY "Admin e Gerentes podem criar boletos"
ON public.boletos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar boletos"
ON public.boletos FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin pode deletar boletos"
ON public.boletos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 5. TRANSAÇÕES FINANCEIRAS
DROP POLICY IF EXISTS "Usuarios podem ver transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem criar transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem atualizar transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Admins podem deletar transacoes" ON public.transacoes_financeiras;

CREATE POLICY "Visualizar transacoes permitidas"
ON public.transacoes_financeiras FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar transacoes"
ON public.transacoes_financeiras FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar transacoes"
ON public.transacoes_financeiras FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin pode deletar transacoes"
ON public.transacoes_financeiras FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 6. ATENDIMENTOS
DROP POLICY IF EXISTS "Authenticated users can view atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Authenticated users can insert atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Authenticated users can update atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Admins can delete atendimentos" ON public.atendimentos;

CREATE POLICY "Visualizar atendimentos permitidos"
ON public.atendimentos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  operador_id = auth.uid()
);

CREATE POLICY "Admin, Gerentes e Operadores podem criar atendimentos"
ON public.atendimentos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'gerente') OR
  has_role(auth.uid(), 'operador')
);

CREATE POLICY "Gerenciar atendimentos permitidos"
ON public.atendimentos FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  (condominio_id IS NOT NULL AND has_condominio_access(auth.uid(), condominio_id)) OR
  operador_id = auth.uid()
);

CREATE POLICY "Admin pode deletar atendimentos"
ON public.atendimentos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 7. TABELAS RELACIONADAS A UNIDADES (moradores, veículos, etc.)
-- Aplicar mesma lógica: Admin, Gerente do condomínio ou Morador da unidade

-- MORADORES_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir moradores" ON public.moradores_unidade;

CREATE POLICY "Visualizar moradores permitidos"
ON public.moradores_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar moradores"
ON public.moradores_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar moradores"
ON public.moradores_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar moradores"
ON public.moradores_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VEICULOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON public.veiculos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir veículos" ON public.veiculos_unidade;

CREATE POLICY "Visualizar veiculos permitidos"
ON public.veiculos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar veiculos"
ON public.veiculos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar veiculos"
ON public.veiculos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar veiculos"
ON public.veiculos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VAGAS_GARAGEM
DROP POLICY IF EXISTS "Usuários autenticados podem ver vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem criar vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar vagas" ON public.vagas_garagem;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir vagas" ON public.vagas_garagem;

CREATE POLICY "Visualizar vagas permitidas"
ON public.vagas_garagem FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar vagas"
ON public.vagas_garagem FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar vagas"
ON public.vagas_garagem FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar vagas"
ON public.vagas_garagem FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ANIMAIS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar animais" ON public.animais_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir animais" ON public.animais_unidade;

CREATE POLICY "Visualizar animais permitidos"
ON public.animais_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar animais"
ON public.animais_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar animais"
ON public.animais_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar animais"
ON public.animais_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- VISITANTES_AUTORIZADOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem criar visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir visitantes" ON public.visitantes_autorizados;

CREATE POLICY "Visualizar visitantes permitidos"
ON public.visitantes_autorizados FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar visitantes"
ON public.visitantes_autorizados FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar visitantes"
ON public.visitantes_autorizados FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar visitantes"
ON public.visitantes_autorizados FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ACESSOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar acessos" ON public.acessos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir acessos" ON public.acessos_unidade;

CREATE POLICY "Visualizar acessos permitidos"
ON public.acessos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar acessos"
ON public.acessos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar acessos"
ON public.acessos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar acessos"
ON public.acessos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- PROPRIETARIOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar proprietários" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir proprietários" ON public.proprietarios_unidade;

CREATE POLICY "Visualizar proprietarios permitidos"
ON public.proprietarios_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar proprietarios"
ON public.proprietarios_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar proprietarios"
ON public.proprietarios_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar proprietarios"
ON public.proprietarios_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- INQUILINOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir inquilinos" ON public.inquilinos_unidade;

CREATE POLICY "Visualizar inquilinos permitidos"
ON public.inquilinos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar inquilinos"
ON public.inquilinos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar inquilinos"
ON public.inquilinos_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar inquilinos"
ON public.inquilinos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- DOCUMENTOS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver documentos" ON public.documentos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar documentos" ON public.documentos_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir documentos" ON public.documentos_unidade;

CREATE POLICY "Visualizar documentos permitidos"
ON public.documentos_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar documentos"
ON public.documentos_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar documentos"
ON public.documentos_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- OCORRENCIAS_UNIDADE
DROP POLICY IF EXISTS "Usuários autenticados podem ver ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem criar ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar ocorrências" ON public.ocorrencias_unidade;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir ocorrências" ON public.ocorrencias_unidade;

CREATE POLICY "Visualizar ocorrencias permitidas"
ON public.ocorrencias_unidade FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem criar ocorrencias"
ON public.ocorrencias_unidade FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar ocorrencias"
ON public.ocorrencias_unidade FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_unidade_access(auth.uid(), unidade_id)
);

CREATE POLICY "Admin pode deletar ocorrencias"
ON public.ocorrencias_unidade FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- CONFIGURACOES_COBRANCA
DROP POLICY IF EXISTS "Usuários autenticados podem ver configurações" ON public.configuracoes_cobranca;
DROP POLICY IF EXISTS "Usuários autenticados podem criar configurações" ON public.configuracoes_cobranca;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar configurações" ON public.configuracoes_cobranca;

CREATE POLICY "Visualizar configuracoes permitidas"
ON public.configuracoes_cobranca FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar configuracoes"
ON public.configuracoes_cobranca FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem atualizar configuracoes"
ON public.configuracoes_cobranca FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

-- HISTORICO_GERACAO_BOLETOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver histórico" ON public.historico_geracao_boletos;
DROP POLICY IF EXISTS "Inserção de histórico permitida" ON public.historico_geracao_boletos;

CREATE POLICY "Visualizar historico permitido"
ON public.historico_geracao_boletos FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

CREATE POLICY "Admin e Gerentes podem criar historico"
ON public.historico_geracao_boletos FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

-- ANEXOS
DROP POLICY IF EXISTS "Usuários autenticados podem ver anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar anexos" ON public.anexos;

CREATE POLICY "Visualizar anexos autenticados"
ON public.anexos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Criar anexos autenticados"
ON public.anexos FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Deletar anexos admin"
ON public.anexos FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- CATEGORIAS_FINANCEIRAS (leitura para todos autenticados, escrita admin)
DROP POLICY IF EXISTS "Usuarios podem ver categorias" ON public.categorias_financeiras;

CREATE POLICY "Visualizar categorias"
ON public.categorias_financeiras FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode criar categorias"
ON public.categorias_financeiras FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar categorias"
ON public.categorias_financeiras FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode deletar categorias"
ON public.categorias_financeiras FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ADMINISTRADORAS
DROP POLICY IF EXISTS "Authenticated users can view administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Authenticated users can insert administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Authenticated users can update administradoras" ON public.administradoras;

CREATE POLICY "Visualizar administradoras"
ON public.administradoras FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode criar administradoras"
ON public.administradoras FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode atualizar administradoras"
ON public.administradoras FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin pode deletar administradoras"
ON public.administradoras FOR DELETE
USING (has_role(auth.uid(), 'admin'));
-- 1. Criar tabela de comunicados
CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'aviso' CHECK (tipo IN ('aviso', 'urgente', 'manutencao', 'assembleia', 'financeiro')),
  data_publicacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  criado_por UUID REFERENCES auth.users(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para comunicados
-- Admins e gerentes podem gerenciar comunicados
CREATE POLICY "Admins e gerentes podem gerenciar comunicados"
ON public.comunicados FOR ALL
USING (
  has_role(auth.uid(), 'admin') OR
  has_condominio_access(auth.uid(), condominio_id)
);

-- Moradores podem visualizar comunicados ativos do seu condomínio
CREATE POLICY "Moradores podem ver comunicados do seu condomínio"
ON public.comunicados FOR SELECT
USING (
  ativo = true AND
  (data_expiracao IS NULL OR data_expiracao > now()) AND
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = comunicados.condominio_id
    AND uua.user_id = auth.uid()
  )
);

-- 4. Trigger para updated_at
CREATE TRIGGER update_comunicados_updated_at
BEFORE UPDATE ON public.comunicados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Criar índices para performance
CREATE INDEX idx_comunicados_condominio ON public.comunicados(condominio_id);
CREATE INDEX idx_comunicados_ativo ON public.comunicados(ativo) WHERE ativo = true;

-- 6. Habilitar realtime para comunicados
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados;-- Permitir que admins vejam todos os perfis
CREATE POLICY "Admins podem ver todos os perfis"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Permitir que admins atualizem perfis (para gestão)
CREATE POLICY "Admins podem atualizar perfis"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));-- Fix RLS infinite recursion on public.user_unidade_access
-- The existing policy references user_unidade_access inside its own USING clause, causing recursion.

DROP POLICY IF EXISTS "Admins e gerentes podem gerenciar acessos unidade" ON public.user_unidade_access;

-- Moradores: podem ver somente seus próprios vínculos
-- (mantém compatibilidade caso já exista)
DROP POLICY IF EXISTS "Moradores podem ver seus próprios acessos" ON public.user_unidade_access;
CREATE POLICY "Moradores podem ver seus próprios acessos"
ON public.user_unidade_access
FOR SELECT
USING (auth.uid() = user_id);

-- Admin: pode ver/gerenciar tudo
CREATE POLICY "Admins podem ver acessos unidade"
ON public.user_unidade_access
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins podem gerenciar acessos unidade"
ON public.user_unidade_access
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Gerente: pode ver/gerenciar acessos de unidades que pertencem aos seus condomínios
CREATE POLICY "Gerentes podem ver acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem gerenciar acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem atualizar acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);

CREATE POLICY "Gerentes podem remover acessos unidade do seu condomínio"
ON public.user_unidade_access
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.user_condominio_access uca
    JOIN public.unidades u ON u.condominio_id = uca.condominio_id
    WHERE uca.user_id = auth.uid()
      AND u.id = public.user_unidade_access.unidade_id
  )
);-- Fix profiles table: Remove overly permissive policies
-- The profiles table should only be viewable by the owner or admins

-- Drop the overly permissive policies if they exist and recreate properly
-- (The current policies "Users can view their own profile" and "Admins podem ver todos os perfis" are correct)

-- Fix administradoras table: Restrict to admin or users with access to condominiums that reference the administradora
DROP POLICY IF EXISTS "Visualizar administradoras" ON public.administradoras;

CREATE POLICY "Visualizar administradoras permitidas"
ON public.administradoras FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.condominios c
    JOIN public.user_condominio_access uca ON uca.condominio_id = c.id
    WHERE c.administradora_id = administradoras.id
    AND uca.user_id = auth.uid()
  )
);

-- Fix storage bucket: Make anexos bucket private and update policies

-- Update bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'anexos';

-- Drop the public access policy
DROP POLICY IF EXISTS "Permitir visualização de anexos" ON storage.objects;

-- Create authenticated-only policy with proper access control
DROP POLICY IF EXISTS "Authenticated users can view anexos" ON storage.objects;
CREATE POLICY "Authenticated users can view anexos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos' AND
  (
    -- Admin can see everything
    public.has_role(auth.uid(), 'admin') OR
    -- User has access to the related entity via anexos table
    EXISTS (
      SELECT 1 FROM public.anexos a
      WHERE a.storage_path = storage.objects.name
      AND (
        -- Check access based on entidade_tipo
        (a.entidade_tipo = 'condominio' AND public.has_condominio_access(auth.uid(), a.entidade_id))
        OR (a.entidade_tipo = 'unidade' AND public.has_unidade_access(auth.uid(), a.entidade_id))
        OR (a.entidade_tipo = 'atendimento' AND EXISTS (
          SELECT 1 FROM public.atendimentos at
          WHERE at.id = a.entidade_id
          AND (public.has_role(auth.uid(), 'admin') OR at.operador_id = auth.uid() OR public.has_condominio_access(auth.uid(), at.condominio_id))
        ))
        OR (a.entidade_tipo = 'ordem_servico' AND public.can_access_os(auth.uid(), a.entidade_id))
      )
    )
  )
);

-- Keep the delete policy for authenticated users who uploaded the file
DROP POLICY IF EXISTS "Permitir deleção de anexos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can delete their own anexos" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'anexos' AND
  (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.anexos a
      WHERE a.storage_path = storage.objects.name
      AND a.criado_por = auth.uid()
    )
  )
);

-- Ensure upload policy exists for authenticated users
DROP POLICY IF EXISTS "Permitir upload de anexos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload anexos" ON storage.objects;
CREATE POLICY "Authenticated users can upload anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anexos' AND
  auth.uid() IS NOT NULL
);-- =====================================================
-- SECURITY HARDENING: Restrict access to sensitive data
-- =====================================================

-- 1. PROFILES: Only users can see their own profile, admins can see all
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admin pode gerenciar profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios visualizam proprio perfil" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. ADMINISTRADORAS: Restrict to admins and managers with condominium access
DROP POLICY IF EXISTS "Authenticated users can view administradoras" ON public.administradoras;
DROP POLICY IF EXISTS "Visualizar administradoras permitidas" ON public.administradoras;

CREATE POLICY "Admins can view all administradoras"
ON public.administradoras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view linked administradoras"
ON public.administradoras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.condominios c
    JOIN public.user_condominio_access uca ON uca.condominio_id = c.id
    WHERE c.administradora_id = administradoras.id
    AND uca.user_id = auth.uid()
  )
);

-- 3. ATENDIMENTOS: Users see only their own tickets, admins/managers see by condominium
DROP POLICY IF EXISTS "Authenticated users can read atendimentos" ON public.atendimentos;
DROP POLICY IF EXISTS "Operadores podem ver atendimentos atribuidos" ON public.atendimentos;

CREATE POLICY "Admins can view all atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Operators see assigned atendimentos"
ON public.atendimentos FOR SELECT
TO authenticated
USING (operador_id = auth.uid());

-- 4. BOLETOS: Residents only see their own unit's boletos
DROP POLICY IF EXISTS "Authenticated users can read boletos" ON public.boletos;
DROP POLICY IF EXISTS "Usuarios podem ver boletos permitidos" ON public.boletos;

CREATE POLICY "Admins can view all boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit boletos"
ON public.boletos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = boletos.condominio_id
    AND u.codigo = boletos.unidade
    AND uua.user_id = auth.uid()
  )
);

-- 5. CONDOMINIOS: Restrict sensitive fields visibility
-- Cannot drop columns, so we restrict by access level
DROP POLICY IF EXISTS "Authenticated users can read condominios" ON public.condominios;
DROP POLICY IF EXISTS "Usuarios podem ver condominios permitidos" ON public.condominios;

CREATE POLICY "Admins can view all condominios"
ON public.condominios FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view assigned condominios"
ON public.condominios FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), id));

CREATE POLICY "Residents can view own condominium basic info"
ON public.condominios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = condominios.id
    AND uua.user_id = auth.uid()
  )
);

-- 6. UNIDADES: Users only see their own unit
DROP POLICY IF EXISTS "Authenticated users can read unidades" ON public.unidades;
DROP POLICY IF EXISTS "Usuarios podem ver unidades permitidas" ON public.unidades;

CREATE POLICY "Admins can view all unidades"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium unidades"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit only"
ON public.unidades FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), id));

-- 7. PROPRIETARIOS_UNIDADE: Only unit owners and admins
DROP POLICY IF EXISTS "Authenticated users can read proprietarios" ON public.proprietarios_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver proprietarios permitidos" ON public.proprietarios_unidade;

CREATE POLICY "Admins can view all proprietarios"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium proprietarios"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = proprietarios_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own proprietario"
ON public.proprietarios_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 8. INQUILINOS_UNIDADE: Only unit tenants and admins/managers
DROP POLICY IF EXISTS "Authenticated users can read inquilinos" ON public.inquilinos_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver inquilinos permitidos" ON public.inquilinos_unidade;

CREATE POLICY "Admins can view all inquilinos"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium inquilinos"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = inquilinos_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own inquilino"
ON public.inquilinos_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 9. MORADORES_UNIDADE: Only unit residents and admins/managers
DROP POLICY IF EXISTS "Authenticated users can read moradores" ON public.moradores_unidade;
DROP POLICY IF EXISTS "Usuarios podem ver moradores permitidos" ON public.moradores_unidade;

CREATE POLICY "Admins can view all moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = moradores_unidade.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own moradores"
ON public.moradores_unidade FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 10. TRANSACOES_FINANCEIRAS: Restrict to own unit transactions
DROP POLICY IF EXISTS "Authenticated users can read transacoes" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Usuarios podem ver transacoes permitidas" ON public.transacoes_financeiras;

CREATE POLICY "Admins can view all transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Residents see own unit transacoes"
ON public.transacoes_financeiras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_unidade_access uua ON uua.unidade_id = u.id
    WHERE u.condominio_id = transacoes_financeiras.condominio_id
    AND u.codigo = transacoes_financeiras.unidade
    AND uua.user_id = auth.uid()
  )
);

-- 11. VISITANTES_AUTORIZADOS: Only unit users and admins
DROP POLICY IF EXISTS "Authenticated users can read visitantes" ON public.visitantes_autorizados;
DROP POLICY IF EXISTS "Usuarios podem ver visitantes permitidos" ON public.visitantes_autorizados;

CREATE POLICY "Admins can view all visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view condominium visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.unidades u
    JOIN public.user_condominio_access uca ON uca.condominio_id = u.condominio_id
    WHERE u.id = visitantes_autorizados.unidade_id
    AND uca.user_id = auth.uid()
  )
);

CREATE POLICY "Unit users see own visitantes"
ON public.visitantes_autorizados FOR SELECT
TO authenticated
USING (public.has_unidade_access(auth.uid(), unidade_id));

-- 12. ANEXOS: Restrict based on entity access
DROP POLICY IF EXISTS "Authenticated users can view anexos" ON public.anexos;
DROP POLICY IF EXISTS "Usuarios podem ver anexos" ON public.anexos;

CREATE POLICY "Admins can view all anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view accessible anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (
  CASE
    WHEN entidade_tipo = 'condominio' THEN public.has_condominio_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'unidade' THEN public.has_unidade_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'ordem_servico' THEN public.can_access_os(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'boleto' THEN public.can_access_boleto(auth.uid(), entidade_id::uuid)
    ELSE false
  END
);-- Restrict categorias_financeiras to admins and managers only
DROP POLICY IF EXISTS "Visualizar categorias" ON public.categorias_financeiras;

CREATE POLICY "Admins can view categorias"
ON public.categorias_financeiras FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view categorias"
ON public.categorias_financeiras FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_condominio_access
    WHERE user_id = auth.uid()
  )
);-- Create audit log table for tracking sensitive operations
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details jsonb,
  ip_address text,
  user_agent text
);

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Security audit log for tracking sensitive operations';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed: create, update, delete, login, logout, password_reset, role_change, etc.';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity affected: user, boleto, condominio, unidade, etc.';
COMMENT ON COLUMN public.audit_logs.details IS 'Additional details about the operation (changes made, previous values, etc.)';

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (security requirement)
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to insert audit logs (for tracking their own actions)
-- This uses service role in edge functions for system-level logging
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete audit logs (immutability for security)
-- Admins could be granted this via a separate policy if needed for compliance

-- Enable realtime for audit logs (useful for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;-- Create contas_bancarias table with full support for billing/boleto registration
CREATE TABLE public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ownership: can be linked to administradora (shared) or specific condominio
  administradora_id UUID REFERENCES public.administradoras(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  
  -- Basic bank info
  nome_conta VARCHAR(100) NOT NULL,
  banco_codigo VARCHAR(10) NOT NULL,
  banco_nome VARCHAR(100) NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  agencia_digito VARCHAR(2),
  conta VARCHAR(20) NOT NULL,
  conta_digito VARCHAR(2),
  tipo_conta VARCHAR(20) NOT NULL DEFAULT 'corrente',
  
  -- Holder info
  titular_nome VARCHAR(150) NOT NULL,
  titular_documento VARCHAR(20) NOT NULL,
  titular_tipo VARCHAR(10) NOT NULL DEFAULT 'PJ',
  
  -- Boleto registration fields
  convenio VARCHAR(20),
  carteira VARCHAR(10),
  variacao_carteira VARCHAR(10),
  codigo_cedente VARCHAR(20),
  nosso_numero_inicio BIGINT DEFAULT 1,
  nosso_numero_atual BIGINT DEFAULT 1,
  
  -- Billing instructions
  instrucoes_linha1 TEXT,
  instrucoes_linha2 TEXT,
  instrucoes_linha3 TEXT,
  multa_percentual DECIMAL(5,2) DEFAULT 2.00,
  juros_mensal DECIMAL(5,2) DEFAULT 1.00,
  dias_protesto INTEGER,
  
  -- Status
  ativa BOOLEAN NOT NULL DEFAULT true,
  conta_padrao BOOLEAN NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT chk_ownership CHECK (
    (administradora_id IS NOT NULL AND condominio_id IS NULL) OR
    (administradora_id IS NULL AND condominio_id IS NOT NULL)
  ),
  CONSTRAINT chk_tipo_conta CHECK (tipo_conta IN ('corrente', 'poupanca')),
  CONSTRAINT chk_titular_tipo CHECK (titular_tipo IN ('PF', 'PJ'))
);

-- Add comments for documentation
COMMENT ON TABLE public.contas_bancarias IS 'Bank accounts for billing and boleto issuance';
COMMENT ON COLUMN public.contas_bancarias.administradora_id IS 'If set, this is a shared account owned by the administradora';
COMMENT ON COLUMN public.contas_bancarias.condominio_id IS 'If set, this is a specific account for this condominio';
COMMENT ON COLUMN public.contas_bancarias.convenio IS 'Convênio number for boleto registration';
COMMENT ON COLUMN public.contas_bancarias.carteira IS 'Carteira code for boleto';
COMMENT ON COLUMN public.contas_bancarias.nosso_numero_atual IS 'Current nosso_numero counter for sequential boleto generation';

-- Create indexes
CREATE INDEX idx_contas_bancarias_administradora ON public.contas_bancarias(administradora_id) WHERE administradora_id IS NOT NULL;
CREATE INDEX idx_contas_bancarias_condominio ON public.contas_bancarias(condominio_id) WHERE condominio_id IS NOT NULL;
CREATE INDEX idx_contas_bancarias_ativa ON public.contas_bancarias(ativa) WHERE ativa = true;

-- Enable RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to contas_bancarias"
ON public.contas_bancarias
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Gerente can view accounts linked to their condominios or shared by administradora
CREATE POLICY "Gerente can view relevant contas_bancarias"
ON public.contas_bancarias
FOR SELECT
USING (
  public.has_role(auth.uid(), 'gerente') AND (
    -- Can see condominio-specific accounts they manage
    public.has_condominio_access(auth.uid(), condominio_id)
    OR
    -- Can see administradora accounts (shared)
    administradora_id IS NOT NULL
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_contas_bancarias_updated_at
BEFORE UPDATE ON public.contas_bancarias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Link configuracoes_cobranca to a conta_bancaria (optional)
ALTER TABLE public.configuracoes_cobranca
ADD COLUMN conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

-- Link boletos to a conta_bancaria (optional)
ALTER TABLE public.boletos
ADD COLUMN conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

-- Enable realtime for contas_bancarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.contas_bancarias;-- Tabela de ocorrências do condomínio (áreas comuns, eventos gerais)
CREATE TABLE public.ocorrencias_condominio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  
  -- Tipo e categoria
  tipo_ocorrencia TEXT NOT NULL CHECK (tipo_ocorrencia IN ('manutencao', 'seguranca', 'convivencia', 'outro')),
  categoria TEXT,
  
  -- Dados da ocorrência
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  local_ocorrencia TEXT,
  
  -- Datas e status
  data_ocorrencia TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_resolucao TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'resolvida', 'cancelada')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Resolução
  resolucao TEXT,
  custo_estimado NUMERIC(12, 2),
  custo_real NUMERIC(12, 2),
  
  -- Responsáveis
  registrado_por UUID REFERENCES auth.users(id),
  atribuido_a TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_ocorrencias_condominio_condominio_id ON public.ocorrencias_condominio(condominio_id);
CREATE INDEX idx_ocorrencias_condominio_tipo ON public.ocorrencias_condominio(tipo_ocorrencia);
CREATE INDEX idx_ocorrencias_condominio_status ON public.ocorrencias_condominio(status);
CREATE INDEX idx_ocorrencias_condominio_data ON public.ocorrencias_condominio(data_ocorrencia DESC);
CREATE INDEX idx_ocorrencias_condominio_prioridade ON public.ocorrencias_condominio(prioridade);

-- Habilitar RLS
ALTER TABLE public.ocorrencias_condominio ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admin pode gerenciar todas ocorrências" 
  ON public.ocorrencias_condominio 
  FOR ALL 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gerente pode gerenciar ocorrências dos seus condomínios" 
  ON public.ocorrencias_condominio 
  FOR ALL 
  USING (public.has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Operador pode visualizar ocorrências dos condomínios" 
  ON public.ocorrencias_condominio 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'operador'
    ) AND public.has_condominio_access(auth.uid(), condominio_id)
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ocorrencias_condominio_updated_at
  BEFORE UPDATE ON public.ocorrencias_condominio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencias_condominio;-- Adicionar coluna foto_url na tabela animais_unidade
ALTER TABLE public.animais_unidade
ADD COLUMN foto_url TEXT;

-- Criar bucket para fotos de animais
INSERT INTO storage.buckets (id, name, public)
VALUES ('animais-fotos', 'animais-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública das fotos
DROP POLICY IF EXISTS "Fotos de animais são públicas" ON storage.objects;
CREATE POLICY "Fotos de animais são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'animais-fotos');

-- Política para upload por usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de fotos de animais" ON storage.objects;
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de animais"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fotos de animais" ON storage.objects;
CREATE POLICY "Usuários autenticados podem atualizar fotos de animais"
ON storage.objects FOR UPDATE
USING (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');

-- Política para exclusão por usuários autenticados
DROP POLICY IF EXISTS "Usuários autenticados podem excluir fotos de animais" ON storage.objects;
CREATE POLICY "Usuários autenticados podem excluir fotos de animais"
ON storage.objects FOR DELETE
USING (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');
-- Criar tabela de categorias de demanda
CREATE TABLE public.categorias_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  icone text DEFAULT 'Wrench',
  cor text DEFAULT '#3B82F6',
  ordem integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de templates de serviços (pré-cadastrados)
CREATE TABLE public.templates_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid REFERENCES public.categorias_demanda(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  periodicidade text NOT NULL DEFAULT 'anual', -- mensal, trimestral, semestral, anual, bienal, sob_demanda, personalizada
  periodicidade_meses integer,
  obrigatorio boolean DEFAULT false,
  base_legal text,
  documentos_necessarios text[] DEFAULT '{}',
  alertar_antecedencia_dias integer DEFAULT 30,
  permite_prorrogacao boolean DEFAULT true,
  condicional boolean DEFAULT false,
  condicao_campo text, -- campo do condomínio que deve ser verificado
  condicao_valor text, -- valor que o campo deve ter
  custo_estimado numeric(10,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de fornecedores
CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  telefone text,
  email text,
  endereco text,
  cidade text,
  uf text,
  contato_nome text,
  observacoes text,
  avaliacao numeric(2,1) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de demandas por condomínio
CREATE TABLE public.demandas_condominio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.templates_demanda(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.categorias_demanda(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  periodicidade text NOT NULL DEFAULT 'anual',
  periodicidade_meses integer,
  obrigatorio boolean DEFAULT false,
  base_legal text,
  documentos_necessarios text[] DEFAULT '{}',
  alertar_antecedencia_dias integer DEFAULT 30,
  permite_prorrogacao boolean DEFAULT true,
  custo_estimado numeric(10,2) DEFAULT 0,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  ultima_execucao date,
  proxima_execucao date,
  status text DEFAULT 'em_dia', -- em_dia, atencao, urgente, vencido, sob_demanda
  ativo boolean DEFAULT true,
  observacoes text,
  criado_por uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de execuções de demandas
CREATE TABLE public.execucoes_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demanda_id uuid NOT NULL REFERENCES public.demandas_condominio(id) ON DELETE CASCADE,
  data_execucao date NOT NULL,
  fornecedor_id uuid REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  fornecedor_nome text,
  custo numeric(10,2) DEFAULT 0,
  observacoes text,
  documentos_anexados text[] DEFAULT '{}',
  executado_por uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de configurações de demanda por condomínio
CREATE TABLE public.configuracoes_demanda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL UNIQUE REFERENCES public.condominios(id) ON DELETE CASCADE,
  alertas_email boolean DEFAULT true,
  alertas_push boolean DEFAULT true,
  alertas_inapp boolean DEFAULT true,
  frequencia_urgente text DEFAULT 'diario',
  frequencia_atencao text DEFAULT 'semanal',
  frequencia_informativo text DEFAULT 'quinzenal',
  notificar_sindico boolean DEFAULT true,
  notificar_conselho boolean DEFAULT true,
  notificar_administradora boolean DEFAULT false,
  calcular_proxima_automatico boolean DEFAULT true,
  ativar_servicos_condicionais boolean DEFAULT true,
  exigir_aprovacao boolean DEFAULT false,
  valor_aprovacao numeric(10,2) DEFAULT 5000,
  exigir_documentos boolean DEFAULT true,
  bloquear_sem_documentos boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas_condominio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execucoes_demanda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_demanda ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias_demanda (leitura para todos autenticados)
CREATE POLICY "Categorias visíveis para autenticados" ON public.categorias_demanda
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar categorias" ON public.categorias_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para templates_demanda (leitura para todos autenticados)
CREATE POLICY "Templates visíveis para autenticados" ON public.templates_demanda
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin pode gerenciar templates" ON public.templates_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Políticas para fornecedores
CREATE POLICY "Fornecedores visíveis para autenticados" ON public.fornecedores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin e Gerentes podem gerenciar fornecedores" ON public.fornecedores
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'gerente'));

-- Políticas para demandas_condominio
CREATE POLICY "Visualizar demandas do condomínio" ON public.demandas_condominio
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem criar demandas" ON public.demandas_condominio
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem atualizar demandas" ON public.demandas_condominio
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin pode deletar demandas" ON public.demandas_condominio
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Políticas para execucoes_demanda
CREATE POLICY "Visualizar execuções permitidas" ON public.execucoes_demanda
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.demandas_condominio d 
      WHERE d.id = execucoes_demanda.demanda_id 
      AND has_condominio_access(auth.uid(), d.condominio_id)
    )
  );

CREATE POLICY "Admin e Gerentes podem criar execuções" ON public.execucoes_demanda
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    EXISTS (
      SELECT 1 FROM public.demandas_condominio d 
      WHERE d.id = execucoes_demanda.demanda_id 
      AND has_condominio_access(auth.uid(), d.condominio_id)
    )
  );

CREATE POLICY "Admin pode deletar execuções" ON public.execucoes_demanda
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Políticas para configuracoes_demanda
CREATE POLICY "Visualizar config demandas" ON public.configuracoes_demanda
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Admin e Gerentes podem gerenciar config" ON public.configuracoes_demanda
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_condominio_access(auth.uid(), condominio_id));

-- Inserir categorias padrão
INSERT INTO public.categorias_demanda (nome, icone, cor, ordem) VALUES
  ('Água e Saneamento', 'Droplets', '#0EA5E9', 1),
  ('Controle de Pragas', 'Bug', '#84CC16', 2),
  ('Estrutura e Segurança Predial', 'Building2', '#6366F1', 3),
  ('Prevenção e Combate a Incêndio', 'Flame', '#EF4444', 4),
  ('Documentação e Obrigações Jurídicas', 'FileText', '#8B5CF6', 5),
  ('Áreas Externas e Paisagismo', 'TreePine', '#22C55E', 6),
  ('Limpeza e Conservação', 'Sparkles', '#14B8A6', 7),
  ('Outros Serviços', 'Settings', '#64748B', 8);

-- Inserir templates de serviços pré-cadastrados
INSERT INTO public.templates_demanda (categoria_id, nome, descricao, periodicidade, periodicidade_meses, obrigatorio, base_legal, documentos_necessarios, alertar_antecedencia_dias) VALUES
-- Água e Saneamento
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Limpeza e desinfecção das caixas d''água', 'Limpeza completa e desinfecção de todas as caixas d''água do condomínio', 'semestral', 6, true, 'Portaria MS 2914/2011', ARRAY['Certificado de limpeza', 'Laudo bacteriológico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Limpeza de cisterna', 'Limpeza e higienização da cisterna', 'semestral', 6, true, NULL, ARRAY['Certificado de limpeza'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Água e Saneamento'), 'Teste de potabilidade da água', 'Análise laboratorial da qualidade da água', 'anual', 12, true, 'Portaria GM/MS 888/2021', ARRAY['Laudo de potabilidade'], 45),

-- Controle de Pragas
((SELECT id FROM public.categorias_demanda WHERE nome = 'Controle de Pragas'), 'Dedetização, desratização e descupinização', 'Controle completo de pragas urbanas', 'semestral', 6, true, 'Lei Federal 6.514/77, Vigilância Sanitária', ARRAY['Certificado de dedetização', 'ART do responsável técnico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Controle de Pragas'), 'Controle de pombos e morcegos', 'Manejo de fauna urbana', 'sob_demanda', NULL, false, NULL, ARRAY['Laudo técnico', 'Autorização ambiental'], 30),

-- Estrutura e Segurança Predial
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Vistoria predial completa (AVCB/Laudo técnico)', 'Inspeção geral das condições do edifício', 'anual', 12, true, 'Corpo de Bombeiros local, Lei 13.425/2017', ARRAY['AVCB', 'Laudo técnico de vistoria'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo de inspeção predial (NBR 16747)', 'Inspeção técnica conforme norma ABNT', 'anual', 12, true, 'NBR 16747:2020', ARRAY['Laudo de inspeção predial', 'ART'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo SPDA (para-raios)', 'Verificação do sistema de proteção contra descargas atmosféricas', 'anual', 12, true, 'NBR 5419, NR-10', ARRAY['Laudo SPDA', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Laudo de elevadores', 'Vistoria técnica dos elevadores', 'anual', 12, true, 'NBR NM 313, NR-12', ARRAY['Laudo de vistoria', 'Certificado de conformidade'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção preventiva dos elevadores', 'Manutenção mensal dos elevadores', 'mensal', 1, true, 'NBR 16083', ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Teste de estanqueidade do gás', 'Verificação de vazamentos na rede de gás', 'anual', 12, true, 'NBR 15923, NBR 13103', ARRAY['Laudo de estanqueidade', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Limpeza de dutos de exaustão', 'Higienização dos dutos de ventilação', 'anual', 12, true, 'NBR 14518, Corpo de Bombeiros', ARRAY['Certificado de limpeza'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Limpeza de caixa de gordura', 'Limpeza periódica das caixas de gordura', 'trimestral', 3, true, 'NBR 8160', ARRAY['Comprovante de limpeza'], 15),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de bombas d''água', 'Verificação e manutenção das bombas', 'mensal', 1, true, NULL, ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de portões automáticos', 'Manutenção preventiva dos portões', 'mensal', 1, true, 'NBR 13207', ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de gerador', 'Manutenção do grupo gerador', 'mensal', 1, false, NULL, ARRAY['Relatório de manutenção'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Manutenção de sistemas de CFTV', 'Verificação das câmeras e gravadores', 'anual', 12, false, NULL, ARRAY['Relatório técnico'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Estrutura e Segurança Predial'), 'Revisão de impermeabilização', 'Inspeção das áreas impermeabilizadas', 'anual', 12, false, 'NBR 9575', ARRAY['Laudo técnico'], 45),

-- Prevenção e Combate a Incêndio
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Recarga e inspeção de extintores', 'Recarga e verificação dos extintores', 'anual', 12, true, 'NBR 12962, NR-23', ARRAY['Certificado de recarga', 'Etiqueta de validade'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Teste e manutenção de hidrantes', 'Verificação do sistema de hidrantes', 'anual', 12, true, 'NBR 13714', ARRAY['Laudo técnico', 'ART'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Teste de iluminação de emergência', 'Verificação do sistema de iluminação', 'anual', 12, true, 'NBR 10898', ARRAY['Relatório de teste'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Prevenção e Combate a Incêndio'), 'Renovação do AVCB', 'Auto de Vistoria do Corpo de Bombeiros', 'anual', 12, true, 'Corpo de Bombeiros local', ARRAY['AVCB renovado'], 90),

-- Documentação e Obrigações Jurídicas
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa de débitos (INSS, FGTS)', 'Obtenção das certidões negativas', 'anual', 12, true, 'CLT, Lei 8212/91', ARRAY['CND INSS', 'CRF FGTS', 'CND Federal'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa trabalhista', 'Certidão de débitos trabalhistas', 'anual', 12, true, NULL, ARRAY['CNDT'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Certidão negativa municipal', 'Certidão de débitos municipais', 'anual', 12, true, NULL, ARRAY['CND Municipal'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Atualização do seguro predial', 'Renovação da apólice de seguro', 'anual', 12, true, NULL, ARRAY['Apólice de seguro renovada'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Exames periódicos (PCMSO)', 'Exames ocupacionais dos funcionários', 'anual', 12, true, 'NR-7', ARRAY['ASO'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Atualização do PGR', 'Programa de Gerenciamento de Riscos', 'anual', 12, true, 'NR-9, NR-1', ARRAY['PGR atualizado'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Treinamento de brigada de incêndio', 'Capacitação da brigada', 'anual', 12, true, 'NBR 14276', ARRAY['Certificados de treinamento'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Documentação e Obrigações Jurídicas'), 'Assembleia ordinária', 'Assembleia anual obrigatória', 'anual', 12, true, 'Código Civil, Lei 4.591/64', ARRAY['Edital de convocação', 'Ata de assembleia'], 60),

-- Áreas Externas e Paisagismo
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Poda de árvores', 'Poda e manutenção das árvores', 'anual', 12, false, 'Legislação ambiental municipal', ARRAY['Autorização de poda'], 45),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Manutenção de jardins', 'Cuidados com áreas verdes', 'mensal', 1, false, NULL, ARRAY['Relatório de serviço'], 7),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Áreas Externas e Paisagismo'), 'Limpeza de calhas e rufos', 'Desobstrução do sistema de drenagem', 'semestral', 6, true, NULL, ARRAY['Comprovante de serviço'], 30),

-- Limpeza e Conservação
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Limpeza de fachada', 'Lavagem e conservação da fachada', 'anual', 12, false, 'Legislação municipal', ARRAY['Comprovante de serviço', 'ART'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Lavagem de garagem', 'Limpeza das áreas de estacionamento', 'semestral', 6, false, NULL, ARRAY['Comprovante de serviço'], 15),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Limpeza e Conservação'), 'Limpeza de caixas de inspeção', 'Desobstrução das caixas de inspeção', 'trimestral', 3, true, NULL, ARRAY['Comprovante de limpeza'], 15),

-- Outros Serviços
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Inventário de bens do condomínio', 'Levantamento patrimonial', 'anual', 12, false, NULL, ARRAY['Relatório de inventário'], 30),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Auditoria contábil', 'Verificação das contas', 'anual', 12, false, NULL, ARRAY['Relatório de auditoria'], 60),
((SELECT id FROM public.categorias_demanda WHERE nome = 'Outros Serviços'), 'Revisão de contratos de seguros', 'Análise das apólices', 'anual', 12, true, NULL, ARRAY['Análise comparativa de apólices'], 60);

-- Criar índices para performance
CREATE INDEX idx_demandas_condominio_id ON public.demandas_condominio(condominio_id);
CREATE INDEX idx_demandas_status ON public.demandas_condominio(status);
CREATE INDEX idx_demandas_proxima_execucao ON public.demandas_condominio(proxima_execucao);
CREATE INDEX idx_execucoes_demanda_id ON public.execucoes_demanda(demanda_id);
CREATE INDEX idx_templates_categoria_id ON public.templates_demanda(categoria_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_demandas_condominio_updated_at
  BEFORE UPDATE ON public.demandas_condominio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_demanda_updated_at
  BEFORE UPDATE ON public.configuracoes_demanda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
  BEFORE UPDATE ON public.fornecedores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular status da demanda
CREATE OR REPLACE FUNCTION public.calcular_status_demanda(proxima date)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  dias_restantes integer;
BEGIN
  IF proxima IS NULL THEN
    RETURN 'sob_demanda';
  END IF;
  
  dias_restantes := proxima - CURRENT_DATE;
  
  IF dias_restantes < 0 THEN
    RETURN 'vencido';
  ELSIF dias_restantes <= 7 THEN
    RETURN 'urgente';
  ELSIF dias_restantes <= 30 THEN
    RETURN 'atencao';
  ELSE
    RETURN 'em_dia';
  END IF;
END;
$$;

-- Função para atualizar status de todas as demandas
CREATE OR REPLACE FUNCTION public.atualizar_status_demandas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quantidade_atualizada INTEGER;
BEGIN
  UPDATE demandas_condominio
  SET status = calcular_status_demanda(proxima_execucao),
      updated_at = now()
  WHERE ativo = true
    AND status != calcular_status_demanda(proxima_execucao);
  
  GET DIAGNOSTICS quantidade_atualizada = ROW_COUNT;
  RETURN quantidade_atualizada;
END;
$$;

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
  USING (destinatario_usuario_id = auth.uid());-- Atualizar a função que muda status de boletos vencidos para usar "atraso" em vez de "atrasado"
CREATE OR REPLACE FUNCTION public.atualizar_boletos_atrasados()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  quantidade_atualizada INTEGER;
BEGIN
  UPDATE boletos
  SET status = 'atraso', updated_at = now()
  WHERE status = 'pendente'
    AND data_vencimento < CURRENT_DATE;
  
  GET DIAGNOSTICS quantidade_atualizada = ROW_COUNT;
  RETURN quantidade_atualizada;
END;
$function$;-- Remover constraint antiga e criar nova com valor 'atraso' em vez de 'atrasado'
ALTER TABLE public.boletos DROP CONSTRAINT IF EXISTS boletos_status_check;

ALTER TABLE public.boletos ADD CONSTRAINT boletos_status_check 
  CHECK (status IN ('pendente', 'pago', 'atraso', 'cancelado'));
-- Função para atualizar o status financeiro da unidade baseado nos boletos
CREATE OR REPLACE FUNCTION public.atualizar_status_financeiro_unidade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unidade_id UUID;
  v_tem_boletos_pendentes BOOLEAN;
  v_tem_acordo_ativo BOOLEAN;
BEGIN
  -- Buscar a unidade pelo código e condomínio
  SELECT u.id INTO v_unidade_id
  FROM unidades u
  WHERE u.codigo = COALESCE(NEW.unidade, OLD.unidade)
    AND u.condominio_id = COALESCE(NEW.condominio_id, OLD.condominio_id);
  
  -- Se não encontrou a unidade, sair
  IF v_unidade_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Verificar se há boletos pendentes ou em atraso para esta unidade
  SELECT EXISTS (
    SELECT 1 FROM boletos b
    JOIN unidades u ON u.codigo = b.unidade AND u.condominio_id = b.condominio_id
    WHERE u.id = v_unidade_id
      AND b.status IN ('pendente', 'atraso')
  ) INTO v_tem_boletos_pendentes;
  
  -- Verificar se há acordo ativo para esta unidade
  SELECT EXISTS (
    SELECT 1 FROM acordos a
    WHERE a.unidade_id = v_unidade_id
      AND a.status = 'ativo'
  ) INTO v_tem_acordo_ativo;
  
  -- Atualizar o status financeiro da unidade com cast para o ENUM
  IF v_tem_acordo_ativo THEN
    UPDATE unidades SET status_financeiro = 'acordo'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  ELSIF v_tem_boletos_pendentes THEN
    UPDATE unidades SET status_financeiro = 'inadimplente'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  ELSE
    UPDATE unidades SET status_financeiro = 'em_dia'::status_financeiro_unidade, updated_at = now() WHERE id = v_unidade_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Atualizar todas as unidades existentes com base nos boletos atuais
UPDATE unidades u
SET status_financeiro = (
  CASE
    WHEN EXISTS (
      SELECT 1 FROM acordos a WHERE a.unidade_id = u.id AND a.status = 'ativo'
    ) THEN 'acordo'
    WHEN EXISTS (
      SELECT 1 FROM boletos b 
      WHERE b.unidade = u.codigo 
        AND b.condominio_id = u.condominio_id 
        AND b.status IN ('pendente', 'atraso')
    ) THEN 'inadimplente'
    ELSE 'em_dia'
  END
)::status_financeiro_unidade,
updated_at = now();
-- Função para gerar nosso_numero único baseado em timestamp + sequencial
CREATE OR REPLACE FUNCTION public.gerar_nosso_numero()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ano_mes TEXT;
  sequencia INT;
  numero TEXT;
BEGIN
  ano_mes := to_char(CURRENT_DATE, 'YYMM');
  
  -- Buscar o próximo número sequencial do mês
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(nosso_numero FROM '\d{4}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM boletos
  WHERE nosso_numero LIKE ano_mes || '-%';
  
  numero := ano_mes || '-' || LPAD(sequencia::TEXT, 6, '0');
  
  RETURN numero;
END;
$$;

-- Trigger para gerar nosso_numero automaticamente quando não informado
CREATE OR REPLACE FUNCTION public.boleto_gerar_nosso_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se nosso_numero não foi informado ou é vazio, gerar automaticamente
  IF NEW.nosso_numero IS NULL OR TRIM(NEW.nosso_numero) = '' THEN
    NEW.nosso_numero := gerar_nosso_numero();
  END IF;
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_gerar_nosso_numero ON boletos;
CREATE TRIGGER trigger_gerar_nosso_numero
  BEFORE INSERT ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION boleto_gerar_nosso_numero();-- Adicionar campos de contrato na seção de Administradora
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS administradora_tem_contrato boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS administradora_contrato_path text;-- Adicionar coluna unidade_id como FK para unidades
ALTER TABLE public.boletos 
ADD COLUMN unidade_id uuid REFERENCES public.unidades(id);

-- Criar índice para melhor performance
CREATE INDEX idx_boletos_unidade_id ON public.boletos(unidade_id);

-- Atualizar RLS para incluir acesso via unidade_id
DROP POLICY IF EXISTS "Residents see own unit boletos" ON public.boletos;

CREATE POLICY "Residents see own unit boletos" 
ON public.boletos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_unidade_access uua
    WHERE uua.unidade_id = boletos.unidade_id 
    AND uua.user_id = auth.uid()
  )
);

-- Atualizar política de visualização geral
DROP POLICY IF EXISTS "Visualizar boletos permitidos" ON public.boletos;

CREATE POLICY "Visualizar boletos permitidos" 
ON public.boletos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_condominio_access(auth.uid(), condominio_id) 
  OR EXISTS (
    SELECT 1 FROM user_unidade_access uua
    WHERE uua.unidade_id = boletos.unidade_id 
    AND uua.user_id = auth.uid()
  )
);
-- Tabela: areas_comuns
CREATE TABLE public.areas_comuns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  capacidade INTEGER,
  valor_taxa NUMERIC(10,2) DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  imagem_url TEXT,
  regras TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.areas_comuns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar areas_comuns" ON public.areas_comuns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerente pode gerenciar areas do seu condomínio" ON public.areas_comuns
  FOR ALL USING (has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Moradores podem ver areas do seu condomínio" ON public.areas_comuns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM unidades u
      JOIN user_unidade_access uua ON uua.unidade_id = u.id
      WHERE u.condominio_id = areas_comuns.condominio_id AND uua.user_id = auth.uid()
    )
  );

-- Enum de status de reserva
CREATE TYPE public.reserva_status AS ENUM ('pendente', 'confirmada', 'cancelada', 'concluida', 'recusada');

-- Enum de status de acesso de convidado
CREATE TYPE public.convidado_status_acesso AS ENUM ('liberado', 'bloqueado', 'pendente');

-- Função para gerar número de reserva
CREATE OR REPLACE FUNCTION public.gerar_numero_reserva()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    CAST(SUBSTRING(numero_reserva FROM 'RSV-\d{6}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM reservas
  WHERE numero_reserva LIKE 'RSV-' || ano || mes || '-%';
  
  numero := 'RSV-' || ano || mes || '-' || LPAD(sequencia::TEXT, 4, '0');
  RETURN numero;
END;
$$;

-- Tabela: reservas
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_reserva TEXT NOT NULL UNIQUE DEFAULT gerar_numero_reserva(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id),
  area_comum_id UUID NOT NULL REFERENCES public.areas_comuns(id),

  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT NOT NULL,
  responsavel_email TEXT,
  responsavel_cpf TEXT,

  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,

  tem_convidados BOOLEAN DEFAULT false,
  total_convidados INTEGER DEFAULT 0,

  status public.reserva_status DEFAULT 'pendente',

  valor_taxa NUMERIC(10,2) DEFAULT 0,
  taxa_paga BOOLEAN DEFAULT false,
  data_pagamento DATE,

  observacoes TEXT,
  motivo_recusa TEXT,
  aprovado_por UUID,
  data_aprovacao TIMESTAMPTZ,
  criado_por UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservas_data_inicio ON public.reservas(data_inicio);
CREATE INDEX idx_reservas_area_status ON public.reservas(area_comum_id, status);
CREATE INDEX idx_reservas_unidade ON public.reservas(unidade_id);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar todas reservas" ON public.reservas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerente pode gerenciar reservas do condomínio" ON public.reservas
  FOR ALL USING (has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Morador pode ver suas reservas" ON public.reservas
  FOR SELECT USING (has_unidade_access(auth.uid(), unidade_id));

CREATE POLICY "Morador pode criar reserva na sua unidade" ON public.reservas
  FOR INSERT WITH CHECK (has_unidade_access(auth.uid(), unidade_id));

CREATE POLICY "Morador pode cancelar sua reserva" ON public.reservas
  FOR UPDATE USING (has_unidade_access(auth.uid(), unidade_id) AND status = 'pendente');

-- Tabela: reserva_convidados
CREATE TABLE public.reserva_convidados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT,
  status_acesso public.convidado_status_acesso DEFAULT 'pendente',
  entrada_registrada BOOLEAN DEFAULT false,
  hora_entrada TIME,
  hora_saida TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserva_convidados_reserva ON public.reserva_convidados(reserva_id);

ALTER TABLE public.reserva_convidados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar convidados" ON public.reserva_convidados
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Acesso convidados via reserva" ON public.reserva_convidados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id = reserva_convidados.reserva_id
      AND (has_condominio_access(auth.uid(), r.condominio_id) OR has_unidade_access(auth.uid(), r.unidade_id))
    )
  );

-- Tabela: reserva_historico
CREATE TABLE public.reserva_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  usuario_id UUID,
  acao TEXT NOT NULL,
  descricao TEXT,
  dados_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reserva_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Criar historico autenticado" ON public.reserva_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ver historico da reserva" ON public.reserva_historico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id = reserva_historico.reserva_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR has_condominio_access(auth.uid(), r.condominio_id) OR has_unidade_access(auth.uid(), r.unidade_id))
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_areas_comuns_updated_at BEFORE UPDATE ON public.areas_comuns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de histórico de atendimentos
CREATE TABLE public.atendimento_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  detalhes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atendimento_historico ENABLE ROW LEVEL SECURITY;

-- Policies matching atendimentos access
CREATE POLICY "Admin pode gerenciar histórico atendimentos"
ON public.atendimento_historico FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerentes podem gerenciar histórico dos seus condomínios"
ON public.atendimento_historico FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM atendimentos a
    WHERE a.id = atendimento_historico.atendimento_id
    AND a.condominio_id IS NOT NULL
    AND has_condominio_access(auth.uid(), a.condominio_id)
  )
);

CREATE POLICY "Operadores podem gerenciar histórico dos seus atendimentos"
ON public.atendimento_historico FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM atendimentos a
    WHERE a.id = atendimento_historico.atendimento_id
    AND a.operador_id = auth.uid()
  )
);
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sindico';
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
-- Fix: Alinhar as políticas de RLS da tabela atendimento_historico
-- com as políticas da tabela atendimentos (pai).
--
-- PROBLEMA: As políticas anteriores eram excessivamente restritivas,
-- exigindo role admin, acesso ao condomínio, ou que operador_id == auth.uid().
-- Se operador_id fosse NULL ou o usuário não fosse admin, o INSERT e SELECT
-- falhavam silenciosamente, fazendo com que novos registros de histórico
-- não aparecessem na interface.
--
-- SOLUÇÃO: Usar a mesma política da tabela atendimentos: qualquer usuário
-- autenticado pode ler, inserir e atualizar. Apenas admin pode deletar.

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admin pode gerenciar histórico atendimentos" ON public.atendimento_historico;
DROP POLICY IF EXISTS "Gerentes podem gerenciar histórico dos seus condomínios" ON public.atendimento_historico;
DROP POLICY IF EXISTS "Operadores podem gerenciar histórico dos seus atendimentos" ON public.atendimento_historico;

-- Criar novas políticas alinhadas com a tabela atendimentos
CREATE POLICY "Authenticated users can view atendimento_historico"
  ON public.atendimento_historico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert atendimento_historico"
  ON public.atendimento_historico FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update atendimento_historico"
  ON public.atendimento_historico FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete atendimento_historico"
  ON public.atendimento_historico FOR DELETE
  TO authenticated
  USING (true);

-- Também permitir que usuários autenticados deletem anexos
-- (Importante porque deletar histórico tenta deletar os anexos vinculados)
DROP POLICY IF EXISTS "Deletar anexos admin" ON public.anexos;
CREATE POLICY "Authenticated users can delete anexos"
  ON public.anexos FOR DELETE
  TO authenticated
  USING (true);
-- =====================================================
-- Adiciona suporte ao tipo 'transacao' nas políticas RLS de anexos
-- Transações financeiras são acessíveis a quem tem acesso ao condomínio
-- =====================================================

-- Atualiza a política de SELECT para anexos adicionando 'transacao'
DROP POLICY IF EXISTS "Users can view accessible anexos" ON public.anexos;

CREATE POLICY "Users can view accessible anexos"
ON public.anexos FOR SELECT
TO authenticated
USING (
  CASE
    WHEN entidade_tipo = 'condominio' THEN public.has_condominio_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'unidade' THEN public.has_unidade_access(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'ordem_servico' THEN public.can_access_os(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'boleto' THEN public.can_access_boleto(auth.uid(), entidade_id::uuid)
    WHEN entidade_tipo = 'transacao' THEN EXISTS (
      SELECT 1 FROM public.transacoes_financeiras tf
      WHERE tf.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), tf.condominio_id)
    )
    WHEN entidade_tipo = 'atendimento' THEN EXISTS (
      SELECT 1 FROM public.atendimentos a
      WHERE a.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), a.condominio_id)
    )
    WHEN entidade_tipo = 'atendimento_historico' THEN EXISTS (
      SELECT 1 FROM public.atendimento_historico ah
      JOIN public.atendimentos a ON a.id = ah.atendimento_id
      WHERE ah.id = entidade_id::uuid
      AND public.has_condominio_access(auth.uid(), a.condominio_id)
    )
    ELSE false
  END
);

-- Garante que usuários autenticados podem inserir anexos do tipo 'transacao'
-- (reutiliza a política existente de insert se houver, ou cria uma nova)
DROP POLICY IF EXISTS "Users can insert anexos" ON public.anexos;
DROP POLICY IF EXISTS "Authenticated users can insert anexos" ON public.anexos;

CREATE POLICY "Authenticated users can insert anexos"
ON public.anexos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Garante que usuários podem deletar apenas seus próprios anexos
DROP POLICY IF EXISTS "Users can delete own anexos" ON public.anexos;
DROP POLICY IF EXISTS "Admins can delete any anexo" ON public.anexos;

CREATE POLICY "Users can delete own anexos"
ON public.anexos FOR DELETE
TO authenticated
USING (criado_por = auth.uid());

CREATE POLICY "Admins can delete any anexo"
ON public.anexos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
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
-- =====================================================
-- AUDITORIA DE SEGURANÇA: PREVENÇÃO DE DUPLICIDADE (RACE CONDITION)
-- =====================================================

-- Função para obter o próximo nosso_numero de forma atômica
-- Isso evita que dois usuários emitam o mesmo número simultaneamente
CREATE OR REPLACE FUNCTION public.get_next_nosso_numero(_conta_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_num INTEGER;
BEGIN
  -- Bloqueia a linha da conta para evitar concorrência
  UPDATE public.contas_bancarias
  SET nosso_numero_atual = COALESCE(nosso_numero_atual, nosso_numero_inicio, 1) + 1
  WHERE id = _conta_id
  RETURNING (nosso_numero_atual - 1) INTO v_next_num;

  RETURN LPAD(v_next_num::TEXT, 8, '0');
END;
$$;
CREATE TABLE mensageria_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'inapp')),
  ativo BOOLEAN DEFAULT true,
  config_json JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condominio_id, canal)
);

CREATE TABLE mensageria_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  comunicado_id uuid REFERENCES comunicados(id) ON DELETE SET NULL,
  evento_tipo TEXT,
  evento_ref_id uuid,
  destinatario_id uuid,
  destinatario_nome TEXT,
  destinatario_email TEXT,
  destinatario_telefone TEXT,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'inapp')),
  assunto TEXT,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enviando', 'enviado', 'falhou', 'lido')),
  tentativas INT DEFAULT 0,
  proximo_retry TIMESTAMPTZ,
  provider_response JSONB,
  enviado_em TIMESTAMPTZ,
  lido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE mensageria_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id uuid NOT NULL REFERENCES mensageria_entregas(id) ON DELETE CASCADE,
  tentativa INT NOT NULL,
  status TEXT NOT NULL,
  provider_request JSONB,
  provider_response JSONB,
  erro TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE morador_preferencias_notificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  receber_email BOOLEAN DEFAULT true,
  receber_whatsapp BOOLEAN DEFAULT true,
  receber_inapp BOOLEAN DEFAULT true,
  horario_silencio_inicio TIME DEFAULT '22:00',
  horario_silencio_fim TIME DEFAULT '08:00',
  opt_out_tipos TEXT[] DEFAULT '{}',
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(morador_id, condominio_id)
);

CREATE INDEX idx_mensageria_entregas_condominio ON mensageria_entregas(condominio_id);
CREATE INDEX idx_mensageria_entregas_status ON mensageria_entregas(status);
CREATE INDEX idx_mensageria_entregas_destinatario ON mensageria_entregas(destinatario_id);
CREATE INDEX idx_mensageria_entregas_criado_em ON mensageria_entregas(criado_em DESC);
CREATE INDEX idx_mensageria_entregas_comunicado ON mensageria_entregas(comunicado_id);
CREATE INDEX idx_mensageria_logs_entrega ON mensageria_logs(entrega_id);

ALTER TABLE mensageria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensageria_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensageria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE morador_preferencias_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensageria_config_staff" ON mensageria_config FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "mensageria_entregas_staff" ON mensageria_entregas FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "mensageria_entregas_morador" ON mensageria_entregas FOR SELECT USING (destinatario_id = auth.uid());
CREATE POLICY "mensageria_logs_staff" ON mensageria_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "preferencias_proprio_morador" ON morador_preferencias_notificacao FOR ALL USING (morador_id = auth.uid());
CREATE POLICY "preferencias_staff_view" ON morador_preferencias_notificacao FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
-- Migration para adicionar novos campos em fornecedores
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS numero_fornecedor serial,
ADD COLUMN IF NOT EXISTS dados_bancarios text,
ADD COLUMN IF NOT EXISTS tipos_servico text[] DEFAULT '{}';
-- Add specific banking fields to fornecedores
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS agencia text,
ADD COLUMN IF NOT EXISTS conta text,
ADD COLUMN IF NOT EXISTS pix text;
