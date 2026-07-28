REVOKE ALL ON FUNCTION public.sync_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_user_role() TO service_role;