/**
 * EquipmentModal - formulario modal para crear/editar equipamiento.
 *
 * Responsabilidad: solo presentación; no valida ni persiste (lo hace
 * useEquipment desde EquipmentManager). Lo usa: EquipmentManager.
 * Estilos: admin/styles/modals.css. Cierra con Escape o clic en el overlay.
 */
import React, { useEffect } from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";
import "@/admin/styles/modals.css";

/**
 * Modal de alta/edición de equipo.
 *
 * @param props.isOpen Si es false no renderiza nada.
 * @param props.onClose Cierra el modal (botón, overlay o tecla Escape).
 * @param props.onSubmit Recibe el evento submit ya con preventDefault.
 * @param props.formData Estado del formulario: name, category, status,
 *   quantity, lastMaintenance (YYYY-MM-DD).
 * @param props.onChange Handler change compartido por todos los campos.
 * @param props.isEditing Cambia títulos/etiquetas entre editar y agregar.
 */
const EquipmentModal = ({
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
        aria-labelledby="equipment-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="equipment-modal-title">
            {isEditing ? "Editar Equipo" : "Agregar Nuevo Equipo"}
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
            <label htmlFor="equipment-name">Nombre del Equipo *</label>
            <input
              id="equipment-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Ej: Barra Olímpica"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="equipment-category">Categoría *</label>
            <select
              id="equipment-category"
              name="category"
              value={formData.category}
              onChange={onChange}
              required
            >
              <option value="">Seleccionar categoría</option>
              <option value="Pesas Libres">Pesas Libres</option>
              <option value="Máquinas">Máquinas</option>
              <option value="Cardio">Cardio</option>
              <option value="Funcional">Funcional</option>
              <option value="Accesorios">Accesorios</option>
              <option value="Bancos">Bancos</option>
              <option value="Poleas">Poleas</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="equipment-status">Estado</label>
              <select
                id="equipment-status"
                name="status"
                value={formData.status}
                onChange={onChange}
              >
                <option value="Disponible">Disponible</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Fuera de servicio">Fuera de servicio</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="equipment-quantity">Cantidad</label>
              <input
                id="equipment-quantity"
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={onChange}
                min="1"
                max="9999"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="equipment-maintenance">Último Mantenimiento</label>
            <input
              id="equipment-maintenance"
              type="date"
              name="lastMaintenance"
              value={formData.lastMaintenance}
              onChange={onChange}
            />
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Guardar Cambios" : "Agregar Equipo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentModal;
