-- Create contas_bancarias table with full support for billing/boleto registration
CREATE TABLE public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ownership: can be linked to administradora (shared) or specific condominio
  administradora_id UUID REFERENCES public.administradoras(id) ON DELETE CASCADE,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE,
  
  -- Basic bank info
  nome_conta VARCHAR(100) NOT NULL,
  banco_codigo VARCHAR(10) NOT NULL,
  banco_nome VARCHAR(100) NOT NULL,
  agencia VARCHAR(10) NOT NULL,
  agencia_digito VARCHAR(2),
  conta VARCHAR(20) NOT NULL,
  conta_digito VARCHAR(2),
  tipo_conta VARCHAR(20) NOT NULL DEFAULT 'corrente',
  
  -- Holder info
  titular_nome VARCHAR(150) NOT NULL,
  titular_documento VARCHAR(20) NOT NULL,
  titular_tipo VARCHAR(10) NOT NULL DEFAULT 'PJ',
  
  -- Boleto registration fields
  convenio VARCHAR(20),
  carteira VARCHAR(10),
  variacao_carteira VARCHAR(10),
  codigo_cedente VARCHAR(20),
  nosso_numero_inicio BIGINT DEFAULT 1,
  nosso_numero_atual BIGINT DEFAULT 1,
  
  -- Billing instructions
  instrucoes_linha1 TEXT,
  instrucoes_linha2 TEXT,
  instrucoes_linha3 TEXT,
  multa_percentual DECIMAL(5,2) DEFAULT 2.00,
  juros_mensal DECIMAL(5,2) DEFAULT 1.00,
  dias_protesto INTEGER,
  
  -- Status
  ativa BOOLEAN NOT NULL DEFAULT true,
  conta_padrao BOOLEAN NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT chk_ownership CHECK (
    (administradora_id IS NOT NULL AND condominio_id IS NULL) OR
    (administradora_id IS NULL AND condominio_id IS NOT NULL)
  ),
  CONSTRAINT chk_tipo_conta CHECK (tipo_conta IN ('corrente', 'poupanca')),
  CONSTRAINT chk_titular_tipo CHECK (titular_tipo IN ('PF', 'PJ'))
);

-- Add comments for documentation
COMMENT ON TABLE public.contas_bancarias IS 'Bank accounts for billing and boleto issuance';
COMMENT ON COLUMN public.contas_bancarias.administradora_id IS 'If set, this is a shared account owned by the administradora';
COMMENT ON COLUMN public.contas_bancarias.condominio_id IS 'If set, this is a specific account for this condominio';
COMMENT ON COLUMN public.contas_bancarias.convenio IS 'Convênio number for boleto registration';
COMMENT ON COLUMN public.contas_bancarias.carteira IS 'Carteira code for boleto';
COMMENT ON COLUMN public.contas_bancarias.nosso_numero_atual IS 'Current nosso_numero counter for sequential boleto generation';

-- Create indexes
CREATE INDEX idx_contas_bancarias_administradora ON public.contas_bancarias(administradora_id) WHERE administradora_id IS NOT NULL;
CREATE INDEX idx_contas_bancarias_condominio ON public.contas_bancarias(condominio_id) WHERE condominio_id IS NOT NULL;
CREATE INDEX idx_contas_bancarias_ativa ON public.contas_bancarias(ativa) WHERE ativa = true;

-- Enable RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access to contas_bancarias"
ON public.contas_bancarias
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Gerente can view accounts linked to their condominios or shared by administradora
CREATE POLICY "Gerente can view relevant contas_bancarias"
ON public.contas_bancarias
FOR SELECT
USING (
  public.has_role(auth.uid(), 'gerente') AND (
    -- Can see condominio-specific accounts they manage
    public.has_condominio_access(auth.uid(), condominio_id)
    OR
    -- Can see administradora accounts (shared)
    administradora_id IS NOT NULL
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_contas_bancarias_updated_at
BEFORE UPDATE ON public.contas_bancarias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Link configuracoes_cobranca to a conta_bancaria (optional)
ALTER TABLE public.configuracoes_cobranca
ADD COLUMN conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

-- Link boletos to a conta_bancaria (optional)
ALTER TABLE public.boletos
ADD COLUMN conta_bancaria_id UUID REFERENCES public.contas_bancarias(id) ON DELETE SET NULL;

-- Enable realtime for contas_bancarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.contas_bancarias;