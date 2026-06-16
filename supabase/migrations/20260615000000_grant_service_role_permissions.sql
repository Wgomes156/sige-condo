-- Grant necessary permissions to service_role for edge function operations.
-- Without these grants, admin operations (user deletion, role checks) fail
-- with "permission denied" even though service_role should bypass RLS.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
