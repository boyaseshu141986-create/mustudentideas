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
import { adminRoom, helpRoom, youtubeId } from "@/lib/app";

export const Route = createFileRoute("/student")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Student dashboard — Marwadi Innovation Hub" },
      {
        name: "description",
        content: "Submit projects, ask mentors for help, answer idea questions and learn new skills.",
      },
      { property: "og:title", content: "Student dashboard — Marwadi Innovation Hub" },
      { property: "og:description", content: "Projects, ideas and skill learning for Marwadi students." },
    ],
  }),
  component: StudentPage,
});

type Project = {
  id: string;
  title: string;
  description: string;
  tech_stack: string;
  project_link: string;
  instructions: string | null;
  status: "pending" | "accepted" | "rejected";
  views: number;
  created_at: string;
};

function StudentPage() {
  const { profile, userId, refresh } = useRoleGuard("student");
  const { profiles, names } = useProfiles();
  const [showProfile, setShowProfile] = useState(false);

  if (!profile || !userId) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const mentors = profiles.filter((p) => p.role === "mentor");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader profile={profile} onOpenProfile={() => setShowProfile(true)} />
      <ProfileDialog profile={profile} open={showProfile} onOpenChange={setShowProfile} onSaved={refresh} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Student space</h1>
        <Tabs defaultValue="projects" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">1 · Project submissions</TabsTrigger>
            <TabsTrigger value="ideas">2 · Ideas</TabsTrigger>
            <TabsTrigger value="skills">3 · Skills learning</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6">
            <ProjectsTab studentId={userId} mentors={mentors} names={names} />
          </TabsContent>
          <TabsContent value="ideas" className="mt-6">
            <IdeasTab userId={userId} names={names} />
          </TabsContent>
          <TabsContent value="skills" className="mt-6">
            <SkillsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ProjectsTab({
  studentId,
  mentors,
  names,
}: {
  studentId: string;
  mentors: { id: string; email: string; full_name: string }[];
  names: Record<string, string>;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tech, setTech] = useState("");
  const [link, setLink] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [showMentors, setShowMentors] = useState(false);
  const [activeMentor, setActiveMentor] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    setProjects((data ?? []) as Project[]);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !link.trim()) {
      toast.error("Title and project link are required.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      student_id: studentId,
      title: title.trim().slice(0, 150),
      description: description.trim().slice(0, 2000),
      tech_stack: tech.trim().slice(0, 300),
      project_link: link.trim().slice(0, 500),
      instructions: instructions.trim().slice(0, 1000) || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Project submitted — it now goes to admin for review.");
    setTitle("");
    setDescription("");
    setTech("");
    setLink("");
    setInstructions("");
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Submit a project</h2>
        <div className="space-y-1.5">
          <Label htmlFor="t">Title</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d">Description</Label>
          <Textarea id="d" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s">Tech stack</Label>
          <Input id="s" value={tech} onChange={(e) => setTech(e.target.value)} maxLength={300} placeholder="React, Node, Postgres" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="l">Project link</Label>
          <Input id="l" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://…" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="i">Transfer instructions</Label>
          <Textarea id="i" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} maxLength={1000} />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Submitting…" : "Submit project"}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">My submissions</h2>
          <Button variant="outline" size="sm" onClick={() => setShowMentors((v) => !v)}>
            Mentor help
          </Button>
        </div>

        {showMentors ? (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Mentor emails</p>
            <div className="mt-3 space-y-2">
              {mentors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mentors registered yet.</p>
              ) : null}
              {mentors.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.full_name || "Mentor"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveMentor(m.id)}>
                    Chat
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Admin</p>
                <p className="truncate text-xs text-muted-foreground">Marwadi Innovation Hub admin</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveMentor("admin")}>
                Chat
              </Button>
            </div>
            {activeMentor === "admin" ? (
              <div className="mt-4 h-[26rem]">
                <ChatBox
                  room={adminRoom(studentId)}
                  currentUserId={studentId}
                  names={names}
                  title="Chat with Admin"
                />
              </div>
            ) : null}
            {activeMentor && activeMentor !== "admin" ? (
              <div className="mt-4 h-[26rem]">
                <ChatBox
                  key={activeMentor}
                  room={helpRoom(studentId, activeMentor)}
                  currentUserId={studentId}
                  names={names}
                  title={`Help chat with ${names[activeMentor] ?? "mentor"}`}
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects submitted yet.</p>
        ) : null}
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{p.title}</h3>
              <Badge variant={p.status === "accepted" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>
                {p.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Tech: {p.tech_stack || "—"}</p>
            <a href={p.project_link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
              {p.project_link}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">{p.views} views</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type Idea = { id: string; title: string; question: string; author_id: string; created_at: string };
type Answer = { id: string; idea_id: string; author_id: string; answer: string; created_at: string };

function IdeasTab({ userId, names }: { userId: string; names: Record<string, string> }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [i, a] = await Promise.all([
      supabase.from("ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("idea_answers").select("*").order("created_at", { ascending: true }),
    ]);
    setIdeas((i.data ?? []) as Idea[]);
    setAnswers((a.data ?? []) as Answer[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function answer(ideaId: string) {
    const text = (drafts[ideaId] ?? "").trim();
    if (!text) return;
    const { error } = await supabase
      .from("idea_answers")
      .insert({ idea_id: ideaId, author_id: userId, answer: text.slice(0, 1000) });
    if (error) {
      toast.error(error.message);
      return;
    }
    setDrafts((d) => ({ ...d, [ideaId]: "" }));
    void load();
  }

  return (
    <div className="space-y-4">
      {ideas.length === 0 ? <p className="text-sm text-muted-foreground">No mentor questions yet.</p> : null}
      {ideas.map((idea) => (
        <div key={idea.id} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">{idea.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{idea.question}</p>
          <p className="mt-3 text-xs font-medium text-primary">Asked by {names[idea.author_id] ?? "Mentor"}</p>

          <div className="mt-3 space-y-2">
            {answers
              .filter((a) => a.idea_id === idea.id)
              .map((a) => (
                <div key={a.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                  <span className="font-medium">{names[a.author_id] ?? "Member"}: </span>
                  {a.answer}
                </div>
              ))}
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              value={drafts[idea.id] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [idea.id]: e.target.value }))}
              placeholder="Write your answer…"
              maxLength={1000}
            />
            <Button onClick={() => void answer(idea.id)}>Post</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type Video = { id: string; title: string; youtube_url: string; description: string };

function SkillsTab() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    supabase
      .from("skill_videos")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setVideos((data ?? []) as Video[]));
  }, []);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {videos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No learning videos published yet.</p>
      ) : null}
      {videos.map((v) => {
        const id = youtubeId(v.youtube_url);
        return (
          <div key={v.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            {id ? (
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube.com/embed/${id}`}
                title={v.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : null}
            <div className="p-4">
              <h3 className="font-semibold">{v.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{v.description}</p>
              <a href={v.youtube_url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-primary underline">
                {v.youtube_url}
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
