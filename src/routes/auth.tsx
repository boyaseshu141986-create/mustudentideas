import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ensureAdminAccount } from "@/lib/admin.functions";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  HOME_FOR_ROLE,
  MENTOR_DOMAIN,
  STUDENT_DOMAIN,
  domainForRole,
  emailMatchesRole,
  type Role,
} from "@/lib/app";

const searchSchema = z.object({
  slide: z.enum(["campus", "ngo"]).catch("campus"),
});

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Marwadi Innovation Hub" },
      {
        name: "description",
        content:
          "Create an account or sign in as a Marwadi student, mentor or partner NGO to access the innovation hub.",
      },
      { property: "og:title", content: "Sign in — Marwadi Innovation Hub" },
      { property: "og:description", content: "Student, mentor and NGO access to the Marwadi Innovation Hub." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { slide } = Route.useSearch();
  const navigate = useNavigate();
  const { profile, session } = useAuth();

  useEffect(() => {
    if (profile) navigate({ to: HOME_FOR_ROLE[profile.role], replace: true });
  }, [profile, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Login in your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Slide 1 is for students and mentors. Slide 2 is for NGOs.
        </p>

        <Tabs
          value={slide}
          onValueChange={(v) => navigate({ to: "/auth", search: { slide: v as "campus" | "ngo" } })}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campus">1 · Student / Mentor</TabsTrigger>
            <TabsTrigger value="ngo">2 · NGOs</TabsTrigger>
          </TabsList>

          <TabsContent value="campus" className="mt-6">
            <CampusPanel />
          </TabsContent>
          <TabsContent value="ngo" className="mt-6">
            <AccountForm role="ngo" />
          </TabsContent>
        </Tabs>

        {!session ? <AdminPanel /> : null}
      </main>
    </div>
  );
}

function CampusPanel() {
  const [role, setRole] = useState<Role>("student");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {(["student", "mentor"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`rounded-xl border p-4 text-left transition ${
              role === r ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/60"
            }`}
          >
            <p className="text-sm font-semibold capitalize">{r} section</p>
            <p className="mt-1 text-xs text-muted-foreground">@{domainForRole(r)}</p>
          </button>
        ))}
      </div>
      <AccountForm role={role} />
    </div>
  );
}

function AccountForm({ role }: { role: Role }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailMatchesRole(email, role)) {
      toast.error(
        role === "ngo"
          ? "Enter a valid email address."
          : `${role === "student" ? "Student" : "Mentor"} accounts must use an @${domainForRole(role)} email.`,
      );
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: {
              full_name: fullName.trim(),
              role,
              department: role === "student" || role === "mentor" ? extra.trim() : null,
              organisation: role === "ngo" ? extra.trim() : null,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your Gmail inbox and verify your email, then sign in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex gap-2">
        {(["login", "signup"] as const).map((m) => (
          <Button
            key={m}
            type="button"
            size="sm"
            variant={mode === m ? "default" : "outline"}
            onClick={() => setMode(m)}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </Button>
        ))}
      </div>

      {mode === "signup" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="extra">{role === "ngo" ? "Organisation" : "Department"}</Label>
            <Input id="extra" value={extra} onChange={(e) => setExtra(e.target.value)} maxLength={100} />
          </div>
        </>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            role === "student"
              ? `yourname@${STUDENT_DOMAIN}`
              : role === "mentor"
                ? `yourname@${MENTOR_DOMAIN}`
                : "ngo@example.org"
          }
          required
          maxLength={255}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          maxLength={128}
        />
      </div>

      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </Button>
      {role !== "ngo" ? (
        <p className="text-xs text-muted-foreground">
          Accounts are verified by email — confirm the link sent to your inbox before signing in.
        </p>
      ) : null}
    </form>
  );
}

function AdminPanel() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await ensureAdminAccount({ data: { username, password } });
      if (!result.ok) {
        toast.error(result.error ?? "Invalid admin credentials");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: ADMIN_PASSWORD,
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Admin sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border p-5">
      {!open ? (
        <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setOpen(true)}>
          Admin sign in
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-sm font-semibold">Admin sign in</p>
          <Input
            placeholder={`Username (${ADMIN_USERNAME})`}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={64}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={128}
          />
          <Button type="submit" disabled={busy} size="sm">
            {busy ? "Signing in…" : "Enter admin"}
          </Button>
        </form>
      )}
    </div>
  );
}
