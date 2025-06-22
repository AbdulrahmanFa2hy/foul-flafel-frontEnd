// Lazy loaded components for better performance
import { lazy } from "react";

// Immediately loaded components (small and frequently used)
export { default as CategorySidebar } from "./CategorySidebar";
export { default as MealGrid } from "./MealGrid";

// Lazy loaded components (large modals that are conditionally rendered)
export const MealForm = lazy(() => import("./MealForm"));
export const MealDetails = lazy(() => import("./MealDetails"));
export const CategoryForm = lazy(() => import("./CategoryForm"));
export { default as AddMealCard } from "./AddMealCard";
export { useMealsManagement } from "./useMealsManagement";
export * from "./utils";
