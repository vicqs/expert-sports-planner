import { useCallback, useEffect, useState } from "react";

export type Sex = "M" | "F";

export interface MeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sex: Sex;
  age: number;
  values: Record<string, number>;
  notes?: string;
}

export interface MeasurementField {
  key: string;
  label: string;
  unit: string;
}

export interface MeasurementSection {
  id: string;
  title: string;
  fields: MeasurementField[];
}

export const MEASUREMENT_SECTIONS: MeasurementSection[] = [
  {
    id: "antropometricas",
    title: "Mediciones antropométricas",
    fields: [
      { key: "peso", label: "Peso", unit: "kg" },
      { key: "talla", label: "Talla", unit: "cm" },
    ],
  },
  {
    id: "diametros",
    title: "Diámetros óseos",
    fields: [
      { key: "d_muneca", label: "Muñeca", unit: "cm" },
      { key: "d_codo", label: "Codo", unit: "cm" },
      { key: "d_rodilla", label: "Rodilla", unit: "cm" },
    ],
  },
  {
    id: "circunferencias",
    title: "Circunferencias",
    fields: [
      { key: "c_torax", label: "Tórax", unit: "cm" },
      { key: "c_cintura", label: "Cintura", unit: "cm" },
      { key: "c_cadera", label: "Cadera", unit: "cm" },
      { key: "c_brazo", label: "Brazo", unit: "cm" },
      { key: "c_brazoMax", label: "Brazo máx.", unit: "cm" },
      { key: "c_muslo", label: "Muslo", unit: "cm" },
      { key: "c_pantorrilla", label: "Pantorrilla", unit: "cm" },
      { key: "c_pantorrillaMax", label: "Pantorrilla máx.", unit: "cm" },
    ],
  },
  {
    id: "pliegues",
    title: "Pliegues cutáneos",
    fields: [
      { key: "p_triceps", label: "Tríceps", unit: "mm" },
      { key: "p_biceps", label: "Bíceps", unit: "mm" },
      { key: "p_pecho", label: "Pecho", unit: "mm" },
      { key: "p_axila", label: "Axila", unit: "mm" },
      { key: "p_subescapular", label: "Subescapular", unit: "mm" },
      { key: "p_suprailiaco", label: "Suprailíaco", unit: "mm" },
      { key: "p_abdomen", label: "Abdomen", unit: "mm" },
      { key: "p_muslo", label: "Muslo", unit: "mm" },
      { key: "p_pantorrilla", label: "Pantorrilla", unit: "mm" },
    ],
  },
];

export interface MeasurementResults {
  imc: number | null;
  icc: number | null;
  conicidad: number | null;
  grasaSiri: number | null;
  grasaBrozek: number | null;
  pesoLibreGrasa: number | null;
  tmb: number | null;
}

export const RESULT_ROWS: {
  key: keyof MeasurementResults;
  label: string;
  unit: string;
  decimals: number;
}[] = [
  { key: "imc", label: "IMC", unit: "", decimals: 2 },
  { key: "conicidad", label: "Índice de conicidad", unit: "", decimals: 2 },
  { key: "icc", label: "Relación cintura/cadera", unit: "", decimals: 2 },
  { key: "grasaSiri", label: "% Grasa SIRI", unit: "%", decimals: 2 },
  { key: "grasaBrozek", label: "% Grasa BROZEK", unit: "%", decimals: 2 },
  {
    key: "pesoLibreGrasa",
    label: "Peso libre de grasa",
    unit: "kg",
    decimals: 2,
  },
  { key: "tmb", label: "Tasa metabólica basal", unit: "kcal", decimals: 2 },
];

