/**
 * searchPrefill - transporta el término elegido en la búsqueda global hacia la
 * vista destino, que lo consume una sola vez al montarse.
 * Usa sessionStorage["admin_search_prefill"] = { view, term, at }. No se borra
 * al leer (StrictMode ejecuta los inicializadores dos veces); caduca a los
 * pocos segundos para no reaparecer en navegaciones posteriores.
 */
const KEY = "admin_search_prefill";
const TTL_MS = 5_000;

/** Guarda el término para la vista indicada. */
export const setSearchPrefill = (view: string, term: string) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ view, term, at: Date.now() }));
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
};

/** Devuelve el término vigente de `view` ("" si no hay o caducó). */
export const consumeSearchPrefill = (view: string): string => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return "";
    const data = JSON.parse(raw);
    if (data?.view !== view || Date.now() - Number(data.at) > TTL_MS) {
      return "";
    }
    return typeof data.term === "string" ? data.term : "";
  } catch {
    return "";
  }
};
