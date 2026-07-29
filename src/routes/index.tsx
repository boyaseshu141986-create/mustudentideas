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
        <section className="dark relative isolate overflow-hidden">
          <video
            className="absolute inset-0 -z-10 size-full object-cover"
            src={intro.url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/45 via-background/25 to-background/70" />

          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center lg:py-28">
            <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-accent-foreground uppercase">
              Startup &amp; Innovation Policy
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground drop-shadow-lg sm:text-5xl lg:text-6xl">
              Where Marwadi ideas turn into
              <span className="text-accent"> funded projects</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-foreground/85 drop-shadow sm:text-lg">
              Students submit project links, mentors review and guide them, admin approves what goes
              live, and NGOs discover work they can support or buy.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto w-full max-w-3xl px-4 py-14">
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
              <p className="text-base font-semibold text-card-foreground">Login in your account</p>
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

            <div className="mt-10 text-center">
              <h2 className="text-2xl font-bold tracking-tight">About the Marketplace</h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                The Marwadi University Campus Marketplace is an exclusive platform bridging the gap
                between student innovators, faculty mentors, and industry partners. We empower
                students to showcase their groundbreaking projects while providing businesses and
                mentors with direct access to the next generation of tech talent.
              </p>
            </div>
          </div>
        </section>


        <section className="border-t border-border bg-sidebar">
          <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-sidebar-foreground sm:text-3xl">
              Ready to open your account?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-sidebar-foreground/75">
              Students and mentors use their Marwadi email. NGOs can register with any work email.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ slide: "campus" }}>
                  Student / Mentor account <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth" search={{ slide: "ngo" }}>
                  NGO account
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>


      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Marwadi University · Innovation Hub
      </footer>
    </div>
  );
}
