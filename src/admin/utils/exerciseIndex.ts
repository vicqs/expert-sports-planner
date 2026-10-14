/**
 * exerciseIndex - utilidades de lectura sobre el catálogo de ejercicios para
 * el panel Admin (búsqueda global y salud de datos).
 * Lo usan: AdminGlobalSearch y OverviewInsights.
 */
import { GYM_EXERCISES, EXERCISE_METADATA } from "@/utils/constants";
import { CATALOG_METADATA } from "@/utils/exerciseCatalogData";

/** Normaliza para comparar sin distinguir mayúsculas ni tildes. */
export const foldText = (s: string): string =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Lista plana de nombres (sistema no ocultos + personalizados), sin repetir. */
export const listExerciseNames = (
  customExercises: Record<string, string[]>,
  hiddenExercises: Record<string, string[]>,
): string[] => {
  const names = new Set<string>();
  Object.keys(GYM_EXERCISES).forEach((category) => {
    GYM_EXERCISES[category].forEach((ex: string) => {
      if (!hiddenExercises?.[category]?.includes(ex)) names.add(ex);
    });
  });
  Object.values(customExercises || {}).forEach((list) =>
    list.forEach((ex) => names.add(ex)),
  );
  return [...names];
};

/** Metadata de un ejercicio (personalizada > sistema > catálogo). */
export const getExerciseMeta = (
  name: string,
  customMeta: Record<string, any>,
) =>
  customMeta?.[name] ||
  EXERCISE_METADATA[name] ||
  CATALOG_METADATA[name] ||
  null;
