import React from "react";
import { Card, Button } from "../ui";
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
  const completedSessions = myPlans.reduce(
    (sum, p) => sum + (p.completedSessions || 0),
    0,
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
      `}</style>
    </div>
  );
};

/* ---------------------------------- Perfil ---------------------------------- */

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
      `}</style>
    </div>
  );
};
