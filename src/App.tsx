import { useState, useEffect, lazy, Suspense } from "react";
import { Users, Clock, Compass, Settings } from "lucide-react";
import Layout from "./components/Layout";
import AuthPage from "./components/AuthPage";
import DemoBanner from "./components/DemoBanner";
import BottomNav from "./components/ui/BottomNav";
import type { BottomNavTab } from "./components/ui/BottomNav";
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

// Tabs del BottomNav para el rol Entrenador: mismo patrón de 4 items que el
// rol Atleta. "explorar" muestra un hub (dentro de CoachDashboard) desde
// donde se accede a Solicitudes, Citas y Horarios de Gimnasio.
const TRAINER_TABS: BottomNavTab[] = [
  { id: "planes", label: "Planes", icon: Clock },
  { id: "mis-atletas", label: "Atletas", icon: Users },
  { id: "explorar", label: "Explorar", icon: Compass },
  { id: "configuracion", label: "Config", icon: Settings },
];
const TRAINER_TAB_IDS = TRAINER_TABS.map((t) => t.id);
const ATHLETE_TAB_IDS = ["entrenamientos", "explorar", "progreso", "perfil"];

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
      if (currentUser.role === "TRAINER") {
        document.body.classList.add("has-bottom-nav-extended");
      } else {
        document.body.classList.remove("has-bottom-nav-extended");
      }
    } else {
      document.body.classList.remove("has-bottom-nav");
      document.body.classList.remove("has-bottom-nav-extended");
    }
    return () => {
      document.body.classList.remove("has-bottom-nav");
      document.body.classList.remove("has-bottom-nav-extended");
    };
  }, [currentUser]);

  // Asegura que activeTab siempre apunte a una pestaña válida para el rol
  // actual (ej. al cambiar de Atleta a Entrenador vía preview de Admin).
  useEffect(() => {
    if (!currentUser) return;
    if (
      currentUser.role === "TRAINER" &&
      !TRAINER_TAB_IDS.includes(activeTab)
    ) {
      setActiveTab("planes");
    } else if (
      currentUser.role === "ATHLETE" &&
      !ATHLETE_TAB_IDS.includes(activeTab)
    ) {
      setActiveTab("entrenamientos");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

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
      return (
        <>
          <DemoBanner onUpgradeClick={handleUpgradeClick} />
          <CoachDashboard
            onExit={handleExit}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onImmersiveChange={setHideBottomNav}
          />
        </>
      );
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
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={isTrainer() ? TRAINER_TABS : undefined}
          extended={isTrainer()}
        />
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
