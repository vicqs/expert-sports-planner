import { useState, useEffect } from "react";
import { GYM_EXERCISES } from "@/utils/constants";
import type { ExerciseMetadata } from "@/types";

/**
 * Hook para gestionar ejercicios personalizados y modificaciones del sistema
 * Permite agregar, editar y "eliminar" (ocultar) ejercicios
 * Estructura:
 * - customExercises: { "LOWER": ["Ejercicio1"], ... }
 * - hiddenExercises: { "LOWER": ["EjercicioOculto"], ... }
 * - customExerciseMeta: { "Ejercicio1": { gifUrl, targetMuscles, ... } } (opcional, por nombre)
 */
export const useCustomExercises = () => {
  const [customExercises, setCustomExercises] = useState(() => {
    const stored = localStorage.getItem("crm_custom_exercises");
    return stored ? JSON.parse(stored) : {};
  });

  const [hiddenExercises, setHiddenExercises] = useState(() => {
    const stored = localStorage.getItem("crm_hidden_exercises");
    return stored ? JSON.parse(stored) : {};
  });

  const [customExerciseMeta, setCustomExerciseMeta] = useState<
    Record<string, ExerciseMetadata>
  >(() => {
    const stored = localStorage.getItem("crm_custom_exercise_meta");
    return stored ? JSON.parse(stored) : {};
  });

  // Persistir en localStorage
  useEffect(() => {
    localStorage.setItem(
      "crm_custom_exercises",
      JSON.stringify(customExercises),
    );
  }, [customExercises]);

  useEffect(() => {
    localStorage.setItem(
      "crm_hidden_exercises",
      JSON.stringify(hiddenExercises),
    );
  }, [hiddenExercises]);

  useEffect(() => {
    localStorage.setItem(
      "crm_custom_exercise_meta",
      JSON.stringify(customExerciseMeta),
    );
  }, [customExerciseMeta]);

  const addExercise = ({ category, name, metadata = null }) => {
    setCustomExercises((prev) => ({
      ...prev,
      [category]: [...(prev[category] || []), name],
    }));
    if (metadata && Object.keys(metadata).length > 0) {
      setCustomExerciseMeta((prev) => ({ ...prev, [name]: metadata }));
    }
  };

  const updateExercise = (oldExercise, { category, name, metadata = null }) => {
    const { category: oldCategory, name: oldName } = oldExercise;

    // Verificar si es un ejercicio del sistema
    const isSystemExercise = GYM_EXERCISES[oldCategory]?.includes(oldName);

    setCustomExercises((prev) => {
      const updated = { ...prev };

      // Si es del sistema y se está editando, ocultarlo primero
      if (isSystemExercise) {
        setHiddenExercises((prevHidden) => ({
          ...prevHidden,
          [oldCategory]: [...(prevHidden[oldCategory] || []), oldName],
        }));
      } else {
        // Si es personalizado, removerlo del antiguo lugar
        if (updated[oldCategory]) {
          updated[oldCategory] = updated[oldCategory].filter(
            (ex) => ex !== oldName,
          );
          if (updated[oldCategory].length === 0) {
            delete updated[oldCategory];
          }
        }
      }

      // Agregar al nuevo lugar (siempre como personalizado)
      updated[category] = [...(updated[category] || []), name];

      return updated;
    });

    setCustomExerciseMeta((prev) => {
      const updated = { ...prev };
      if (oldName !== name) delete updated[oldName];
      if (metadata && Object.keys(metadata).length > 0) {
        updated[name] = metadata;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const deleteExercise = (category, exerciseName) => {
    // Verificar si es un ejercicio del sistema
    const isSystemExercise = GYM_EXERCISES[category]?.includes(exerciseName);

    if (isSystemExercise) {
      // Si es del sistema, agregarlo a la lista de ocultos
      setHiddenExercises((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), exerciseName],
      }));
    } else {
      // Si es personalizado, eliminarlo realmente
      setCustomExercises((prev) => {
        const updated = { ...prev };
        if (updated[category]) {
          updated[category] = updated[category].filter(
            (ex) => ex !== exerciseName,
          );
          if (updated[category].length === 0) {
            delete updated[category];
          }
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

  return {
    customExercises,
    hiddenExercises,
    customExerciseMeta,
    addExercise,
    updateExercise,
    deleteExercise,
  };
};
