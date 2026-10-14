/** Clave con la fecha ISO del último respaldo exportado desde Configuración. */
export const LAST_BACKUP_KEY = "admin_last_backup_at";
/** Días sin respaldo a partir de los cuales el Panel General avisa. */
export const BACKUP_STALE_DAYS = 14;

/** Días desde el último respaldo, o null si nunca se hizo. */
export const daysSinceBackup = (): number | null => {
  const raw = localStorage.getItem(LAST_BACKUP_KEY);
  if (!raw) return null;
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
};
