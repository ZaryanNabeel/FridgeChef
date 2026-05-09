import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ── Curated Unsplash food photos per cuisine ─────────────────────────────────
const CUISINE_IMAGES: Record<string, string[]> = {
  Italian: [
    "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  ],
  Asian: [
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    "https://images.unsplash.com/photo-1569562211093-4ed0d0758359?w=800&q=80",
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80",
    "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=800&q=80",
  ],
  Mediterranean: [
    "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80",
    "https://images.unsplash.com/photo-1544510808-91bcf50e41e4?w=800&q=80",
    "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=800&q=80",
  ],
  Mexican: [
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
    "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&q=80",
    "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80",
  ],
  "Middle Eastern": [
    "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&q=80",
    "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=800&q=80",
  ],
  Pakistani: [
    "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80",
    "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?w=800&q=80",
  ],
  default: [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  ],
};

const usedImages = new Set<string>();

function pickImage(cuisine: string): string {
  const pool = CUISINE_IMAGES[cuisine] ?? CUISINE_IMAGES["default"];
  const available = pool.filter((u) => !usedImages.has(u));
  const chosen =
    available.length > 0
      ? available[Math.floor(Math.random() * available.length)]
      : pool[Math.floor(Math.random() * pool.length)];
  usedImages.add(chosen);
  return chosen;
}

// ── Server function ──────────────────────────────────────────────────────────
export const generateRecipes = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ ingredients: z.array(z.string()).min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey)
      throw new Error("OPENROUTER_API_KEY is not configured in .env");

    usedImages.clear();

    const prompt = `You are a professional chef and recipe developer.

Available ingredients: ${data.ingredients.join(", ")}

Create exactly 4 diverse recipe ideas using primarily these ingredients.
Return ONLY a raw JSON array — no markdown fences, no extra text.

Each recipe object MUST follow this schema exactly:
{
  "id": "<kebab-case-unique-slug>",
  "name": "<Recipe Name>",
  "cuisine": "<one of: Italian | Asian | Mediterranean | Mexican | Middle Eastern | Pakistani>",
  "meal": "<one of: Breakfast | Lunch | Dinner | Snack | Dessert>",
  "time": <total minutes as integer>,
  "match": <0-100 integer reflecting how well ingredients match>,
  "description": "<1-2 sentence appetising description>",
  "difficulty": "<Easy | Medium | Hard>",
  "prepTime": <prep minutes as integer>,
  "cookTime": <cook minutes as integer>,
  "ingredients": [
    { "name": "<ingredient>", "qty": "<amount + unit>" }
  ],
  "steps": [
    "<Step 1 detailed instruction.>",
    "<Step 2 detailed instruction.>"
  ]
}

Rules:
- Include exactly 5 ingredients per recipe.
- Include exactly 4 cooking steps per recipe. Keep each step under 20 words.
- Vary cuisines and meal types across the 6 recipes.
- Ensure all 6 recipe ids are unique.
- Return ONLY the JSON array — nothing else.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fridgechef.app",
        "X-Title": "FridgeChef",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096,
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      if (response.status === 429)
        throw new Error("Rate limit reached — please wait a moment and retry.");
      throw new Error(`OpenRouter error ${response.status}: ${body}`);
    }

    const json = await response.json();
    const raw: string = json.choices?.[0]?.message?.content ?? "[]";
    const clean = raw.replace(/```(?:json)?|```/g, "").trim();

    let parsed: Omit<import("../lib/mock-data").Recipe, "image">[];
    try {
      // Extract JSON array even if model added text before/after
      const match = clean.match(/\[[\s\S]*\]/);
      const jsonStr = match ? match[0] : clean;
      parsed = JSON.parse(jsonStr);
    } catch {
      // If still broken, try to salvage complete objects from partial JSON
      const objects = clean.match(/\{[\s\S]*?"steps"[\s\S]*?\]\s*\}/g) ?? [];
      if (objects.length === 0)
        throw new Error("Could not parse any recipes from model response.");
      parsed = objects.map((o) => JSON.parse(o));
    }

    const recipes = parsed.map((r) => ({
      ...r,
      image: pickImage(r.cuisine),
    }));

    return { recipes };
  });
