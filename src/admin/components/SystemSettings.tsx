/**
 * SystemSettings - Configuración del sistema (vista Admin).
 *
 * Responsabilidad: duración del trial de nuevos registros, respaldo y
 * restauración de datos, datos de la cuenta admin, registro de actividad
 * (auditoría), tema claro/oscuro e información de la app.
 * Lo usa: AdminDashboard (vista "settings").
 * Toca: localStorage (todas las claves en respaldo/restauración excepto las
 * excluidas), "admin_trial_days" vía setTrialDays, "admin_audit_log" y su
 * evento AUDIT_CHANGED_EVENT, y el tema vía useTheme.
 * Efectos: descarga de archivo, toasts y recarga de página al restaurar.
 */
import React, { useState, useEffect, useRef } from "react";
import { Card, ConfirmDialog, useToast } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import {
  getTrialDays,
  setTrialDays,
  adminChangeOwnPassword,
  getAllUsers,
  ADMIN_MIN_PASSWORD_LENGTH,
} from "@/utils/auth";
import { STORAGE_KEYS } from "@/utils/storage";
import { IDLE_MINUTES_KEY, getIdleMinutes } from "@/admin/hooks/useIdleTimeout";
import { LAST_BACKUP_KEY } from "@/admin/utils/backupInfo";
import {
  Moon,
  Sun,
  Mail,
  User,
  Shield,
  Info,
  Lock,
  History,
  Trash2,
  Clock,
  Download,
  Upload,
} from "lucide-react";
import {
  getAuditLog,
  clearAuditLog,
  logAdminAction,
  AUDIT_CHANGED_EVENT,
  type AuditEntry,
} from "@/admin/utils/auditLog";
import { buildCsv, downloadCsv } from "@/admin/utils/csv";
import "@/admin/styles/settings.css";
import "@/admin/styles/admin-extras.css";

// Claves que nunca se exportan ni se restauran (sesión y bloqueos locales):
// evita suplantar sesiones o borrar el bloqueo por intentos fallidos.
const BACKUP_EXCLUDED = new Set(["currentUser", "login_attempts"]);
// Tamaño máximo aceptado del archivo de respaldo
const BACKUP_MAX_BYTES = 10 * 1024 * 1024;
// Claves con datos operativos (planes, reservas, citas, solicitudes). No
// incluyen usuarios ni catálogos.
const OPERATIONAL_KEYS = [
  STORAGE_KEYS.CLIENTS,
  STORAGE_KEYS.GYM_AVAILABILITY,
  STORAGE_KEYS.GYM_BOOKINGS,
  STORAGE_KEYS.APPOINTMENTS,
  STORAGE_KEYS.APPOINTMENT_AVAILABILITY,
  "athleteRequests",
];

/** Celda CSV segura (comillas escapadas y sin fórmulas). */
/**
 * Puntaje de fortaleza 0-4: longitud >= 10, minúsculas y mayúsculas, números
 * y símbolos/longitud >= 14. Se exige >= 3 para cambiar la contraseña.
 */
const passwordScore = (pwd: string): number => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 10) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/\d/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 14) s++;
  return s;
};

/**
 * Configuración real pero acotada al alcance actual de la app (no hay
 * backend): trial, respaldo, datos de la cuenta de administrador, auditoría,
 * preferencia de tema y versión del sistema. No recibe props.
 */
