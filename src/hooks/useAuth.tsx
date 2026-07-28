import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/app";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  department: string | null;
  organisation: string | null;
  phone: string | null;
  bio: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (s: Session) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
    if (data) {
      setProfile(data as Profile);
      return;
    }
    const meta = (s.user.user_metadata ?? {}) as Record<string, string>;
    const inserted = await supabase
      .from("profiles")
      .insert({
        id: s.user.id,
        email: s.user.email ?? "",
        full_name: meta.full_name ?? "",
        role: (meta.role as Role) ?? "student",
        department: meta.department ?? null,
        organisation: meta.organisation ?? null,
        phone: meta.phone ?? null,
      })
      .select()
      .maybeSingle();
    setProfile((inserted.data as Profile) ?? null);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setTimeout(() => {
        loadProfile(s).finally(() => setLoading(false));
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        setLoading(false);
      } else {
        loadProfile(data.session).finally(() => setLoading(false));
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    if (session) await loadProfile(session);
  }, [session, loadProfile]);

  return { session, profile, loading, refresh, userId: session?.user.id ?? null };
}
