import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { ChatBox } from "@/components/ChatBox";
import { ProfileDialog } from "@/components/ProfileDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles, useRoleGuard } from "@/hooks/useRoleGuard";
import { listMemberEmails } from "@/lib/directory.functions";
import { adminRoom, ngoRoom, youtubeId } from "@/lib/app";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin console — Marwadi Innovation Hub" },
      {
        name: "description",
        content: "Review student project submissions, publish skill videos and chat with mentors, students and NGOs.",
      },
      { property: "og:title", content: "Admin console — Marwadi Innovation Hub" },
      { property: "og:description", content: "Approve projects and manage the Marwadi Innovation Hub." },
    ],
  }),
  component: AdminPage,
});

type Project = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  tech_stack: string;
  project_link: string;
  instructions: string | null;
  status: "pending" | "accepted" | "rejected";
  views: number;
};

function AdminPage() {
  const { profile, userId, refresh } = useRoleGuard("admin");
  const { profiles, names } = useProfiles();
  const [showProfile, setShowProfile] = useState(false);
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    listMemberEmails()
      .then((rows) => {
        const map: Record<string, string> = {};
        for (const r of rows) map[r.id] = r.email;
        setEmails(map);
      })
      .catch(() => setEmails({}));
  }, []);

  if (!profile || !userId) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const ngos = profiles.filter((p) => p.role === "ngo");
  const students = profiles.filter((p) => p.role === "student");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader profile={profile} onOpenProfile={() => setShowProfile(true)} />
      <ProfileDialog profile={profile} open={showProfile} onOpenChange={setShowProfile} onSaved={refresh} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Admin console</h1>
        <Tabs defaultValue="projects" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="videos">Skill videos</TabsTrigger>
            <TabsTrigger value="students">Student chats</TabsTrigger>
            <TabsTrigger value="ngo">NGO chats</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <ReviewTab names={names} />
          </TabsContent>
          <TabsContent value="videos" className="mt-6">
            <VideosTab adminId={userId} />
          </TabsContent>
          <TabsContent value="students" className="mt-6">
            <DirectChats
              adminId={userId}
              people={students}
              names={names}
              emails={emails}
              emptyLabel="No students registered yet."
              roomFor={adminRoom}
            />
          </TabsContent>
          <TabsContent value="ngo" className="mt-6">
            <DirectChats
              adminId={userId}
              people={ngos}
              names={names}
              emails={emails}
              emptyLabel="No NGOs registered yet."
              roomFor={ngoRoom}
            />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}

function ReviewTab({ names }: { names: Record<string, string> }) {
  const [projects, setProjects] = useState<Project[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: "accepted" | "rejected") {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "accepted" ? "Project accepted and published" : "Project rejected");
    void load();
  }

  return (
    <div className="space-y-4">
      {projects.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : null}
      {projects.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-xs text-muted-foreground">By {names[p.student_id] ?? "Student"}</p>
            </div>
            <Badge variant={p.status === "accepted" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
              {p.status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">Tech: {p.tech_stack || "—"}</p>
          {p.instructions ? (
            <p className="mt-1 text-xs text-muted-foreground">Transfer instructions: {p.instructions}</p>
          ) : null}
          <a href={p.project_link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
            {p.project_link}
          </a>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => void setStatus(p.id, "accepted")} disabled={p.status === "accepted"}>
              Accept &amp; publish
            </Button>
            <Button size="sm" variant="outline" onClick={() => void setStatus(p.id, "rejected")}>
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Video = { id: string; title: string; youtube_url: string; description: string };

function VideosTab({ adminId }: { adminId: string }) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("skill_videos").select("*").order("created_at", { ascending: false });
    setVideos((data ?? []) as Video[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !youtubeId(url)) {
      toast.error("Add a title and a valid YouTube link.");
      return;
    }
    const { error } = await supabase.from("skill_videos").insert({
      created_by: adminId,
      title: title.trim().slice(0, 150),
      youtube_url: url.trim().slice(0, 500),
      description: description.trim().slice(0, 1000),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setUrl("");
    setDescription("");
    toast.success("Video published to the student skill-learning slide");
    void load();
  }

  async function remove(id: string) {
    await supabase.from("skill_videos").delete().eq("id", id);
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={add} className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Upload a learning video</h2>
        <div className="space-y-1.5">
          <Label htmlFor="vt">Title</Label>
          <Input id="vt" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vu">YouTube link</Label>
          <Input id="vu" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} placeholder="https://youtu.be/…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="vd">Description</Label>
          <Textarea id="vd" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} />
        </div>
        <Button type="submit" className="w-full">Publish video</Button>
      </form>

      <div className="space-y-3">
        {videos.map((v) => (
          <div key={v.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="text-sm text-muted-foreground">{v.description}</p>
              <p className="truncate text-xs text-primary">{v.youtube_url}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void remove(v.id)}>
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

type ChatPerson = { id: string; full_name: string; organisation: string | null };

function DirectChats({
  adminId,
  people,
  names,
  emails,
  emptyLabel,
  roomFor,
}: {
  adminId: string;
  people: ChatPerson[];
  names: Record<string, string>;
  emptyLabel: string;
  roomFor: (id: string) => string;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
        {people.length === 0 ? <p className="p-2 text-sm text-muted-foreground">{emptyLabel}</p> : null}
        {people.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setActive(n.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              active === n.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <span className="block truncate font-medium">{n.organisation || n.full_name || "Member"}</span>
            <span className="block truncate text-xs opacity-70">{emails[n.id] ?? ""}</span>
          </button>
        ))}
      </div>
      <div className="h-[30rem]">
        {active ? (
          <ChatBox
            key={active}
            room={roomFor(active)}
            currentUserId={adminId}
            names={names}
            title={`Chat · ${names[active] ?? "Member"}`}
          />
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Click an email on the left to open the chat.
          </div>
        )}
      </div>
    </div>
  );
}
