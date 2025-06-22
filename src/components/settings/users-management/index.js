// Lazy loaded components for better performance
import { lazy } from "react";

// Immediately loaded components (small and frequently used)
export { default as UserFilters } from "./UserFilters";
export { default as UserStats } from "./UserStats";
export { default as UserTable } from "./UserTable";

// Lazy loaded components (large modals that are conditionally rendered)
export const UserForm = lazy(() => import("./UserForm"));
