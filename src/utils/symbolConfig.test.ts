import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_SYMBOLS,
  loadSymbols,
  saveSymbols,
  resetSymbols,
  sanitizeSymbols,
  buildLegend,
} from "./symbolConfig";

describe("leyenda de sesión", () => {
  it("incluye solo los símbolos usados, sin duplicados", () => {
    const symbols = [
      { id: "a", name: "Fuerte", insert: "F.", meaning: "Esfuerzo fuerte" },
      { id: "b", name: "Mi cambio", insert: " ~ ", meaning: "Cambia" },
      { id: "c", name: "Otro F", insert: "F.", meaning: "dup" },
      { id: "d", name: "No usado", insert: "ZZ", meaning: "" },
    ];
    const legend = buildLegend(["5 [3' F. ~ 2']", null], symbols);
    expect(legend.map((l) => l.symbol)).toEqual(["F.", "~"]);
    expect(legend[0].meaning).toBe("Esfuerzo fuerte");
  });
});

describe("simbología del entrenador", () => {
  beforeEach(() => localStorage.clear());

  it("usa los valores por defecto si no hay configuración", () => {
    expect(loadSymbols("t1")).toEqual(DEFAULT_SYMBOLS);
  });

  it("guarda por entrenador sin afectar a otros", () => {
    saveSymbols("t1", [{ id: "a", name: "Mío", insert: "Z", meaning: "x" }]);
    expect(loadSymbols("t1")).toHaveLength(1);
    expect(loadSymbols("t2")).toEqual(DEFAULT_SYMBOLS);
  });

  it("descarta entradas vacías y recorta longitudes", () => {
    const out = sanitizeSymbols([
      { name: "  ", insert: "X" },
      { name: "Ok", insert: " " },
      {
        name: "N".repeat(50),
        insert: "Y".repeat(30),
        meaning: "m".repeat(200),
      },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].name).toHaveLength(20);
    expect(out[0].insert).toHaveLength(12);
    expect(out[0].meaning).toHaveLength(80);
  });

  it("conserva espacios del símbolo y tolera JSON corrupto", () => {
    saveSymbols("t1", [{ id: "p", name: "Sumar", insert: " + ", meaning: "" }]);
    expect(loadSymbols("t1")[0].insert).toBe(" + ");
    localStorage.setItem("trainerSymbols:t3", "{mal");
    expect(loadSymbols("t3")).toEqual(DEFAULT_SYMBOLS);
  });

  it("restaurar vuelve a los valores por defecto", () => {
    saveSymbols("t1", [{ id: "a", name: "Mío", insert: "Z", meaning: "" }]);
    resetSymbols("t1");
    expect(loadSymbols("t1")).toEqual(DEFAULT_SYMBOLS);
  });
});
