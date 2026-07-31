import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";
import "@/admin/styles/sidebar.css";

const AdminSidebar = ({ activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);

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
        className="sidebar-toggle tap-ripple"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
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
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button
            className="sidebar-close tap-ripple"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
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
