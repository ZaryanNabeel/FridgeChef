import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const generateStepImage = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        recipeName: z.string(),
        stepInstruction: z.string(),
        stepIngredients: z.array(z.string()).default([]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const ingredients = data.stepIngredients.length
      ? data.stepIngredients.join(", ")
      : "as described in the instruction";

    const prompt = `Ultra-realistic cooking tutorial photograph for the recipe "${data.recipeName}".

Step instruction: "${data.stepInstruction}"
Ingredients visible in this step: ${ingredients}

STRICT RULES:
- Show ONLY the ingredients mentioned in this step, in their correct cooking state (raw, chopped, sizzling, softened, simmering, boiling, etc. depending on the action).
- Match the cooking action exactly: chopping → cutting board with knife; heating oil → oil shimmering in skillet; sautéing → vegetables cooking with steam in skillet; boiling → bubbling pot; mixing → bowl with whisk/spoon; baking → oven or baking tray; plating → elegant plate; garnishing → herbs being sprinkled.
- Use realistic cookware appropriate to the action (skillet, saucepan, baking tray, cutting board, mixing bowl).
- Do NOT show the finished dish unless the step is plating or garnishing.
- Do NOT add any ingredients not mentioned.

VISUAL STYLE:
- Cinematic kitchen lighting, 45-degree close-up angle.
- Highly detailed, natural colors, realistic steam/oil/moisture textures.
- Modern, clean kitchen environment, premium recipe-app aesthetic.
- Professional food photography. No text, no watermark, no cartoon style.`;

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
