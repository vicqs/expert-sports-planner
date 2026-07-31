import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, Button, useToast } from "../ui";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  TrendingUp,
  Award,
  LogOut,
  Moon,
  Sun,
  Calendar,
  Dumbbell,
  Trophy,
  Flame,
  ChevronRight,
  Mail,
  Phone,
  UserCog,
} from "lucide-react";

/**
 * Tab bodies for the athlete's BottomNav ("Explorar" / "Progreso" / "Perfil").
 * Kept as small, focused components (not inline in AthleteDashboard) so each
 * one can evolve independently — e.g. "Progreso" will likely grow real charts
 * later without bloating the main dashboard file.
 */

/* --------------------------------- Explorar -------------------------------- */

interface ExplorarTabProps {
  myTrainer: any;
  onFindTrainer: () => void;
  onGymBooking: () => void;
  onAppointments: () => void;
}

export const ExplorarTab: React.FC<ExplorarTabProps> = ({
  myTrainer,
  onFindTrainer,
  onGymBooking,
  onAppointments,
}) => {
  return (
    <div className="explorar-tab">
      {!myTrainer ? (
        // Empty state: no coach yet — the single most important CTA on this tab.
        <Card className="explorar-empty">
          <Search size={40} color="var(--color-primary)" />
          <h3>Encuentra a tu entrenador</h3>
          <p>Busca por nombre, código o email para enviar una solicitud.</p>
          <Button variant="primary" onClick={onFindTrainer}>
            Buscar Entrenador
          </Button>
        </Card>
      ) : (
        <div className="explorar-grid">
          <button className="explorar-card tap-ripple" onClick={onGymBooking}>
            <span className="explorar-icon gym">
              <Dumbbell size={22} />
            </span>
            <span className="explorar-card-text">
              <strong>Reservar Gimnasio</strong>
              <small>Elige horario y cupo disponible</small>
            </span>
            <ChevronRight size={18} className="explorar-chevron" />
          </button>

          <button className="explorar-card tap-ripple" onClick={onAppointments}>
            <span className="explorar-icon appt">
              <Calendar size={22} />
            </span>
            <span className="explorar-card-text">
              <strong>Citas 1 a 1</strong>
              <small>Agenda una sesión con tu entrenador</small>
            </span>
            <ChevronRight size={18} className="explorar-chevron" />
          </button>
        </div>
      )}

      <style>{`
        .explorar-tab { display: flex; flex-direction: column; gap: var(--space-4); }
        .explorar-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-3);
          padding: var(--space-10) var(--space-6);
        }
        .explorar-empty h3 { margin: 0; font-family: var(--font-display); }
        .explorar-empty p { margin: 0; color: var(--color-text-muted); max-width: 320px; }

        .explorar-grid { display: flex; flex-direction: column; gap: var(--space-3); }
        .explorar-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          width: 100%;
          min-height: var(--touch-target-large);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          text-align: left;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }
        .explorar-card:active { transform: scale(0.98); }
        .explorar-card:hover { border-color: var(--color-border-hover); }
        .explorar-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .explorar-icon.gym { background: var(--color-primary-bg); color: var(--color-primary); }
        .explorar-icon.appt { background: var(--color-accent-bg); color: var(--color-accent); }
        .explorar-card-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .explorar-card-text strong { font-size: var(--text-base); color: var(--color-text-primary); }
        .explorar-card-text small { color: var(--color-text-muted); font-size: var(--text-sm); }
        .explorar-chevron { color: var(--color-text-subtle); flex-shrink: 0; }
      `}</style>
    </div>
  );
};

/* --------------------------------- Progreso -------------------------------- */

interface ProgresoTabProps {
  myTrainer: any;
  myPlans: any[];
}

