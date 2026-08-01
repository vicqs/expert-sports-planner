import { EXERCISE_METADATA } from "@/utils/constants";
import type { ExerciseMetadata } from "@/types";

/**
 * Shared read-only accessor for exercise metadata (gif, músculos, equipamiento, instrucciones).
 * Merges the built-in EXERCISE_METADATA catalog with any admin-defined custom metadata
 * stored in localStorage (same key used by admin/hooks/useCustomExercises.ts), so
 * Trainer/Athlete views can show the same rich info without importing the full admin hook.
 */
export const getExerciseMetadata = (name: string): ExerciseMetadata | null => {
  try {
    const stored = localStorage.getItem("crm_custom_exercise_meta");
    const customMeta: Record<string, ExerciseMetadata> = stored
      ? JSON.parse(stored)
      : {};
    return customMeta[name] || EXERCISE_METADATA[name] || null;
  } catch {
    return EXERCISE_METADATA[name] || null;
  }
};
