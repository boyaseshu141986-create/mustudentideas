import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.object({ projectId: z.string().uuid() });

/** Loads (and lazily creates) the signed-in user's own full profile. */
export const getMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const existing = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (existing.data) return existing.data;

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const meta = (userData?.user?.user_metadata ?? {}) as Record<string, string>;
    const inserted = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userId,
        email: userData?.user?.email ?? "",
        full_name: meta.full_name ?? "",
        role: (meta.role as "student" | "mentor" | "ngo" | "admin") ?? "student",
        department: meta.department ?? null,
        organisation: meta.organisation ?? null,
        phone: meta.phone ?? null,
      })
      .select()
      .maybeSingle();

    return inserted.data ?? null;
  });

/** Safe member directory (no email/phone/bio) for signed-in users. */
export const listDirectory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, department, organisation, avatar_url");
    return data ?? [];
  });

/** Admin-only: contact emails for the member lists in the admin console. */
export const listMemberEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const role = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!role.data) throw new Error("Forbidden");

    const { data } = await supabaseAdmin.from("profiles").select("id, email");
    return (data ?? []) as { id: string; email: string }[];
  });

/** Counts an NGO opening an accepted project. */
export const incrementProjectView = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => uuid.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const current = await supabaseAdmin
      .from("projects")
      .select("views, status")
      .eq("id", data.projectId)
      .maybeSingle();

    if (!current.data || current.data.status !== "accepted") return { ok: false as const };

    await supabaseAdmin
      .from("projects")
      .update({ views: (current.data.views ?? 0) + 1 })
      .eq("id", data.projectId);

    return { ok: true as const };
  });
