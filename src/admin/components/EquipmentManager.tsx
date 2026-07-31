import React, { useState } from "react";
import { Card, Button, ConfirmDialog } from "@/components/ui";
import {
  Search,
  PlusCircle,
  Package,
  Check,
  AlertCircle,
  Edit,
  Trash2,
} from "lucide-react";
import { useEquipment } from "@/admin/hooks";
import EquipmentModal from "@/admin/components/modals/EquipmentModal";
import { useToast } from "@/components/ui";
import "@/admin/styles/equipment.css";

const EquipmentManager = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment } =
    useEquipment();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    status: "Disponible",
    quantity: 1,
    lastMaintenance: new Date().toISOString().split("T")[0],
  });

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        category: "",
        status: "Disponible",
        quantity: 1,
        lastMaintenance: new Date().toISOString().split("T")[0],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      category: "",
      status: "Disponible",
      quantity: 1,
      lastMaintenance: new Date().toISOString().split("T")[0],
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateEquipment(editingItem.id, formData);
      addToast("Equipo actualizado correctamente", "success");
    } else {
      addEquipment(formData);
      addToast("Equipo agregado correctamente", "success");
    }
    closeModal();
  };

  const handleDelete = (id) => {
    setItemToDelete(equipment.find((item) => item.id === id) || { id });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteEquipment(itemToDelete.id);
      addToast("Equipo eliminado", "success");
    }
  };

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="admin-equipment">
      <div className="section-header">
        <h2>Gestión de Equipamiento</h2>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar equipamiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={18} />}
            onClick={() => openModal()}
          >
            Agregar Equipo
          </Button>
        </div>
      </div>

      <div className="equipment-grid">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="equipment-card">
            <div className="equipment-header">
              <div className="equipment-icon">
                <Package size={24} />
              </div>
              <span className={`status-indicator ${item.status.toLowerCase()}`}>
                {item.status === "Disponible" ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
              </span>
            </div>
            <h4>{item.name}</h4>
            <div className="equipment-meta">
              <span className="category-tag">{item.category}</span>
              <span className="quantity">Cantidad: {item.quantity}</span>
            </div>
            <div className="equipment-footer">
              <small>
                Mantenimiento:{" "}
                {new Date(item.lastMaintenance).toLocaleDateString()}
              </small>
              <div className="equipment-actions">
                <button
                  className="btn-icon tap-ripple"
                  onClick={() => openModal(item)}
                  title="Editar"
                  aria-label="Editar equipo"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="btn-icon danger tap-ripple"
                  onClick={() => handleDelete(item.id)}
                  title="Eliminar"
                  aria-label="Eliminar equipo"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="empty-state">
          <Package size={48} />
          <p>No se encontró equipamiento</p>
          <Button variant="primary" onClick={() => openModal()}>
            Agregar Primer Equipo
          </Button>
        </div>
      )}

      <EquipmentModal
        isOpen={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        isEditing={!!editingItem}
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar equipo"
        message={`¿Estás seguro de eliminar "${itemToDelete?.name || "este equipo"}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};

export default EquipmentManager;
