import { describe, it, expect } from "vitest";
import { sanitizeExerciseField } from "./exerciseInput";

describe("sanitizeExerciseField", () => {
  it("series y descanso solo aceptan enteros", () => {
    expect(sanitizeExerciseField("series", "e4-")).toBe("4");
    expect(sanitizeExerciseField("series", "123")).toBe("12");
    expect(sanitizeExerciseField("restVal", "6a0")).toBe("60");
  });
  it("peso acepta decimales validos", () => {
    expect(sanitizeExerciseField("weight", "e")).toBe("");
    expect(sanitizeExerciseField("weight", "22,555")).toBe("22.55");
    expect(sanitizeExerciseField("weight", "1.2.3")).toBe("1.23");
  });
  it("reps solo acepta formatos de repeticiones", () => {
    expect(sanitizeExerciseField("reps", "asd")).toBe("");
    expect(sanitizeExerciseField("reps", "10-12")).toBe("10-12");
    expect(sanitizeExerciseField("reps", "3x10")).toBe("3x10");
  });
});
