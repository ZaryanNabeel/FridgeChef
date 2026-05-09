import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Camera, BookOpen, ChefHat, Apple, Repeat, Utensils, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: typeof Home; exact?: boolean };
const ITEMS: Item[] = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/scan", label: "Scan", icon: Camera },
  { to: "/recipes", label: "Recipes", icon: BookOpen },
  { to: "/cooking", label: "Cook", icon: ChefHat },
  { to: "/nutrition", label: "Nutri", icon: Apple },
  { to: "/variations", label: "Vary", icon: Repeat },
  { to: "/plating", label: "Plate", icon: Utensils },
  { to: "/profile", label: "You", icon: User },
];

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 flex items-center gap-2 overflow-x-auto bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
      <div className="flex items-center gap-2 pr-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ChefHat className="h-4 w-4" />
        </div>
        <span className="text-sm font-bold">FridgeChef</span>
      </div>
      <div className="flex flex-1 items-center gap-1">
        {ITEMS.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path === to || path.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to as any}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground/70 hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