export const ProgresoTab: React.FC<ProgresoTabProps> = ({
  myTrainer,
  myPlans,
}) => {
  // Cumplimiento por semana (todas las semanas de todos los planes del
  // atleta, agregadas por `weekNum`) — alimenta el gráfico de barras de
  // abajo. Se calcula en vivo a partir de `planObject`, mismo dato que ya
  // usan las stats de más abajo, no requiere ninguna estructura mock nueva.
  // Se calcula ANTES del early-return de "sin entrenador" para respetar las
  // reglas de hooks (siempre en el mismo orden).
  const weeklyData = useMemo(() => {
    const byWeek = new Map<number, { total: number; completed: number }>();
    myPlans.forEach((p) => {
      (p.planObject || []).forEach((week: any) => {
        const entry = byWeek.get(week.weekNum) || { total: 0, completed: 0 };
        (week.days || []).forEach((d: any) => {
          if (d.session) {
            entry.total += 1;
            if (d.completed) entry.completed += 1;
          }
        });
        byWeek.set(week.weekNum, entry);
      });
    });
    return Array.from(byWeek.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNum, v]) => ({
        weekNum,
        total: v.total,
        completed: v.completed,
        pct: v.total ? Math.round((v.completed / v.total) * 100) : 0,
      }));
  }, [myPlans]);

  if (!myTrainer) {
    return (
      <Card className="progreso-empty">
        <TrendingUp size={40} color="var(--color-text-subtle)" />
        <h3>Aún no hay progreso que mostrar</h3>
        <p>
          Vincúlate con un entrenador y completa sesiones para ver tus
          estadísticas aquí.
        </p>
        <style>{`
          .progreso-empty {
            display: flex; flex-direction: column; align-items: center; text-align: center;
            gap: var(--space-3); padding: var(--space-10) var(--space-6);
          }
          .progreso-empty h3 { margin: 0; }
          .progreso-empty p { margin: 0; color: var(--color-text-muted); max-width: 320px; }
        `}</style>
      </Card>
    );
  }

  const totalPlans = myPlans.length;
  const avgProgress = totalPlans
    ? Math.round(
        myPlans.reduce((sum, p) => sum + (p.progress || 0), 0) / totalPlans,
      )
    : 0;

  // `planObject` es un arreglo de semanas ({ weekNum, days: [...] }); cada día
  // trae `session` (null si es descanso) y `completed`. Antes se leía
  // `p.completedSessions`, un campo que nunca se guarda en MockDatabase, así
  // que el conteo real de sesiones siempre daba 0 — se calcula aquí en vivo.
  const allTrainingDays = myPlans.flatMap((p) =>
    (p.planObject || []).flatMap((week: any) =>
      (week.days || []).filter((d: any) => d.session),
    ),
  );
  const totalSessions = allTrainingDays.length;
  const completedSessions = allTrainingDays.filter((d) => d.completed).length;
  const remainingSessions = totalSessions - completedSessions;

  // Racha: sesiones completadas consecutivas desde el inicio del plan (en
  // orden), hasta la primera sesión de entrenamiento pendiente.
  let currentStreak = 0;
  for (const day of allTrainingDays) {
    if (day.completed) currentStreak++;
    else break;
  }

  // Días restantes hasta que finalice el plan (si hay endDate).
  const daysRemaining = myPlans.reduce(
    (min, p) => {
      if (!p.endDate) return min;
      const diff = Math.ceil(
        (new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const clamped = Math.max(diff, 0);
      return min === null ? clamped : Math.min(min, clamped);
    },
    null as number | null,
  );

  return (
    <div className="progreso-tab">
      <div className="stats-grid">
        <Card className="stat-card">
          <Trophy size={22} className="stat-icon primary" />
          <span className="stat-value">{totalPlans}</span>
          <span className="stat-label">Planes activos</span>
        </Card>
        <Card className="stat-card">
          <Flame size={22} className="stat-icon warning" />
          <span className="stat-value">{completedSessions}</span>
          <span className="stat-label">Sesiones completadas</span>
        </Card>
        <Card className="stat-card">
          <Calendar size={22} className="stat-icon primary" />
          <span className="stat-value">{remainingSessions}</span>
          <span className="stat-label">Sesiones restantes</span>
        </Card>
        <Card className="stat-card">
          <Flame size={22} className="stat-icon warning" />
          <span className="stat-value">{currentStreak}</span>
          <span className="stat-label">Racha actual</span>
        </Card>
        {daysRemaining !== null && (
          <Card className="stat-card">
            <Calendar size={22} className="stat-icon success" />
            <span className="stat-value">{daysRemaining}</span>
            <span className="stat-label">Días restantes</span>
          </Card>
        )}
        <Card className="stat-card stat-card-wide">
          <Award size={22} className="stat-icon success" />
          <span className="stat-value">{avgProgress}%</span>
          <span className="stat-label">Progreso promedio</span>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
        </Card>
      </div>

      {weeklyData.length > 0 && (
        <Card className="weekly-chart-card">
          <h4 className="weekly-chart-title">
            <TrendingUp size={18} /> Cumplimiento semanal
          </h4>
          <div className="weekly-chart">
            {weeklyData.map((w, i) => (
              <div
                className="weekly-bar-col"
                key={w.weekNum}
                title={`Semana ${w.weekNum}: ${w.completed}/${w.total} sesiones (${w.pct}%)`}
              >
                <span className="weekly-bar-pct">{w.pct}%</span>
                <div className="weekly-bar-track">
                  <motion.div
                    className="weekly-bar-fill"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(w.pct, w.total ? 4 : 0)}%` }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.07,
                      ease: "easeOut",
                    }}
                    whileHover={{ filter: "brightness(1.15)" }}
                  />
                </div>
                <span className="weekly-bar-label">S{w.weekNum}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <style>{`
        .progreso-tab { display: flex; flex-direction: column; gap: var(--space-4); }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          padding: var(--space-4);
        }
        .stat-card-wide { grid-column: 1 / -1; }
        .stat-icon.primary { color: var(--color-primary); }
        .stat-icon.warning { color: var(--color-warning); }
        .stat-icon.success { color: var(--color-success); }
        .stat-value {
          font-family: var(--font-display);
          font-variant-numeric: tabular-nums;
          font-size: var(--text-3xl);
          font-weight: 700;
          color: var(--color-text-primary);
        }
        .stat-label { font-size: var(--text-sm); color: var(--color-text-muted); }
        .stat-bar-track {
          margin-top: var(--space-2);
          height: 8px;
          border-radius: var(--radius-full);
          background: var(--color-bg-elevated);
          overflow: hidden;
        }
        .stat-bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: var(--color-primary-gradient);
          transition: width var(--transition-slow);
        }
        .weekly-chart-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding: var(--space-5) var(--space-4) var(--space-4);
        }
        .weekly-chart-title {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          margin: 0;
          font-family: var(--font-display);
          font-size: var(--text-base);
          color: var(--color-text-primary);
        }
        .weekly-chart {
          display: flex;
          align-items: flex-end;
          gap: var(--space-3);
          height: 150px;
        }
        .weekly-bar-col {
          flex: 1;
          min-width: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          cursor: default;
        }
        .weekly-bar-pct {
          font-size: var(--text-xs);
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: var(--color-text-muted);
        }
        .weekly-bar-track {
          flex: 1;
          width: 100%;
          max-width: 34px;
          display: flex;
          align-items: flex-end;
          background: var(--color-bg-elevated);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .weekly-bar-fill {
          width: 100%;
          min-height: 4px;
          border-radius: var(--radius-full);
          background: var(--color-primary-gradient);
          transition: filter var(--transition-fast);
        }
        .weekly-bar-label {
          font-size: var(--text-xs);
          color: var(--color-text-subtle);
        }
      `}</style>
    </div>
  );
};

/* ---------------------------------- Perfil ---------------------------------- */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CR_PHONE_REGEX = /^\+506 \d{4}-\d{4}$/;

// Formatea un teléfono de Costa Rica en vivo mientras se escribe: +506 XXXX-XXXX
// (8 dígitos locales, el 506 tecleado al inicio se interpreta como el código
// de país y se descarta del bloque local).
function formatCRPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("506") && digits.length > 8) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 8);
  if (!digits) return "";
  const local =
    digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
  return `+506 ${local}`;
}

interface PerfilTabProps {
  currentUser: any;
  myTrainer: any;
  isDark: boolean;
  onToggleTheme: () => void;
  onExit: () => void;
}

export const PerfilTab: React.FC<PerfilTabProps> = ({
  currentUser,
  myTrainer,
  isDark,
  onToggleTheme,
  onExit,
}) => {
  const { updateProfile } = useAuth();
  const { addToast } = useToast();
  const [editingContact, setEditingContact] = useState(false);
  const [emailDraft, setEmailDraft] = useState(currentUser?.email || "");
  const [phoneDraft, setPhoneDraft] = useState(currentUser?.phone || "");
  const [saving, setSaving] = useState(false);

  const startEditingContact = () => {
    setEmailDraft(currentUser?.email || "");
    setPhoneDraft(currentUser?.phone || "");
    setEditingContact(true);
  };

  const emailError =
    emailDraft.trim() && !EMAIL_REGEX.test(emailDraft.trim())
      ? "Ingresa un correo válido (ej. nombre@dominio.com)"
      : "";
  const phoneError =
    phoneDraft.trim() && !CR_PHONE_REGEX.test(phoneDraft.trim())
      ? "Ingresa un teléfono válido de Costa Rica (+506 1234-5678)"
      : "";
  const canSaveContact = !emailError && !phoneError;

  const handlePhoneChange = (raw: string) => {
    setPhoneDraft(formatCRPhone(raw));
  };

  const handleSaveContact = async () => {
    if (!canSaveContact) return;
    setSaving(true);
    const result = await updateProfile({
      email: emailDraft.trim() || null,
      phone: phoneDraft.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      addToast("Datos de contacto actualizados", "success");
      setEditingContact(false);
    } else {
      addToast(result.error || "No se pudo guardar", "error");
    }
  };

  return (
    <div className="perfil-tab">
      <Card className="perfil-header">
        <div className="perfil-avatar">
          <UserCog size={28} />
        </div>
        <div>
          <h3>{currentUser?.name || "Atleta"}</h3>
          {currentUser?.email && (
            <p className="perfil-email">
              <Mail size={14} /> {currentUser.email}
            </p>
          )}
        </div>
      </Card>

      {myTrainer && (
        <Card className="perfil-row">
          <span className="perfil-row-label">Entrenador</span>
          <span className="perfil-row-value">{myTrainer.name}</span>
        </Card>
      )}

      <Card className="perfil-contact-card">
        <div className="perfil-contact-header">
          <span className="perfil-row-label">
            <Phone size={16} /> Datos de contacto
          </span>
          {!editingContact && (
            <button
              className="perfil-contact-edit tap-ripple"
              onClick={startEditingContact}
              aria-label="Editar datos de contacto"
            >
              Editar
            </button>
          )}
        </div>

        {editingContact ? (
          <div className="perfil-contact-form">
            <label className="perfil-contact-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                aria-invalid={!!emailError}
                className={emailError ? "has-error" : ""}
              />
              {emailError && (
                <small className="perfil-field-error">{emailError}</small>
              )}
            </label>
            <label className="perfil-contact-field">
              <span>Teléfono</span>
              <input
                type="tel"
                value={phoneDraft}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+506 1234-5678"
                autoComplete="tel"
                inputMode="numeric"
                maxLength={13}
                aria-invalid={!!phoneError}
                className={phoneError ? "has-error" : ""}
              />
              {phoneError && (
                <small className="perfil-field-error">{phoneError}</small>
              )}
            </label>
            <p className="perfil-contact-hint">
              Tu entrenador podrá ver estos datos para contactarte.
            </p>
            <div className="perfil-contact-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingContact(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveContact}
                loading={saving}
                disabled={!canSaveContact}
              >
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="perfil-contact-view">
            <div className="perfil-contact-row">
              <Mail size={16} />
              <span>{currentUser?.email || "Sin correo registrado"}</span>
            </div>
            <div className="perfil-contact-row">
              <Phone size={16} />
              <span>{currentUser?.phone || "Sin teléfono registrado"}</span>
            </div>
          </div>
        )}
      </Card>

      <Card
        className="perfil-row perfil-row-button tap-ripple"
        onClick={onToggleTheme}
        role="button"
        tabIndex={0}
        aria-pressed={isDark}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleTheme();
          }
        }}
      >
        <span className="perfil-row-label">
          {isDark ? <Moon size={16} /> : <Sun size={16} />} Tema
        </span>
        <span className="perfil-row-value">{isDark ? "Oscuro" : "Claro"}</span>
      </Card>

      <Button
        variant="ghost"
        leftIcon={<LogOut size={18} />}
        onClick={onExit}
        className="perfil-logout"
      >
        Cerrar sesión
      </Button>

      <style>{`
        .perfil-tab { display: flex; flex-direction: column; gap: var(--space-3); }
        .perfil-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
        }
        .perfil-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-primary-gradient);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .perfil-header h3 { margin: 0; font-family: var(--font-display); }
        .perfil-email {
          margin: 4px 0 0;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
        .perfil-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-4);
          min-height: var(--touch-target-comfortable);
        }
        .perfil-row-button { cursor: pointer; }
        .perfil-row-button:active { transform: scale(0.98); }
        .perfil-row-button:focus-visible {
          outline: 2px solid var(--color-primary);
          outline-offset: 2px;
        }
        .perfil-row-label {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-text-secondary);
          font-weight: 600;
          font-size: var(--text-sm);
        }
        .perfil-row-value { color: var(--color-text-primary); font-weight: 600; }
        .perfil-logout { justify-content: center; color: var(--color-error); }

        .perfil-contact-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          padding: var(--space-4);
        }
        .perfil-contact-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .perfil-contact-edit {
          color: var(--color-primary);
          font-weight: 600;
          font-size: var(--text-sm);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
        }
        .perfil-contact-view {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .perfil-contact-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--color-text-primary);
          font-size: var(--text-sm);
        }
        .perfil-contact-row svg { color: var(--color-text-muted); flex-shrink: 0; }
        .perfil-contact-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .perfil-contact-field {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .perfil-contact-field input {
          font-size: 16px;
          font-weight: 400;
          padding: var(--space-3);
          min-height: var(--touch-target-min, 44px);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-primary);
        }
        .perfil-contact-field input:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .perfil-contact-field input.has-error {
          border-color: var(--color-error);
        }
        .perfil-field-error {
          color: var(--color-error);
          font-size: var(--text-xs);
          font-weight: 400;
        }
        .perfil-contact-hint {
          margin: 0;
          color: var(--color-text-muted);
          font-size: var(--text-xs);
        }
        .perfil-contact-actions {
          display: flex;
          justify-content: flex-end;
          gap: var(--space-2);
        }
      `}</style>
    </div>
  );
};
