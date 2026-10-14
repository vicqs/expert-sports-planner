/**
 * OverviewInsights - tarjetas de seguimiento del Panel General.
 *
 * Responsabilidad: registros del mes, trials por vencer (con acción de
 * extender), alertas de equipamiento y actividad reciente de la bitácora.
 * Lo usa: Overview.
 * Lee: usuarios (useUsers) y bitácora localStorage "admin_audit_log".
 * Escucha: AUDIT_CHANGED_EVENT. Escribe: vía adminExtendTrial (auth.ts) y
 * logAdminAction; muestra toasts.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Card, Button, useToast } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useUsers, useCustomExercises, useEquipment } from "@/admin/hooks";
import {
  listExerciseNames,
  getExerciseMeta,
} from "@/admin/utils/exerciseIndex";
import { adminExtendTrial, ROLES } from "@/utils/auth";
import {
  AUDIT_CHANGED_EVENT,
  getAuditLog,
  logAdminAction,
} from "@/admin/utils/auditLog";
import { AlertTriangle, Clock, UserPlus } from "lucide-react";
import { BACKUP_STALE_DAYS, daysSinceBackup } from "@/admin/utils/backupInfo";

const DAY = 24 * 60 * 60 * 1000;
/** Ventana (en días) para considerar que un trial "vence pronto". */
const EXPIRING_DAYS = 7;

/**
 * Tarjetas de insights del administrador.
 *
 * @param props.stats Estadísticas de AdminDashboard (se usa `equipment`).
 * @param props.onNavigate Callback `(viewId) => void` (botón "Ver
 *   equipamiento" navega a "equipment").
 */
