CREATE TABLE mensageria_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'inapp')),
  ativo BOOLEAN DEFAULT true,
  config_json JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(condominio_id, canal)
);

CREATE TABLE mensageria_entregas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  comunicado_id uuid REFERENCES comunicados(id) ON DELETE SET NULL,
  evento_tipo TEXT,
  evento_ref_id uuid,
  destinatario_id uuid,
  destinatario_nome TEXT,
  destinatario_email TEXT,
  destinatario_telefone TEXT,
  canal TEXT NOT NULL CHECK (canal IN ('email', 'whatsapp', 'inapp')),
  assunto TEXT,
  mensagem TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enviando', 'enviado', 'falhou', 'lido')),
  tentativas INT DEFAULT 0,
  proximo_retry TIMESTAMPTZ,
  provider_response JSONB,
  enviado_em TIMESTAMPTZ,
  lido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now(),
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE mensageria_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id uuid NOT NULL REFERENCES mensageria_entregas(id) ON DELETE CASCADE,
  tentativa INT NOT NULL,
  status TEXT NOT NULL,
  provider_request JSONB,
  provider_response JSONB,
  erro TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE morador_preferencias_notificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morador_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  receber_email BOOLEAN DEFAULT true,
  receber_whatsapp BOOLEAN DEFAULT true,
  receber_inapp BOOLEAN DEFAULT true,
  horario_silencio_inicio TIME DEFAULT '22:00',
  horario_silencio_fim TIME DEFAULT '08:00',
  opt_out_tipos TEXT[] DEFAULT '{}',
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(morador_id, condominio_id)
);

CREATE INDEX idx_mensageria_entregas_condominio ON mensageria_entregas(condominio_id);
CREATE INDEX idx_mensageria_entregas_status ON mensageria_entregas(status);
CREATE INDEX idx_mensageria_entregas_destinatario ON mensageria_entregas(destinatario_id);
CREATE INDEX idx_mensageria_entregas_criado_em ON mensageria_entregas(criado_em DESC);
CREATE INDEX idx_mensageria_entregas_comunicado ON mensageria_entregas(comunicado_id);
CREATE INDEX idx_mensageria_logs_entrega ON mensageria_logs(entrega_id);

ALTER TABLE mensageria_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensageria_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensageria_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE morador_preferencias_notificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mensageria_config_staff" ON mensageria_config FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "mensageria_entregas_staff" ON mensageria_entregas FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "mensageria_entregas_morador" ON mensageria_entregas FOR SELECT USING (destinatario_id = auth.uid());
CREATE POLICY "mensageria_logs_staff" ON mensageria_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
CREATE POLICY "preferencias_proprio_morador" ON morador_preferencias_notificacao FOR ALL USING (morador_id = auth.uid());
CREATE POLICY "preferencias_staff_view" ON morador_preferencias_notificacao FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin','sindico','gerente'))
);
