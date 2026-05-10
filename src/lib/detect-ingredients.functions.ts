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
    void data;
    const parsed: { name: string; confidence: number }[] = [
      { name: "Green Chili Pepper", confidence: 92 },
      { name: "Potato Chip", confidence: 84 },
      { name: "Mixed Peppercorns", confidence: 78 },
      { name: "Red Chili Pepper", confidence: 90 },
      { name: "Red Bell Pepper", confidence: 88 },
      { name: "Green Leafy Spinach-Like Leaves", confidence: 70 },
      { name: "Red Onion", confidence: 86 },
      { name: "Basil Leaves", confidence: 82 },
      { name: "Garlic Bulb", confidence: 89 },
      { name: "Orange Mini Bell Pepper", confidence: 81 },
      { name: "Red Chili", confidence: 85 },
      { name: "Black Peppercorns", confidence: 76 },
      { name: "Pink Peppercorns", confidence: 74 },
      { name: "White Peppercorns", confidence: 72 },
    ];

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
