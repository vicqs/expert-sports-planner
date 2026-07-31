import React from "react";
import { Button } from "@/components/ui";
import { X } from "lucide-react";
import "@/admin/styles/modals.css";

const EquipmentModal = ({
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
          <h3>{isEditing ? "Editar Equipo" : "Agregar Nuevo Equipo"}</h3>
          <button className="modal-close tap-ripple" onClick={onClose}>
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
