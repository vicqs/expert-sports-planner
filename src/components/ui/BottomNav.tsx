import React from "react";
import { Home, Compass, TrendingUp, User } from "lucide-react";
import "./BottomNav.css";

export interface BottomNavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

const DEFAULT_ATHLETE_TABS: BottomNavTab[] = [
  { id: "entrenamientos", label: "Entrenamientos", icon: Home },
  { id: "explorar", label: "Explorar", icon: Compass },
  { id: "progreso", label: "Progreso", icon: TrendingUp },
  { id: "perfil", label: "Perfil", icon: User },
];

/**
 * Bottom Navigation Bar for Mobile-First Navigation
 * @param {string} activeTab - Currently active tab
 * @param {function} onTabChange - Handler for tab changes
 * @param {BottomNavTab[]} tabs - Optional custom tab set (defaults to athlete tabs)
 */
const BottomNav = ({
  activeTab = "entrenamientos",
  onTabChange,
  tabs = DEFAULT_ATHLETE_TABS,
  extended = false,
}: {
  activeTab?: string;
  onTabChange: (id: string) => void;
  tabs?: BottomNavTab[];
  extended?: boolean;
}) => {
  return (
    <nav className={`bottom-nav ${extended ? "bottom-nav-extended" : ""}`}>
      <div
        className={`bottom-nav-container ${tabs.length > 4 ? "compact" : ""}`}
      >
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
                <Icon size={tabs.length > 4 ? 20 : 24} />
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
