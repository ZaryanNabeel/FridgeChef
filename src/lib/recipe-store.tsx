import { createContext, useContext, useState, type ReactNode } from "react";
import { type DetectedIngredient, type Recipe } from "./mock-data";

interface SavedItem {
  recipeId: string;
  variation?: string;
  platingImage?: string;
}

type IngredientsUpdater =
  | DetectedIngredient[]
  | ((prev: DetectedIngredient[]) => DetectedIngredient[]);

interface Store {
  ingredients: DetectedIngredient[];
  /** Accepts either a new array or an updater function (like React setState) */
  setIngredients: (i: IngredientsUpdater) => void;
  generatedRecipes: Recipe[];
  setGeneratedRecipes: (r: Recipe[]) => void;
  activeRecipe: Recipe | null;
  setActiveRecipe: (r: Recipe | null) => void;
  cookingStep: number;
  setCookingStep: (n: number) => void;
  doneSteps: Record<number, boolean>;
  setDoneSteps: (d: Record<number, boolean>) => void;
  servings: number;
  setServings: (n: number) => void;
  saved: SavedItem[];
  saveItem: (s: SavedItem) => void;
  appliedVariation: string | null;
  setAppliedVariation: (v: string | null) => void;
  lastFromCooking: boolean;
  setLastFromCooking: (b: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

export function RecipeStoreProvider({ children }: { children: ReactNode }) {
  const [ingredients, setIngredientsRaw] = useState<DetectedIngredient[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [cookingStep, setCookingStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<Record<number, boolean>>({});
  const [servings, setServings] = useState(2);
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [appliedVariation, setAppliedVariation] = useState<string | null>(null);
  const [lastFromCooking, setLastFromCooking] = useState(false);

  /** Supports both direct array and updater-function signatures */
  const setIngredients = (value: IngredientsUpdater) => {
    if (typeof value === "function") {
      setIngredientsRaw(value);
    } else {
      setIngredientsRaw(value);
    }
  };

  const saveItem = (s: SavedItem) => setSaved((prev) => [...prev, s]);

  return (
    <Ctx.Provider
      value={{
        ingredients,
        setIngredients,
        generatedRecipes,
        setGeneratedRecipes,
        activeRecipe,
        setActiveRecipe,
        cookingStep,
        setCookingStep,
        doneSteps,
        setDoneSteps,
        servings,
        setServings,
        saved,
        saveItem,
        appliedVariation,
        setAppliedVariation,
        lastFromCooking,
        setLastFromCooking,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRecipeStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRecipeStore must be inside RecipeStoreProvider");
  return v;
}
