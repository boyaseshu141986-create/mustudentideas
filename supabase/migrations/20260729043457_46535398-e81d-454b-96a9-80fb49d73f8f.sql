REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_access_room(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_project_views(uuid) FROM PUBLIC;