import React, { useState } from "react";
import { Card, Button } from "@/components/ui";
import {
  Search,
  PlusCircle,
  Package,
  Check,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useTrainerLibrary } from "@/hooks";
import EquipmentSelectorModal from "./modals/EquipmentSelectorModal";
import "@/admin/styles/equipment.css";
import "@/styles/trainer-library.css";

/**
 * Componente para gestionar el equipamiento disponible del entrenador
 * Permite seleccionar equipamiento del gimnasio para usarlo en planes
 */
const TrainerEquipmentLibrary = ({ trainerId }) => {
  const {
    selectedEquipment,
    getMasterEquipment,
    removeEquipment,
    addEquipments,
    getStats,
  } = useTrainerLibrary(trainerId);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const allEquipment = getMasterEquipment();
  const stats = getStats();

  // Filtrar solo el equipamiento seleccionado por el entrenador
  const trainerEquipment = allEquipment.filter((item) =>
    selectedEquipment.includes(item.id),
  );

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleRemove = (id, name) => {
    if (window.confirm(`¿Quitar "${name}" de tu equipamiento disponible?`)) {
      removeEquipment(id);
    }
  };

  // Filtrar equipamiento por búsqueda y estado
  const filteredEquipment = trainerEquipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || item.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calcular estadísticas del equipamiento seleccionado
  const availableCount = trainerEquipment.filter(
    (e) => e.status === "Disponible",
  ).length;
  const maintenanceCount = trainerEquipment.filter(
    (e) => e.status === "Mantenimiento",
  ).length;

  return (
    <div className="admin-equipment trainer-library">
      {/* Header con estadísticas */}
      <div className="section-header">
        <div className="header-content">
          <Package size={28} />
          <div>
            <h2>Mi Equipamiento Disponible</h2>
            <p className="subtitle">
              {stats.equipmentCount} equipos • {availableCount} disponibles •{" "}
              {maintenanceCount} en mantenimiento
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={openModal}
          icon={<PlusCircle size={18} />}
        >
          Agregar Equipamiento
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="equipment-toolbar">
        <div className="search-bar">
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
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">Todos los estados</option>
          <option value="Disponible">Disponible</option>
          <option value="Mantenimiento">En Mantenimiento</option>
        </select>
      </div>

      {/* Lista de equipamiento */}
      {trainerEquipment.length === 0 ? (
        <Card className="empty-state">
          <Package size={48} className="empty-icon" />
          <h3>Sin equipamiento seleccionado</h3>
          <p>
            Agrega equipamiento del gimnasio para filtrar ejercicios compatibles
            en tus planes.
          </p>
          <Button
            variant="primary"
            onClick={openModal}
            icon={<PlusCircle size={18} />}
          >
            Seleccionar Equipamiento
          </Button>
        </Card>
      ) : (
        <div className="equipment-grid">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="equipment-card">
              <div className="equipment-header">
                <div className="equipment-icon">
                  <Package size={24} />
                </div>
                <span
                  className={`status-indicator ${item.status.toLowerCase()}`}
                >
                  {item.status === "Disponible" ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                  <span>{item.status}</span>
                </span>
              </div>

              <div className="equipment-info">
                <h3>{item.name}</h3>
                <p className="equipment-category">{item.category}</p>

                <div className="equipment-details">
                  <div className="detail-item">
                    <span className="label">Cantidad:</span>
                    <span className="value">{item.quantity}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Última mantención:</span>
                    <span className="value">
                      {new Date(item.lastMaintenance).toLocaleDateString(
                        "es-ES",
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="equipment-actions">
                <button
                  onClick={() => handleRemove(item.id, item.name)}
                  className="action-btn delete"
                  title="Quitar de mi equipamiento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredEquipment.length === 0 && trainerEquipment.length > 0 && (
        <div className="no-results">
          <p>No se encontraron resultados para &ldquo;{searchTerm}&rdquo;</p>
        </div>
      )}

      {/* Modal para seleccionar equipamiento */}
      {showModal && (
        <EquipmentSelectorModal
          trainerId={trainerId}
          selectedEquipment={selectedEquipment}
          getMasterEquipment={getMasterEquipment}
          addEquipments={addEquipments}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default TrainerEquipmentLibrary;
