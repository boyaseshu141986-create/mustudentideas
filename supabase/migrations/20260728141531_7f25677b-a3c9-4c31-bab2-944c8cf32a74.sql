CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_sync_role
AFTER INSERT OR UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

CREATE OR REPLACE FUNCTION public.increment_project_views(_project_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.projects SET views = views + 1 WHERE id = _project_id AND status = 'accepted';
$$;

REVOKE ALL ON FUNCTION public.increment_project_views(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_project_views(uuid) TO authenticated, service_role;