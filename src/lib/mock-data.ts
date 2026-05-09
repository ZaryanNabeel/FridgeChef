export type Confidence = "high" | "medium" | "low";

export interface DetectedIngredient {
  id: string;
  name: string;
  confidence: number; // 0-100
  manual?: boolean;
  selected: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  cuisine: string;
  meal: string;
  time: number; // minutes
  match: number; // 0-100
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prepTime: number;
  cookTime: number;
  ingredients: { name: string; qty: string }[];
  steps: string[];
}

export const COMMON_INGREDIENTS = [
  "Tomato", "Egg", "Cheese", "Spinach", "Onion", "Garlic", "Bell Pepper",
  "Chicken", "Beef", "Rice", "Pasta", "Olive Oil", "Butter", "Milk",
  "Carrot", "Potato", "Mushroom", "Lemon", "Basil", "Parsley", "Salt",
  "Black Pepper", "Cucumber", "Avocado", "Yogurt", "Bread", "Flour",
];

export const MOCK_DETECTED: Omit<DetectedIngredient, "id" | "selected">[] = [
  { name: "Tomato", confidence: 94 },
  { name: "Egg", confidence: 88 },
  { name: "Cheese", confidence: 76 },
  { name: "Spinach", confidence: 58 },
  { name: "Onion", confidence: 52 },
  { name: "Bell Pepper", confidence: 34 },
];

export const CUISINES = ["Italian", "Asian", "Mediterranean", "Mexican", "Middle Eastern", "Pakistani"];
export const MEAL_CATEGORIES = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: "shakshuka",
    name: "Mediterranean Shakshuka",
    image: "https://images.unsplash.com/photo-1590412200988-a436970781fa?w=800&q=80",
    cuisine: "Mediterranean",
    meal: "Breakfast",
    time: 25,
    match: 92,
    description: "Eggs poached in a spiced tomato and pepper sauce, finished with fresh herbs and crumbled cheese.",
    difficulty: "Easy",
    prepTime: 10,
    cookTime: 15,
    ingredients: [
      { name: "Tomato", qty: "4 large, diced" },
      { name: "Egg", qty: "4" },
      { name: "Onion", qty: "1, sliced" },
      { name: "Bell Pepper", qty: "1, diced" },
      { name: "Cheese", qty: "60g feta" },
      { name: "Olive Oil", qty: "2 tbsp" },
      { name: "Spinach", qty: "1 cup" },
    ],
    steps: [
      "Heat olive oil in a wide skillet over medium heat. Add onions and bell peppers; cook until softened, about 5 minutes.",
      "Stir in diced tomatoes and a pinch of paprika. Simmer for 8 minutes until the sauce thickens.",
      "Fold in the spinach and let it wilt for one minute.",
      "Make 4 small wells in the sauce and crack an egg into each. Cover and cook until whites are set, about 5 minutes.",
      "Crumble feta over the top and season with salt and pepper.",
      "Garnish with fresh herbs and serve directly from the pan with crusty bread.",
    ],
  },
  {
    id: "pasta-pomodoro",
    name: "Spinach & Tomato Pasta Pomodoro",
    image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80",
    cuisine: "Italian",
    meal: "Dinner",
    time: 30,
    match: 87,
    description: "A bright weeknight pasta tossed with blistered tomatoes, wilted spinach, and shaved cheese.",
    difficulty: "Easy",
    prepTime: 10,
    cookTime: 20,
    ingredients: [
      { name: "Pasta", qty: "300g spaghetti" },
      { name: "Tomato", qty: "5 ripe, halved" },
      { name: "Onion", qty: "1, finely chopped" },
      { name: "Spinach", qty: "2 cups" },
      { name: "Cheese", qty: "40g parmesan" },
      { name: "Olive Oil", qty: "3 tbsp" },
    ],
    steps: [
      "Bring a large pot of salted water to a boil and cook pasta until al dente.",
      "Meanwhile, sauté onion in olive oil until translucent.",
      "Add tomatoes and cook until blistered and saucy, about 8 minutes.",
      "Toss in spinach until just wilted.",
      "Drain pasta, reserving 1/2 cup pasta water. Add pasta to the pan with a splash of pasta water.",
      "Top with shaved parmesan and a drizzle of olive oil.",
    ],
  },
  {
    id: "veg-fried-rice",
    name: "Garden Vegetable Fried Rice",
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    cuisine: "Asian",
    meal: "Lunch",
    time: 20,
    match: 81,
    description: "Quick stir-fried rice with eggs, tomato, and crisp vegetables in a savory soy glaze.",
    difficulty: "Easy",
    prepTime: 8,
    cookTime: 12,
    ingredients: [
      { name: "Rice", qty: "3 cups cooked" },
      { name: "Egg", qty: "2" },
      { name: "Onion", qty: "1, diced" },
      { name: "Bell Pepper", qty: "1, diced" },
      { name: "Tomato", qty: "1, diced" },
      { name: "Spinach", qty: "1 cup" },
    ],
    steps: [
      "Heat oil in a wok over high heat.",
      "Scramble eggs quickly and set aside.",
      "Stir-fry onion and bell pepper for 2 minutes.",
      "Add cold rice and toss to break up clumps.",
      "Stir in tomato, spinach, and eggs with a splash of soy sauce.",
      "Cook another 2 minutes and serve immediately.",
    ],
  },
  {
    id: "frittata",
    name: "Spinach & Cheese Frittata",
    image: "https://images.unsplash.com/photo-1565895405138-6c3a1555da6a?w=800&q=80",
    cuisine: "Italian",
    meal: "Breakfast",
    time: 22,
    match: 78,
    description: "An oven-finished egg frittata loaded with spinach, sweet onion, and melty cheese.",
    difficulty: "Easy",
    prepTime: 7,
    cookTime: 15,
    ingredients: [
      { name: "Egg", qty: "6" },
      { name: "Spinach", qty: "2 cups" },
      { name: "Onion", qty: "1/2, sliced" },
      { name: "Cheese", qty: "80g grated" },
      { name: "Olive Oil", qty: "1 tbsp" },
    ],
    steps: [
      "Preheat oven to 190°C (375°F).",
      "Sauté onion in an oven-safe skillet until soft.",
      "Add spinach and wilt down briefly.",
      "Whisk eggs with salt and pepper, pour into skillet.",
      "Sprinkle cheese on top and cook 2 minutes on the stove.",
      "Transfer to oven and bake 10 minutes until set and golden.",
    ],
  },
];

