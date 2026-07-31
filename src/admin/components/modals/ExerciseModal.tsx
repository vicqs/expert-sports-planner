import React from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";
import "@/admin/styles/modals.css";

const ExerciseModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  isEditing,
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? "Editar Ejercicio" : "Agregar Nuevo Ejercicio"}</h3>
          <button className="modal-close tap-ripple" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="exercise-category">Categoría *</label>
            <select
              id="exercise-category"
              name="category"
              value={formData.category}
              onChange={onChange}
              required
            >
              <option value="LOWER">Tren Inferior</option>
              <option value="UPPER_PUSH">Tren Superior (Empuje)</option>
              <option value="UPPER_PULL">Tren Superior (Tracción)</option>
              <option value="CORE">Core/Abdomen</option>
              <option value="CARDIO">Cardio</option>
              <option value="FLEXIBILITY">Flexibilidad</option>
              <option value="PLYOMETRIC">Pliométrico</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exercise-name">Nombre del Ejercicio *</label>
            <input
              id="exercise-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Ej: Sentadilla Búlgara"
              required
            />
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Guardar Cambios" : "Agregar Ejercicio"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseModal;
