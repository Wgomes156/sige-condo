-- Adicionar campos bairro e cep na tabela condominios
ALTER TABLE public.condominios ADD COLUMN bairro text;
ALTER TABLE public.condominios ADD COLUMN cep text;