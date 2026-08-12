import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut, User } from "lucide-react";
import logo from "@/assets/marwadi-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useAuth";

export function SiteHeader({
  profile,
  onOpenProfile,
}: {
  profile?: Profile | null;
  onOpenProfile?: () => void;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showBack = pathname !== "/";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-2">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go back"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
          ) : null}
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="Marwadi University" className="h-9 w-auto" />
            <span className="hidden text-sm font-semibold tracking-[0.2em] text-muted-foreground uppercase sm:inline">
              Innovation Hub
            </span>
          </Link>
        </div>

        {profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                  {(profile.full_name || profile.email || "M").charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[9rem] truncate sm:inline">
                  {profile.full_name || profile.email || "Member"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate text-sm font-semibold">{profile.full_name || "Unnamed"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{profile.email}</p>
                <p className="text-xs font-normal text-muted-foreground capitalize">{profile.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onOpenProfile ? (
                <DropdownMenuItem onSelect={onOpenProfile}>
                  <User className="mr-2 size-4" /> My profile
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={signOut}>
                <LogOut className="mr-2 size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm">
            <Link to="/auth" search={{ slide: "campus" }}>Login / Create account</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
