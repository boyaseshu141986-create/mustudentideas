DROP VIEW IF EXISTS public.profiles_directory;

CREATE OR REPLACE FUNCTION public.list_directory()
RETURNS TABLE (
  id uuid,
  full_name text,
  role app_role,
  department text,
  organisation text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.role, p.department, p.organisation, p.avatar_url
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.list_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_directory() TO authenticated;