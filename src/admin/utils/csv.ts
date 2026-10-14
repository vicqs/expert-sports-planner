/**
 * csv - utilidades para exportar tablas a CSV desde el panel Admin.
 *
 * Escapa celdas (comillas dobles y prefijo anti-inyección de fórmulas) y
 * descarga el archivo con BOM UTF-8 para que Excel muestre bien las tildes.
 */

/** Escapa una celda CSV; neutraliza valores que empiezan con = + - @. */
export const csvCell = (value: string | number | null | undefined): string => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

/** Construye el contenido CSV (encabezado + filas). */
export const buildCsv = (
  header: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string =>
  "\uFEFF" +
  [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

/** Descarga `content` como archivo CSV con el nombre indicado. */
export const downloadCsv = (filename: string, content: string) => {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
