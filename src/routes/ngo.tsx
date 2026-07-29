import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatBox } from "@/components/ChatBox";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles, useRoleGuard } from "@/hooks/useRoleGuard";
import { ngoRoom } from "@/lib/app";

export const Route = createFileRoute("/ngo")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "NGO portal — Marwadi Innovation Hub" },
      {
        name: "description",
        content: "Browse approved student projects and chat with the admin team to buy or partner on a solution.",
      },
      { property: "og:title", content: "NGO portal — Marwadi Innovation Hub" },
      { property: "og:description", content: "Discover and adopt student-built projects from Marwadi University." },
    ],
  }),
  component: NgoPage,
});

type Project = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  tech_stack: string;
  project_link: string;
  views: number;
};

function NgoPage() {
  const { profile, userId, refresh } = useRoleGuard("ngo");
  const { names } = useProfiles();
  const [showProfile, setShowProfile] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .eq("status", "accepted")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects((data ?? []) as Project[]));
  }, []);

  if (!profile || !userId) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  async function view(p: Project) {
    window.open(p.project_link, "_blank", "noopener,noreferrer");
    await supabase.rpc("increment_project_views", { _project_id: p.id });
  }

  async function want(p: Project) {
    await supabase.from("messages").insert({
      room: ngoRoom(userId!),
      sender_id: userId!,
      content: `I want this project: ${p.title} — ${p.project_link}`,
    });
    document.getElementById("admin-chat")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader profile={profile} onOpenProfile={() => setShowProfile(true)} />
      <ProfileDialog profile={profile} open={showProfile} onOpenChange={setShowProfile} onSaved={refresh} />

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h1 className="text-2xl font-bold tracking-tight">Approved student projects</h1>
          <div className="mt-6 space-y-4">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved projects available yet.</p>
            ) : null}
            {projects.map((p) => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold">{p.title}</h2>
                <p className="text-xs text-muted-foreground">By {names[p.student_id] ?? "Student"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">Tech: {p.tech_stack || "—"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button size="sm" onClick={() => void view(p)}>
                    Open project link
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void want(p)}>
                    I want this
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="admin-chat">
          <h2 className="text-base font-semibold">Chat with admin</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Interested in buying or partnering on a project? Message the admin team here.
          </p>
          <div className="mt-4 h-[32rem]">
            <ChatBox
              room={ngoRoom(userId)}
              currentUserId={userId}
              names={names}
              title="NGO ↔ Admin"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

