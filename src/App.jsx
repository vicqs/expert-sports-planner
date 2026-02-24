import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import RoleSelector from "./components/RoleSelector";
import CoachDashboard from "./components/CoachDashboard";
import AthleteDashboard from "./components/AthleteDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AuthPage from "./components/AuthPage";
import PricingPage from "./components/PricingPage";
import DemoBanner from "./components/DemoBanner";
import BottomNav from "./components/ui/BottomNav";
import { MockDatabaseProvider } from "./context/MockDatabase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { ROLES } from "./utils/auth";

function AppContent() {
  const {
    currentUser,
    isAuthenticated,
    isTrainer,
    isAthlete,
    isAdmin,
    logout,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("entrenamientos");
  const [showPricing, setShowPricing] = useState(false);

  // Add class to body for bottom nav padding
  useEffect(() => {
    if (currentUser) {
      document.body.classList.add("has-bottom-nav");
    } else {
      document.body.classList.remove("has-bottom-nav");
    }
    return () => document.body.classList.remove("has-bottom-nav");
  }, [currentUser]);

  const handleAuthSuccess = (user) => {
    console.log("Usuario autenticado:", user);
    setActiveTab("entrenamientos");
  };

  const handleExit = () => {
    logout();
    setActiveTab("entrenamientos");
    setShowPricing(false);
  };

  const handleUpgradeClick = () => {
    // Deshabilitado: solo plan FREE disponible
    // setShowPricing(true);
  };

  const handlePricingBack = () => {
    setShowPricing(false);
  };

  // Si no está autenticado, mostrar página de auth
  if (!isAuthenticated()) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  // Si está en la página de pricing
  if (showPricing) {
    return <PricingPage onBack={handlePricingBack} />;
  }

  const renderContent = () => {
    if (isAdmin()) {
      return <AdminDashboard onExit={handleExit} />;
    }

    if (isAthlete()) {
      return <AthleteDashboard onExit={handleExit} />;
    }

    if (isTrainer()) {
      // Different views based on active tab
      switch (activeTab) {
        case "entrenamientos":
          return (
            <>
              <DemoBanner onUpgradeClick={handleUpgradeClick} />
              <CoachDashboard onExit={handleExit} />
            </>
          );
        case "explorar":
          return (
            <>
              <DemoBanner onUpgradeClick={handleUpgradeClick} />
              <div className="container" style={{ padding: "2rem" }}>
                <h2>Explorar</h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Biblioteca de planes y ejercicios
                </p>
              </div>
            </>
          );
        case "progreso":
          return (
            <>
              <DemoBanner onUpgradeClick={handleUpgradeClick} />
              <div className="container" style={{ padding: "2rem" }}>
                <h2>Progreso</h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Estadísticas y análisis
                </p>
              </div>
            </>
          );
        case "perfil":
          return (
            <>
              <DemoBanner onUpgradeClick={handleUpgradeClick} />
              <div className="container" style={{ padding: "2rem" }}>
                <h2>Perfil</h2>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Configuración y datos del usuario
                </p>
                <div
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem",
                    background: "var(--color-surface-raised)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <p
                    style={{ margin: 0, color: "var(--color-text-secondary)" }}
                  >
                    Plan actual:{" "}
                    <strong>Demostración Gratuita (14 días)</strong>
                  </p>
                </div>
              </div>
            </>
          );
        default:
          return (
            <>
              <DemoBanner onUpgradeClick={handleUpgradeClick} />
              <CoachDashboard onExit={handleExit} />
            </>
          );
      }
    }
  };

  // Si es administrador, mostrar dashboard sin layout
  if (isAdmin()) {
    return <AdminDashboard onExit={handleExit} />;
  }

  return (
    <Layout onExit={handleExit} userRole={currentUser?.role}>
      <div className="animate-fade-in">{renderContent()}</div>
      {currentUser && !isAdmin() && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <MockDatabaseProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </MockDatabaseProvider>
    </AuthProvider>
  );
}

export default App;
