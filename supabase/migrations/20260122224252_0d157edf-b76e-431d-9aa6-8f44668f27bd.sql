-- Create audit log table for tracking sensitive operations
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_name text,
  details jsonb,
  ip_address text,
  user_agent text
);

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Security audit log for tracking sensitive operations';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed: create, update, delete, login, logout, password_reset, role_change, etc.';
COMMENT ON COLUMN public.audit_logs.entity_type IS 'Type of entity affected: user, boleto, condominio, unidade, etc.';
COMMENT ON COLUMN public.audit_logs.details IS 'Additional details about the operation (changes made, previous values, etc.)';

-- Create index for faster queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (security requirement)
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to insert audit logs (for tracking their own actions)
-- This uses service role in edge functions for system-level logging
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- No one can update or delete audit logs (immutability for security)
-- Admins could be granted this via a separate policy if needed for compliance

-- Enable realtime for audit logs (useful for monitoring)
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;