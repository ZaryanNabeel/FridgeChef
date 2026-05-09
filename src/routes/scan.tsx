import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import {
  Upload,
  Trash2,
  Plus,
  Sparkles,
  Lightbulb,
  Loader2,
  X,
  ScanLine,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRecipeStore } from "@/lib/recipe-store";
import { COMMON_INGREDIENTS, type DetectedIngredient } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { detectIngredients } from "@/lib/detect-ingredients.functions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Ingredients — FridgeChef" },
      {
        name: "description",
        content:
          "Upload photos of your ingredients and let AI suggest recipes.",
      },
    ],
  }),
  component: ScanPage,
});

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AcceptedMime = (typeof ACCEPTED_TYPES)[number];
const ACCEPTED_EXT = "image/jpeg,image/png,image/webp";

// ── Helpers ──────────────────────────────────────────────────────────────────

function confidenceBadge(c: number) {
  if (c >= 70) return { label: "High", cls: "bg-emerald-500 text-white" };
  if (c >= 40) return { label: "Med",  cls: "bg-amber-400 text-navy" };
  return               { label: "Low",  cls: "bg-rose-500 text-white" };
}

/**
 * Resize an image file on a canvas and return { base64, mimeType }.
 * Keeps the image ≤ 1 024 px on the longest edge to stay well within
 * Gemini's inline-data limit (~4 MB base64).
 */
function resizeToBase64(
  file: File,
  maxPx = 1024,
): Promise<{ base64: string; mimeType: AcceptedMime }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width  = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not available"));
        ctx.drawImage(img, 0, 0, w, h);

        // Keep original mime if supported, fall back to jpeg
        const mime: AcceptedMime = (ACCEPTED_TYPES as readonly string[]).includes(file.type)
          ? (file.type as AcceptedMime)
          : "image/jpeg";

        const dataUrl = canvas.toDataURL(mime, 0.85);
        // Strip "data:<mime>;base64," prefix
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType: mime });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Component ────────────────────────────────────────────────────────────────

