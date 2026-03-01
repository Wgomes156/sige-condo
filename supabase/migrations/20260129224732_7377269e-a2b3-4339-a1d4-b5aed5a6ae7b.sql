-- Adicionar campos de contrato na seção de Administradora
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS administradora_tem_contrato boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS administradora_contrato_path text;