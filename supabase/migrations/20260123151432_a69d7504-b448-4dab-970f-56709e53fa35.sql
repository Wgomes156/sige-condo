-- Tabela de ocorrências do condomínio (áreas comuns, eventos gerais)
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
ALTER PUBLICATION supabase_realtime ADD TABLE public.ocorrencias_condominio;