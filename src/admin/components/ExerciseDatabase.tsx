import React, { useState } from "react";
import { Card, Button, ConfirmDialog } from "@/components/ui";
import { Activity, PlusCircle, Edit, Trash2, Search, X } from "lucide-react";
import { GYM_EXERCISES } from "@/utils/constants";
import { useCustomExercises } from "@/admin/hooks";
import ExerciseModal from "@/admin/components/modals/ExerciseModal";
import { useToast } from "@/components/ui";
import "@/admin/styles/exercises.css";

const ExerciseDatabase = () => {
  const {
    customExercises,
    hiddenExercises,
    addExercise,
    updateExercise,
    deleteExercise,
  } = useCustomExercises();
  const { addToast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<{
    category: string;
    name: string;
  } | null>(null);
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

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleExercises: Record<string, string[]> = {};
  filteredCategory.forEach((category) => {
    visibleExercises[category] = normalizedSearch
      ? allExercises[category].filter((ex: string) =>
          ex.toLowerCase().includes(normalizedSearch),
        )
      : allExercises[category];
  });
  const categoriesToRender = filteredCategory.filter(
    (category) => visibleExercises[category].length > 0,
  );
  const totalExercises = categories.reduce(
    (sum, category) => sum + allExercises[category].length,
    0,
  );

  const openModal = (
    category: string | null = null,
    exerciseName: string | null = null,
  ) => {
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
      addToast("Ejercicio actualizado correctamente", "success");
    } else {
      // Agregar nuevo ejercicio
      addExercise({ category, name });
      addToast("Ejercicio agregado correctamente", "success");
    }
    closeModal();
  };

  const handleDelete = (category, exerciseName) => {
    setExerciseToDelete({ category, name: exerciseName });
  };

  const confirmDelete = () => {
    if (exerciseToDelete) {
      deleteExercise(exerciseToDelete.category, exerciseToDelete.name);
      addToast("Ejercicio eliminado", "success");
    }
  };

  return (
    <div className="admin-exercises">
      <div className="section-header">
        <div>
          <h2>Base de Datos de Ejercicios</h2>
          <p className="exercises-total">
            {totalExercises.toLocaleString("es-ES")} ejercicios en total
          </p>
        </div>
        <div className="filters">
          <div className="exercise-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar ejercicio por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar ejercicio por nombre"
            />
            {searchTerm && (
              <button
                type="button"
                className="exercise-search-clear tap-ripple"
                onClick={() => setSearchTerm("")}
                aria-label="Limpiar búsqueda"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
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
        {categoriesToRender.length === 0 && (
          <div className="exercises-empty-state">
            <Search size={40} />
            <p>No se encontraron ejercicios para &quot;{searchTerm}&quot;</p>
          </div>
        )}
        {categoriesToRender.map((category) => (
          <Card key={category} className="category-card">
            <div className="category-header">
              <h3>{category}</h3>
              <span className="count-badge">
                {visibleExercises[category].length} ejercicios
              </span>
            </div>
            <div className="exercise-list">
              {visibleExercises[category].map((exercise, idx) => {
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
                        className="btn-icon-mini tap-ripple"
                        onClick={() => openModal(category, exercise)}
                        title="Editar"
                        aria-label="Editar ejercicio"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        className="btn-icon-mini danger tap-ripple"
                        onClick={() => handleDelete(category, exercise)}
                        title="Eliminar"
                        aria-label="Eliminar ejercicio"
                      >
                        <Trash2 size={20} />
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

      <ConfirmDialog
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar ejercicio"
        message={`¿Estás seguro de eliminar "${exerciseToDelete?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default ExerciseDatabase;