function ScanPage() {
  const navigate = useNavigate();
  const { ingredients, setIngredients } = useRecipeStore();

  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [currentPhotoName, setCurrentPhotoName] = useState<string>("");
  const [newIngredient, setNewIngredient] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Validate + accept files ────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      const remaining = MAX_FILES - photos.length;

      const accepted = arr.slice(0, remaining).filter((f) => {
        if (!(ACCEPTED_TYPES as readonly string[]).includes(f.type)) {
          toast.error(`${f.name}: unsupported format (use JPEG/PNG/WEBP)`);
          return false;
        }
        if (f.size > MAX_SIZE) {
          toast.error(`${f.name}: exceeds 10 MB`);
          return false;
        }
        return true;
      });

      if (!accepted.length) return;

      const newPhotos = accepted.map((f) => ({
        url: URL.createObjectURL(f),
        name: f.name,
      }));
      setPhotos((p) => [...p, ...newPhotos]);

      // Run AI detection for each new photo
      for (const file of accepted) {
        await runDetection(file);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos.length, ingredients],
  );

  // ── AI detection via Gemini Vision ────────────────────────────────────────
  const runDetection = async (file: File) => {
    setDetecting(true);
    setCurrentPhotoName(file.name);

    try {
      const { base64, mimeType } = await resizeToBase64(file);

      const result = await detectIngredients({
        data: { imageBase64: base64, mimeType },
      });

      if (!result.ingredients.length) {
        toast.warning(`No food items detected in ${file.name}.`);
        return;
      }

      // Merge with existing: keep manual additions, deduplicate by name
      setIngredients((prev) => {
        const existingNames = new Set(prev.map((i) => i.name.toLowerCase()));
        const fresh = result.ingredients.filter(
          (d) => !existingNames.has(d.name.toLowerCase()),
        );
        return [...prev, ...fresh];
      });

      toast.success(
        `${result.ingredients.length} ingredients detected in ${file.name}!`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Detection failed for ${file.name}: ${msg}`);
    } finally {
      setDetecting(false);
      setCurrentPhotoName("");
    }
  };

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  // ── Ingredient management ──────────────────────────────────────────────────
  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    setPendingDelete(null);
  };

  const toggleIngredient = (id: string) =>
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, selected: !i.selected } : i)),
    );

  const addIngredient = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    if (
      ingredients.some((i) => i.name.toLowerCase() === clean.toLowerCase())
    ) {
      toast.info(`"${clean}" is already in your list`);
      return;
    }
    setIngredients((prev) => [
      ...prev,
      {
        id: `man-${Date.now()}`,
        name: clean,
        confidence: 100,
        manual: true,
        selected: true,
      } satisfies DetectedIngredient,
    ]);
    setNewIngredient("");
  };

  const removePhoto = (idx: number) =>
    setPhotos((p) => p.filter((_, i) => i !== idx));

  const confirmedCount = ingredients.filter((i) => i.selected).length;
  const canGenerate   = confirmedCount >= 3;

  const suggestions = COMMON_INGREDIENTS.filter(
    (c) =>
      newIngredient &&
      c.toLowerCase().includes(newIngredient.toLowerCase()) &&
      !ingredients.some((i) => i.name.toLowerCase() === c.toLowerCase()),
  ).slice(0, 5);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy sm:text-4xl">
          Ingredient Recognizer
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload photos of what's in your fridge — Gemini Vision will detect
          the ingredients instantly.
        </p>
      </div>

      {/* ── Upload zone ── */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => !detecting && inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/40 p-10 text-center transition-colors",
              dragOver && "border-primary bg-primary/5",
              (photos.length >= MAX_FILES || detecting) &&
                "pointer-events-none opacity-60",
            )}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              {detecting ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Upload className="h-7 w-7" />
              )}
            </div>

            {detecting ? (
              <div className="space-y-1">
                <p className="font-semibold text-navy">
                  Analysing {currentPhotoName}…
                </p>
                <p className="text-sm text-muted-foreground">
                  Gemini Vision is scanning for food items
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-navy">
                  Drag & drop photos, or click to browse
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPEG · PNG · WEBP &nbsp;·&nbsp; max 10 MB &nbsp;·&nbsp; up
                  to {MAX_FILES} photos
                </p>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFiles(e.target.files)
              }
            />
          </div>

          {/* Photo thumbnails */}
          {photos.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {photos.length < MAX_FILES && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/40 text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  <Plus className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detected ingredients list ── */}
      {(detecting || ingredients.length > 0) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-navy">
              <ScanLine className="h-5 w-5 text-primary" />
              Detected Ingredients
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{confirmedCount} confirmed</Badge>
              {confirmedCount >= 3 && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Scanning indicator */}
            {detecting && (
              <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/20 p-3 text-sm text-navy">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>
                  Scanning <span className="font-medium">{currentPhotoName}</span> with Gemini Vision…
                </span>
              </div>
            )}

            {/* Ingredient rows */}
            {!detecting && ingredients.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm">No ingredients detected yet. Upload a photo above.</p>
              </div>
            )}

            {ingredients.map((ing) => {
              const b = confidenceBadge(ing.confidence);
              return (
                <div
                  key={ing.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border bg-card p-3 transition",
                    !ing.selected && "opacity-60",
                  )}
                >
                  <Checkbox
                    checked={ing.selected}
                    onCheckedChange={() => toggleIngredient(ing.id)}
                  />
                  <span
                    className={cn(
                      "flex-1 font-medium text-navy",
                      !ing.selected && "line-through text-muted-foreground",
                    )}
                  >
                    {ing.name}
                  </span>
                  {ing.manual ? (
                    <Badge className="bg-navy text-navy-foreground text-xs">
                      Manual
                    </Badge>
                  ) : (
                    <Badge className={cn(b.cls, "text-xs")}>
                      {b.label} · {ing.confidence}%
                    </Badge>
                  )}
                  <button
                    onClick={() => setPendingDelete(ing.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}

            {/* Manual add */}
            <div className="relative pt-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add ingredient manually (e.g. Garlic)"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && addIngredient(newIngredient)
                  }
                />
                <Button
                  onClick={() => addIngredient(newIngredient)}
                  variant="secondary"
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => addIngredient(s)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Minimum count hint */}
            {!canGenerate && ingredients.length > 0 && (
              <p className="text-xs text-muted-foreground">
                ✦ Confirm at least{" "}
                <span className="font-semibold text-primary">
                  {3 - confirmedCount} more
                </span>{" "}
                ingredient{3 - confirmedCount !== 1 ? "s" : ""} to generate
                recipes.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Footer: tip + CTA ── */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-navy">Chef's Tip</p>
            <p className="text-muted-foreground">
              Good lighting and a clear fridge shelf give the best detection
              results. You can always add extras manually.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          disabled={!canGenerate || detecting}
          onClick={() => navigate({ to: "/recipes" })}
          className="bg-primary hover:bg-primary/90 shrink-0"
        >
          <Sparkles className="h-4 w-4" />
          Confirm &amp; Generate Recipes
        </Button>
      </div>

      {/* ── Delete confirm dialog ── */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will exclude it from recipe generation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                pendingDelete && removeIngredient(pendingDelete)
              }
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
