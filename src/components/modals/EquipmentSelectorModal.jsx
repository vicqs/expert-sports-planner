import React, { useState } from "react";
import { Button } from "@/components/ui";
import { X, Search, Check, Package, AlertCircle } from "lucide-react";
import "@/admin/styles/modals.css";
import "@/styles/trainer-library.css";

/**
 * Modal para seleccionar equipamiento del gimnasio
 * Permite selección múltiple
 */
const EquipmentSelectorModal = ({
  trainerId,
  selectedEquipment,
  getMasterEquipment,
  addEquipments,
  onClose,
}) => {
  const allEquipment = getMasterEquipment();

  // Estado local para las selecciones temporales
  const [tempSelections, setTempSelections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Obtener categorías únicas
  const categories = [...new Set(allEquipment.map((item) => item.category))];

  // Verificar si un equipamiento ya está seleccionado
  const isAlreadySelected = (id) => {
    return selectedEquipment.includes(id);
  };

  // Verificar si está en selecciones temporales
  const isTempSelected = (id) => {
    return tempSelections.includes(id);
  };

  // Toggle selección temporal
  const toggleSelection = (id) => {
    setTempSelections((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Seleccionar todos los disponibles
  const selectAllAvailable = () => {
    const availableIds = getFilteredEquipment()
      .filter((item) => !isAlreadySelected(item.id))
      .map((item) => item.id);
    setTempSelections(availableIds);
  };

  // Limpiar selección
  const clearSelection = () => {
    setTempSelections([]);
  };

  // Confirmar y agregar equipamiento
  const handleConfirm = () => {
    if (tempSelections.length > 0) {
      addEquipments(tempSelections);
    }
    onClose();
  };

  // Filtrar equipamiento
  const getFilteredEquipment = () => {
    return allEquipment.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;

      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const filteredEquipment = getFilteredEquipment();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>Seleccionar Equipamiento</h2>
            <p className="modal-subtitle">
              Elige el equipamiento disponible para tus entrenamientos
            </p>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Filtros */}
          <div className="filters-row">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar equipamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los estados</option>
              <option value="Disponible">Disponible</option>
              <option value="Mantenimiento">En Mantenimiento</option>
            </select>
          </div>

          {/* Lista de equipamiento */}
          <div className="equipment-selection-list">
            <div className="list-header">
              <span>{filteredEquipment.length} equipos encontrados</span>
              <div className="list-actions">
                <button onClick={selectAllAvailable} className="text-btn">
                  Seleccionar todos
                </button>
                {tempSelections.length > 0 && (
                  <button onClick={clearSelection} className="text-btn danger">
                    Limpiar selección ({tempSelections.length})
                  </button>
                )}
              </div>
            </div>

            <div className="equipment-grid-modal">
              {filteredEquipment.map((item) => {
                const alreadySelected = isAlreadySelected(item.id);
                const tempSelected = isTempSelected(item.id);

                return (
                  <div
                    key={item.id}
                    className={`equipment-card-modal ${alreadySelected ? "disabled" : ""} ${tempSelected ? "selected" : ""}`}
                    onClick={() => {
                      if (!alreadySelected) {
                        toggleSelection(item.id);
                      }
                    }}
                  >
                    <div className="equipment-checkbox">
                      {alreadySelected ? (
                        <Check size={18} className="check-icon existing" />
                      ) : tempSelected ? (
                        <Check size={18} className="check-icon" />
                      ) : (
                        <div className="checkbox-empty" />
                      )}
                    </div>

                    <div className="equipment-icon-small">
                      <Package size={20} />
                    </div>

                    <div className="equipment-info-modal">
                      <h4>{item.name}</h4>
                      <p className="category">{item.category}</p>
                      <div className="meta-info">
                        <span className={`status ${item.status.toLowerCase()}`}>
                          {item.status === "Disponible" ? (
                            <Check size={14} />
                          ) : (
                            <AlertCircle size={14} />
                          )}
                          {item.status}
                        </span>
                        <span className="quantity">
                          Cantidad: {item.quantity}
                        </span>
                      </div>
                    </div>

                    {alreadySelected && (
                      <span className="already-badge">Ya seleccionado</span>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredEquipment.length === 0 && (
              <div className="no-results">
                <Package size={48} />
                <p>No se encontró equipamiento con los filtros aplicados</p>
              </div>
            )}
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
            disabled={tempSelections.length === 0}
          >
            Agregar{" "}
            {tempSelections.length > 0
              ? `${tempSelections.length} equipos`
              : ""}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentSelectorModal;
