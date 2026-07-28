import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type Profile } from "@/hooks/useAuth";
import { HOME_FOR_ROLE, type Role } from "@/lib/app";

export function useRoleGuard(role: Role) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.session) {
      navigate({ to: "/auth", search: { slide: "campus" }, replace: true });
      return;
    }
    if (auth.profile && auth.profile.role !== role) {
      navigate({ to: HOME_FOR_ROLE[auth.profile.role], replace: true });
    }
  }, [auth.loading, auth.session, auth.profile, role, navigate]);

  return auth;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then(({ data }) => setProfiles((data ?? []) as Profile[]));
  }, []);

  const names: Record<string, string> = {};
  for (const p of profiles) names[p.id] = p.full_name || p.email;

  return { profiles, names };
}
