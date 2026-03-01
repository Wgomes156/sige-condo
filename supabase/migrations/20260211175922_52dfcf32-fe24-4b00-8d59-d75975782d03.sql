
-- Tabela: areas_comuns
CREATE TABLE public.areas_comuns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  capacidade INTEGER,
  valor_taxa NUMERIC(10,2) DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  imagem_url TEXT,
  regras TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.areas_comuns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar areas_comuns" ON public.areas_comuns
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerente pode gerenciar areas do seu condomínio" ON public.areas_comuns
  FOR ALL USING (has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Moradores podem ver areas do seu condomínio" ON public.areas_comuns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM unidades u
      JOIN user_unidade_access uua ON uua.unidade_id = u.id
      WHERE u.condominio_id = areas_comuns.condominio_id AND uua.user_id = auth.uid()
    )
  );

-- Enum de status de reserva
CREATE TYPE public.reserva_status AS ENUM ('pendente', 'confirmada', 'cancelada', 'concluida', 'recusada');

-- Enum de status de acesso de convidado
CREATE TYPE public.convidado_status_acesso AS ENUM ('liberado', 'bloqueado', 'pendente');

-- Função para gerar número de reserva
CREATE OR REPLACE FUNCTION public.gerar_numero_reserva()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ano TEXT;
  mes TEXT;
  sequencia INT;
  numero TEXT;
BEGIN
  ano := to_char(CURRENT_DATE, 'YYYY');
  mes := to_char(CURRENT_DATE, 'MM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(numero_reserva FROM 'RSV-\d{6}-(\d+)') AS INT)
  ), 0) + 1
  INTO sequencia
  FROM reservas
  WHERE numero_reserva LIKE 'RSV-' || ano || mes || '-%';
  
  numero := 'RSV-' || ano || mes || '-' || LPAD(sequencia::TEXT, 4, '0');
  RETURN numero;
END;
$$;

-- Tabela: reservas
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_reserva TEXT NOT NULL UNIQUE DEFAULT gerar_numero_reserva(),
  condominio_id UUID NOT NULL REFERENCES public.condominios(id),
  unidade_id UUID NOT NULL REFERENCES public.unidades(id),
  area_comum_id UUID NOT NULL REFERENCES public.areas_comuns(id),

  responsavel_nome TEXT NOT NULL,
  responsavel_telefone TEXT NOT NULL,
  responsavel_email TEXT,
  responsavel_cpf TEXT,

  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,

  tem_convidados BOOLEAN DEFAULT false,
  total_convidados INTEGER DEFAULT 0,

  status public.reserva_status DEFAULT 'pendente',

  valor_taxa NUMERIC(10,2) DEFAULT 0,
  taxa_paga BOOLEAN DEFAULT false,
  data_pagamento DATE,

  observacoes TEXT,
  motivo_recusa TEXT,
  aprovado_por UUID,
  data_aprovacao TIMESTAMPTZ,
  criado_por UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reservas_data_inicio ON public.reservas(data_inicio);
CREATE INDEX idx_reservas_area_status ON public.reservas(area_comum_id, status);
CREATE INDEX idx_reservas_unidade ON public.reservas(unidade_id);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar todas reservas" ON public.reservas
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerente pode gerenciar reservas do condomínio" ON public.reservas
  FOR ALL USING (has_condominio_access(auth.uid(), condominio_id));

CREATE POLICY "Morador pode ver suas reservas" ON public.reservas
  FOR SELECT USING (has_unidade_access(auth.uid(), unidade_id));

CREATE POLICY "Morador pode criar reserva na sua unidade" ON public.reservas
  FOR INSERT WITH CHECK (has_unidade_access(auth.uid(), unidade_id));

CREATE POLICY "Morador pode cancelar sua reserva" ON public.reservas
  FOR UPDATE USING (has_unidade_access(auth.uid(), unidade_id) AND status = 'pendente');

-- Tabela: reserva_convidados
CREATE TABLE public.reserva_convidados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT NOT NULL,
  telefone TEXT,
  status_acesso public.convidado_status_acesso DEFAULT 'pendente',
  entrada_registrada BOOLEAN DEFAULT false,
  hora_entrada TIME,
  hora_saida TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reserva_convidados_reserva ON public.reserva_convidados(reserva_id);

ALTER TABLE public.reserva_convidados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar convidados" ON public.reserva_convidados
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Acesso convidados via reserva" ON public.reserva_convidados
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id = reserva_convidados.reserva_id
      AND (has_condominio_access(auth.uid(), r.condominio_id) OR has_unidade_access(auth.uid(), r.unidade_id))
    )
  );

-- Tabela: reserva_historico
CREATE TABLE public.reserva_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reserva_id UUID NOT NULL REFERENCES public.reservas(id) ON DELETE CASCADE,
  usuario_id UUID,
  acao TEXT NOT NULL,
  descricao TEXT,
  dados_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reserva_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Criar historico autenticado" ON public.reserva_historico
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Ver historico da reserva" ON public.reserva_historico
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservas r
      WHERE r.id = reserva_historico.reserva_id
      AND (has_role(auth.uid(), 'admin'::app_role) OR has_condominio_access(auth.uid(), r.condominio_id) OR has_unidade_access(auth.uid(), r.unidade_id))
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_areas_comuns_updated_at BEFORE UPDATE ON public.areas_comuns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at BEFORE UPDATE ON public.reservas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
