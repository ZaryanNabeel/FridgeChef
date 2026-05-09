import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, BookmarkPlus, ChefHat, Sun, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipeStore } from "@/lib/recipe-store";
import { generatePlatingImage } from "@/lib/plating-image.functions";

export const Route = createFileRoute("/plating")({
  head: () => ({ meta: [{ title: "Plating Preview — FridgeChef" }] }),
  component: PlatingPage,
});

const STYLES = ["Rustic", "Fine Dining", "Casual", "Minimalist"];
const ANGLES = ["Overhead (flat-lay)", "45-Degree", "Eye-Level"];

const TIPS: Record<string, string> = {
  "Rustic": "Use uneven garnish placement and a wooden board for natural warmth.",
  "Fine Dining": "Use the rule of thirds when plating. Add a garnish at 10 o'clock for visual balance.",
  "Casual": "Layer ingredients loosely and let colors shine through.",
  "Minimalist": "Negative space is your friend — center one focal element.",
};
const LIGHTING: Record<string, string> = {
  "Overhead (flat-lay)": "Diffused overhead lighting eliminates harsh shadows.",
  "45-Degree": "Soft natural side lighting works best for Fine Dining presentations.",
  "Eye-Level": "Backlight at low angle to highlight texture and depth.",
};

function PlatingPage() {
  const navigate = useNavigate();
  const { activeRecipe, saveItem } = useRecipeStore();
  const generate = useServerFn(generatePlatingImage);
  const [style, setStyle] = useState("Fine Dining");
  const [angle, setAngle] = useState("45-Degree");
  const [seed, setSeed] = useState(0);
  const [regens, setRegens] = useState(0);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = activeRecipe ? `${activeRecipe.id}-${style}-${angle}-${seed}` : "";
  const currentImage = imageCache[cacheKey];

  useEffect(() => {
    if (!activeRecipe || currentImage || loading) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    generate({
      data: {
        recipeName: activeRecipe.name,
        cuisine: activeRecipe.cuisine,
        ingredients: activeRecipe.ingredients.map((i) => i.name),
        platingStyle: style,
        cameraAngle: angle,
        seed,
      },
    })
      .then((res) => {
        if (cancelled) return;
        setImageCache((prev) => ({ ...prev, [cacheKey]: res.imageUrl }));
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  if (!activeRecipe) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">No recipe selected.</p>
        <Button asChild className="mt-4"><Link to="/recipes">Browse recipes</Link></Button>
      </div>
    );
  }

  const keyIngredients = activeRecipe.ingredients.slice(0, 5);

  const regenerate = () => {
    if (regens >= 5) { toast.error("Regeneration limit reached for this session (5/5)"); return; }
    setSeed(Date.now()); setRegens((r) => r + 1);
  };

  const save = () => {
    if (!currentImage) return;
    saveItem({ recipeId: activeRecipe.id, platingImage: currentImage });
    toast.success("Plating saved to your recipe book");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">Plating Preview</h1>
        <p className="mt-2 text-muted-foreground">Visual inspiration for {activeRecipe.name}.</p>
      </div>

      <Card className="overflow-hidden pt-0">
        <div className="relative aspect-[16/9] bg-muted">
          {currentImage ? (
            <img key={currentImage} src={currentImage} alt={`${activeRecipe.name} plated in ${style} style`} className="h-full w-full animate-in fade-in object-cover duration-500" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
              {loading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Plating your dish…</p>
                </>
              ) : error ? (
                <p className="px-6 text-center text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-sm">Preparing image…</p>
              )}
            </div>
          )}
          <Badge className="absolute left-3 top-3 bg-black/60 text-white">AI-generated image for visual inspiration only.</Badge>
        </div>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Plating Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Camera Angle</label>
              <Select value={angle} onValueChange={setAngle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ANGLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <Button variant="outline" onClick={regenerate} disabled={regens >= 5 || loading}>
            <RefreshCw className="h-4 w-4" /> Regenerate ({regens}/5)
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Smart Insights</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 rounded-lg border bg-secondary/40 p-3">
            <ChefHat className="h-5 w-5 flex-shrink-0 text-primary" />
            <div><div className="text-xs font-semibold text-muted-foreground">Chef's Plating Tip</div><div className="text-sm text-navy">🍴 {TIPS[style]}</div></div>
          </div>
          <div className="flex gap-3 rounded-lg border bg-secondary/40 p-3">
            <Sun className="h-5 w-5 flex-shrink-0 text-warning" />
            <div><div className="text-xs font-semibold text-muted-foreground">Lighting Note</div><div className="text-sm text-navy">💡 {LIGHTING[angle]}</div></div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Ingredients in Frame</div>
            <div className="flex flex-wrap gap-2">
              {keyIngredients.map((i) => <Badge key={i.name} variant="secondary">{i.name}</Badge>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={save} disabled={!currentImage}><BookmarkPlus className="h-4 w-4" /> Save to Recipe Book</Button>
        <Button onClick={() => navigate({ to: "/cooking" })} className="bg-primary hover:bg-primary/90">
          <ChefHat className="h-4 w-4" /> Start Cooking
        </Button>
      </div>
    </div>
  );
}
