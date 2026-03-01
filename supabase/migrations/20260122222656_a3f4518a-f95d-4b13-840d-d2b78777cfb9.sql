-- Fix profiles table: Remove overly permissive policies
-- The profiles table should only be viewable by the owner or admins

-- Drop the overly permissive policies if they exist and recreate properly
-- (The current policies "Users can view their own profile" and "Admins podem ver todos os perfis" are correct)

-- Fix administradoras table: Restrict to admin or users with access to condominiums that reference the administradora
DROP POLICY IF EXISTS "Visualizar administradoras" ON public.administradoras;

CREATE POLICY "Visualizar administradoras permitidas"
ON public.administradoras FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.condominios c
    JOIN public.user_condominio_access uca ON uca.condominio_id = c.id
    WHERE c.administradora_id = administradoras.id
    AND uca.user_id = auth.uid()
  )
);

-- Fix storage bucket: Make anexos bucket private and update policies

-- Update bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'anexos';

-- Drop the public access policy
DROP POLICY IF EXISTS "Permitir visualização de anexos" ON storage.objects;

-- Create authenticated-only policy with proper access control
CREATE POLICY "Authenticated users can view anexos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'anexos' AND
  (
    -- Admin can see everything
    public.has_role(auth.uid(), 'admin') OR
    -- User has access to the related entity via anexos table
    EXISTS (
      SELECT 1 FROM public.anexos a
      WHERE a.storage_path = storage.objects.name
      AND (
        -- Check access based on entidade_tipo
        (a.entidade_tipo = 'condominio' AND public.has_condominio_access(auth.uid(), a.entidade_id))
        OR (a.entidade_tipo = 'unidade' AND public.has_unidade_access(auth.uid(), a.entidade_id))
        OR (a.entidade_tipo = 'atendimento' AND EXISTS (
          SELECT 1 FROM public.atendimentos at
          WHERE at.id = a.entidade_id
          AND (public.has_role(auth.uid(), 'admin') OR at.operador_id = auth.uid() OR public.has_condominio_access(auth.uid(), at.condominio_id))
        ))
        OR (a.entidade_tipo = 'ordem_servico' AND public.can_access_os(auth.uid(), a.entidade_id))
      )
    )
  )
);

-- Keep the delete policy for authenticated users who uploaded the file
DROP POLICY IF EXISTS "Permitir deleção de anexos" ON storage.objects;

CREATE POLICY "Authenticated users can delete their own anexos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'anexos' AND
  (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.anexos a
      WHERE a.storage_path = storage.objects.name
      AND a.criado_por = auth.uid()
    )
  )
);

-- Ensure upload policy exists for authenticated users
DROP POLICY IF EXISTS "Permitir upload de anexos" ON storage.objects;

CREATE POLICY "Authenticated users can upload anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anexos' AND
  auth.uid() IS NOT NULL
);