/**
 * EquipmentManager - gestión del equipamiento del gimnasio (vista Admin).
 *
 * Responsabilidad: tarjetas de equipos con búsqueda, alta/edición (modal) y
 * eliminación con confirmación; marca mantenimientos vencidos.
 * Lo usa: AdminDashboard (vista "equipment").
 * Datos: useEquipment -> localStorage "crm_equipment".
 * Efectos: toasts y registro en la bitácora (logAdminAction).
 */
import React, { useState, useRef } from "react";
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
import {
  isMaintenanceOverdue,
  todayLocal,
  EQUIPMENT_STATUSES,
  type EquipmentItem,
} from "@/admin/hooks/useEquipment";
import { useAuth } from "@/context/AuthContext";
import { logAdminAction } from "@/admin/utils/auditLog";
import { consumeSearchPrefill } from "@/admin/utils/searchPrefill";
import EquipmentModal from "@/admin/components/modals/EquipmentModal";
import UndoBar from "@/admin/components/UndoBar";
import { buildCsv, downloadCsv } from "@/admin/utils/csv";
import { useToast } from "@/components/ui";
import "@/admin/styles/equipment.css";
import "@/admin/styles/admin-extras.css";

/**
 * Formatea una fecha YYYY-MM-DD como fecha local (es-ES). Se fuerza la hora
 * local (T00:00:00) para evitar el desfase de un día que produce interpretar
 * la cadena como UTC. Devuelve "—" si falta o es inválida.
 */
const formatLocalDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-ES");
};

