-- Criar enum para status da OS
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
CREATE INDEX idx_ordens_servico_data_solicitacao ON public.ordens_servico(data_solicitacao);