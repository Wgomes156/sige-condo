-- =============================================
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
CREATE INDEX IF NOT EXISTS idx_unidades_status_financeiro ON public.unidades(status_financeiro);