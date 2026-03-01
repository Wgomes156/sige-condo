-- Remover constraint antiga e criar nova com valor 'atraso' em vez de 'atrasado'
ALTER TABLE public.boletos DROP CONSTRAINT IF EXISTS boletos_status_check;

ALTER TABLE public.boletos ADD CONSTRAINT boletos_status_check 
  CHECK (status IN ('pendente', 'pago', 'atraso', 'cancelado'));