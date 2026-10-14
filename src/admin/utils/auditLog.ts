/**
 * Registro local de acciones del administrador (sin backend).
 *
 * Responsabilidad: guardar/leer/borrar la bitácora de auditoría.
 * Lo usan: ExerciseDatabase, EquipmentManager, UserManagement, Overview,
 * OverviewInsights y SystemSettings.
 * Toca: localStorage["admin_audit_log"]; emite AUDIT_CHANGED_EVENT tras
 * cada escritura para que las vistas se refresquen.
 * Se conservan solo las últimas MAX_ENTRIES entradas (más reciente primero).
 */

const AUDIT_KEY = "admin_audit_log";
const MAX_ENTRIES = 1000;
/** Evento emitido en window cuando la bitácora cambia. */
export const AUDIT_CHANGED_EVENT = "admin-audit:changed";
/** Evento emitido cuando no se pudo guardar una entrada (p. ej. cuota llena). */
export const AUDIT_ERROR_EVENT = "admin-audit:error";

/** Entrada de la bitácora. `at` es fecha ISO; `detail` es opcional. */
export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail?: string;
}

/**
 * Lee la bitácora. Devuelve [] si no existe o los datos están corruptos.
 */
export const getAuditLog = (): AuditEntry[] => {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Agrega una entrada al inicio de la bitácora y emite AUDIT_CHANGED_EVENT.
 *
 * @param actor Identificador del admin (p. ej. email) que ejecuta la acción.
 * @param action Nombre corto de la acción.
 * @param detail Información adicional opcional.
 */
export const logAdminAction = (
  actor: string,
  action: string,
  detail?: string,
) => {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    actor,
    action,
    detail,
  };
  const next = [entry, ...getAuditLog()].slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(AUDIT_CHANGED_EVENT));
  } catch (error) {
    console.error("No se pudo guardar el registro de auditoría:", error);
    window.dispatchEvent(new Event(AUDIT_ERROR_EVENT));
  }
};

/** Borra toda la bitácora y emite AUDIT_CHANGED_EVENT. */
export const clearAuditLog = () => {
  localStorage.removeItem(AUDIT_KEY);
  window.dispatchEvent(new Event(AUDIT_CHANGED_EVENT));
};
