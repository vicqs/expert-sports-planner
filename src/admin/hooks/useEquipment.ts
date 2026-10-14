/**
 * useEquipment - CRUD del equipamiento del gimnasio para el panel Admin.
 *
 * Lo usan: AdminDashboard (estadísticas) y EquipmentManager.
 * Persiste en localStorage["crm_equipment"] vía usePersistentState (sincroniza
 * entre instancias/pestañas). Si no hay datos usa el inventario inicial.
 * También exporta constantes y helpers de mantenimiento.
 */
import { normalizeName, newId } from "@/utils/validation";
import { usePersistentState } from "./usePersistentState";

/** Estados válidos de un equipo (se validan en `validate`). */
export const EQUIPMENT_STATUSES = [
  "Disponible",
  "Mantenimiento",
  "Fuera de servicio",
] as const;

/** Categorías disponibles en el formulario de equipamiento. */
export const EQUIPMENT_CATEGORIES = [
  "Pesas Libres",
  "Máquinas",
  "Cardio",
  "Funcional",
  "Accesorios",
  "Bancos",
  "Poleas",
];

// Días sin mantenimiento a partir de los cuales se considera vencido
export const MAINTENANCE_OVERDUE_DAYS = 180;

/** Elemento del inventario. `lastMaintenance` es fecha YYYY-MM-DD. */
export interface EquipmentItem {
  id: number | string;
  name: string;
  category: string;
  status: string;
  quantity: number;
  lastMaintenance: string;
  /** Fechas de mantenimiento registradas (más reciente al final, máx. 20). */
  maintenanceHistory?: string[];
}

const MAX_HISTORY = 20;

/** Devuelve `item` con `date` añadida al historial si es nueva. */
const withHistory = (item: EquipmentItem, date?: string): EquipmentItem => {
  if (!date) return item;
  const history = item.maintenanceHistory ?? [];
  if (history.includes(date)) return item;
  return {
    ...item,
    maintenanceHistory: [...history, date].slice(-MAX_HISTORY),
  };
};

/** Resultado de una operación validada: éxito o mensaje de error en español. */
type Result = { ok: true } | { ok: false; error: string };

