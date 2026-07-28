import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, HeartHandshake, Lightbulb, Users } from "lucide-react";
import intro from "@/assets/intro.mp4.asset.json";
import { SiteHeader } from "@/components/SiteHeader";
import { WelcomeIntro } from "@/components/WelcomeIntro";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { HOME_FOR_ROLE } from "@/lib/app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marwadi Innovation Hub — Students, Mentors & NGOs" },
      {
        name: "description",
        content:
          "Marwadi University's innovation platform: students submit projects, mentors guide ideas, and NGOs discover work worth backing.",
      },
      { property: "og:title", content: "Marwadi Innovation Hub" },
      {
        property: "og:description",
        content: "Submit projects, get mentor help, explore ideas and skill learning — all in one place.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <WelcomeIntro />
      <SiteHeader profile={profile} />

      <main>
        <section className="relative isolate overflow-hidden">
          <video
            className="absolute inset-0 -z-10 size-full object-cover"
            src={intro.url}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-[2px]" />

          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center lg:py-28">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Startup & Innovation Policy
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Where Marwadi ideas turn into
              <span className="text-primary"> funded projects</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Students submit project links, mentors review and guide them, admin approves what goes
              live, and NGOs discover work they can support or buy.
            </p>

            <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-foreground">Login in your account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an account to enter the Student / Mentor space or the NGO space.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ slide: "campus" }}>
                    Login / Create account <ArrowRight className="ml-1 size-4" />
                  </Link>
                </Button>
                {profile ? (
                  <Button asChild size="lg" variant="outline">
                    <Link to={HOME_FOR_ROLE[profile.role]}>Go to my dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="lg" variant="outline">
                    <Link to="/auth" search={{ slide: "ngo" }}>
                      NGO access
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: GraduationCap, title: "Project submissions", text: "Title, description, tech stack and links — reviewed by admin." },
              { icon: Lightbulb, title: "Ideas board", text: "Mentors post project questions, students answer and learn." },
              { icon: Users, title: "Mentor help", text: "Chat directly with a mentor, emojis included." },
              { icon: HeartHandshake, title: "NGO support", text: "NGOs browse approved work and chat with admin to back it." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-5">
                <f.icon className="size-6 text-primary" />
                <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Marwadi University · Innovation Hub
      </footer>
    </div>
  );
}
