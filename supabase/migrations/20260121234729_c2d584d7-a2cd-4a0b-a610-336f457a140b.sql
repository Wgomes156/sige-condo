-- Adicionar campos da administradora na tabela condominios
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS administradora_site TEXT,
ADD COLUMN IF NOT EXISTS administradora_responsavel TEXT,
ADD COLUMN IF NOT EXISTS administradora_telefone TEXT,
ADD COLUMN IF NOT EXISTS administradora_email TEXT;