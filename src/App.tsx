import { useState, useEffect, lazy, Suspense } from "react";
import Layout from "./components/Layout";
import AuthPage from "./components/AuthPage";
import DemoBanner from "./components/DemoBanner";
import BottomNav from "./components/ui/BottomNav";
import PulseLoader from "./components/ui/PulseLoader";
import { MockDatabaseProvider } from "./context/MockDatabase";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";

const CoachDashboard = lazy(() => import("./components/CoachDashboard"));
const AthleteDashboard = lazy(() => import("./components/AthleteDashboard"));
const PricingPage = lazy(() => import("./components/PricingPage"));
const AdminDashboard = lazy(() =>
  import("./admin").then((module) => ({ default: module.AdminDashboard })),
);

function LoadingScreen() {
  return <PulseLoader />;
}

function AppContent() {
  const {
    currentUser,
    isAuthenticated,
    isTrainer,
    isAthlete,
    isAdmin,
    logout,
    isPreviewMode,
    stopPreview,
  } = useAuth();
  const [activeTab, setActiveTab] = useState("entrenamientos");
  const [showPricing, setShowPricing] = useState(false);
  const [hideBottomNav, setHideBottomNav] = useState(false);

  // Add class to body for bottom nav padding
  useEffect(() => {
    if (currentUser) {
      document.body.classList.add("has-bottom-nav");
    } else {
      document.body.classList.remove("has-bottom-nav");
    }
    return () => document.body.classList.remove("has-bottom-nav");
  }, [currentUser]);

  const handleAuthSuccess = () => {
    setActiveTab("entrenamientos");
  };

  const handleExit = () => {
    // Si el super admin está en modo vista previa, "salir" solo
    // regresa al panel de administración en lugar de cerrar sesión.
    if (isPreviewMode()) {
      stopPreview();
    } else {
      logout();
    }
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
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AuthPage onSuccess={handleAuthSuccess} />
      </Suspense>
    );
  }

  // Si está en la página de pricing
  if (showPricing) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <PricingPage onBack={handlePricingBack} />
      </Suspense>
    );
  }

  const renderContent = () => {
    if (isAdmin()) {
      return <AdminDashboard onExit={handleExit} />;
    }

    if (isAthlete()) {
      return (
        <AthleteDashboard
          onExit={handleExit}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onImmersiveChange={setHideBottomNav}
        />
      );
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
    return (
      <Suspense fallback={<LoadingScreen />}>
        <AdminDashboard onExit={handleExit} />
      </Suspense>
    );
  }

  return (
    <Layout onExit={handleExit} userRole={currentUser?.role}>
      {isPreviewMode() && (
        <div className="preview-mode-banner">
          <span>
            🔍 Vista previa (demo) como <strong>{currentUser?.name}</strong>
          </span>
          <button type="button" onClick={handleExit}>
            Volver al panel Admin
          </button>
        </div>
      )}
      <div className="animate-fade-in">
        <Suspense fallback={<LoadingScreen />}>{renderContent()}</Suspense>
      </div>
      {currentUser && !isAdmin() && !hideBottomNav && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
      <style>{`
        .preview-mode-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.65rem 1.25rem;
          background: var(--color-primary-gradient, #4f46e5);
          color: #fff;
          font-size: 0.9rem;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .preview-mode-banner button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.4);
          color: #fff;
          padding: 0.35rem 0.9rem;
          border-radius: var(--radius-md, 6px);
          cursor: pointer;
          font-weight: 600;
        }
        .preview-mode-banner button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
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
