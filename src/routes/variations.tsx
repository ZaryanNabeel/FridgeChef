import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRecipeStore } from "@/lib/recipe-store";
import { VARIATIONS, NUTRITION_BY_RECIPE } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/variations")({
  head: () => ({ meta: [{ title: "Recipe Variations — FridgeChef" }] }),
  component: VariationsPage,
});

function VariationsPage() {
  const navigate = useNavigate();
  const { activeRecipe, appliedVariation, setAppliedVariation } = useRecipeStore();
  const [pending, setPending] = useState<string | null>(null);

  if (!activeRecipe) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">No recipe selected.</p>
        <Button asChild className="mt-4"><Link to="/recipes">Browse recipes</Link></Button>
      </div>
    );
  }

  const baseCals = NUTRITION_BY_RECIPE[activeRecipe.id]?.calories ?? 320;

  const apply = (type: string) => {
    setAppliedVariation(type);
    setPending(null);
    toast.success(`${type} variation applied to ${activeRecipe.name}`);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="-ml-2 text-muted-foreground"
        onClick={() => navigate({ to: "/recipes/$id", params: { id: activeRecipe.id } })}>
        <ArrowLeft className="h-4 w-4" /> Back to Recipe
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">Variations</h1>
        <p className="mt-2 text-muted-foreground">
          Tailored versions of <span className="font-medium text-navy">{activeRecipe.name}</span>.
          {appliedVariation && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3 w-3" /> {appliedVariation} active
            </span>
          )}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {VARIATIONS.map((v) => {
          const newCals = baseCals + v.caloriesDelta;
          const isApplied = appliedVariation === v.type;
          return (
            <Card key={v.type} className={cn("transition", isApplied && "border-primary ring-2 ring-primary/30")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-navy">
                  <span className="text-2xl">{v.emoji}</span> {v.type}
                </CardTitle>
                <Badge className={v.compliance === "Fully Compliant" ? "bg-success text-white" : "bg-warning text-navy"}>
                  {v.compliance}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{v.benefit}</p>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Substitutions</h4>
                  {v.substitutions.map((s, i) => (
                    <div key={i} className="rounded-md bg-secondary/50 p-2.5 text-sm">
                      <div className="font-medium text-navy">{s.from} → {s.to}</div>
                      <div className="text-xs text-muted-foreground">{s.reason}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-md bg-card border p-3">
                  <span className="text-sm text-muted-foreground">Updated calories</span>
                  <div className="text-right">
                    <span className="font-bold text-navy">{newCals} kcal</span>
                    <span className={cn("ml-2 text-sm font-medium",
                      v.caloriesDelta < 0 ? "text-success" : "text-warning"
                    )}>
                      {v.caloriesDelta > 0 ? "+" : ""}{v.caloriesDelta} kcal
                    </span>
                  </div>
                </div>

                {v.allergenWarning && (
                  <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-navy">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-warning" />
                    For diagnosed allergies, consult a healthcare professional before consuming.
                  </div>
                )}

                <AlertDialog open={pending === v.type} onOpenChange={(o) => !o && setPending(null)}>
                  <AlertDialogTrigger asChild>
                    <Button onClick={() => setPending(v.type)} className="w-full bg-primary hover:bg-primary/90" disabled={isApplied}>
                      {isApplied ? "Variation Active" : "Use This Variation"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Replace current recipe with this variation?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cooking steps, nutrition, and plating will reflect the {v.type} version.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => apply(v.type)}>Apply Variation</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
