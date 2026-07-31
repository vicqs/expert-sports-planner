import React from "react";
import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import "./TopBar.css";

// Same silhouette as the PulseLoader waveform (and lucide-react's "Activity"
// icon), reused here as the brand mark. `pathLength={100}` lets the CSS
// animation use simple 0-100 percentages regardless of the path's real length.
const BrandPulseIcon = () => (
  <svg
    className="brand-icon"
    width={28}
    height={28}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12h4l3-9l6 18l3-9h4" pathLength={100} />
  </svg>
);

/**
 * TopBar Component - Modern App Header
 *
 * UX Best Practices 2026:
 * - Fixed position for easy access
 * - Theme toggle prominently displayed
 * - Clear logout action
 * - Responsive design
 * - Backdrop blur for depth
 * - Touch-friendly targets (48px min)
 */
const TopBar = ({
  onExit,
  userName: _userName,
  userRole,
}: {
  onExit: () => void;
  userName?: string;
  userRole?: string;
}) => {
  const { toggleTheme, isDark } = useTheme();

  const getRoleBadge = () => {
    if (!userRole) return null;

    const roleLabels = {
      athlete: "Atleta",
      coach: "Entrenador",
    };

    return (
      <span className={`role-badge role-${userRole}`}>
        {roleLabels[userRole] || userRole}
      </span>
    );
  };

  return (
    <header className="top-bar">
      <div className="top-bar-content">
        {/* Logo & Brand */}
        <div className="brand">
          <BrandPulseIcon />
          <div className="brand-text">
            <h1 className="brand-name">Expert Sport Planner</h1>
          </div>
        </div>

        {/* Actions */}
        <div className="top-bar-actions">
          {/* Role Badge */}
          {getRoleBadge()}

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
            title={`Cambiar a modo ${isDark ? "claro" : "oscuro"}`}
          >
            {isDark ? (
              <Sun size={20} className="theme-icon" />
            ) : (
              <Moon size={20} className="theme-icon" />
            )}
          </button>

          {/* Logout Button */}
          {onExit && (
            <button
              className="logout-button"
              onClick={onExit}
              aria-label="Cerrar sesión"
            >
              <LogOut size={20} />
              <span className="logout-text">Salir</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
