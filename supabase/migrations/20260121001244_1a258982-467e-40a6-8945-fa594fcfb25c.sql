-- Adicionar campos de estrutura (amenidades)
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS salao_festa boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS area_kids boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS piscina boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS sala_jogos boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS quadra_futsal boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS quadra_tenis boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS sauna boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS outras_areas boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS outras_areas_descricao text;

-- Adicionar campos de vagas
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS tem_vagas_garagem boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS vagas_identificadas boolean DEFAULT false;

-- Adicionar campos de ESG
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS programa_sustentabilidade boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN IF NOT EXISTS descricao_sustentabilidade text;