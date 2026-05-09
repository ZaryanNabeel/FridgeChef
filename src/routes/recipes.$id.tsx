import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { ChefHat, Apple, Sparkles, Image as ImageIcon, Clock, Gauge, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecipeStore } from "@/lib/recipe-store";
import { MOCK_RECIPES } from "@/lib/mock-data";
import { useEffect } from "react";

export const Route = createFileRoute("/recipes/$id")({
  loader: ({ params }) => {
    const recipe = MOCK_RECIPES.find((r) => r.id === params.id);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.recipe.name ?? "Recipe"} — FridgeChef` },
      { name: "description", content: loaderData?.recipe.description ?? "" },
      { property: "og:image", content: loaderData?.recipe.image ?? "" },
    ],
  }),
  component: RecipeDetail,
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="text-muted-foreground">Recipe not found.</p>
      <Button asChild className="mt-4"><Link to="/recipes">Back to recipes</Link></Button>
    </div>
  ),
  errorComponent: ({ error }) => <div className="py-20 text-center text-destructive">{error.message}</div>,
});

function RecipeDetail() {
  const { recipe } = Route.useLoaderData();
  const navigate = useNavigate();
  const { setActiveRecipe, setCookingStep, setDoneSteps, setAppliedVariation } = useRecipeStore();

  useEffect(() => {
    setActiveRecipe(recipe);
    setAppliedVariation(null);
  }, [recipe.id]);

  const startCooking = () => { setCookingStep(0); setDoneSteps({}); navigate({ to: "/cooking" }); };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-2 text-muted-foreground">
        <Link to="/recipes"><ArrowLeft className="h-4 w-4" /> Back to recipes</Link>
      </Button>

      <Card className="overflow-hidden pt-0">
        <div className="relative aspect-[16/7] bg-muted">
          <img src={recipe.image} alt={recipe.name} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary text-primary-foreground">{recipe.cuisine}</Badge>
              <Badge className="bg-white/90 text-navy">{recipe.meal}</Badge>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-4xl">{recipe.name}</h1>
          </div>
        </div>
        <CardContent className="space-y-6 p-6">
          <p className="text-muted-foreground">{recipe.description}</p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Clock} label="Total Time" value={`${recipe.time} min`} />
            <Stat icon={Clock} label="Prep" value={`${recipe.prepTime} min`} />
            <Stat icon={Clock} label="Cook" value={`${recipe.cookTime} min`} />
            <Stat icon={Gauge} label="Difficulty" value={recipe.difficulty} />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-navy">Ingredients</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {recipe.ingredients.map((i: { name: string; qty: string }) => (
                <li key={i.name} className="flex justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm">
                  <span className="font-medium text-navy">{i.name}</span>
                  <span className="text-muted-foreground">{i.qty}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button onClick={startCooking} className="bg-primary hover:bg-primary/90">
              <ChefHat className="h-4 w-4" /> Start Cooking
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/nutrition" })}>
              <Apple className="h-4 w-4" /> Nutrition Info
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/variations" })}>
              <Sparkles className="h-4 w-4" /> View Variations
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/plating" })}>
              <ImageIcon className="h-4 w-4" /> Plating Preview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-semibold text-navy">{value}</div>
    </div>
  );
}
