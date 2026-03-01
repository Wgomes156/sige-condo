
-- Criar tabela de histórico de atendimentos
CREATE TABLE public.atendimento_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atendimento_id UUID NOT NULL REFERENCES public.atendimentos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  hora TIME NOT NULL DEFAULT CURRENT_TIME,
  detalhes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Em andamento',
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.atendimento_historico ENABLE ROW LEVEL SECURITY;

-- Policies matching atendimentos access
CREATE POLICY "Admin pode gerenciar histórico atendimentos"
ON public.atendimento_historico FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Gerentes podem gerenciar histórico dos seus condomínios"
ON public.atendimento_historico FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM atendimentos a
    WHERE a.id = atendimento_historico.atendimento_id
    AND a.condominio_id IS NOT NULL
    AND has_condominio_access(auth.uid(), a.condominio_id)
  )
);

CREATE POLICY "Operadores podem gerenciar histórico dos seus atendimentos"
ON public.atendimento_historico FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM atendimentos a
    WHERE a.id = atendimento_historico.atendimento_id
    AND a.operador_id = auth.uid()
  )
);
