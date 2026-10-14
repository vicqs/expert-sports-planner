import { EXERCISE_METADATA } from "@/utils/constants";
import { CATALOG_METADATA } from "@/utils/exerciseCatalogData";
import type { ExerciseMetadata } from "@/types";

/**
 * Shared read-only accessor for exercise metadata (imagen, músculos, equipamiento,
 * instrucciones). Prioridad: metadatos personalizados del admin (localStorage,
 * clave crm_custom_exercise_meta) > metadatos curados (EXERCISE_METADATA) >
 * catálogo importado (CATALOG_METADATA, ~860 ejercicios).
 */
export const getExerciseMetadata = (name: string): ExerciseMetadata | null => {
  const builtIn = EXERCISE_METADATA[name] || CATALOG_METADATA[name] || null;
  try {
    const stored = localStorage.getItem("crm_custom_exercise_meta");
    const customMeta: Record<string, ExerciseMetadata> = stored
      ? JSON.parse(stored)
      : {};
    return customMeta[name] || builtIn;
  } catch {
    return builtIn;
  }
};
