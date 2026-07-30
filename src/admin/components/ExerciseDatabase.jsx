import React, { useState } from "react";
import { Card, Button } from "@/components/ui";
import { Activity, PlusCircle, Edit, Trash2 } from "lucide-react";
import { GYM_EXERCISES } from "@/utils/constants";
import { useCustomExercises } from "@/admin/hooks";
import ExerciseModal from "@/admin/components/modals/ExerciseModal";
import "@/admin/styles/exercises.css";

const ExerciseDatabase = () => {
  const {
    customExercises,
    hiddenExercises,
    addExercise,
    updateExercise,
    deleteExercise,
  } = useCustomExercises();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "LOWER",
  });

  // Merge GYM_EXERCISES con customExercises y filtrar los ocultos
  const allExercises = {};
  Object.keys(GYM_EXERCISES).forEach((category) => {
    // Empezar con ejercicios del sistema, filtrando los ocultos
    const systemExercises = GYM_EXERCISES[category].filter(
      (ex) => !hiddenExercises[category]?.includes(ex),
    );
    // Agregar ejercicios personalizados
    const custom = customExercises[category] || [];
    allExercises[category] = [...systemExercises, ...custom];
  });

  // Agregar categorías que solo existen en customExercises
  Object.keys(customExercises).forEach((category) => {
    if (!allExercises[category]) {
      allExercises[category] = customExercises[category];
    }
  });

  const categories = Object.keys(allExercises);
  const filteredCategory =
    selectedCategory === "all" ? categories : [selectedCategory];

  const openModal = (category = null, exerciseName = null) => {
    if (category && exerciseName) {
      setEditingExercise({ category, name: exerciseName });
      setFormData({
        name: exerciseName,
        category: category,
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: "",
        category: "LOWER",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExercise(null);
    setFormData({
      name: "",
      category: "LOWER",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { category, name } = formData;

    if (editingExercise) {
      // Editar ejercicio existente
      updateExercise(editingExercise, { category, name });
    } else {
      // Agregar nuevo ejercicio
      addExercise({ category, name });
    }
    closeModal();
  };

  const handleDelete = (category, exerciseName) => {
    if (window.confirm(`¿Estás seguro de eliminar "${exerciseName}"?`)) {
      deleteExercise(category, exerciseName);
    }
  };

  return (
    <div className="admin-exercises">
      <div className="section-header">
        <h2>Base de Datos de Ejercicios</h2>
        <div className="filters">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({allExercises[cat].length})
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={18} />}
            onClick={() => openModal()}
          >
            Agregar Ejercicio
          </Button>
        </div>
      </div>

      <div className="exercises-grid">
        {filteredCategory.map((category) => (
          <Card key={category} className="category-card">
            <div className="category-header">
              <h3>{category}</h3>
              <span className="count-badge">
                {allExercises[category].length} ejercicios
              </span>
            </div>
            <div className="exercise-list">
              {allExercises[category].map((exercise, idx) => {
                const isCustom = customExercises[category]?.includes(exercise);
                return (
                  <div
                    key={idx}
                    className={`exercise-item ${isCustom ? "custom" : ""}`}
                  >
                    <Activity size={16} />
                    <span className="exercise-name">{exercise}</span>
                    {isCustom && (
                      <span className="custom-badge">Personalizado</span>
                    )}
                    <div className="exercise-item-actions">
                      <button
                        className="btn-icon-mini"
                        onClick={() => openModal(category, exercise)}
                        title="Editar"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        className="btn-icon-mini danger"
                        onClick={() => handleDelete(category, exercise)}
                        title="Eliminar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <ExerciseModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        isEditing={!!editingExercise}
      />
    </div>
  );
};

export default ExerciseDatabase;
