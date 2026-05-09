import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const detectIngredients = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        imageBase64: z.string(),
        mimeType: z
          .enum(["image/jpeg", "image/png", "image/webp"])
          .default("image/jpeg"),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured in .env");

    const prompt = `You are a professional chef's ingredient scanner.

Analyze this photo and identify every food ingredient that is clearly or partially visible.

Return a raw JSON array only (no markdown, no code fences, nothing else):
[
  { "name": "Tomato",    "confidence": 94 },
  { "name": "Cheddar",   "confidence": 72 },
  { "name": "Spinach",   "confidence": 55 }
]

Rules:
- Only food items (skip containers, utensils, packaging).
- Capitalise each name (e.g. "Bell Pepper", "Olive Oil").
- confidence = 0-100 reflecting how clearly the item is visible.
- Return AT LEAST 2 and AT MOST 12 items.
 - Return ONLY the JSON array — no prose, no explanation, no code fences.
 - If unsure about an item, exclude it.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fridgechef.app",
        "X-Title": "FridgeChef",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/auto",
        messages: [
          {
            role: "system",
            content:
              "You are a precise ingredient detector. Output strict JSON only.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${data.mimeType};base64,${data.imageBase64}`,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 0.1,
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
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    const slice = start >= 0 && end > start ? clean.slice(start, end + 1) : clean;

    let parsed: { name: string; confidence: number }[];
    try {
      parsed = JSON.parse(slice);
    } catch {
      throw new Error("Model returned non-JSON: " + clean.slice(0, 200));
    }

    const now = Date.now();
    return {
      ingredients: parsed
        .filter(
          (item) =>
            item &&
            typeof item.name === "string" &&
            typeof item.confidence === "number" &&
            item.name.trim().length > 0,
        )
        .slice(0, 12)
        .map((item, i) => ({
          id: `det-${i}-${now}`,
          name: item.name.trim(),
          confidence: Math.min(100, Math.max(0, Math.round(item.confidence))),
          selected: true,
          manual: false as const,
        })),
    };
  });
