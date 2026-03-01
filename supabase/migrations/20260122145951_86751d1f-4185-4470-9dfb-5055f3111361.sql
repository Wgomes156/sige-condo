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
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados;