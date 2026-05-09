import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home, Camera, BookOpen, ChefHat, Apple, Repeat, Utensils,
  LogOut, User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/",           label: "Home",            icon: Home,    exact: true },
  { to: "/scan",       label: "Scan Ingredients", icon: Camera },
  { to: "/recipes",    label: "Recipes",          icon: BookOpen },
  { to: "/cooking",    label: "Cooking Guide",    icon: ChefHat },
  { to: "/nutrition",  label: "Nutrition",        icon: Apple },
  { to: "/variations", label: "Variations",       icon: Repeat },
  { to: "/plating",    label: "Plating Preview",  icon: Utensils },
];

export function Sidebar() {
  const path     = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate({ to: "/login" });
  };

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Chef";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex md:sticky md:top-0 md:h-screen">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-card">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-bold tracking-tight">FridgeChef</div>
          <div className="text-xs text-sidebar-foreground/60">Your AI Sous Chef</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact
            ? path === to
            : path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to as any}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-white/10 px-4 py-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition hover:bg-white/5 hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
