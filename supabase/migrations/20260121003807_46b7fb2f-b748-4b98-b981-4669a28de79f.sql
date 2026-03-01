-- Adicionar campos de estacionamento detalhados
ALTER TABLE public.condominios
ADD COLUMN IF NOT EXISTS quantidade_total_vagas INTEGER,
ADD COLUMN IF NOT EXISTS vagas_visitantes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quantidade_vagas_visitantes INTEGER,
ADD COLUMN IF NOT EXISTS controle_acesso_vagas TEXT;