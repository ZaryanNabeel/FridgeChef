import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Minus, Plus, ArrowLeft } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRecipeStore } from "@/lib/recipe-store";
import { NUTRITION_BY_RECIPE, DV } from "@/lib/mock-data";

export const Route = createFileRoute("/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — FridgeChef" }] }),
  component: NutritionPage,
});

function dvBadge(pct: number) {
  if (pct >= 20) return <Badge className="bg-success text-white">High</Badge>;
  if (pct <= 5) return <Badge className="bg-danger text-white">Low</Badge>;
  return null;
}

function NutritionPage() {
  const navigate = useNavigate();
  const { activeRecipe, servings, setServings, lastFromCooking } = useRecipeStore();

  if (!activeRecipe) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center">
        <p className="text-muted-foreground">No recipe selected.</p>
        <Button asChild className="mt-4"><Link to="/recipes">Browse recipes</Link></Button>
      </div>
    );
  }

  const base = NUTRITION_BY_RECIPE[activeRecipe.id] ?? NUTRITION_BY_RECIPE["shakshuka"];
  const m = (v: number) => Math.round(v * servings);

  const macros = [
    { name: "Protein", value: m(base.protein) * 4, grams: m(base.protein), color: "var(--chart-1)" },
    { name: "Carbs",   value: m(base.carbs) * 4,   grams: m(base.carbs),   color: "var(--chart-2)" },
    { name: "Fat",     value: m(base.fat) * 9,     grams: m(base.fat),     color: "var(--chart-3)" },
  ];

  const macroRows = [
    { label: "Protein", val: m(base.protein), unit: "g", dv: DV.protein },
    { label: "Total Carbs", val: m(base.carbs), unit: "g", dv: DV.carbs },
    { label: "Total Fat", val: m(base.fat), unit: "g", dv: DV.fat },
    { label: "Dietary Fiber", val: m(base.fiber), unit: "g", dv: DV.fiber },
  ];
  const microRows = [
    { label: "Cholesterol", val: m(base.cholesterol), unit: "mg", dv: DV.cholesterol },
    { label: "Sodium", val: m(base.sodium), unit: "mg", dv: DV.sodium },
    { label: "Total Sugars", val: m(base.sugars), unit: "g", dv: DV.sugars },
    { label: "Vitamin D", val: m(base.vitaminD), unit: "mcg", dv: DV.vitaminD },
    { label: "Calcium", val: m(base.calcium), unit: "mg", dv: DV.calcium },
    { label: "Iron", val: m(base.iron), unit: "mg", dv: DV.iron },
    { label: "Potassium", val: m(base.potassium), unit: "mg", dv: DV.potassium },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="-ml-2 text-muted-foreground"
        onClick={() => navigate({ to: lastFromCooking ? "/cooking" : "/recipes/$id", params: { id: activeRecipe.id } })}>
        <ArrowLeft className="h-4 w-4" /> {lastFromCooking ? "Back to Cooking" : "Back to Recipe"}
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-navy">{activeRecipe.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="text-4xl font-bold text-primary">{m(base.calories)} kcal</div>
                <div className="text-sm text-muted-foreground">per serving · {servings} serving{servings > 1 ? "s" : ""}</div>
              </div>
              <div className="flex items-center gap-3 rounded-full border bg-card px-2 py-1">
                <Button size="icon" variant="ghost" disabled={servings <= 1} onClick={() => setServings(servings - 1)}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-navy">{servings}</span>
                <Button size="icon" variant="ghost" disabled={servings >= 20} onClick={() => setServings(servings + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Macronutrients</h3>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-navy">
                    <tr><th className="px-4 py-2 text-left">Nutrient</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">%DV</th><th className="px-4 py-2 text-right"></th></tr>
                  </thead>
                  <tbody>
                    {macroRows.map((r) => {
                      const pct = Math.round((r.val / r.dv) * 100);
                      return (
                        <tr key={r.label} className="border-t">
                          <td className="px-4 py-2 font-medium text-navy">{r.label}</td>
                          <td className="px-4 py-2 text-right">{r.val} {r.unit}</td>
                          <td className="px-4 py-2 text-right">{pct}%</td>
                          <td className="px-4 py-2 text-right">{dvBadge(pct)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-navy">Macro Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={macros} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {macros.map((m, i) => <Cell key={i} fill={m.color} />)}
                  </Pie>
                  <Tooltip formatter={(_v, n, p: any) => [`${p.payload.grams}g`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {macros.map((m) => (
                <li key={m.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: m.color }} />{m.name}</span>
                  <span className="text-muted-foreground">{m.grams}g</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-navy">Other Nutrients</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {microRows.map((r) => {
              const pct = Math.round((r.val / r.dv) * 100);
              return (
                <div key={r.label} className="flex items-center justify-between rounded-lg border bg-card p-3">
                  <div>
                    <div className="font-medium text-navy">{r.label}</div>
                    <div className="text-sm text-muted-foreground">{r.val} {r.unit} · {pct}% DV</div>
                  </div>
                  {dvBadge(pct)}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Nutritional values are estimates based on USDA FoodData Central and may vary based on specific brands and preparation methods.
      </p>
    </div>
  );
}
