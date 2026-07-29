GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.can_access_room(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.increment_project_views(uuid) TO authenticated, service_role;