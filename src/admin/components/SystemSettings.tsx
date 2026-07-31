import React from "react";
import { Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, Mail, User, Shield, Info } from "lucide-react";
import "@/admin/styles/settings.css";

/**
 * Reemplaza el antiguo placeholder ("Opciones disponibles próximamente").
 * Configuración real pero acotada al alcance actual de la app (no hay backend):
 * datos de la cuenta de administrador, preferencia de tema y versión del sistema.
 */
const SystemSettings = () => {
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="admin-settings">
      <div className="section-header">
        <h2>Configuración del Sistema</h2>
      </div>

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
