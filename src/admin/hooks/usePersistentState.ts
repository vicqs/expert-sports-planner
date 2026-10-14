/**
 * usePersistentState - estado React respaldado por localStorage.
 *
 * Responsabilidad: persistir y sincronizar datos del panel Admin.
 * Lo usan: useEquipment y useCustomExercises.
 * Toca: la clave de localStorage recibida; emite el evento interno
 * "admin-storage:changed" (detail = clave) y escucha "storage".
 */
import { useState, useEffect, useRef } from "react";

// Evento interno: el evento nativo "storage" NO se dispara en la misma
// pestaña que escribe, por eso se emite uno propio.
const SYNC_EVENT = "admin-storage:changed";

/**
 * Estado persistido en localStorage, tolerante a datos corruptos y
 * sincronizado entre todas las instancias del hook (y entre pestañas).
 * Evita que, por ejemplo, el Panel General muestre datos obsoletos mientras
 * otra sección los edita.
 *
 * @param key Clave de localStorage.
 * @param initial Fábrica del valor por defecto (sin dato o dato inválido).
 * @param isValid Validador del JSON leído; si falla se usa `initial()`.
 * @returns Tupla `[valor, setValue]` igual que useState.
 */
export function usePersistentState<T>(
  key: string,
  initial: () => T,
  isValid: (value: unknown) => boolean = () => true,
) {
  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return initial();
      const parsed = JSON.parse(raw);
      return isValid(parsed) ? (parsed as T) : initial();
    } catch (error) {
      console.error(`Datos corruptos en localStorage (${key}):`, error);
      return initial();
    }
  };

  const [value, setValue] = useState<T>(read);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Persistir (se omite si no hay cambios para no emitir eventos en bucle)
  useEffect(() => {
    const serialized = JSON.stringify(value);
    if (localStorage.getItem(key) === serialized) return;
    try {
      localStorage.setItem(key, serialized);
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: key }));
    } catch (error) {
      console.error(`No se pudo guardar ${key}:`, error);
    }
  }, [key, value]);

  // Sincronizar con otras instancias/pestañas. valueRef evita re-suscribir
  // listeners en cada cambio de valor.
  useEffect(() => {
    const sync = () => {
      const raw = localStorage.getItem(key);
      if (raw == null || raw === JSON.stringify(valueRef.current)) return;
      try {
        const parsed = JSON.parse(raw);
        if (isValid(parsed)) setValue(parsed as T);
      } catch {
        /* ignorar datos corruptos */
      }
    };
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail === key) sync();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) sync();
    };
    window.addEventListener(SYNC_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue] as const;
}
