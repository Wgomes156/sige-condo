-- Add specific banking fields to fornecedores
ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS agencia text,
ADD COLUMN IF NOT EXISTS conta text,
ADD COLUMN IF NOT EXISTS pix text;
