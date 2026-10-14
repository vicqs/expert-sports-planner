/**
 * ExerciseModal - formulario modal para crear/editar ejercicios.
 *
 * Responsabilidad: solo presentación. Los campos de lista (bodyParts,
 * targetMuscles, secondaryMuscles, equipments) son texto separado por comas y
 * `instructions` una línea por paso; ExerciseDatabase los convierte a arreglos
 * y useCustomExercises valida (incluida la URL https del GIF).
 * Lo usa: ExerciseDatabase. Estilos: admin/styles/modals.css.
 */
import React, { useEffect } from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";
import "@/admin/styles/modals.css";

/**
 * Modal de alta/edición de ejercicio.
 *
 * @param props.isOpen Si es false no renderiza nada.
 * @param props.onClose Cierra el modal (botón, overlay o tecla Escape).
 * @param props.onSubmit Recibe el evento submit ya con preventDefault.
 * @param props.formData Campos: category, name y opcionales gifUrl, bodyParts,
 *   targetMuscles, secondaryMuscles, equipments, instructions (strings).
 * @param props.onChange Handler change compartido por todos los campos.
 * @param props.isEditing Cambia títulos/etiquetas entre editar y agregar.
 */
const ExerciseModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  isEditing,
}) => {
  // Escape cierra el modal (solo mientras está abierto)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="exercise-modal-title">
            {isEditing ? "Editar Ejercicio" : "Agregar Nuevo Ejercicio"}
          </h3>
          <button
            type="button"
            className="modal-close tap-ripple"
            onClick={onClose}
            aria-label="Cerrar"
          >
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
              <option value="FULL_BODY">Cuerpo completo</option>
              <option value="PLIOMETRICO">Pliométrico</option>
              <option value="MOVILIDAD">Movilidad y estiramientos</option>
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

          <div className="form-group">
            <label htmlFor="exercise-gifUrl">
              URL de GIF/imagen (opcional)
            </label>
            <input
              id="exercise-gifUrl"
              type="text"
              name="gifUrl"
              value={formData.gifUrl || ""}
              onChange={onChange}
              placeholder="https://..."
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="admin-btn tap-ripple"
                onClick={() => {
                  const el = document.getElementById(
                    "exercise-gifUrl",
                  ) as HTMLInputElement | null;
                  el?.focus();
                  el?.select();
                }}
              >
                Seleccionar URL
              </button>
              <button
                type="button"
                className="admin-btn tap-ripple"
                disabled={!formData.gifUrl}
                onClick={() =>
                  navigator.clipboard?.writeText(formData.gifUrl || "")
                }
              >
                Copiar URL
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exercise-bodyParts">
              Partes del cuerpo (separadas por coma)
            </label>
            <input
              id="exercise-bodyParts"
              type="text"
              name="bodyParts"
              value={formData.bodyParts || ""}
              onChange={onChange}
              placeholder="chest, back"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-targetMuscles">
              Músculos principales (separados por coma)
            </label>
            <input
              id="exercise-targetMuscles"
              type="text"
              name="targetMuscles"
              value={formData.targetMuscles || ""}
              onChange={onChange}
              placeholder="pectorals"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-secondaryMuscles">
              Músculos secundarios (separados por coma)
            </label>
            <input
              id="exercise-secondaryMuscles"
              type="text"
              name="secondaryMuscles"
              value={formData.secondaryMuscles || ""}
              onChange={onChange}
              placeholder="triceps, shoulders"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-equipments">
              Equipamiento (separado por coma)
            </label>
            <input
              id="exercise-equipments"
              type="text"
              name="equipments"
              value={formData.equipments || ""}
              onChange={onChange}
              placeholder="barbell"
            />
          </div>

          <div className="form-group">
            <label htmlFor="exercise-instructions">
              Instrucciones (una por línea)
            </label>
            <textarea
              id="exercise-instructions"
              name="instructions"
              value={formData.instructions || ""}
              onChange={onChange}
              placeholder={"Paso 1: ...\nPaso 2: ...\nPaso 3: ..."}
              rows={4}
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
