import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

export const ensureAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const ADMIN_USERNAME = "Marwadi";
    const ADMIN_PASSWORD = "2026";
    const ADMIN_EMAIL = "admin@marwadiuniversity.ac.in";

    if (data.username !== ADMIN_USERNAME || data.password !== ADMIN_PASSWORD) {
      return { ok: false as const, error: "Invalid admin credentials" };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", ADMIN_EMAIL)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD });
      return { ok: true as const, email: ADMIN_EMAIL };
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

    if (created.error || !created.data.user) {
      return { ok: false as const, error: "Could not prepare the admin account" };
    }

    await supabaseAdmin.from("profiles").insert({
      id: created.data.user.id,
      email: ADMIN_EMAIL,
      full_name: "Marwadi Admin",
      role: "admin",
    });

    return { ok: true as const, email: ADMIN_EMAIL };
  });
