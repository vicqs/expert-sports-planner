/**
 * Módulo Admin - barrel de exportación.
 *
 * Propósito: punto de entrada único del panel de administración (CRM).
 * Responsabilidad: re-exportar página, componentes, modales y hooks.
 * Lo usa: App.tsx (carga diferida de AdminDashboard) y cualquier consumidor
 * externo que necesite piezas del módulo.
 * No toca datos por sí mismo (solo re-exporta).
 */

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
