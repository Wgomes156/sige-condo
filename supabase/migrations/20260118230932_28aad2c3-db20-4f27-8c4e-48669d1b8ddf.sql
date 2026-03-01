-- Criar bucket para armazenamento de anexos
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
CREATE POLICY "Permitir upload de anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'anexos');

CREATE POLICY "Permitir visualização de anexos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'anexos');

CREATE POLICY "Permitir deleção de anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'anexos');

-- Índice para busca por entidade
CREATE INDEX idx_anexos_entidade ON public.anexos(entidade_tipo, entidade_id);