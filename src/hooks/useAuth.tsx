import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/directory.functions";
import type { Role } from "@/lib/app";

export type Profile = {
  id: string;
  email?: string;
  full_name: string;
  role: Role;
  department: string | null;
  organisation: string | null;
  phone?: string | null;
  bio?: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyProfile();
      setProfile((data as Profile) ?? null);
    } catch {
      setProfile(null);
    }
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
        loadProfile().finally(() => setLoading(false));
      }, 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) {
        setLoading(false);
      } else {
        loadProfile().finally(() => setLoading(false));
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    if (session) await loadProfile();
  }, [session, loadProfile]);

  return { session, profile, loading, refresh, userId: session?.user.id ?? null };
}
