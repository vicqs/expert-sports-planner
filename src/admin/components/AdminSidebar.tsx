/**
 * AdminSidebar - menú lateral de navegación del panel Admin.
 *
 * Responsabilidad: listar las secciones y notificar la elección. En móvil y
 * tablet funciona como cajón deslizable con botón hamburguesa y overlay.
 * Lo usa: AdminDashboard. Estilos: admin/styles/sidebar.css.
 * No toca localStorage ni eventos propios (solo document.body.style.overflow
 * y un listener de teclado mientras está abierto).
 */
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";
import "@/admin/styles/sidebar.css";

/**
 * Barra lateral de navegación del administrador.
 *
 * @param props.activeTab Id de la sección activa (overview, users, exercises,
 *   equipment, analytics, settings); se marca con aria-current.
 * @param props.onTabChange Callback `(id) => void` al elegir una sección.
 */
const AdminSidebar = ({ activeTab, onTabChange }) => {
  // Solo relevante en móvil/tablet; en escritorio el sidebar es fijo.
  const [isOpen, setIsOpen] = useState(false);

  // Escape cierra el menú y se bloquea el scroll del fondo mientras está abierto
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Los ids deben coincidir con las claves de `view` en AdminDashboard
  const menuItems = [
    { id: "overview", label: "Panel General", icon: LayoutDashboard },
    { id: "users", label: "Usuarios", icon: Users },
    { id: "exercises", label: "Ejercicios", icon: Dumbbell },
    { id: "equipment", label: "Equipamiento", icon: Package },
    { id: "analytics", label: "Análisis", icon: BarChart3 },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  const handleItemClick = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false); // Cerrar sidebar en móvil después de seleccionar
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Button - Solo visible en móvil/tablet */}
      <button
        className={`sidebar-toggle tap-ripple ${isOpen ? "hidden-open" : ""}`}
        onClick={toggleSidebar}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls="admin-sidebar"
      >
        <span className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Overlay - Solo móvil/tablet */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`admin-sidebar ${isOpen ? "open" : ""}`}
        aria-label="Navegación de administración"
      >
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button
            className="sidebar-close tap-ripple"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-item tap-ripple ${activeTab === item.id ? "active" : ""}`}
                onClick={() => handleItemClick(item.id)}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                <span className="sidebar-icon">
                  <Icon size={18} />
                </span>
                <span className="sidebar-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">A</div>
            <div className="user-info">
              <div className="user-name">Administrador</div>
              <div className="user-role">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
