import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Loader2,
  Bookmark,
  BookmarkCheck,
  Clock,
  ScanLine,
  RefreshCw,
  ChefHat,
  Flame,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRecipeStore } from "@/lib/recipe-store";
import { CUISINES, MEAL_CATEGORIES, type Recipe } from "@/lib/mock-data";
import { generateRecipes } from "@/lib/generate-recipes.functions";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recipe Ideas — FridgeChef" },
      {
        name: "description",
        content: "AI-generated recipe ideas based on your ingredients.",
      },
    ],
  }),
  component: RecipesPage,
});

// ── Difficulty colour map ─────────────────────────────────────────────────────
const DIFFICULTY_STYLES: Record<string, string> = {
  Easy:   "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-rose-100 text-rose-700",
};

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-5 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/2 rounded bg-muted" />
        <div className="mt-auto h-9 w-full rounded bg-muted" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function RecipesPage() {
  const navigate = useNavigate();
  const {
    ingredients,
    generatedRecipes,
    setGeneratedRecipes,
    setActiveRecipe,
    setAppliedVariation,
  } = useRecipeStore();

  const [loading, setLoading]   = useState(false);
  const [cuisine, setCuisine]   = useState<string>("all");
  const [meal, setMeal]         = useState<string>("all");
  const [saved, setSaved]       = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(generatedRecipes.length > 0);

  const confirmedIngredients = ingredients
    .filter((i) => i.selected)
    .map((i) => i.name);

  // ── Auto-generate on first visit ──────────────────────────────────────────
  useEffect(() => {
    if (confirmedIngredients.length >= 3 && generatedRecipes.length === 0) {
      runGeneration();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runGeneration = async () => {
    if (confirmedIngredients.length < 3) {
      toast.error("Please confirm at least 3 ingredients on the Scan page first.");
      return;
    }

    setLoading(true);
    try {
      const result = await generateRecipes({
        data: { ingredients: confirmedIngredients },
      });

      if (!result.recipes?.length) {
        toast.error("No recipes returned. Please try again.");
        return;
      }

      setGeneratedRecipes(result.recipes);
      setHasGenerated(true);
      toast.success(`${result.recipes.length} recipes generated just for you!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Recipe generation failed: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Navigate to recipe detail ─────────────────────────────────────────────
  const openRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setAppliedVariation(null);
    navigate({ to: "/recipes/$id", params: { id: recipe.id } });
  };

  const toggleSave = (id: string) =>
    setSaved((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const filtered = generatedRecipes.filter(
    (r) =>
      (cuisine === "all" || r.cuisine === cuisine) &&
      (meal    === "all" || r.meal    === meal),
  );

  // ── No ingredients yet ────────────────────────────────────────────────────
  if (confirmedIngredients.length < 3 && !hasGenerated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Recipe Ideas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Curated for you by FridgeChef AI.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-5 rounded-xl border bg-card py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ScanLine className="h-8 w-8" />
          </div>
          <div>
            <p className="text-lg font-semibold text-navy">
              No ingredients scanned yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Go to the Ingredient Recognizer, upload a photo, confirm at
              least 3 items, then come back here.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/scan" })}
            className="bg-primary hover:bg-primary/90"
          >
            <ScanLine className="h-4 w-4" /> Scan Ingredients
          </Button>
        </div>
      </div>
    );
  }

  // ── Main view ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Recipe Ideas
          </h1>
          <p className="mt-2 text-muted-foreground">
            {hasGenerated
              ? `AI-generated from ${confirmedIngredients.length} confirmed ingredients.`
              : "Curated for you by FridgeChef AI."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={runGeneration}
          disabled={loading}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}{" "}
          Regenerate
        </Button>
      </div>

      {/* Ingredient chips */}
      {confirmedIngredients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {confirmedIngredients.map((name) => (
            <Badge
              key={name}
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
            >
              {name}
            </Badge>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Cuisine
          </label>
          <Select value={cuisine} onValueChange={setCuisine}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {CUISINES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Meal
          </label>
          <Select value={meal} onValueChange={setMeal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              {MEAL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border bg-primary/5 border-primary/20 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-navy">
                Gemini is crafting recipes…
              </p>
              <p className="text-xs text-muted-foreground">
                Analysing {confirmedIngredients.length} ingredients and
                building personalised dishes
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 && hasGenerated ? (
        /* ── Empty filter state ── */
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-20 text-center">
          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-navy">No recipes match these filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing the cuisine or meal filter.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => { setCuisine("all"); setMeal("all"); }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        /* ── Recipe grid ── */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card
              key={r.id}
              className="group flex flex-col overflow-hidden pt-0 transition-shadow hover:shadow-lg"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={r.image}
                  alt={r.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {/* Save button */}
                <button
                  onClick={() => toggleSave(r.id)}
                  className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                  aria-label={saved.has(r.id) ? "Unsave recipe" : "Save recipe"}
                >
                  {saved.has(r.id) ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4 text-navy" />
                  )}
                </button>

                {/* Badges */}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                  <Badge className="bg-navy text-navy-foreground text-xs">
                    {r.cuisine}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {r.meal}
                  </Badge>
                </div>
              </div>

              {/* Body */}
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <h3 className="line-clamp-2 text-lg font-semibold text-navy leading-snug">
                  {r.name}
                </h3>

                <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {r.description}
                </p>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {r.time} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ChefHat className="h-3.5 w-3.5" />
                    <span
                      className={
                        DIFFICULTY_STYLES[r.difficulty] ??
                        "text-muted-foreground"
                      }
                    >
                      {r.difficulty}
                    </span>
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 font-semibold text-primary">
                    <Flame className="h-3.5 w-3.5" /> {r.match}% match
                  </span>
                </div>

                {/* CTA */}
                <Button
                  className="mt-auto bg-primary hover:bg-primary/90"
                  onClick={() => openRecipe(r)}
                >
                  View Recipe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
