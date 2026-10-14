// Saneamiento de los campos numéricos/texto del editor de gimnasio.
export const sanitizeExerciseField = (field: string, raw: unknown) => {
  const value = String(raw ?? "");
  switch (field) {
    case "series":
    case "restVal":
      return value.replace(/\D/g, "").slice(0, field === "series" ? 2 : 4);
    case "weight": {
      const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
      const [int = "", ...rest] = cleaned.split(".");
      const dec = rest.join("").slice(0, 2);
      const head = int.slice(0, 4);
      return rest.length > 0 ? `${head}.${dec}` : head;
    }
    case "reps":
      // 10, 8-12, 5/3/1, 10+, 3x10
      return value.replace(/[^0-9\-/+xX ]/g, "").slice(0, 12);
    case "name":
      return value.slice(0, 80);
    default:
      return value;
  }
};
