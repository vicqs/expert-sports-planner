import { SYMBOLS } from "./constants";

export interface SymbolEntry {
  id: string;
  name: string;
  insert: string;
  meaning: string;
}

export const MAX_SYMBOLS = 30;
const LIMITS = { name: 20, insert: 12, meaning: 80 };

export const DEFAULT_SYMBOLS: SymbolEntry[] = [
  {
    id: "sep",
    name: "Separador",
    insert: SYMBOLS.SEPARATOR,
    meaning: "Separa bloques de la sesión",
  },
  {
    id: "prog",
    name: "Progresivo",
    insert: SYMBOLS.PROGRESSION_DOWN,
    meaning: "Ritmo que mejora de forma progresiva",
  },
  {
    id: "fast",
    name: "Más rápido",
    insert: SYMBOLS.DOWN,
    meaning: "Un poco más rápido que el ritmo base",
  },
  {
    id: "strong",
    name: "Fuerte",
    insert: SYMBOLS.STRONG,
    meaning: "Esfuerzo fuerte",
  },
  {
    id: "soft",
    name: "Suave",
    insert: SYMBOLS.SOFT,
    meaning: "Esfuerzo suave",
  },
  {
    id: "pace",
    name: "Ritmo",
    insert: SYMBOLS.PACE,
    meaning: "Seguido de un ritmo por kilómetro",
  },
  {
    id: "avg",
    name: "Promedio",
    insert: SYMBOLS.AVG,
    meaning: "Ritmo promedio del bloque",
  },
  {
    id: "change",
    name: "Cambio",
    insert: SYMBOLS.CHANGE,
    meaning: "Cambio de ritmo",
  },
  {
    id: "mrp",
    name: "Mejor ritmo",
    insert: SYMBOLS.BEST_PACE,
    meaning: "Mejor ritmo personal",
  },
  {
    id: "sprint",
    name: "Sprint",
    insert: SYMBOLS.SPRINT,
    meaning: "Esfuerzo máximo corto",
  },
  {
    id: "circuit",
    name: "Circuito",
    insert: SYMBOLS.CIRCUIT,
    meaning: "Circuito de ejercicios",
  },
  {
    id: "restS",
    name: "Desc. series",
    insert: SYMBOLS.REST_SERIES,
    meaning: "Descanso entre series",
  },
  {
    id: "restB",
    name: "Desc. bloques",
    insert: SYMBOLS.REST_BLOCK,
    meaning: "Descanso entre bloques",
  },
  {
    id: "rest30",
    name: "Desc. 30s",
    insert: SYMBOLS.REST_30_SEC,
    meaning: "Descanso de 30 segundos",
  },
  {
    id: "plus",
    name: "Sumar",
    insert: " + ",
    meaning: "Une dos partes del bloque",
  },
  {
    id: "open",
    name: "Abrir",
    insert: " [ ",
    meaning: "Abre un grupo repetido",
  },
  {
    id: "close",
    name: "Cerrar",
    insert: " ] ",
    meaning: "Cierra un grupo repetido",
  },
];

const keyFor = (userId?: string | null) =>
  `trainerSymbols:${userId || "default"}`;

/** Limpia una lista: recorta textos, descarta entradas sin nombre o símbolo. */
export const sanitizeSymbols = (list: unknown): SymbolEntry[] => {
  if (!Array.isArray(list)) return [];
  const out: SymbolEntry[] = [];
  list.forEach((raw: any, i) => {
    if (!raw || typeof raw !== "object") return;
    const name = String(raw.name ?? "")
      .trim()
      .slice(0, LIMITS.name);
    // El símbolo conserva espacios internos/laterales (p. ej. " + ")
    const insert = String(raw.insert ?? "").slice(0, LIMITS.insert);
    if (!name || !insert.trim()) return;
    out.push({
      id: String(raw.id || `custom-${Date.now()}-${i}`),
      name,
      insert,
      meaning: String(raw.meaning ?? "")
        .trim()
        .slice(0, LIMITS.meaning),
    });
  });
  return out.slice(0, MAX_SYMBOLS);
};

export const loadSymbols = (userId?: string | null): SymbolEntry[] => {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return DEFAULT_SYMBOLS;
    const clean = sanitizeSymbols(JSON.parse(raw));
    return clean.length ? clean : DEFAULT_SYMBOLS;
  } catch {
    return DEFAULT_SYMBOLS;
  }
};

export const saveSymbols = (
  userId: string | null | undefined,
  list: SymbolEntry[],
) => {
  const clean = sanitizeSymbols(list);
  localStorage.setItem(keyFor(userId), JSON.stringify(clean));
  return clean.length ? clean : DEFAULT_SYMBOLS;
};

export const resetSymbols = (userId?: string | null) => {
  localStorage.removeItem(keyFor(userId));
  return DEFAULT_SYMBOLS;
};

export interface LegendEntry {
  symbol: string;
  name: string;
  meaning: string;
}

/**
 * Leyenda de los símbolos que aparecen en los textos de una sesión. Se guarda
 * junto a la sesión para que el atleta la vea y no cambie si el entrenador
 * edita su simbología después.
 */
export const buildLegend = (
  texts: Array<string | undefined | null>,
  symbols: SymbolEntry[],
): LegendEntry[] => {
  const text = texts.filter(Boolean).join(" ");
  const seen = new Set<string>();
  const out: LegendEntry[] = [];
  symbols.forEach((s) => {
    const symbol = s.insert.trim();
    if (!symbol || seen.has(symbol) || !text.includes(symbol)) return;
    seen.add(symbol);
    out.push({ symbol, name: s.name, meaning: s.meaning });
  });
  return out;
};
