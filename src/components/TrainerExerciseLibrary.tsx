import React, { useState } from "react";
import { Card, Button } from "@/components/ui";
import { Dumbbell, PlusCircle, Trash2, Search } from "lucide-react";
import { useTrainerLibrary } from "@/hooks";
import ExerciseSelectorModal from "./modals/ExerciseSelectorModal";
import "@/admin/styles/exercises.css";
import "@/styles/trainer-library.css";

const CATEGORY_LABELS = {
  LOWER: "Tren Inferior",
  UPPER_PUSH: "Tren Superior - Empuje",
  UPPER_PULL: "Tren Superior - Jalón",
  CORE: "Core / Abdomen",
};

/**
 * Componente para gestionar la biblioteca personal de ejercicios del entrenador
 * Permite seleccionar ejercicios de la lista maestra (sistema + custom del admin)
 */
const TrainerExerciseLibrary = ({ trainerId }) => {
  const {
    selectedExercises,
    getMasterExercises,
    removeExercise,
    addExercises,
    getStats,
  } = useTrainerLibrary(trainerId);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const masterExercises = getMasterExercises;
  const categories =
    Object.keys(selectedExercises).length > 0
      ? Object.keys(selectedExercises)
      : Object.keys(masterExercises);

  const stats = getStats();

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleRemove = (category, exerciseName) => {
    if (window.confirm(`¿Quitar "${exerciseName}" de tu biblioteca?`)) {
      removeExercise(category, exerciseName);
    }
  };

  // Filtrar ejercicios por categoría y búsqueda
  const getFilteredExercises = () => {
    const categoriesToShow =
      selectedCategory === "all" ? categories : [selectedCategory];

    const filtered = {};
    categoriesToShow.forEach((cat) => {
      const exercises = selectedExercises[cat] || [];
      if (searchTerm) {
        filtered[cat] = exercises.filter((ex) =>
          ex.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      } else {
        filtered[cat] = exercises;
      }
    });

    return filtered;
  };

  const filteredExercises = getFilteredExercises();

  return (
    <div className="admin-exercises trainer-library">
      {/* Header con estadísticas */}
      <div className="section-header">
        <div className="header-content">
          <Dumbbell size={28} />
          <div>
            <h2>Mi Biblioteca de Ejercicios</h2>
            <p className="subtitle">
              {stats.exerciseCount} ejercicios seleccionados •{" "}
              {stats.categoriesUsed} categorías
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={openModal}
          icon={<PlusCircle size={18} />}
        >
          Agregar Ejercicios
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="exercises-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar en mi biblioteca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          <option value="all">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat} (
              {(selectedExercises[cat] || []).length})
            </option>
          ))}
        </select>
      </div>

      {/* Lista de ejercicios por categoría */}
      {stats.isEmpty ? (
        <Card className="empty-state">
          <Dumbbell size={48} className="empty-icon" />
          <h3>Tu biblioteca está vacía</h3>
          <p>
            Agrega ejercicios de la base de datos para crear planes de
            entrenamiento.
          </p>
          <Button
            variant="primary"
            onClick={openModal}
            icon={<PlusCircle size={18} />}
          >
            Agregar Ejercicios
          </Button>
        </Card>
      ) : (
        <div className="exercises-grid">
          {Object.entries(filteredExercises).map(([category, exercises]) => {
            if (!exercises || exercises.length === 0) return null;

            return (
              <Card key={category} className="category-card">
                <div className="category-header">
                  <h3>{CATEGORY_LABELS[category] || category}</h3>
                  <span className="exercise-count">{exercises.length}</span>
                </div>
                <ul className="exercise-list">
                  {exercises.map((exerciseName) => (
                    <li key={exerciseName} className="exercise-item">
                      <span className="exercise-name">{exerciseName}</span>
                      <button
                        onClick={() => handleRemove(category, exerciseName)}
                        className="remove-btn"
                        title="Quitar de mi biblioteca"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal para seleccionar ejercicios */}
      {showModal && (
        <ExerciseSelectorModal
          trainerId={trainerId}
          selectedExercises={selectedExercises}
          getMasterExercises={getMasterExercises}
          addExercises={addExercises}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TrainerExerciseLibrary;
