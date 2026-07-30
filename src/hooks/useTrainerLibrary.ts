import { useState, useEffect, useMemo } from "react";
import { GYM_EXERCISES } from "@/utils/constants";

/**
 * Hook para gestionar la biblioteca personal de ejercicios y equipamiento del entrenador
 *
 * Funcionalidad:
 * - Permite seleccionar ejercicios de la lista maestra (sistema + custom admin)
 * - Permite seleccionar equipamiento del gimnasio
 * - Filtra ejercicios por compatibilidad con equipamiento
 * - Persiste en localStorage por trainerId
 *
 * @param {string} trainerId - ID único del entrenador
 * @returns {object} Estado y funciones de gestión
 */
export const useTrainerLibrary = (trainerId) => {
  if (!trainerId) {
    console.warn("useTrainerLibrary: trainerId is required");
  }

  // Estado: Ejercicios seleccionados por categoría
  const [selectedExercises, setSelectedExercises] = useState(() => {
    if (!trainerId) return {};
    const stored = localStorage.getItem(`trainer_exercises_${trainerId}`);
    return stored ? JSON.parse(stored) : {};
  });

  // Estado: IDs de equipamiento seleccionado
  const [selectedEquipment, setSelectedEquipment] = useState(() => {
    if (!trainerId) return [];
    const stored = localStorage.getItem(`trainer_equipment_${trainerId}`);
    return stored ? JSON.parse(stored) : [];
  });

  // Persistir ejercicios en localStorage
  useEffect(() => {
    if (trainerId) {
      localStorage.setItem(
        `trainer_exercises_${trainerId}`,
        JSON.stringify(selectedExercises),
      );
    }
  }, [trainerId, selectedExercises]);

  // Persistir equipamiento en localStorage
  useEffect(() => {
    if (trainerId) {
      localStorage.setItem(
        `trainer_equipment_${trainerId}`,
        JSON.stringify(selectedEquipment),
      );
    }
  }, [trainerId, selectedEquipment]);

  /**
   * Obtener lista maestra de ejercicios (sistema + custom del admin)
   */
  const getMasterExercises = useMemo(() => {
    // Ejercicios del sistema
    const systemExercises = { ...GYM_EXERCISES };

    // Ejercicios custom del admin
    const customStored = localStorage.getItem("crm_custom_exercises");
    const customExercises = customStored ? JSON.parse(customStored) : {};

    // Ejercicios ocultos por el admin
    const hiddenStored = localStorage.getItem("crm_hidden_exercises");
    const hiddenExercises = hiddenStored ? JSON.parse(hiddenStored) : {};

    // Combinar: sistema + custom - ocultos
    const masterList = {};
    const categories = ["LOWER", "UPPER_PUSH", "UPPER_PULL", "CORE"];

    categories.forEach((category) => {
      const system = systemExercises[category] || [];
      const custom = customExercises[category] || [];
      const hidden = hiddenExercises[category] || [];

      // Filtrar ejercicios del sistema que no estén ocultos
      const visibleSystem = system.filter((ex) => !hidden.includes(ex));

      // Combinar y eliminar duplicados
      masterList[category] = [...new Set([...visibleSystem, ...custom])].sort();
    });

    return masterList;
  }, []); // Solo calcular una vez al montar

  /**
   * Obtener lista maestra de equipamiento del gimnasio
   */
  const getMasterEquipment = () => {
    const stored = localStorage.getItem("crm_equipment");
    return stored ? JSON.parse(stored) : [];
  };

  /**
   * Agregar ejercicio a la biblioteca del entrenador
   */
  const addExercise = (category, exerciseName) => {
    setSelectedExercises((prev) => {
      const categoryExercises = prev[category] || [];

      // Evitar duplicados
      if (categoryExercises.includes(exerciseName)) {
        return prev;
      }

      return {
        ...prev,
        [category]: [...categoryExercises, exerciseName].sort(),
      };
    });
  };

  /**
   * Agregar múltiples ejercicios a la vez
   */
  const addExercises = (category, exerciseNames) => {
    setSelectedExercises((prev) => {
      const categoryExercises = prev[category] || [];
      const newExercises = [
        ...new Set([...categoryExercises, ...exerciseNames]),
      ].sort();

      return {
        ...prev,
        [category]: newExercises,
      };
    });
  };

  /**
   * Remover ejercicio de la biblioteca
   */
  const removeExercise = (category, exerciseName) => {
    setSelectedExercises((prev) => {
      const categoryExercises = prev[category] || [];
      const filtered = categoryExercises.filter((ex) => ex !== exerciseName);

      // Si la categoría queda vacía, eliminarla
      if (filtered.length === 0) {
        const { [category]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [category]: filtered,
      };
    });
  };

  /**
   * Agregar equipamiento a la biblioteca
   */
  const addEquipment = (equipmentId) => {
    setSelectedEquipment((prev) => {
      // Evitar duplicados
      if (prev.includes(equipmentId)) {
        return prev;
      }
      return [...prev, equipmentId];
    });
  };

  /**
   * Agregar múltiples equipamientos a la vez
   */
  const addEquipments = (equipmentIds) => {
    setSelectedEquipment((prev) => [...new Set([...prev, ...equipmentIds])]);
  };

  /**
   * Remover equipamiento de la biblioteca
   */
  const removeEquipment = (equipmentId) => {
    setSelectedEquipment((prev) => prev.filter((id) => id !== equipmentId));
  };

  /**
   * Limpiar toda la biblioteca
   */
  const clearLibrary = () => {
    if (window.confirm("¿Estás seguro de limpiar toda tu biblioteca?")) {
      setSelectedExercises({});
      setSelectedEquipment([]);
      return true;
    }
    return false;
  };

  /**
   * Obtener todos los ejercicios seleccionados como array plano
   */
  const getAllSelectedExercises = () => {
    const all = [];
    Object.keys(selectedExercises).forEach((category) => {
      all.push(...selectedExercises[category]);
    });
    return all.sort();
  };

  /**
   * Obtener ejercicios filtrados por equipamiento disponible
   * TODO: Implementar lógica de mapeo equipamiento -> ejercicios
   * Por ahora devuelve todos los seleccionados
   */
  const getFilteredExercises = () => {
    // Si no hay equipamiento seleccionado, mostrar todos los ejercicios
    if (selectedEquipment.length === 0) {
      return selectedExercises;
    }

    // TODO: Implementar filtrado basado en equipamiento requerido
    // Por ahora devolvemos todos los ejercicios seleccionados
    // En fase futura, agregar lógica de mapeo ejercicio -> equipamiento requerido
    return selectedExercises;
  };

  /**
   * Verificar si la biblioteca está vacía
   */
  const isEmpty = () => {
    return getAllSelectedExercises().length === 0;
  };

  /**
   * Obtener estadísticas de la biblioteca
   */
  const getStats = () => {
    const exerciseCount = getAllSelectedExercises().length;
    const equipmentCount = selectedEquipment.length;
    const categoriesUsed = Object.keys(selectedExercises).length;

    return {
      exerciseCount,
      equipmentCount,
      categoriesUsed,
      isEmpty: isEmpty(),
    };
  };

  return {
    // Estado
    selectedExercises,
    selectedEquipment,

    // Getters
    getMasterExercises,
    getMasterEquipment,
    getAllSelectedExercises,
    getFilteredExercises,
    getStats,
    isEmpty,

    // Mutadores - Ejercicios
    addExercise,
    addExercises,
    removeExercise,

    // Mutadores - Equipamiento
    addEquipment,
    addEquipments,
    removeEquipment,

    // Utilidades
    clearLibrary,
  };
};