const SystemSettings = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [audit, setAudit] = useState<AuditEntry[]>(() => getAuditLog());
  // Texto del input (solo dígitos); se convierte a número al guardar
  const [trialInput, setTrialInput] = useState(String(getTrialDays()));
  const [idleInput, setIdleInput] = useState(String(getIdleMinutes()));
  // Respaldo ya validado a la espera de que el admin confirme la restauración
  const [pendingRestore, setPendingRestore] = useState<Record<
    string,
    string
  > | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [auditFilter, setAuditFilter] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [confirmResetOps, setConfirmResetOps] = useState(false);
  const [auditLimit, setAuditLimit] = useState(100);

  /** Resuelve el id del actor a un nombre legible (o el id si ya no existe). */
  const actorNames = new Map(
    getAllUsers().map((u) => [u.id, u.name || u.email || u.id]),
  );
  const actorLabel = (id: string) => actorNames.get(id) ?? id;

  const auditActions = Array.from(new Set(audit.map((e) => e.action))).sort();
  const filteredAudit = audit.filter((e) => {
    const term = auditFilter.trim().toLowerCase();
    const day = e.at.slice(0, 10);
    if (auditAction && e.action !== auditAction) return false;
    if (auditFrom && day < auditFrom) return false;
    if (auditTo && day > auditTo) return false;
    return (
      !term ||
      e.action.toLowerCase().includes(term) ||
      actorLabel(e.actor).toLowerCase().includes(term) ||
      (e.detail ?? "").toLowerCase().includes(term)
    );
  });

  const pwdScore = passwordScore(pwdNew);

  /** Cambia la contraseña del admin (valida la actual y la política). */
  const changeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdNew !== pwdConfirm) {
      addToast("La confirmación no coincide", "error");
      return;
    }
    if (pwdScore < 3) {
      addToast(
        "La contraseña es débil: usa mayúsculas, minúsculas y números",
        "error",
      );
      return;
    }
    setPwdBusy(true);
    try {
      await adminChangeOwnPassword(
        currentUser?.id as string,
        pwdCurrent,
        pwdNew,
      );
      logAdminAction(
        currentUser?.id || "admin",
        "Contraseña de admin cambiada",
      );
      addToast("Contraseña actualizada", "success");
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setPwdBusy(false);
    }
  };

  /** Descarga la bitácora (la filtrada) como CSV. */
  const exportAuditCsv = () => {
    downloadCsv(
      `bitacora-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(
        ["Fecha", "Actor", "Acción", "Detalle"],
        filteredAudit.map((e) => [
          e.at,
          actorLabel(e.actor),
          e.action,
          e.detail ?? "",
        ]),
      ),
    );
    addToast(`${filteredAudit.length} registro(s) exportados`, "success");
  };

  /** Borra los datos operativos y recarga; conserva usuarios y catálogos. */
  const resetOperationalData = () => {
    exportBackup("respaldo-previo");
    OPERATIONAL_KEYS.forEach((k) => localStorage.removeItem(k));
    logAdminAction(
      currentUser?.id || "admin",
      "Datos operativos restablecidos",
    );
    setConfirmResetOps(false);
    window.location.reload();
  };

  useEffect(() => {
    const refresh = () => setAudit(getAuditLog());
    window.addEventListener(AUDIT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(AUDIT_CHANGED_EVENT, refresh);
  }, []);

  /**
   * Guarda la duración del trial. setTrialDays valida el rango y lanza error
   * si es inválido; se informa por toast y se audita.
   */
  const saveTrialDays = () => {
    try {
      setTrialDays(Number(trialInput));
      logAdminAction(
        currentUser?.id || "admin",
        "Duración de trial actualizada",
        `${trialInput} días`,
      );
      addToast("Duración del trial guardada", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  };

  /** Guarda los minutos de inactividad (0 desactiva, máx. 480). */
  const saveIdleMinutes = () => {
    const n = Number(idleInput);
    if (idleInput === "" || !Number.isInteger(n) || n < 0 || n > 480) {
      addToast("Indica un entero entre 0 y 480 minutos", "error");
      return;
    }
    localStorage.setItem(IDLE_MINUTES_KEY, String(n));
    logAdminAction(
      currentUser?.id || "admin",
      "Inactividad de sesión actualizada",
      n === 0 ? "desactivada" : `${n} min`,
    );
    addToast("Guardado. Se aplica en la próxima sesión del panel", "success");
  };

  /**
   * Descarga un JSON `{ version, at, data }` con todas las claves de
   * localStorage salvo BACKUP_EXCLUDED. Incluye hashes de contraseña, por eso
   * la UI advierte que debe guardarse en un lugar seguro.
   */
  const exportBackup = (prefix = "respaldo") => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !BACKUP_EXCLUDED.has(key)) {
        data[key] = localStorage.getItem(key) ?? "";
      }
    }
    const blob = new Blob(
      [JSON.stringify({ version: 1, at: new Date().toISOString(), data })],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    logAdminAction(currentUser?.id || "admin", "Respaldo exportado");
    addToast("Respaldo descargado", "success");
  };

  /**
   * Lee y valida el archivo de respaldo elegido (tamaño, version === 1,
   * `data` objeto plano con valores string). No escribe nada: deja el respaldo
   * en `pendingRestore` hasta que el admin confirme.
   */
  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > BACKUP_MAX_BYTES) {
      addToast("El archivo es demasiado grande", "error");
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      const data = parsed?.data;
      if (
        parsed?.version !== 1 ||
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        !Object.values(data).every((v) => typeof v === "string")
      ) {
        throw new Error("invalid");
      }
      setPendingRestore(data as Record<string, string>);
    } catch {
      addToast("Archivo de respaldo inválido", "error");
    }
  };

  /**
   * Aplica el respaldo confirmado: sobrescribe las claves (sin las excluidas,
   * aunque el archivo las traiga), audita y recarga la página para que todos
   * los hooks lean los datos restaurados.
   */
  const confirmRestore = () => {
    if (!pendingRestore) return;
    try {
      Object.entries(pendingRestore).forEach(([k, v]) => {
        if (!BACKUP_EXCLUDED.has(k)) localStorage.setItem(k, v);
      });
      logAdminAction(currentUser?.id || "admin", "Respaldo restaurado");
      window.location.reload();
    } catch {
      addToast("No se pudo restaurar el respaldo", "error");
    }
    setPendingRestore(null);
  };

  return (
    <div className="admin-settings">
      <div className="section-header">
        <h2>Configuración del Sistema</h2>
      </div>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Clock size={18} /> Trial de nuevos registros
        </h3>
        <div className="settings-row">
          <label className="settings-row-label" htmlFor="trial-days">
            Duración (días)
          </label>
          <span className="settings-row-value">
            <input
              id="trial-days"
              inputMode="numeric"
              maxLength={3}
              style={{ width: 80, fontSize: 16, minHeight: 44 }}
              value={trialInput}
              onChange={(e) => setTrialInput(e.target.value.replace(/\D/g, ""))}
            />{" "}
            <button
              type="button"
              className="admin-btn tap-ripple"
              onClick={saveTrialDays}
            >
              Guardar
            </button>
          </span>
        </div>
        <p className="settings-row-label">
          Aplica solo a cuentas nuevas; los trials existentes no cambian (usa
          &ldquo;Extender&rdquo; en Usuarios).
        </p>
      </Card>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Lock size={18} /> Cierre por inactividad
        </h3>
        <div className="settings-row">
          <label className="settings-row-label" htmlFor="idle-minutes">
            Minutos (0 = desactivado)
          </label>
          <span className="settings-row-value">
            <input
              id="idle-minutes"
              inputMode="numeric"
              maxLength={3}
              style={{ width: 80, fontSize: 16, minHeight: 44 }}
              value={idleInput}
              onChange={(e) => setIdleInput(e.target.value.replace(/\D/g, ""))}
            />{" "}
            <button
              type="button"
              className="admin-btn tap-ripple"
              onClick={saveIdleMinutes}
            >
              Guardar
            </button>
          </span>
        </div>
        <p className="settings-row-label">
          Cierra la sesión del panel tras este tiempo sin actividad y avisa un
          minuto antes.
        </p>
      </Card>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Download size={18} /> Respaldo de datos
        </h3>
        <p className="settings-row-label">
          Incluye usuarios (con sus hashes de contraseña), planes y catálogos.
          Guárdalo en un lugar seguro.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="admin-btn tap-ripple"
            onClick={() => exportBackup()}
          >
            <Download size={16} /> Exportar
          </button>
          <button
            type="button"
            className="admin-btn tap-ripple"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={16} /> Restaurar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            style={{ display: "none" }}
            aria-hidden="true"
            tabIndex={-1}
            onChange={onPickFile}
          />
        </div>
      </Card>

      <ConfirmDialog
        isOpen={!!pendingRestore}
        onClose={() => setPendingRestore(null)}
        onConfirm={confirmRestore}
        title="Restaurar respaldo"
        message="Se sobrescribirán los datos actuales con los del archivo y la app se recargará. ¿Continuar?"
        confirmText="Restaurar"
        cancelText="Cancelar"
        variant="danger"
      />

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Shield size={18} /> Cuenta de Administrador
        </h3>
        <div className="settings-row">
          <span className="settings-row-label">
            <User size={16} /> Nombre
          </span>
          <span className="settings-row-value">{currentUser?.name}</span>
        </div>
        {currentUser?.email && (
          <div className="settings-row">
            <span className="settings-row-label">
              <Mail size={16} /> Email
            </span>
            <span className="settings-row-value">{currentUser.email}</span>
          </div>
        )}
      </Card>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Lock size={18} /> Seguridad
        </h3>
        <form onSubmit={changeAdminPassword} autoComplete="off">
          {(
            [
              [
                "Contraseña actual",
                pwdCurrent,
                setPwdCurrent,
                "current-password",
              ],
              ["Nueva contraseña", pwdNew, setPwdNew, "new-password"],
              ["Confirmar nueva", pwdConfirm, setPwdConfirm, "new-password"],
            ] as [string, string, (v: string) => void, string][]
          ).map(([label, value, setter, ac]) => (
            <div className="settings-row" key={label}>
              <label className="settings-row-label">
                {label}
                <input
                  type="password"
                  autoComplete={ac}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  required
                  style={{ display: "block", fontSize: 16, minHeight: 44 }}
                />
              </label>
            </div>
          ))}
          <p className="settings-row-label" aria-live="polite">
            Fortaleza:{" "}
            <strong>
              {pwdNew
                ? ["muy débil", "débil", "aceptable", "buena", "fuerte"][
                    pwdScore
                  ]
                : "—"}
            </strong>{" "}
            (mínimo: buena, con mayúsculas, minúsculas y números).
          </p>
          <p className="settings-row-label">
            Mínimo {ADMIN_MIN_PASSWORD_LENGTH} caracteres. El cambio se aplica a
            este navegador; si cambias el hash en la configuración del
            despliegue (variables de entorno), ese valor prevalece.
          </p>
          <button
            type="submit"
            className="admin-btn tap-ripple"
            disabled={pwdBusy}
          >
            Cambiar contraseña
          </button>
        </form>
        <div className="settings-row">
          <span className="settings-row-label">Protección de acceso</span>
          <span className="settings-row-value">
            Bloqueo temporal tras 5 intentos fallidos
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Almacenamiento</span>
          <span className="settings-row-value">
            Contraseñas con PBKDF2 y sal (los hashes antiguos se migran al
            iniciar sesión)
          </span>
        </div>
      </Card>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Trash2 size={18} /> Datos operativos
        </h3>
        <p className="settings-row-label">
          Borra planes, reservas de gimnasio, citas y solicitudes. Conserva
          usuarios y catálogos. Se descarga un respaldo automáticamente antes de
          borrar.
        </p>
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={() => setConfirmResetOps(true)}
        >
          <Trash2 size={16} /> Restablecer datos operativos
        </button>
      </Card>

      <ConfirmDialog
        isOpen={confirmResetOps}
        onClose={() => setConfirmResetOps(false)}
        onConfirm={resetOperationalData}
        title="Restablecer datos operativos"
        message="Se eliminarán planes, reservas, citas y solicitudes de todos los usuarios. Esta acción no se puede deshacer."
        confirmText="Restablecer"
        cancelText="Cancelar"
        variant="danger"
      />

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <History size={18} /> Registro de actividad
        </h3>
        {audit.length === 0 ? (
          <p className="settings-row-label">Sin actividad registrada</p>
        ) : (
          <>
            <div className="admin-filters">
              <input
                type="search"
                aria-label="Filtrar registro de actividad"
                placeholder="Filtrar por acción o detalle..."
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                style={{ fontSize: 16, minHeight: 44, flex: 1 }}
              />
              <span className="admin-filters-count">
                {filteredAudit.length} de {audit.length}
              </span>
            </div>
            <div className="admin-filters">
              <select
                className="admin-select"
                aria-label="Filtrar por tipo de acción"
                value={auditAction}
                onChange={(e) => setAuditAction(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                {auditActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <label>
                Desde{" "}
                <input
                  type="date"
                  value={auditFrom}
                  onChange={(e) => setAuditFrom(e.target.value)}
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </label>
              <label>
                Hasta{" "}
                <input
                  type="date"
                  value={auditTo}
                  onChange={(e) => setAuditTo(e.target.value)}
                  style={{ fontSize: 16, minHeight: 44 }}
                />
              </label>
            </div>
            <ul className="audit-list">
              {filteredAudit.slice(0, auditLimit).map((entry) => (
                <li key={entry.id} className="audit-item">
                  <strong>{entry.action}</strong>
                  <span>
                    {actorLabel(entry.actor)}
                    {entry.detail ? ` — ${entry.detail}` : ""}
                  </span>
                  <time dateTime={entry.at}>
                    {new Date(entry.at).toLocaleString("es-ES")}
                  </time>
                </li>
              ))}
            </ul>
            {filteredAudit.length > auditLimit && (
              <button
                type="button"
                className="admin-btn tap-ripple"
                onClick={() => setAuditLimit((n) => n + 100)}
              >
                Ver más ({filteredAudit.length - auditLimit})
              </button>
            )}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-btn tap-ripple"
                onClick={exportAuditCsv}
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button
                type="button"
                className="admin-btn tap-ripple"
                onClick={clearAuditLog}
              >
                <Trash2 size={16} /> Limpiar registro
              </button>
            </div>
          </>
        )}
      </Card>

      <Card
        className="settings-card settings-row-button tap-ripple"
        onClick={toggleTheme}
        role="button"
        tabIndex={0}
        aria-pressed={isDark}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleTheme();
          }
        }}
      >
        <span className="settings-row-label">
          {isDark ? <Moon size={16} /> : <Sun size={16} />} Tema
        </span>
        <span className="settings-row-value">
          {isDark ? "Oscuro" : "Claro"}
        </span>
      </Card>

      <Card className="settings-card">
        <h3 className="settings-card-title">
          <Info size={18} /> Acerca de
        </h3>
        <div className="settings-row">
          <span className="settings-row-label">Aplicación</span>
          <span className="settings-row-value">Expert Sports Planner</span>
        </div>
        <div className="settings-row">
          <span className="settings-row-label">Entorno</span>
          <span className="settings-row-value">
            {import.meta.env.DEV ? "Desarrollo" : "Producción"}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default SystemSettings;
