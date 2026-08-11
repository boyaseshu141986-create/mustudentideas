CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION private.can_access_room(_room text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _room = 'community' THEN true
    WHEN private.has_role(auth.uid(), 'admin') THEN true
    WHEN _room LIKE 'help-%' THEN substring(_room from 6 for 36) = auth.uid()::text
      OR substring(_room from 43 for 36) = auth.uid()::text
    WHEN _room LIKE 'ngo-%' THEN substring(_room from 5 for 36) = auth.uid()::text
    WHEN _room LIKE 'admin-%' THEN substring(_room from 7 for 36) = auth.uid()::text
    ELSE false
  END;
$$;

GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_room(text) TO authenticated;

-- Recreate policies against the private helpers
DROP POLICY IF EXISTS "answers delete own or admin" ON public.idea_answers;
CREATE POLICY "answers delete own or admin" ON public.idea_answers FOR DELETE TO authenticated
USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ideas delete own or admin" ON public.ideas;
CREATE POLICY "ideas delete own or admin" ON public.ideas FOR DELETE TO authenticated
USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "ideas update own or admin" ON public.ideas;
CREATE POLICY "ideas update own or admin" ON public.ideas FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (author_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "messages delete own" ON public.messages;
CREATE POLICY "messages delete own" ON public.messages FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "messages insert in room" ON public.messages;
CREATE POLICY "messages insert in room" ON public.messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND private.can_access_room(room));

DROP POLICY IF EXISTS "messages readable in room" ON public.messages;
CREATE POLICY "messages readable in room" ON public.messages FOR SELECT TO authenticated
USING (private.can_access_room(room));

DROP POLICY IF EXISTS "own or accepted projects readable" ON public.projects;
CREATE POLICY "own or accepted projects readable" ON public.projects FOR SELECT TO authenticated
USING (student_id = auth.uid() OR status = 'accepted' OR private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'mentor'));

DROP POLICY IF EXISTS "owner or admin deletes projects" ON public.projects;
CREATE POLICY "owner or admin deletes projects" ON public.projects FOR DELETE TO authenticated
USING (student_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "owner or admin updates projects" ON public.projects;
CREATE POLICY "owner or admin updates projects" ON public.projects FOR UPDATE TO authenticated
USING (student_id = auth.uid() OR private.has_role(auth.uid(), 'admin'))
WITH CHECK (student_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "videos deletable by admin or owner" ON public.skill_videos;
CREATE POLICY "videos deletable by admin or owner" ON public.skill_videos FOR DELETE TO authenticated
USING (created_by = auth.uid() OR private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "videos managed by admin or mentor" ON public.skill_videos;
CREATE POLICY "videos managed by admin or mentor" ON public.skill_videos FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'mentor')));

DROP POLICY IF EXISTS "roles readable by owner or admin" ON public.user_roles;
CREATE POLICY "roles readable by owner or admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'));

-- Profiles: directory rows for everyone signed in, sensitive columns revoked
DROP VIEW IF EXISTS public.public_profiles;
DROP POLICY IF EXISTS "profiles readable by owner or admin" ON public.profiles;
CREATE POLICY "profiles directory readable" ON public.profiles FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, full_name, role, department, organisation, avatar_url, created_at) ON public.profiles TO authenticated;

-- Remove public-schema SECURITY DEFINER functions callable by signed-in users
DROP FUNCTION IF EXISTS public.increment_project_views(uuid);
DROP FUNCTION IF EXISTS public.can_access_room(text);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);