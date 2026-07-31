import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, ConfirmDialog } from "@/components/ui";
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
  const [exerciseToRemove, setExerciseToRemove] = useState<{
    category: string;
    exerciseName: string;
  } | null>(null);

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
    setExerciseToRemove({ category, exerciseName });
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
          <AnimatePresence>
            {Object.entries(filteredExercises as Record<string, any[]>).map(
              ([category, exercises]) => {
                if (!exercises || exercises.length === 0) return null;

                return (
                  <motion.div
                    key={category}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="category-card">
                      <div className="category-header">
                        <h3>{CATEGORY_LABELS[category] || category}</h3>
                        <span className="exercise-count">
                          {exercises.length}
                        </span>
                      </div>
                      <ul className="exercise-list">
                        <AnimatePresence>
                          {exercises.map((exerciseName: string) => (
                            <motion.li
                              key={exerciseName}
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18 }}
                              className="exercise-item"
                            >
                              <span className="exercise-name">
                                {exerciseName}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemove(category, exerciseName)
                                }
                                className="remove-btn tap-ripple"
                                title="Quitar de mi biblioteca"
                                aria-label="Quitar de mi biblioteca"
                              >
                                <Trash2 size={16} />
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    </Card>
                  </motion.div>
                );
              },
            )}
          </AnimatePresence>
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

      <ConfirmDialog
        isOpen={!!exerciseToRemove}
        onClose={() => setExerciseToRemove(null)}
        onConfirm={() =>
          removeExercise(
            exerciseToRemove.category,
            exerciseToRemove.exerciseName,
          )
        }
        title="Quitar ejercicio"
        message={`¿Quitar "${exerciseToRemove?.exerciseName}" de tu biblioteca?`}
        confirmText="Quitar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default TrainerExerciseLibrary;
