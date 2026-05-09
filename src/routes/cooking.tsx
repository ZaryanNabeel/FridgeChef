import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Apple, List, Star, Home, BookmarkPlus, Hand, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { generateStepImage } from "@/lib/step-image.functions";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRecipeStore } from "@/lib/recipe-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cooking")({
  head: () => ({ meta: [{ title: "Cooking Guide — FridgeChef" }] }),
  component: CookingPage,
});

function CookingPage() {
  const navigate = useNavigate();
  const { activeRecipe, cookingStep, setCookingStep, doneSteps, setDoneSteps, setLastFromCooking } = useRecipeStore();
  const [showAll, setShowAll] = useState(false);
  const genImage = useServerFn(generateStepImage);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const cacheKey = activeRecipe ? `${activeRecipe.id}-${cookingStep}` : "";
  const currentImage = imageCache[cacheKey];

  useEffect(() => {
    if (!activeRecipe || showAll) return;
    if (imageCache[cacheKey]) return;
    let cancelled = false;
    setImageLoading(true);
    setImageError(null);
    const stepText = activeRecipe.steps[cookingStep] ?? "";
    const ingredientNames = activeRecipe.ingredients
      .map((i) => i.name)
      .filter((n) => stepText.toLowerCase().includes(n.toLowerCase()));
    genImage({
      data: {
        recipeName: activeRecipe.name,
        stepInstruction: stepText,
        stepIngredients: ingredientNames,
      },
    })
      .then((res) => {
        if (cancelled) return;
        setImageCache((prev) => ({ ...prev, [cacheKey]: res.imageUrl }));
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setImageError(e.message || "Failed to generate image");
      })
      .finally(() => {
        if (!cancelled) setImageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, showAll, activeRecipe, cookingStep, genImage, imageCache]);

  if (!activeRecipe) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">No recipe selected.</p>
        <Button asChild className="mt-4"><Link to="/recipes">Browse recipes</Link></Button>
      </div>
    );
  }

  const total = activeRecipe.steps.length;
  const step = cookingStep;
  const isLast = step === total - 1;
  const progress = ((step + 1) / total) * 100;

  const toggleDone = (i: number) => setDoneSteps({ ...doneSteps, [i]: !doneSteps[i] });

  const goNutrition = () => { setLastFromCooking(true); navigate({ to: "/nutrition" }); };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-navy p-5 text-navy-foreground sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{activeRecipe.name}</h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm opacity-90">
          <span>Prep: <strong>{activeRecipe.prepTime} min</strong></span>
          <span>Cook: <strong>{activeRecipe.cookTime} min</strong></span>
          <span>Total: <strong>{activeRecipe.time} min</strong></span>
        </div>
      </div>

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy">Step {step + 1} of {total}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
              <List className="h-4 w-4" /> {showAll ? "Single view" : "View All Steps"}
            </Button>
          </div>
          <Progress value={progress} className="h-2" />

          {showAll ? (
            <ol className="space-y-3">
              {activeRecipe.steps.map((s, i) => (
                <li key={i} className="flex gap-3 rounded-lg border bg-card p-4">
                  <Checkbox checked={!!doneSteps[i]} onCheckedChange={() => toggleDone(i)} />
                  <div className={cn("flex-1", doneSteps[i] && "text-muted-foreground line-through")}>
                    <span className="font-semibold text-navy">Step {i + 1}.</span> {s}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Card className="overflow-hidden pt-0">
              <div className="relative aspect-video bg-muted">
                {currentImage ? (
                  <img src={currentImage} alt={`Step ${step + 1}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    {imageLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm">Generating step visual…</span>
                      </>
                    ) : (
                      <span className="px-4 text-center text-sm">{imageError ?? "Preparing image…"}</span>
                    )}
                  </div>
                )}
              </div>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {step + 1}
                  </div>
                  <p className={cn("flex-1 text-lg leading-relaxed text-navy", doneSteps[step] && "text-muted-foreground line-through")}>
                    {activeRecipe.steps[step]}
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={!!doneSteps[step]} onCheckedChange={() => toggleDone(step)} />
                  Mark as Done
                </label>
              </CardContent>
            </Card>
          )}

          {!showAll && (
            <div className="flex items-center justify-between">
              <Button variant="outline" disabled={step === 0} onClick={() => setCookingStep(step - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Hand className="h-3.5 w-3.5" /> Swipe enabled
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Swipe left/right to navigate steps on touch devices.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button disabled={isLast} onClick={() => setCookingStep(step + 1)} className="bg-primary hover:bg-primary/90">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isLast && doneSteps[total - 1] && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="space-y-4 p-6 text-center">
                <p className="text-2xl">🎉</p>
                <p className="text-lg font-semibold text-navy">Your dish is ready! Enjoy your meal.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button variant="outline" onClick={() => toast.success("Thanks for rating! ⭐⭐⭐⭐⭐")}>
                    <Star className="h-4 w-4" /> Rate Recipe
                  </Button>
                  <Button variant="outline" onClick={() => toast.success("Saved to your cookbook")}>
                    <BookmarkPlus className="h-4 w-4" /> Save to Cookbook
                  </Button>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/"><Home className="h-4 w-4" /> Return to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ingredients">
          <Card>
            <CardContent className="p-6">
              <ul className="space-y-2">
                {activeRecipe.ingredients.map((i) => (
                  <li key={i.name} className="flex items-center gap-3 rounded-md bg-secondary/50 p-3">
                    <Checkbox />
                    <span className="flex-1 font-medium text-navy">{i.name}</span>
                    <span className="text-sm text-muted-foreground">{i.qty}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={goNutrition}>
          <Apple className="h-4 w-4" /> Nutrition Info
        </Button>
      </div>
    </div>
  );
}
