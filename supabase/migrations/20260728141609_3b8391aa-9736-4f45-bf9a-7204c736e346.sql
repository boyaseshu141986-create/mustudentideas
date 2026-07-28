REVOKE EXECUTE ON FUNCTION public.sync_user_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_project_views(uuid) FROM anon;