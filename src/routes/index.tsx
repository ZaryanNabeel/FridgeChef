import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Camera, BookOpen, ChefHat, Apple, Repeat, Utensils, ArrowRight,
  Sparkles, Bell, Plus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecipeStore } from "@/lib/recipe-store";
import { MOCK_RECIPES } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FridgeChef — Your AI Sous Chef" },
      { name: "description", content: "Turn what's in your fridge into curated, AI-powered recipes." },
    ],
  }),
  component: HomePage,
});

const QUICK = [
  { to: "/scan", label: "Scan Ingredients", desc: "Snap your fridge", icon: Camera, accent: "bg-primary/10 text-primary" },
  { to: "/recipes", label: "Browse Recipes", desc: "Curated for you", icon: BookOpen, accent: "bg-amber-100 text-amber-700" },
  { to: "/cooking", label: "Cooking Guide", desc: "Step-by-step", icon: ChefHat, accent: "bg-blue-100 text-blue-700" },
  { to: "/nutrition", label: "Nutrition", desc: "Macro breakdown", icon: Apple, accent: "bg-rose-100 text-rose-700" },
  { to: "/variations", label: "Variations", desc: "Adapt your recipe", icon: Repeat, accent: "bg-purple-100 text-purple-700" },
  { to: "/plating", label: "Plating Preview", desc: "Visual inspiration", icon: Utensils, accent: "bg-emerald-100 text-emerald-700" },
] as const;

function HomePage() {
  const { activeRecipe } = useRecipeStore();
  const featured = MOCK_RECIPES.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Welcome back, Chef Julian</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-sidebar sm:text-4xl">
            What are we cooking today?
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Scan your ingredients and let FridgeChef AI craft chef-grade recipes around what you already have.
          </p>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Badge className="gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI Online
          </Badge>
          <button className="rounded-full border bg-card p-2 text-muted-foreground hover:bg-accent">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Hero CTA */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-emerald-700 text-white shadow-elevated">
        <CardContent className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="bg-white/20 text-white">Start here</Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">Begin a New Recipe Scan</h2>
            <p className="max-w-md text-sm text-white/85">
              Upload a photo of your fridge or pantry. We'll detect ingredients and recommend recipes in seconds.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link to="/scan"><Plus className="h-4 w-4" /> New Scan</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick access grid */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-sidebar">Quick Access</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK.map(({ to, label, desc, icon: Icon, accent }) => (
            <Link key={to} to={to}>
              <Card className="group h-full transition hover:-translate-y-0.5 hover:shadow-elevated">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sidebar">{label}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured recipes */}
      <div>
        <div className="mb-4 flex items-end justify-between">
          <h3 className="text-lg font-bold text-sidebar">Featured Recipes</h3>
          <Link to="/recipes" className="text-sm font-medium text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((r) => (
            <Card key={r.id} className="overflow-hidden pt-0 transition hover:shadow-elevated">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={r.image} alt={r.name} className="h-full w-full object-cover" />
                <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">{r.cuisine}</Badge>
              </div>
              <CardContent className="space-y-2 p-4">
                <h4 className="line-clamp-1 font-semibold text-sidebar">{r.name}</h4>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                <Button asChild size="sm" variant="outline" className="w-full">
                  <Link to="/recipes/$id" params={{ id: r.id }}>View Recipe</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {activeRecipe && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-primary">Continue cooking</div>
              <div className="font-semibold text-sidebar">{activeRecipe.name}</div>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/cooking">Resume <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
