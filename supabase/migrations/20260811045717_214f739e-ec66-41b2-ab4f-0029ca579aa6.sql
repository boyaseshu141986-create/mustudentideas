-- 1. Restrict full profile reads
DROP POLICY IF EXISTS "profiles readable by authenticated" ON public.profiles;
CREATE POLICY "profiles readable by owner or admin"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 2. Safe directory view (no email/phone/bio)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, full_name, role, department, organisation, avatar_url, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;

-- 3. Exact-match room access instead of substring matching
CREATE OR REPLACE FUNCTION public.can_access_room(_room text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    CASE
      WHEN _room = 'community' THEN true
      WHEN public.has_role(auth.uid(), 'admin') THEN true
      WHEN _room LIKE 'help-%' THEN
        substring(_room from 6 for 36) = auth.uid()::text
        OR substring(_room from 43 for 36) = auth.uid()::text
      WHEN _room LIKE 'ngo-%' THEN substring(_room from 5 for 36) = auth.uid()::text
      WHEN _room LIKE 'admin-%' THEN substring(_room from 7 for 36) = auth.uid()::text
      ELSE false
    END;
$function$;

-- 4. Internal trigger helper must not be callable by users
REVOKE EXECUTE ON FUNCTION public.sync_user_role() FROM PUBLIC, anon, authenticated;