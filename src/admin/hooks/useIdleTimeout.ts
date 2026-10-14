/**
 * useIdleTimeout - cierra la sesión tras un periodo sin actividad.
 *
 * Lo usa: AdminDashboard. Escucha eventos de usuario (mouse, teclado, touch,
 * scroll) y reinicia el contador. Avisa 1 minuto antes y luego llama a
 * `onTimeout`. Duración: localStorage["admin_idle_minutes"] (entero 1-480,
 * por defecto 30; 0 desactiva).
 */
import { useEffect, useRef } from "react";

export const IDLE_MINUTES_KEY = "admin_idle_minutes";
const DEFAULT_MINUTES = 30;
const WARN_BEFORE_MS = 60_000;
const EVENTS = ["mousedown", "keydown", "touchstart", "scroll"] as const;

/** Minutos de inactividad configurados (0 = desactivado). */
export const getIdleMinutes = (): number => {
  const raw = Number(localStorage.getItem(IDLE_MINUTES_KEY));
  if (localStorage.getItem(IDLE_MINUTES_KEY) === null) return DEFAULT_MINUTES;
  if (!Number.isInteger(raw) || raw < 0 || raw > 480) return DEFAULT_MINUTES;
  return raw;
};

export const useIdleTimeout = (onWarn: () => void, onTimeout: () => void) => {
  const warnRef = useRef(onWarn);
  const timeoutRef = useRef(onTimeout);
  warnRef.current = onWarn;
  timeoutRef.current = onTimeout;

  useEffect(() => {
    const minutes = getIdleMinutes();
    if (minutes === 0) return;
    const total = minutes * 60_000;
    let warnTimer: ReturnType<typeof setTimeout>;
    let endTimer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(warnTimer);
      clearTimeout(endTimer);
      if (total > WARN_BEFORE_MS) {
        warnTimer = setTimeout(() => warnRef.current(), total - WARN_BEFORE_MS);
      }
      endTimer = setTimeout(() => timeoutRef.current(), total);
    };

    reset();
    EVENTS.forEach((ev) =>
      window.addEventListener(ev, reset, { passive: true }),
    );
    return () => {
      clearTimeout(warnTimer);
      clearTimeout(endTimer);
      EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, []);
};
