import React from "react";
import { Activity, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import "./TopBar.css";

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
          <Activity className="brand-icon" size={28} strokeWidth={2.5} />
          <div className="brand-text">
            <h1 className="brand-name">Expert Planner</h1>
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
