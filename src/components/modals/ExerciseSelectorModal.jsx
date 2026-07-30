import React, { useState } from "react";
import { Button } from "@/components/ui";
import { X, Search, Check } from "lucide-react";
import "@/admin/styles/modals.css";
import "@/styles/trainer-library.css";

const CATEGORY_LABELS = {
  LOWER: "Tren Inferior",
  UPPER_PUSH: "Tren Superior - Empuje",
  UPPER_PULL: "Tren Superior - Jalón",
  CORE: "Core / Abdomen",
};

/**
 * Modal para seleccionar ejercicios de la lista maestra
 * Permite selección múltiple por categoría
 */
const ExerciseSelectorModal = ({
  trainerId,
  selectedExercises,
  getMasterExercises,
  addExercises,
  onClose,
}) => {
  const masterExercises = getMasterExercises;

  // Estado local para las selecciones temporales
  const [tempSelections, setTempSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("LOWER");

  // Verificar si un ejercicio ya está seleccionado
  const isAlreadySelected = (category, exerciseName) => {
    return (selectedExercises[category] || []).includes(exerciseName);
  };

  // Verificar si un ejercicio está en las selecciones temporales
  const isTempSelected = (category, exerciseName) => {
    return (tempSelections[category] || []).includes(exerciseName);
  };

  // Toggle selección temporal de ejercicio
  const toggleSelection = (category, exerciseName) => {
    setTempSelections((prev) => {
      const current = prev[category] || [];
      const isSelected = current.includes(exerciseName);

      if (isSelected) {
        // Remover
        return {
          ...prev,
          [category]: current.filter((ex) => ex !== exerciseName),
        };
      } else {
        // Agregar
        return {
          ...prev,
          [category]: [...current, exerciseName],
        };
      }
    });
  };

  // Seleccionar todos los ejercicios de una categoría
  const selectAllInCategory = (category) => {
    const available = masterExercises[category].filter(
      (ex) => !isAlreadySelected(category, ex),
    );
    setTempSelections((prev) => ({
      ...prev,
      [category]: available,
    }));
  };

  // Limpiar selección de una categoría
  const clearCategory = (category) => {
    setTempSelections((prev) => {
      const { [category]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Confirmar y agregar ejercicios seleccionados
  const handleConfirm = () => {
    Object.entries(tempSelections).forEach(([category, exercises]) => {
      if (exercises.length > 0) {
        addExercises(category, exercises);
      }
    });
    onClose();
  };

  // Contar total de selecciones
  const getTotalSelections = () => {
    return Object.values(tempSelections).reduce(
      (sum, exercises) => sum + exercises.length,
      0,
    );
  };

  // Filtrar ejercicios por búsqueda
  const getFilteredExercises = (category) => {
    const exercises = masterExercises[category] || [];
    if (!searchTerm) return exercises;

    return exercises.filter((ex) =>
      ex.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const totalSelections = getTotalSelections();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Seleccionar Ejercicios</h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Búsqueda */}
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Tabs de categorías */}
          <div className="category-tabs">
            {Object.keys(masterExercises).map((category) => {
              const tempCount = (tempSelections[category] || []).length;
              const alreadyCount = (selectedExercises[category] || []).length;

              return (
                <button
                  key={category}
                  className={`category-tab ${activeCategory === category ? "active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                  {tempCount > 0 && (
                    <span className="badge new">{tempCount}</span>
                  )}
                  {alreadyCount > 0 && (
                    <span className="badge existing">{alreadyCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Lista de ejercicios */}
          <div className="exercise-selection-list">
            <div className="list-header">
              <span>
                {getFilteredExercises(activeCategory).length} ejercicios
                disponibles
              </span>
              <div className="list-actions">
                <button
                  onClick={() => selectAllInCategory(activeCategory)}
                  className="text-btn"
                >
                  Seleccionar todos
                </button>
                {(tempSelections[activeCategory] || []).length > 0 && (
                  <button
                    onClick={() => clearCategory(activeCategory)}
                    className="text-btn danger"
                  >
                    Limpiar selección
                  </button>
                )}
              </div>
            </div>

            <div className="exercise-items">
              {getFilteredExercises(activeCategory).map((exerciseName) => {
                const alreadySelected = isAlreadySelected(
                  activeCategory,
                  exerciseName,
                );
                const tempSelected = isTempSelected(
                  activeCategory,
                  exerciseName,
                );

                return (
                  <div
                    key={exerciseName}
                    className={`exercise-item ${alreadySelected ? "disabled" : ""} ${tempSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (!alreadySelected) {
                        toggleSelection(activeCategory, exerciseName);
                      }
                    }}
                  >
                    <div className="exercise-checkbox">
                      {alreadySelected ? (
                        <Check size={18} className="check-icon existing" />
                      ) : tempSelected ? (
                        <Check size={18} className="check-icon" />
                      ) : (
                        <div className="checkbox-empty" />
                      )}
                    </div>
                    <span className="exercise-name">{exerciseName}</span>
                    {alreadySelected && (
                      <span className="already-badge">Ya seleccionado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={totalSelections === 0}
          >
            Agregar {totalSelections > 0 ? `${totalSelections} ejercicios` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelectorModal;