// Durnin & Womersley (1974): densidad = c - m * log10(suma 4 pliegues)
const DW_TABLE: Record<Sex, [number, number, number][]> = {
  // [edad máxima, c, m]
  M: [
    [16, 1.1533, 0.0643],
    [19, 1.162, 0.063],
    [29, 1.1631, 0.0632],
    [39, 1.1422, 0.0544],
    [49, 1.162, 0.07],
    [200, 1.1715, 0.0779],
  ],
  F: [
    [16, 1.1369, 0.0598],
    [19, 1.1549, 0.0678],
    [29, 1.1599, 0.0717],
    [39, 1.1423, 0.0632],
    [49, 1.1333, 0.0612],
    [200, 1.1339, 0.0645],
  ],
};

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null;

export const computeResults = (entry: MeasurementEntry): MeasurementResults => {
  const v = entry.values || {};
  const peso = num(v.peso);
  const talla = num(v.talla);
  const cintura = num(v.c_cintura);
  const cadera = num(v.c_cadera);

  const imc = peso && talla ? peso / Math.pow(talla / 100, 2) : null;
  const icc = cintura && cadera ? cintura / cadera : null;
  const conicidad =
    peso && talla && cintura
      ? cintura / 100 / (0.109 * Math.sqrt(peso / (talla / 100)))
      : null;

  const folds = [
    num(v.p_biceps),
    num(v.p_triceps),
    num(v.p_subescapular),
    num(v.p_suprailiaco),
  ];
  let grasaSiri: number | null = null;
  let grasaBrozek: number | null = null;
  if (folds.every((f) => f !== null)) {
    const sum = (folds as number[]).reduce((a, b) => a + b, 0);
    const [, c, m] =
      DW_TABLE[entry.sex].find(([maxAge]) => entry.age <= maxAge) ||
      DW_TABLE[entry.sex][DW_TABLE[entry.sex].length - 1];
    const density = c - m * Math.log10(sum);
    grasaSiri = 495 / density - 450;
    grasaBrozek = 457 / density - 414.2;
  }

  const pesoLibreGrasa =
    peso && grasaSiri !== null ? peso * (1 - grasaSiri / 100) : null;

  let tmb: number | null = null;
  if (peso && talla && entry.age > 0) {
    tmb =
      entry.sex === "M"
        ? 66.473 + 13.7516 * peso + 5.0033 * talla - 6.755 * entry.age
        : 655.0955 + 9.5634 * peso + 1.8496 * talla - 4.6756 * entry.age;
  }

  return { imc, icc, conicidad, grasaSiri, grasaBrozek, pesoLibreGrasa, tmb };
};

// ---------- Persistencia (localStorage, sin backend) ----------

const STORAGE_KEY = "athlete_measurements";
export const MEASUREMENTS_CHANGED_EVENT = "measurements-changed";

const readAll = (): Record<string, MeasurementEntry[]> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const writeAll = (data: Record<string, MeasurementEntry[]>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(MEASUREMENTS_CHANGED_EVENT));
};

const sortByDate = (list: MeasurementEntry[]) =>
  [...list].sort((a, b) => a.date.localeCompare(b.date));

export const getMeasurements = (athleteId: string): MeasurementEntry[] => {
  const list = readAll()[athleteId];
  return Array.isArray(list) ? sortByDate(list) : [];
};

export const saveMeasurement = (athleteId: string, entry: MeasurementEntry) => {
  const all = readAll();
  const list = Array.isArray(all[athleteId]) ? all[athleteId] : [];
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  all[athleteId] = list;
  writeAll(all);
};

export const deleteMeasurement = (athleteId: string, entryId: string) => {
  const all = readAll();
  all[athleteId] = (all[athleteId] || []).filter((e) => e.id !== entryId);
  writeAll(all);
};

/** Borra todas las mediciones de un atleta (cascada al eliminar usuario). */
export const purgeMeasurements = (athleteId: string) => {
  const all = readAll();
  if (!(athleteId in all)) return;
  delete all[athleteId];
  writeAll(all);
};

