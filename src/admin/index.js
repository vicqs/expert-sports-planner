// Admin Module - Barrel Export
// Este archivo centraliza todas las exportaciones del módulo admin

// Exports de páginas principales
export { default as AdminDashboard } from "./pages/AdminDashboard";

// Exports de componentes
export { default as Overview } from "./components/Overview";
export { default as UserManagement } from "./components/UserManagement";
export { default as ExerciseDatabase } from "./components/ExerciseDatabase";
export { default as EquipmentManager } from "./components/EquipmentManager";
export { default as Analytics } from "./components/Analytics";

// Exports de modales
export { default as EquipmentModal } from "./components/modals/EquipmentModal";
export { default as ExerciseModal } from "./components/modals/ExerciseModal";

// Exports de hooks
export * from "./hooks";
