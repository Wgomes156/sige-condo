-- Create a sequence for automatic unit codes
CREATE SEQUENCE IF NOT EXISTS public.unidades_codigo_seq START WITH 1 INCREMENT BY 1;

-- Update the codigo column to have a default value from the sequence
ALTER TABLE public.unidades 
ALTER COLUMN codigo SET DEFAULT 'UND-' || LPAD(nextval('unidades_codigo_seq')::text, 6, '0');

-- Make codigo NOT NULL (it already is, but ensuring)
ALTER TABLE public.unidades ALTER COLUMN codigo SET NOT NULL;

-- Add unique constraint on codigo if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unidades_codigo_unique'
  ) THEN
    ALTER TABLE public.unidades ADD CONSTRAINT unidades_codigo_unique UNIQUE (codigo);
  END IF;
END $$;