/** Fecha de hoy YYYY-MM-DD en hora local (toISOString usa UTC y puede adelantarse un día). */
export const todayLocal = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Días transcurridos desde una fecha YYYY-MM-DD (interpretada en hora local). */
export const daysSince = (dateStr?: string): number => {
  if (!dateStr) return 0;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Indica si un equipo necesita mantenimiento: lleva más de
 * MAINTENANCE_OVERDUE_DAYS días sin mantenimiento. Los equipos "Fuera de
 * servicio" se excluyen porque no están en uso.
 */
export const isMaintenanceOverdue = (item: EquipmentItem) =>
  item.status !== "Fuera de servicio" &&
  daysSince(item.lastMaintenance) > MAINTENANCE_OVERDUE_DAYS;

const isEquipmentItem = (v: unknown): v is EquipmentItem => {
  const e = v as EquipmentItem;
  return (
    !!e &&
    typeof e === "object" &&
    (typeof e.id === "number" || typeof e.id === "string") &&
    typeof e.name === "string" &&
    typeof e.category === "string" &&
    typeof e.status === "string"
  );
};

const isEquipmentList = (v: unknown): v is EquipmentItem[] =>
  Array.isArray(v) && v.every(isEquipmentItem);

const readStored = (): EquipmentItem[] => getInitialEquipment();

/**
 * Hook para gestionar el equipamiento del gimnasio.
 * Maneja CRUD completo con validación y persistencia en localStorage.
 *
 * @returns `equipment` (lista), `addEquipment`, `updateEquipment` y
 *   `deleteEquipment` (los dos primeros devuelven `{ ok }` o `{ ok:false,
 *   error }`), y `getEquipmentStats()` con conteos por estado.
 *   Efecto secundario: cada cambio se guarda en "crm_equipment". La
 *   confirmación de borrado es responsabilidad del componente.
 */
export const useEquipment = () => {
  const [equipment, setEquipment] = usePersistentState<EquipmentItem[]>(
    "crm_equipment",
    readStored,
    isEquipmentList,
  );
  /**
   * Valida un equipo (nombre, categoría, cantidad, estado, fecha).
   * @param data Datos a validar.
   * @param excludeId Id a ignorar en la detección de duplicados (edición).
   */
  const validate = (
    data: Partial<EquipmentItem>,
    excludeId?: EquipmentItem["id"],
  ): Result => {
    const name = (data.name ?? "").trim();
    if (!name) return { ok: false, error: "El nombre es obligatorio" };
    if (name.length > 80) {
      return { ok: false, error: "El nombre no puede superar 80 caracteres" };
    }
    if (!data.category) return { ok: false, error: "Selecciona una categoría" };
    const quantity = Number(data.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
      return {
        ok: false,
        error: "La cantidad debe ser un entero entre 1 y 9999",
      };
    }
    if (
      data.status &&
      !(EQUIPMENT_STATUSES as readonly string[]).includes(data.status)
    ) {
      return { ok: false, error: "Estado inválido" };
    }
    // El mantenimiento no puede registrarse en el futuro
    if (
      data.lastMaintenance &&
      new Date(`${data.lastMaintenance}T00:00:00`).getTime() > Date.now()
    ) {
      return {
        ok: false,
        error: "La fecha de mantenimiento no puede ser futura",
      };
    }
    // Duplicado = mismo nombre normalizado (sin tildes/mayúsculas) en la misma
    // categoría, excluyendo el propio equipo al editar.
    const duplicate = equipment.some(
      (e) =>
        e.id !== excludeId &&
        normalizeName(e.name) === normalizeName(name) &&
        e.category === data.category,
    );
    if (duplicate) {
      return {
        ok: false,
        error: "Ya existe un equipo con ese nombre en la categoría",
      };
    }
    return { ok: true };
  };

  /** Agrega un equipo validado con id nuevo. Devuelve el item creado. */
  const addEquipment = (
    newEquipment: Omit<EquipmentItem, "id">,
  ): Result & { item?: EquipmentItem } => {
    const check = validate(newEquipment);
    if (!check.ok) return check;
    const item: EquipmentItem = withHistory(
      {
        ...newEquipment,
        id: newId(),
        name: newEquipment.name.trim(),
        quantity: Number(newEquipment.quantity),
      },
      newEquipment.lastMaintenance,
    );
    setEquipment((prev) => [...prev, item]);
    return { ok: true, item };
  };

  /** Actualiza parcialmente un equipo; revalida el resultado combinado. */
  const updateEquipment = (
    id: EquipmentItem["id"],
    updates: Partial<EquipmentItem>,
  ): Result => {
    const current = equipment.find((e) => e.id === id);
    if (!current) return { ok: false, error: "Equipo no encontrado" };
    const merged = { ...current, ...updates };
    const check = validate(merged, id);
    if (!check.ok) return check;
    setEquipment((prev) =>
      prev.map((item) =>
        item.id === id
          ? withHistory(
              {
                ...merged,
                id,
                name: merged.name.trim(),
                quantity: Number(merged.quantity),
              },
              merged.lastMaintenance,
            )
          : item,
      ),
    );
    return { ok: true };
  };

  /**
   * Importa equipos desde un JSON (arreglo o `{ equipment: [] }`). Cada ítem se
   * valida como en el alta; inválidos y duplicados se omiten y se cuentan.
   */
  const importEquipment = (
    data: unknown,
    dryRun = false,
  ): Result & { added?: number; skipped?: number } => {
    const list = Array.isArray(data)
      ? data
      : (data as { equipment?: unknown })?.equipment;
    if (!Array.isArray(list)) {
      return { ok: false, error: "El archivo no tiene un formato válido" };
    }
    const accepted: EquipmentItem[] = [];
    let skipped = 0;
    list.forEach((raw) => {
      const r = (raw ?? {}) as Partial<EquipmentItem>;
      const candidate = {
        name: String(r.name ?? ""),
        category: String(r.category ?? ""),
        status: r.status ? String(r.status) : "Disponible",
        quantity: Number(r.quantity ?? 1),
        lastMaintenance: r.lastMaintenance ?? todayLocal(),
      };
      const dup = [...equipment, ...accepted].some(
        (e) =>
          normalizeName(e.name) === normalizeName(candidate.name) &&
          e.category === candidate.category,
      );
      if (dup || !validate(candidate).ok) {
        skipped += 1;
        return;
      }
      accepted.push(
        withHistory(
          { ...candidate, id: newId(), name: candidate.name.trim() },
          candidate.lastMaintenance,
        ),
      );
    });
    if (accepted.length > 0 && !dryRun) {
      setEquipment((prev) => [...prev, ...accepted]);
    }
    return { ok: true, added: accepted.length, skipped };
  };

  /**
   * Aplica `status` y/o `lastMaintenance` a varios equipos a la vez. Valida el
   * estado y que la fecha no sea futura; devuelve cuántos se modificaron.
   */
  const updateMany = (
    ids: Array<EquipmentItem["id"]>,
    updates: { status?: string; lastMaintenance?: string },
  ): Result & { updated?: number } => {
    if (
      updates.status &&
      !(EQUIPMENT_STATUSES as readonly string[]).includes(updates.status)
    ) {
      return { ok: false, error: "Estado inválido" };
    }
    if (
      updates.lastMaintenance &&
      new Date(`${updates.lastMaintenance}T00:00:00`).getTime() > Date.now()
    ) {
      return {
        ok: false,
        error: "La fecha de mantenimiento no puede ser futura",
      };
    }
    const target = new Set(ids);
    const updated = equipment.filter((e) => target.has(e.id)).length;
    setEquipment((prev) =>
      prev.map((e) =>
        target.has(e.id)
          ? withHistory({ ...e, ...updates }, updates.lastMaintenance)
          : e,
      ),
    );
    return { ok: true, updated };
  };

  /** Elimina un equipo por id (sin confirmación; la pide la UI). */
  const deleteEquipment = (id: EquipmentItem["id"]) => {
    setEquipment((prev) => prev.filter((item) => item.id !== id));
  };

  /** Reinserta un equipo eliminado (conserva su id); ignora si ya existe. */
  const restoreEquipment = (item: EquipmentItem) =>
    setEquipment((prev) =>
      prev.some((e) => e.id === item.id) ? prev : [...prev, item],
    );

  /** Conteos por estado más equipos con mantenimiento vencido. */
  const getEquipmentStats = () => {
    const available = equipment.filter((e) => e.status === "Disponible").length;
    const maintenance = equipment.filter(
      (e) => e.status === "Mantenimiento",
    ).length;
    const outOfService = equipment.filter(
      (e) => e.status === "Fuera de servicio",
    ).length;
    const overdue = equipment.filter(isMaintenanceOverdue).length;
    return {
      available,
      maintenance,
      outOfService,
      overdue,
      total: equipment.length,
    };
  };

  return {
    equipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    restoreEquipment,
    importEquipment,
    updateMany,
    getEquipmentStats,
  };
};

// Equipamiento inicial (se usa solo si localStorage no tiene "crm_equipment")
function getInitialEquipment() {
  return [
    {
      id: 1,
      name: "Barra Olímpica",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 5,
      lastMaintenance: "2026-01-15",
    },
    {
      id: 2,
      name: "Mancuernas 5-50kg",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 10,
      lastMaintenance: "2026-02-01",
    },
    {
      id: 3,
      name: "Rack Sentadilla",
      category: "Máquinas",
      status: "Disponible",
      quantity: 2,
      lastMaintenance: "2026-01-20",
    },
    {
      id: 4,
      name: "Cinta de Correr",
      category: "Cardio",
      status: "Mantenimiento",
      quantity: 8,
      lastMaintenance: "2026-02-15",
    },
    {
      id: 5,
      name: "Bicicleta Estática",
      category: "Cardio",
      status: "Disponible",
      quantity: 10,
      lastMaintenance: "2026-02-10",
    },
    {
      id: 6,
      name: "Banco Plano",
      category: "Bancos",
      status: "Disponible",
      quantity: 6,
      lastMaintenance: "2026-01-25",
    },
    {
      id: 7,
      name: "Banco Inclinado",
      category: "Bancos",
      status: "Disponible",
      quantity: 4,
      lastMaintenance: "2026-01-25",
    },
    {
      id: 8,
      name: "Polea Alta/Baja",
      category: "Poleas",
      status: "Disponible",
      quantity: 3,
      lastMaintenance: "2026-02-05",
    },
    {
      id: 9,
      name: "Kettlebells",
      category: "Pesas Libres",
      status: "Disponible",
      quantity: 15,
      lastMaintenance: "2026-02-01",
    },
    {
      id: 10,
      name: "TRX",
      category: "Funcional",
      status: "Disponible",
      quantity: 6,
      lastMaintenance: "2026-01-30",
    },
  ];
}
