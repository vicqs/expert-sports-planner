// Validaciones compartidas

/** Solo permite URLs https (evita javascript:, data:, http inseguro). */
export const isSafeHttpsUrl = (value?: string | null): boolean => {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

/** Normaliza un nombre para compararlo (trim, espacios y mayúsculas). */
export const normalizeName = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

/** Un id estable y único (no colisiona como Date.now()). */
export const newId = (): string => crypto.randomUUID();
