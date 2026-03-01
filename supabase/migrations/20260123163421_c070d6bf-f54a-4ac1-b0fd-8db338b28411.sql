-- Adicionar coluna foto_url na tabela animais_unidade
ALTER TABLE public.animais_unidade
ADD COLUMN foto_url TEXT;

-- Criar bucket para fotos de animais
INSERT INTO storage.buckets (id, name, public)
VALUES ('animais-fotos', 'animais-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública das fotos
CREATE POLICY "Fotos de animais são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'animais-fotos');

-- Política para upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de fotos de animais"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar fotos de animais"
ON storage.objects FOR UPDATE
USING (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');

-- Política para exclusão por usuários autenticados
CREATE POLICY "Usuários autenticados podem excluir fotos de animais"
ON storage.objects FOR DELETE
USING (bucket_id = 'animais-fotos' AND auth.role() = 'authenticated');