export interface NutritionData {
  calories: number;
  protein: number;     // g
  carbs: number;       // g
  fat: number;         // g
  fiber: number;       // g
  cholesterol: number; // mg
  sodium: number;      // mg
  sugars: number;      // g
  vitaminD: number;    // mcg
  calcium: number;     // mg
  iron: number;        // mg
  potassium: number;   // mg
}

export const NUTRITION_BY_RECIPE: Record<string, NutritionData> = {
  "shakshuka":      { calories: 320, protein: 18, carbs: 22, fat: 18, fiber: 5, cholesterol: 220, sodium: 540, sugars: 9, vitaminD: 2.5, calcium: 180, iron: 4, potassium: 720 },
  "pasta-pomodoro": { calories: 480, protein: 16, carbs: 78, fat: 12, fiber: 6, cholesterol: 12,  sodium: 380, sugars: 8, vitaminD: 0.4, calcium: 140, iron: 5, potassium: 620 },
  "veg-fried-rice": { calories: 410, protein: 12, carbs: 68, fat: 10, fiber: 4, cholesterol: 95,  sodium: 720, sugars: 6, vitaminD: 1.1, calcium: 80,  iron: 3, potassium: 480 },
  "frittata":       { calories: 280, protein: 22, carbs: 6,  fat: 19, fiber: 2, cholesterol: 380, sodium: 420, sugars: 3, vitaminD: 3.2, calcium: 240, iron: 3, potassium: 380 },
};

// Daily reference values (FDA, 2000 kcal)
export const DV = {
  protein: 50, carbs: 275, fat: 78, fiber: 28,
  cholesterol: 300, sodium: 2300, sugars: 50,
  vitaminD: 20, calcium: 1300, iron: 18, potassium: 4700,
};

export interface Variation {
  type: string;
  emoji: string;
  benefit: string;
  caloriesDelta: number;
  compliance: "Fully Compliant" | "Partially Compliant";
  substitutions: { from: string; to: string; reason: string }[];
  allergenWarning?: boolean;
}

export const VARIATIONS: Variation[] = [
  {
    type: "Vegan",
    emoji: "🌱",
    benefit: "Reduces saturated fat and supports ethical eating.",
    caloriesDelta: -80,
    compliance: "Fully Compliant",
    substitutions: [
      { from: "Egg", to: "Silken tofu scramble", reason: "Plant-based protein with similar texture" },
      { from: "Cheese", to: "Cashew cream", reason: "Dairy-free creamy alternative" },
    ],
  },
  {
    type: "Low-Carb",
    emoji: "🥦",
    benefit: "Lowers blood sugar impact and supports weight management.",
    caloriesDelta: -120,
    compliance: "Fully Compliant",
    substitutions: [
      { from: "Pasta", to: "Zucchini noodles", reason: "Cuts carbs by ~80%" },
      { from: "Rice", to: "Cauliflower rice", reason: "Lower glycemic index" },
    ],
  },
  {
    type: "Gluten-Free",
    emoji: "🌾",
    benefit: "Safe for celiac and gluten sensitivity.",
    caloriesDelta: 30,
    compliance: "Fully Compliant",
    substitutions: [
      { from: "Pasta", to: "Certified GF pasta", reason: "Made from rice or corn flour" },
      { from: "Bread", to: "GF sourdough", reason: "No wheat, rye, or barley" },
    ],
  },
  {
    type: "Allergen-Aware",
    emoji: "⚠️",
    benefit: "Removes common allergens from your profile (nuts, dairy).",
    caloriesDelta: -40,
    compliance: "Partially Compliant",
    substitutions: [
      { from: "Cheese", to: "Nutritional yeast", reason: "Dairy-free, nutty flavor" },
    ],
    allergenWarning: true,
  },
];
