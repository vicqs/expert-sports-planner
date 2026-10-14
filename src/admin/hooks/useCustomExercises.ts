/**
 * useCustomExercises - personalización del catálogo de ejercicios (Admin).
 *
 * Lo usa: ExerciseDatabase. Otros roles leen la metadata con
 * utils/exerciseMetadata.ts (misma clave de localStorage).
 * Persiste en localStorage: "crm_custom_exercises", "crm_hidden_exercises" y
 * "crm_custom_exercise_meta" (vía usePersistentState).
 * Seguridad: las URLs de GIF solo se aceptan si son https (isSafeHttpsUrl),
 * tanto al editar como al importar respaldos.
 */
import { GYM_EXERCISES } from "@/utils/constants";
import { isSafeHttpsUrl, normalizeName } from "@/utils/validation";
import type { ExerciseMetadata } from "@/types";
import { usePersistentState } from "./usePersistentState";

/** Mapa categoría -> nombres de ejercicio. */
type CategoryMap = Record<string, string[]>;
type MetaMap = Record<string, ExerciseMetadata>;
type Result = { ok: true } | { ok: false; error: string };

/** Datos de entrada para crear/editar; `metadata` es opcional. */
interface ExerciseInput {
  category: string;
  name: string;
  metadata?: ExerciseMetadata | null;
}

// Validadores usados al leer localStorage y al importar respaldos
const isPlainObject = (v: unknown) =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isCategoryMap = (v: unknown) =>
  isPlainObject(v) &&
  Object.values(v as object).every(
    (list) => Array.isArray(list) && list.every((i) => typeof i === "string"),
  );

const dedupe = (list: string[]) => Array.from(new Set(list));

/**
 * Hook para gestionar ejercicios personalizados y modificaciones del sistema
 * Permite agregar, editar, "eliminar" (ocultar) y restaurar ejercicios
 * Estructura:
 * - customExercises: { "LOWER": ["Ejercicio1"], ... }
 * - hiddenExercises: { "LOWER": ["EjercicioOculto"], ... }
 * - customExerciseMeta: { "Ejercicio1": { gifUrl, targetMuscles, ... } }
 *   (indexado por nombre)
 *
 * El nombre es único en todo el catálogo visible, lo que evita colisiones
 * en los metadatos (indexados por nombre).
 *
 * @returns Datos actuales (`customExercises`, `hiddenExercises`,
 *   `hiddenCount`, `customExerciseMeta`) y acciones: `addExercise`,
 *   `updateExercise`, `deleteExercise`, `restoreExercise`,
 *   `restoreAllHidden`, `exportData`, `importData`. Las acciones que pueden
 *   fallar devuelven `{ ok:false, error }` con mensaje en español.
 */
