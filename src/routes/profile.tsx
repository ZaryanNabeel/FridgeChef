import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Bookmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRecipeStore } from "@/lib/recipe-store";
import { MOCK_RECIPES } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — FridgeChef" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { saved } = useRecipeStore();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Hello, Chef!</h1>
            <p className="text-sm text-muted-foreground">Your personal cooking assistant.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-navy">Allergen Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">🥜 Nuts</Badge>
            <Badge variant="secondary">🥛 Dairy</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-navy"><Bookmark className="h-5 w-5" /> Saved Items</CardTitle></CardHeader>
        <CardContent>
          {saved.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No saved recipes yet. Cook something delicious!</p>
          ) : (
            <ul className="space-y-2">
              {saved.map((s, i) => {
                const r = MOCK_RECIPES.find((m) => m.id === s.recipeId);
                if (!r) return null;
                return (
                  <li key={i} className="flex items-center gap-3 rounded-md border bg-card p-3">
                    <img src={r.image} alt="" className="h-12 w-12 rounded object-cover" />
                    <div className="flex-1">
                      <div className="font-medium text-navy">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.cuisine} · {r.meal}</div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/recipes/$id" params={{ id: r.id }}>Open</Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