export const useMeasurements = (athleteId: string | undefined | null) => {
  const [entries, setEntries] = useState<MeasurementEntry[]>(() =>
    athleteId ? getMeasurements(athleteId) : [],
  );

  const refresh = useCallback(() => {
    setEntries(athleteId ? getMeasurements(athleteId) : []);
  }, [athleteId]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    window.addEventListener(MEASUREMENTS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MEASUREMENTS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return entries;
};

export const parseDecimal = (raw: string): number | null => {
  const n = Number(raw.trim().replace(",", "."));
  return raw.trim() !== "" && Number.isFinite(n) ? n : null;
};

/**
 * Filtra lo escrito en un campo numérico: solo dígitos y, si se permite, un
 * único separador decimal (la coma se normaliza a punto) con hasta 2 decimales.
 */
export const sanitizeNumeric = (raw: string, allowDecimal = true): string => {
  let s = raw.replace(",", ".");
  if (!allowDecimal) return s.replace(/\D/g, "").slice(0, 3);
  s = s.replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    s = s.slice(0, dot + 3);
  }
  return s.slice(0, 7);
};

// ---------- Unidades de visualización (configurables por el entrenador) ----------
// Los datos se guardan SIEMPRE en cm / kg / mm; las unidades solo afectan
// cómo se captura y se muestra.

export type LengthUnit = "cm" | "in";
export type WeightUnit = "kg" | "lb";
export interface MeasurementUnits {
  length: LengthUnit;
  weight: WeightUnit;
}

const UNITS_KEY = "measurement_units";
export const UNITS_CHANGED_EVENT = "measurement-units-changed";
const DEFAULT_UNITS: MeasurementUnits = { length: "cm", weight: "kg" };

export const getMeasurementUnits = (): MeasurementUnits => {
  try {
    const p = JSON.parse(localStorage.getItem(UNITS_KEY) || "{}");
    return {
      length: p?.length === "in" ? "in" : "cm",
      weight: p?.weight === "lb" ? "lb" : "kg",
    };
  } catch {
    return DEFAULT_UNITS;
  }
};

export const setMeasurementUnits = (patch: Partial<MeasurementUnits>) => {
  localStorage.setItem(
    UNITS_KEY,
    JSON.stringify({ ...getMeasurementUnits(), ...patch }),
  );
  window.dispatchEvent(new Event(UNITS_CHANGED_EVENT));
};

export const useMeasurementUnits = (): MeasurementUnits => {
  const [units, setUnits] = useState<MeasurementUnits>(getMeasurementUnits);
  useEffect(() => {
    const refresh = () => setUnits(getMeasurementUnits());
    window.addEventListener(UNITS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(UNITS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return units;
};

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;

export type FieldKind = "length" | "weight" | "skin";
export const fieldKind = (key: string): FieldKind =>
  key === "peso" ? "weight" : key.startsWith("p_") ? "skin" : "length";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Valor canónico (cm/kg/mm) → valor en la unidad elegida. */
export const toDisplay = (
  value: number,
  kind: FieldKind,
  u: MeasurementUnits,
): number => {
  if (kind === "length" && u.length === "in") return round2(value / CM_PER_IN);
  if (kind === "weight" && u.weight === "lb") return round2(value / KG_PER_LB);
  return round2(value);
};

/** Valor en la unidad elegida → valor canónico (cm/kg/mm). */
export const fromDisplay = (
  value: number,
  kind: FieldKind,
  u: MeasurementUnits,
): number => {
  if (kind === "length" && u.length === "in") return round2(value * CM_PER_IN);
  if (kind === "weight" && u.weight === "lb") return round2(value * KG_PER_LB);
  return round2(value);
};

export const unitLabel = (kind: FieldKind, u: MeasurementUnits): string =>
  kind === "skin" ? "mm" : kind === "length" ? u.length : u.weight;

export const formatNumber = (n: number | null | undefined, decimals = 1) =>
  n === null || n === undefined || !Number.isFinite(n)
    ? "—"
    : n.toLocaleString("es-CR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
