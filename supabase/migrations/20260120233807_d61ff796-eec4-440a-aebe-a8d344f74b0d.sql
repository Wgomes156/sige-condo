-- Informações Jurídicas
ALTER TABLE public.condominios ADD COLUMN tem_cnpj boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN arquivo_cnpj_path text;

-- Infraestrutura
ALTER TABLE public.condominios ADD COLUMN nome_administradora text;

-- Documentação
ALTER TABLE public.condominios ADD COLUMN tem_convencao_ou_estatuto boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN tem_regimento_interno boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN data_ultima_atualizacao date;
ALTER TABLE public.condominios ADD COLUMN arquivo_documentacao_path text;

-- Acesso e Segurança
ALTER TABLE public.condominios ADD COLUMN tipo_acesso text;
ALTER TABLE public.condominios ADD COLUMN sistema_cameras boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN porteiro_turno text;
ALTER TABLE public.condominios ADD COLUMN quantidade_porteiros integer;
ALTER TABLE public.condominios ADD COLUMN sistema_mensageria boolean DEFAULT false;
ALTER TABLE public.condominios ADD COLUMN outros_funcionarios_descricao text;
ALTER TABLE public.condominios ADD COLUMN outros_funcionarios_quantidade integer;
ALTER TABLE public.condominios ADD COLUMN seguranca_turno text;
ALTER TABLE public.condominios ADD COLUMN empresa_seguranca_nome text;