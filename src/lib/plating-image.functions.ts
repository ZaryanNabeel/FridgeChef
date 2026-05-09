import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generatePlatingImage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        recipeName: z.string(),
        cuisine: z.string(),
        ingredients: z.array(z.string()).default([]),
        platingStyle: z.string(),
        cameraAngle: z.string(),
        seed: z.number().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const ingredients = data.ingredients.length
      ? data.ingredients.join(", ")
      : "as described in the recipe";

    const styleGuide: Record<string, string> = {
      "Minimalist": "clean white plate, elegant negative space, single subtle garnish, refined composition",
      "Rustic": "wooden board or cast iron skillet, cozy homemade presentation, warm natural textures",
      "Fine Dining": "luxury restaurant presentation, artistic plating, precise quenelles and dots, premium ceramic",
      "Casual": "relaxed home-style presentation on a simple ceramic plate, generous portion",
    };
    const angleGuide: Record<string, string> = {
      "Overhead (flat-lay)": "top-down overhead flat-lay food photography, perfectly centered",
      "45-Degree": "cinematic 45-degree restaurant-style angle, shallow depth of field",
      "Eye-Level": "natural eye-level dining perspective, immersive close-up",
    };

    const prompt = `Ultra-realistic, premium culinary magazine quality food photograph.

DISH: "${data.recipeName}" — ${data.cuisine} cuisine.
MAIN INGREDIENTS visible on the plate: ${ingredients}.

PLATING STYLE: ${data.platingStyle} — ${styleGuide[data.platingStyle] ?? ""}.
CAMERA ANGLE: ${data.cameraAngle} — ${angleGuide[data.cameraAngle] ?? ""}.

STRICT RULES:
- The image MUST be the finished, plated dish that matches the recipe name and cuisine exactly.
- Show ONLY ingredients consistent with the recipe — no foreign or fantasy ingredients.
- If the recipe is Shakshuka, show eggs poached in spiced tomato sauce in a skillet with herbs.
- If salmon, show cooked salmon. If pasta, show pasta. If rice, show rice. If vegetables, show those vegetables accurately.
- NO landscapes, nature scenes, buildings, lakes, abstract art, cartoon, or unrelated imagery.
- NO text, watermarks, logos, or hands.

VISUAL STYLE:
- Cinematic studio lighting, realistic shadows and reflections.
- Appetizing textures, glistening sauces, fresh garnish, steam where appropriate.
- Neutral clean background, realistic ceramic plates/bowls, subtle table styling.
- Shallow depth of field, professional food studio aesthetic, restaurant-quality presentation.

Variation seed: ${data.seed ?? 0}.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      if (response.status === 429)
        throw new Error("Rate limit reached. Please try again shortly.");
      if (response.status === 402)
        throw new Error("AI credits exhausted. Add funds in Settings → Workspace → Usage.");
      throw new Error(`Image generation failed: ${response.status} ${text}`);
    }

    const json = (await response.json()) as {
      choices?: Array<{
        message?: { images?: Array<{ image_url?: { url?: string } }> };
      }>;
    };
    const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error("No image returned from model");
    return { imageUrl: url };
  });
