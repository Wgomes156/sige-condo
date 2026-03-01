-- Adicionar coluna unidade_id como FK para unidades
ALTER TABLE public.boletos 
ADD COLUMN unidade_id uuid REFERENCES public.unidades(id);

-- Criar índice para melhor performance
CREATE INDEX idx_boletos_unidade_id ON public.boletos(unidade_id);

-- Atualizar RLS para incluir acesso via unidade_id
DROP POLICY IF EXISTS "Residents see own unit boletos" ON public.boletos;

CREATE POLICY "Residents see own unit boletos" 
ON public.boletos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_unidade_access uua
    WHERE uua.unidade_id = boletos.unidade_id 
    AND uua.user_id = auth.uid()
  )
);

-- Atualizar política de visualização geral
DROP POLICY IF EXISTS "Visualizar boletos permitidos" ON public.boletos;

CREATE POLICY "Visualizar boletos permitidos" 
ON public.boletos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_condominio_access(auth.uid(), condominio_id) 
  OR EXISTS (
    SELECT 1 FROM user_unidade_access uua
    WHERE uua.unidade_id = boletos.unidade_id 
    AND uua.user_id = auth.uid()
  )
);