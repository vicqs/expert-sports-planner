import React from "react";
import { Home, Compass, TrendingUp, User } from "lucide-react";
import "./BottomNav.css";

/**
 * Bottom Navigation Bar for Mobile-First Navigation
 * @param {string} activeTab - Currently active tab
 * @param {function} onTabChange - Handler for tab changes
 */
const BottomNav = ({ activeTab = "entrenamientos", onTabChange }) => {
  const tabs = [
    {
      id: "entrenamientos",
      label: "Entrenamientos",
      icon: Home,
    },
    {
      id: "explorar",
      label: "Explorar",
      icon: Compass,
    },
    {
      id: "progreso",
      label: "Progreso",
      icon: TrendingUp,
    },
    {
      id: "perfil",
      label: "Perfil",
      icon: User,
    },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-container">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="bottom-nav-icon">
                <Icon size={24} />
              </span>
              <span className="bottom-nav-label">{tab.label}</span>
              {isActive && <span className="bottom-nav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