export const useCustomExercises = () => {
  const [customExercises, setCustomExercises] = usePersistentState<CategoryMap>(
    "crm_custom_exercises",
    () => ({}),
    isCategoryMap,
  );
  const [hiddenExercises, setHiddenExercises] = usePersistentState<CategoryMap>(
    "crm_hidden_exercises",
    () => ({}),
    isCategoryMap,
  );
  const [customExerciseMeta, setCustomExerciseMeta] =
    usePersistentState<MetaMap>(
      "crm_custom_exercise_meta",
      () => ({}),
      isPlainObject,
    );

  /** True si el ejercicio pertenece al catálogo base (GYM_EXERCISES). */
  const isSystem = (category: string, name: string) =>
    !!GYM_EXERCISES[category]?.includes(name);

  /** True si un ejercicio del sistema fue "eliminado" (oculto). */
  const isHidden = (category: string, name: string) =>
    !!hiddenExercises[category]?.includes(name);

  /** Nombres visibles actualmente (sistema no oculto + personalizados). */
  const visibleNames = (): { category: string; name: string }[] => {
    const all: { category: string; name: string }[] = [];
    Object.entries(GYM_EXERCISES).forEach(([category, list]) => {
      (list as string[]).forEach((name) => {
        if (!isHidden(category, name)) all.push({ category, name });
      });
    });
    Object.entries(customExercises).forEach(([category, list]) => {
      list.forEach((name) => all.push({ category, name }));
    });
    return all;
  };

  /**
   * Valida nombre, categoría, URL del GIF, tamaños de listas/pasos y
   * unicidad del nombre en el catálogo visible.
   * @param editing Ejercicio que se está editando (se excluye del duplicado).
   */
  const validate = (
    { category, name, metadata }: ExerciseInput,
    editing?: { category: string; name: string },
  ): Result => {
    const trimmed = (name ?? "").trim();
    if (!trimmed) return { ok: false, error: "El nombre es obligatorio" };
    if (trimmed.length > 100) {
      return { ok: false, error: "El nombre no puede superar 100 caracteres" };
    }
    if (!category) return { ok: false, error: "Selecciona una categoría" };
    // Solo https: evita esquemas peligrosos (javascript:, data:) y contenido
    // mixto al mostrar el GIF en <img>.
    const gif = metadata?.gifUrl;
    if (gif && !isSafeHttpsUrl(gif)) {
      return { ok: false, error: "La URL del GIF debe comenzar con https://" };
    }
    // Límites para acotar el tamaño de lo guardado en localStorage
    const lists = [
      metadata?.bodyParts,
      metadata?.targetMuscles,
      metadata?.secondaryMuscles,
      metadata?.equipments,
    ];
    if (
      lists.some((l) => l && (l.length > 20 || l.some((i) => i.length > 50)))
    ) {
      return {
        ok: false,
        error: "Máximo 20 elementos de hasta 50 caracteres por lista",
      };
    }
    const steps = metadata?.instructions;
    if (steps && (steps.length > 30 || steps.some((s) => s.length > 500))) {
      return {
        ok: false,
        error: "Máximo 30 pasos de hasta 500 caracteres",
      };
    }
    const duplicate = visibleNames().some(
      (e) =>
        !(
          editing &&
          e.category === editing.category &&
          e.name === editing.name
        ) && normalizeName(e.name) === normalizeName(trimmed),
    );
    if (duplicate) {
      return { ok: false, error: "Ya existe un ejercicio con ese nombre" };
    }
    return { ok: true };
  };

  /** True si la metadata tiene al menos una propiedad. */
  const hasMeta = (m?: ExerciseMetadata | null) =>
    !!m && Object.keys(m).length > 0;

  /** Agrega un ejercicio personalizado (y su metadata si la hay). */
  const addExercise = (input: ExerciseInput): Result => {
    const check = validate(input);
    if (!check.ok) return check;
    const name = input.name.trim();
    setCustomExercises((prev) => ({
      ...prev,
      [input.category]: [...(prev[input.category] || []), name],
    }));
    if (hasMeta(input.metadata)) {
      setCustomExerciseMeta((prev) => ({ ...prev, [name]: input.metadata! }));
    }
    return { ok: true };
  };

  /**
   * Edita un ejercicio. Los del sistema no se modifican: se ocultan y se crea
   * una copia personalizada. La metadata se re-indexa si cambia el nombre.
   */
  const updateExercise = (
    oldExercise: { category: string; name: string },
    input: ExerciseInput,
  ): Result => {
    const check = validate(input, oldExercise);
    if (!check.ok) return check;

    const { category: oldCategory, name: oldName } = oldExercise;
    const name = input.name.trim();
    const { category } = input;

    if (isSystem(oldCategory, oldName)) {
      // Ejercicio del sistema: se oculta el original y se crea uno personalizado
      setHiddenExercises((prev) => ({
        ...prev,
        [oldCategory]: dedupe([...(prev[oldCategory] || []), oldName]),
      }));
      setCustomExercises((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), name],
      }));
    } else {
      setCustomExercises((prev) => {
        const updated: CategoryMap = { ...prev };
        if (updated[oldCategory]) {
          updated[oldCategory] = updated[oldCategory].filter(
            (ex) => ex !== oldName,
          );
          if (updated[oldCategory].length === 0) delete updated[oldCategory];
        }
        updated[category] = [...(updated[category] || []), name];
        return updated;
      });
    }

    setCustomExerciseMeta((prev) => {
      const updated = { ...prev };
      if (oldName !== name) delete updated[oldName];
      if (hasMeta(input.metadata)) updated[name] = input.metadata!;
      else delete updated[name];
      return updated;
    });
    return { ok: true };
  };

  /**
   * "Elimina" un ejercicio: los del sistema se ocultan (restaurables) y los
   * personalizados se borran junto con su metadata.
   */
  const deleteExercise = (category: string, exerciseName: string) => {
    if (isSystem(category, exerciseName)) {
      setHiddenExercises((prev) => ({
        ...prev,
        [category]: dedupe([...(prev[category] || []), exerciseName]),
      }));
    } else {
      setCustomExercises((prev) => {
        const updated: CategoryMap = { ...prev };
        if (updated[category]) {
          updated[category] = updated[category].filter(
            (ex) => ex !== exerciseName,
          );
          if (updated[category].length === 0) delete updated[category];
        }
        return updated;
      });
    }

    setCustomExerciseMeta((prev) => {
      if (!prev[exerciseName]) return prev;
      const updated = { ...prev };
      delete updated[exerciseName];
      return updated;
    });
  };

  /**
   * Restaura un ejercicio del sistema oculto. Falla si ya existe otro visible
   * con el mismo nombre (p. ej. una copia personalizada).
   */
  const restoreExercise = (category: string, name: string): Result => {
    const conflict = visibleNames().some(
      (e) => normalizeName(e.name) === normalizeName(name),
    );
    if (conflict) {
      return {
        ok: false,
        error: `Ya existe un ejercicio visible llamado "${name}"`,
      };
    }
    setHiddenExercises((prev) => {
      const updated: CategoryMap = { ...prev };
      updated[category] = (updated[category] || []).filter((n) => n !== name);
      if (updated[category].length === 0) delete updated[category];
      return updated;
    });
    return { ok: true };
  };

  /** Restaura todos los ejercicios del sistema ocultos. */
  const restoreAllHidden = () => setHiddenExercises({});

  /** Cantidad total de ejercicios del sistema ocultos. */
  const hiddenCount = Object.values(hiddenExercises).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  /** Serializa las personalizaciones para respaldo. */
  const exportData = () => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    customExercises,
    hiddenExercises,
    customExerciseMeta,
  });

  /**
   * Importa un respaldo validado y lo fusiona con los datos actuales.
   * Solo se leen las claves conocidas del respaldo (customExercises,
   * hiddenExercises, customExerciseMeta); los ejercicios ya existentes (por
   * nombre normalizado) se omiten y los GIF no https se vacían. Los ocultos
   * importados deben ser ejercicios reales del sistema.
   * @param data JSON ya parseado del archivo de respaldo.
   * @returns `{ ok, added }` con la cantidad de ejercicios agregados.
   */
  const importData = (
    data: unknown,
    dryRun = false,
  ): Result & { added?: number; skipped?: number } => {
    if (
      !isPlainObject(data) ||
      !isCategoryMap((data as Record<string, unknown>).customExercises)
    ) {
      return { ok: false, error: "El archivo no tiene un formato válido" };
    }
    const payload = data as {
      customExercises: CategoryMap;
      hiddenExercises?: CategoryMap;
      customExerciseMeta?: MetaMap;
    };
    if (payload.hiddenExercises && !isCategoryMap(payload.hiddenExercises)) {
      return { ok: false, error: "Ejercicios ocultos inválidos" };
    }
    if (
      payload.customExerciseMeta &&
      !isPlainObject(payload.customExerciseMeta)
    ) {
      return { ok: false, error: "Metadatos inválidos" };
    }

    const existing = new Set(visibleNames().map((e) => normalizeName(e.name)));
    const mergedCustom: CategoryMap = { ...customExercises };
    const mergedMeta: MetaMap = { ...customExerciseMeta };
    let added = 0;
    let skipped = 0;

    Object.entries(payload.customExercises).forEach(([category, list]) => {
      list.forEach((raw) => {
        const name = raw.trim();
        if (!name || name.length > 100) {
          skipped += 1;
          return;
        }
        if (existing.has(normalizeName(name))) {
          skipped += 1;
          return;
        }
        existing.add(normalizeName(name));
        mergedCustom[category] = [...(mergedCustom[category] || []), name];
        const meta = payload.customExerciseMeta?.[raw];
        if (meta && isPlainObject(meta)) {
          const safeGif = meta.gifUrl && isSafeHttpsUrl(meta.gifUrl);
          mergedMeta[name] = { ...meta, gifUrl: safeGif ? meta.gifUrl : "" };
        }
        added += 1;
      });
    });

    if (dryRun) return { ok: true, added, skipped };

    setCustomExercises(mergedCustom);
    setCustomExerciseMeta(mergedMeta);
    if (payload.hiddenExercises) {
      const mergedHidden: CategoryMap = { ...hiddenExercises };
      Object.entries(payload.hiddenExercises).forEach(([category, list]) => {
        const valid = list.filter((n) => isSystem(category, n));
        if (valid.length) {
          mergedHidden[category] = dedupe([
            ...(mergedHidden[category] || []),
            ...valid,
          ]);
        }
      });
      setHiddenExercises(mergedHidden);
    }
    return { ok: true, added, skipped };
  };

  return {
    customExercises,
    hiddenExercises,
    hiddenCount,
    customExerciseMeta,
    addExercise,
    updateExercise,
    deleteExercise,
    restoreExercise,
    restoreAllHidden,
    exportData,
    importData,
  };
};
