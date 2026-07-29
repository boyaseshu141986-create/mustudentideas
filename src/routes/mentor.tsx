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
import { helpRoom } from "@/lib/app";

export const Route = createFileRoute("/mentor")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Mentor dashboard — Marwadi Innovation Hub" },
      {
        name: "description",
        content: "Chat with students and admin, review submitted projects and post idea questions.",
      },
      { property: "og:title", content: "Mentor dashboard — Marwadi Innovation Hub" },
      { property: "og:description", content: "Guide Marwadi students through projects and ideas." },
    ],
  }),
  component: MentorPage,
});

function MentorPage() {
  const { profile, userId, refresh } = useRoleGuard("mentor");
  const { profiles, names } = useProfiles();
  const [showProfile, setShowProfile] = useState(false);

  if (!profile || !userId) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  const students = profiles.filter((p) => p.role === "student");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader profile={profile} onOpenProfile={() => setShowProfile(true)} />
      <ProfileDialog profile={profile} open={showProfile} onOpenChange={setShowProfile} onSaved={refresh} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight">Mentor space</h1>
        <Tabs defaultValue="help" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="help">Student chat</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
          </TabsList>

          <TabsContent value="help" className="mt-6">
            <HelpTab mentorId={userId} students={students} names={names} />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectsList names={names} />
          </TabsContent>

          <TabsContent value="ideas" className="mt-6">
            <MentorIdeas mentorId={userId} names={names} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}


function HelpTab({
  mentorId,
  students,
  names,
}: {
  mentorId: string;
  students: { id: string; full_name: string; email: string }[];
  names: Record<string, string>;
}) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
      <div className="space-y-2 rounded-2xl border border-border bg-card p-3">
        {students.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No students yet.</p> : null}
        {students.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
              active === s.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <span className="block truncate font-medium">{s.full_name || "Student"}</span>
            <span className="block truncate text-xs opacity-70">{s.email}</span>
          </button>
        ))}
      </div>
      <div className="h-[30rem]">
        {active ? (
          <ChatBox
            room={helpRoom(active, mentorId)}
            currentUserId={mentorId}
            names={names}
            title={`Helping ${names[active] ?? "student"}`}
          />
        ) : (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
            Pick a student to open the help chat.
          </div>
        )}
      </div>
    </div>
  );
}

type Project = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  tech_stack: string;
  project_link: string;
  status: string;
  views: number;
};

export function ProjectsList({ names }: { names: Record<string, string> }) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects((data ?? []) as Project[]));
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {projects.length === 0 ? <p className="text-sm text-muted-foreground">No projects yet.</p> : null}
      {projects.map((p) => (
        <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-semibold">{p.title}</h3>
            <Badge variant={p.status === "accepted" ? "default" : "secondary"}>{p.status}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">By {names[p.student_id] ?? "Student"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">Tech: {p.tech_stack || "—"}</p>
          <a href={p.project_link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
            {p.project_link}
          </a>
        </div>
      ))}
    </div>
  );
}

type Idea = { id: string; title: string; question: string; author_id: string };
type Answer = { id: string; idea_id: string; author_id: string; answer: string };

function MentorIdeas({ mentorId, names }: { mentorId: string; names: Record<string, string> }) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

  async function post(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !question.trim()) return;
    const payload = {
      title: title.trim().slice(0, 150),
      question: question.trim().slice(0, 1000),
    };
    const { error } = editingId
      ? await supabase.from("ideas").update(payload).eq("id", editingId)
      : await supabase.from("ideas").insert({ author_id: mentorId, ...payload });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setQuestion("");
    setEditingId(null);
    toast.success(editingId ? "Question updated" : "Question posted");
    void load();
  }

  function startEdit(idea: Idea) {
    setEditingId(idea.id);
    setTitle(idea.title);
    setQuestion(idea.question);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("ideas").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (editingId === id) {
      setEditingId(null);
      setTitle("");
      setQuestion("");
    }
    toast.success("Question removed");
    void load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={post} className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">
          {editingId ? "Edit your question" : "Ask a project question"}
        </h2>
        <div className="space-y-1.5">
          <Label htmlFor="it">Title</Label>
          <Input id="it" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="iq">Question</Label>
          <Textarea id="iq" value={question} onChange={(e) => setQuestion(e.target.value)} rows={4} maxLength={1000} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            {editingId ? "Save changes" : "Submit question"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setQuestion("");
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold">{idea.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{idea.question}</p>
            <p className="mt-3 text-xs font-medium text-primary">Asked by {names[idea.author_id] ?? "Mentor"}</p>
            {idea.author_id === mentorId ? (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(idea)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => void remove(idea.id)}>
                  Remove
                </Button>
              </div>
            ) : null}
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
          </div>
        ))}
      </div>
    </div>
  );

}