/** Vista de equipamiento del administrador. No recibe props. */
const EquipmentManager = () => {
  const {
    equipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    restoreEquipment,
    importEquipment,
    updateMany,
  } = useEquipment();
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [bulkStatus, setBulkStatus] = useState("Disponible");
  const fileRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();
  const { currentUser } = useAuth();
  // Actor para la bitácora de auditoría (id del admin o "admin" por defecto)
  const actor = (currentUser?.id as string) || "admin";
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<EquipmentItem | null>(null);
  const [undoItem, setUndoItem] = useState<EquipmentItem | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: unknown;
    added: number;
    skipped: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState(() =>
    consumeSearchPrefill("equipment"),
  );
  const [formData, setFormData] = useState<
    Omit<EquipmentItem, "id"> & { id?: EquipmentItem["id"] }
  >({
    name: "",
    category: "",
    status: "Disponible",
    quantity: 1,
    lastMaintenance: todayLocal(),
  });

  /**
   * Abre el modal: con `item` precarga el formulario (editar); sin él, crea
   * con valores por defecto (mantenimiento = hoy).
   */
  const openModal = (item: EquipmentItem | null = null) => {
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
        lastMaintenance: todayLocal(),
      });
    }
    setShowModal(true);
  };

  /** Cierra el modal y reinicia el formulario. */
  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: "",
      category: "",
      status: "Disponible",
      quantity: 1,
      lastMaintenance: todayLocal(),
    });
  };

  /**
   * Handler genérico de campos. `quantity` se convierte a entero (o "" si el
   * input está vacío, para permitir borrar mientras se escribe); la validación
   * final ocurre en el hook.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" ? (value === "" ? "" : parseInt(value, 10)) : value,
    }));
  };

  /** Crea o edita el equipo; muestra el error del hook o un toast de éxito. */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingItem
      ? updateEquipment(editingItem.id, formData)
      : addEquipment(formData);
    if (!result.ok) {
      addToast(result.error, "error");
      return;
    }
    logAdminAction(
      actor,
      editingItem ? "Equipo editado" : "Equipo creado",
      formData.name.trim(),
    );
    addToast(
      editingItem
        ? "Equipo actualizado correctamente"
        : "Equipo agregado correctamente",
      "success",
    );
    closeModal();
  };

  /** Solicita confirmación (ConfirmDialog); el hook no pregunta por sí mismo. */
  const handleDelete = (id: EquipmentItem["id"]) => {
    const item = equipment.find((i) => i.id === id);
    if (item) setItemToDelete(item);
  };

  /** Ejecuta la eliminación confirmada y la registra en la bitácora. */
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteEquipment(itemToDelete.id);
      logAdminAction(actor, "Equipo eliminado", itemToDelete.name);
      addToast("Equipo eliminado", "success");
      if (itemToDelete.name) setUndoItem(itemToDelete);
    }
    setItemToDelete(null);
  };

  /** Descarga el inventario como CSV (para hojas de cálculo). */
  const handleExportCsv = () => {
    downloadCsv(
      `equipamiento-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(
        ["Nombre", "Categoría", "Estado", "Cantidad", "Último mantenimiento"],
        equipment.map((e) => [
          e.name,
          e.category,
          e.status,
          e.quantity,
          e.lastMaintenance,
        ]),
      ),
    );
    logAdminAction(
      actor,
      "Equipamiento exportado (CSV)",
      `${equipment.length} ítem(s)`,
    );
  };

  /** Descarga el inventario como JSON. */
  const handleExport = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(equipment, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `equipamiento-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAdminAction(
      actor,
      "Equipamiento exportado",
      `${equipment.length} ítem(s)`,
    );
  };

  /** Lee el JSON (máx. 2 MB), simula la importación y pide confirmación. */
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addToast("El archivo supera 2 MB", "error");
      return;
    }
    try {
      const data = JSON.parse(await file.text());
      const preview = importEquipment(data, true);
      if (!preview.ok) {
        addToast(preview.error, "error");
        return;
      }
      setPendingImport({
        data,
        added: preview.added ?? 0,
        skipped: preview.skipped ?? 0,
      });
    } catch {
      addToast("El archivo no es un JSON válido", "error");
    }
  };

  /** Aplica la importación confirmada y la registra. */
  const confirmImport = () => {
    if (!pendingImport) return;
    const result = importEquipment(pendingImport.data);
    setPendingImport(null);
    if (!result.ok) {
      addToast(result.error, "error");
      return;
    }
    const skipped = result.skipped ?? 0;
    logAdminAction(
      actor,
      "Equipamiento importado",
      `${result.added} nuevos, ${skipped} omitidos`,
    );
    addToast(
      `Importación completa: ${result.added} nuevo(s)` +
        (skipped ? `, ${skipped} omitido(s) (duplicados o inválidos)` : ""),
      skipped ? "info" : "success",
    );
  };

  // Filtro por nombre o categoría (insensible a mayúsculas)
  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Ids vigentes de la selección (descarta equipos eliminados)
  const validSelectedIds = equipment
    .filter((e) => selectedIds.has(e.id))
    .map((e) => e.id);

  const toggleSelected = (id: string | number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Aplica una actualización masiva a la selección y la audita. */
  const runBulk = (
    updates: { status?: string; lastMaintenance?: string },
    label: string,
  ) => {
    const result = updateMany(validSelectedIds, updates);
    if (!result.ok) {
      addToast(result.error, "error");
      return;
    }
    logAdminAction(actor, label, `${result.updated} equipo(s)`);
    addToast(`${label}: ${result.updated} equipo(s)`, "success");
    setSelectedIds(new Set());
  };

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
          <Button variant="secondary" onClick={handleExport}>
            Exportar
          </Button>
          <Button variant="secondary" onClick={handleExportCsv}>
            CSV
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Importar
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            aria-label="Importar equipamiento"
            style={{ display: "none" }}
            tabIndex={-1}
            onChange={handleImportFile}
          />
          <Button
            variant="primary"
            leftIcon={<PlusCircle size={18} />}
            onClick={() => openModal()}
          >
            Agregar Equipo
          </Button>
        </div>
      </div>

      {validSelectedIds.length > 0 && (
        <div
          className="admin-filters"
          role="region"
          aria-label="Acciones en lote"
        >
          <strong>{validSelectedIds.length} seleccionado(s)</strong>
          <select
            className="admin-select"
            aria-label="Estado para el lote"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            {EQUIPMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="admin-btn tap-ripple"
            onClick={() =>
              runBulk({ status: bulkStatus }, "Estado de equipos modificado")
            }
          >
            Aplicar estado
          </button>
          <button
            className="admin-btn tap-ripple"
            onClick={() =>
              runBulk(
                { lastMaintenance: todayLocal() },
                "Mantenimiento registrado (lote)",
              )
            }
          >
            Mantenimiento hecho hoy
          </button>
          <button
            className="admin-btn tap-ripple"
            onClick={() => setSelectedIds(new Set())}
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="equipment-grid">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="equipment-card">
            <div className="equipment-header">
              <label className="equipment-select">
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${item.name}`}
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelected(item.id)}
                />
              </label>
              <div className="equipment-icon">
                <Package size={24} />
              </div>
              <span
                // La clase CSS del estado se deriva del texto ("Fuera de servicio"
                // -> "fuera-de-servicio")
                className={`status-indicator ${item.status.toLowerCase().replace(/\s+/g, "-")}`}
                title={item.status}
              >
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
                Mantenimiento: {formatLocalDate(item.lastMaintenance)}{" "}
                {isMaintenanceOverdue(item) && (
                  <span className="badge-warning">Vencido</span>
                )}
              </small>
              {(item.maintenanceHistory?.length ?? 0) > 1 && (
                <details>
                  <summary>
                    Historial ({item.maintenanceHistory!.length})
                  </summary>
                  <ul>
                    {[...item.maintenanceHistory!].reverse().map((d) => (
                      <li key={d}>{formatLocalDate(d)}</li>
                    ))}
                  </ul>
                </details>
              )}
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
      <ConfirmDialog
        isOpen={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Importar equipamiento"
        message={`Se agregarán ${pendingImport?.added ?? 0} equipo(s) y se omitirán ${pendingImport?.skipped ?? 0} (duplicados o inválidos).`}
        confirmText="Importar"
        cancelText="Cancelar"
      />
      {undoItem && (
        <UndoBar
          message={`Equipo "${undoItem.name}" eliminado`}
          onDismiss={() => setUndoItem(null)}
          onUndo={() => {
            restoreEquipment(undoItem);
            logAdminAction(actor, "Eliminación deshecha", undoItem.name);
            addToast("Equipo restaurado", "success");
            setUndoItem(null);
          }}
        />
      )}
    </div>
  );
};

export default EquipmentManager;