const OverviewInsights = ({ stats, onNavigate }) => {
  const { users } = useUsers();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  // Muestra solo las 6 acciones más recientes y se refresca al cambiar la
  // bitácora (incluidas las acciones hechas desde otras secciones).
  const [audit, setAudit] = useState(() => getAuditLog().slice(0, 6));

  useEffect(() => {
    const refresh = () => setAudit(getAuditLog().slice(0, 6));
    window.addEventListener(AUDIT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(AUDIT_CHANGED_EVENT, refresh);
  }, []);

  // expiring: trials con fin futuro dentro de la ventana, el más próximo
  // primero. newThisMonth: altas (sin admins) desde el día 1 del mes actual.
  const { expiring, newThisMonth, expired } = useMemo(() => {
    const now = Date.now();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    return {
      expired: users.filter(
        (u) => u.role !== ROLES.ADMIN && u.subscription?.status === "EXPIRED",
      ),
      expiring: users
        .filter((u) => {
          if (u.subscription?.status !== "TRIAL" || !u.subscription.trialEndsAt)
            return false;
          const end = new Date(u.subscription.trialEndsAt).getTime();
          return end > now && end - now <= EXPIRING_DAYS * DAY;
        })
        .sort(
          (a, b) =>
            new Date(a.subscription.trialEndsAt).getTime() -
            new Date(b.subscription.trialEndsAt).getTime(),
        ),
      newThisMonth: users.filter(
        (u) =>
          u.role !== ROLES.ADMIN &&
          new Date(u.createdAt).getTime() >= monthStart.getTime(),
      ).length,
    };
  }, [users]);

  // Días restantes redondeados hacia arriba; mínimo 1 para no mostrar "0 d"
  const daysLeft = (iso: string) =>
    Math.max(1, Math.ceil((new Date(iso).getTime() - Date.now()) / DAY));

  /**
   * Extiende 7 días el trial del usuario. adminExtendTrial valida que quien
   * llama sea admin; registra en la bitácora y avisa por toast.
   */
  const extend = (user) => {
    try {
      adminExtendTrial(currentUser.id, user.id, 7);
      logAdminAction(currentUser.id, "Trial extendido", `${user.name} +7 d`);
      addToast(`Trial de ${user.name} extendido 7 días`, "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  };

  const equipmentAlerts =
    (stats.equipment.maintenance || 0) +
    (stats.equipment.outOfService || 0) +
    (stats.equipment.overdue || 0);

  // Salud de datos: registros incompletos que conviene corregir
  const { customExercises, hiddenExercises, customExerciseMeta } =
    useCustomExercises();
  const { equipment } = useEquipment();
  const backupDays = daysSinceBackup();
  const health = useMemo(
    () => ({
      usersNoEmail: users.filter((u) => !u.email).length,
      equipmentNoMaintenance: equipment.filter((e) => !e.lastMaintenance)
        .length,
      exercisesNoImage: listExerciseNames(
        customExercises,
        hiddenExercises,
      ).filter((n) => !getExerciseMeta(n, customExerciseMeta)?.gifUrl).length,
    }),
    [users, equipment, customExercises, hiddenExercises, customExerciseMeta],
  );

  return (
    <div className="overview-insights">
      <Card className="insight-card">
        <h4>
          <UserPlus size={16} /> Registros del mes
        </h4>
        <p className="insight-big">{newThisMonth}</p>
        <small>Entrenadores y atletas nuevos</small>
      </Card>

      <Card className="insight-card">
        <h4>
          <Clock size={16} /> Trials por vencer ({EXPIRING_DAYS} días)
        </h4>
        {expiring.length === 0 ? (
          <small>Ningún trial vence pronto.</small>
        ) : (
          <ul className="insight-list">
            {expiring.slice(0, 5).map((u) => (
              <li key={u.id}>
                <span>
                  {u.name}{" "}
                  <small>({daysLeft(u.subscription.trialEndsAt)} d)</small>
                </span>
                <Button size="sm" variant="secondary" onClick={() => extend(u)}>
                  +7 d
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="insight-card">
        <h4>
          <AlertTriangle size={16} /> Trials vencidos
        </h4>
        {expired.length === 0 ? (
          <small>Ningún trial vencido.</small>
        ) : (
          <ul className="insight-list">
            {expired.slice(0, 5).map((u) => (
              <li key={u.id}>
                <span>{u.name}</span>
                <Button size="sm" variant="secondary" onClick={() => extend(u)}>
                  Reactivar +7 d
                </Button>
              </li>
            ))}
            {expired.length > 5 && (
              <li>
                <small>y {expired.length - 5} más en Usuarios</small>
              </li>
            )}
          </ul>
        )}
      </Card>

      <Card className="insight-card">
        <h4>
          <AlertTriangle size={16} /> Alertas de equipo
        </h4>
        {equipmentAlerts === 0 ? (
          <small>Sin alertas.</small>
        ) : (
          <ul className="insight-list">
            <li>
              <span>En mantenimiento</span>
              <strong>{stats.equipment.maintenance || 0}</strong>
            </li>
            <li>
              <span>Fuera de servicio</span>
              <strong>{stats.equipment.outOfService || 0}</strong>
            </li>
            <li>
              <span>Mantenimiento vencido</span>
              <strong>{stats.equipment.overdue || 0}</strong>
            </li>
          </ul>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate("equipment")}
        >
          Ver equipamiento
        </Button>
      </Card>

      <Card className="insight-card">
        <h4>
          <AlertTriangle size={16} /> Salud de datos
        </h4>
        <ul className="insight-list">
          <li>
            <span>Usuarios sin email</span>
            <strong>{health.usersNoEmail}</strong>
          </li>
          <li>
            <span>Equipos sin mantenimiento registrado</span>
            <strong>{health.equipmentNoMaintenance}</strong>
          </li>
          <li>
            <span>Ejercicios sin imagen</span>
            <strong>{health.exercisesNoImage}</strong>
          </li>
          <li>
            <span>Último respaldo</span>
            <strong>
              {backupDays === null
                ? "Nunca"
                : backupDays === 0
                  ? "Hoy"
                  : `hace ${backupDays} d`}
            </strong>
          </li>
        </ul>
        {(backupDays === null || backupDays > BACKUP_STALE_DAYS) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onNavigate("settings")}
          >
            Hacer respaldo
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onNavigate("exercises")}
        >
          Completar ejercicios
        </Button>
      </Card>

      <Card className="insight-card insight-wide">
        <h4>Actividad reciente</h4>
        {audit.length === 0 ? (
          <small>Aún no hay acciones registradas.</small>
        ) : (
          <ul className="insight-list">
            {audit.map((a) => (
              <li key={a.id}>
                <span>
                  {a.action}
                  {a.detail ? <small> — {a.detail}</small> : null}
                </span>
                <small>{new Date(a.at).toLocaleString("es-ES")}</small>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <style>{`
        .overview-insights {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: var(--space-4, 1rem);
          margin-bottom: var(--space-6, 1.5rem);
        }
        .insight-card h4 {
          display: flex; align-items: center; gap: 0.4rem;
          margin: 0 0 var(--space-2, 0.5rem);
        }
        .insight-card small { color: var(--color-text-muted); }
        .insight-big { font-size: 2rem; font-weight: 700; margin: 0; }
        .insight-wide { grid-column: 1 / -1; }
        .insight-list { list-style: none; margin: 0 0 var(--space-2, 0.5rem); padding: 0; }
        .insight-list li {
          display: flex; justify-content: space-between; align-items: center;
          gap: var(--space-2, 0.5rem); padding: 0.35rem 0;
          border-bottom: 1px solid var(--color-border);
        }
        .insight-list li:last-child { border-bottom: none; }
      `}</style>
    </div>
  );
};

export default OverviewInsights;
