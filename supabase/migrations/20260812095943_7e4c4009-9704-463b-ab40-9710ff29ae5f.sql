DROP POLICY IF EXISTS "profiles directory readable" ON public.profiles;

CREATE POLICY "own profile readable"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.profiles_directory
WITH (security_barrier = true) AS
  SELECT id, full_name, role, department, organisation, avatar_url, created_at
  FROM public.profiles;

REVOKE ALL ON public.profiles_directory FROM anon;
GRANT SELECT ON public.profiles_directory TO authenticated;
GRANT SELECT ON public.profiles_directory TO service_role;