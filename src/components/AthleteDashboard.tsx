import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { useAuth } from "../context/AuthContext";
import { Button, Card } from "./ui";
import TrainerSearch from "./TrainerSearch";
import PlanCard from "./ui/PlanCard";
import PlanDetail from "./PlanDetail";
import GymBookingSystem from "./GymBookingSystem";
import AppointmentScheduler from "./AppointmentScheduler";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ArrowLeft,
  UserPlus,
  Clock,
  CheckCircle,
  Home,
  Compass,
  TrendingUp,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { ExplorarTab, ProgresoTab, PerfilTab } from "./athlete/AthleteTabs";

const AthleteDashboard = ({
  onExit,
  activeTab = "entrenamientos",
  onTabChange,
  onImmersiveChange,
}: {
  onExit: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onImmersiveChange?: (immersive: boolean) => void;
}) => {
  const {
    getActivePlans,
    autoCompletePlans,
    getAthleteTrainer,
    getAthletePendingRequest,
  } = useMockDatabase();
  const { currentUser } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [view, setView] = useState("home"); // home, trainer-search, plan-detail, gym-booking, appointments
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [myTrainer, setMyTrainer] = useState<any>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  // Auto-complete expired plans on component mount / cambio de usuario.
  // Las funciones del contexto MockDatabase no están memoizadas (se recrean
  // en cada render), por lo que incluirlas en el array causaría un loop de
  // efectos; se ejecuta intencionalmente solo cuando cambia el usuario.
  useEffect(() => {
    autoCompletePlans();

    // Verificar si tiene entrenador asignado
    const trainer = getAthleteTrainer(currentUser?.id);
    setMyTrainer(trainer);

    // Verificar si tiene solicitud pendiente
    const pending = getAthletePendingRequest(currentUser?.id);
    setPendingRequest(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Full-screen sub-views (búsqueda, detalle de plan, reservas) se sienten más
  // "nativas" sin la barra inferior compitiendo por espacio/atención.
  useEffect(() => {
    onImmersiveChange?.(view !== "home");
    return () => onImmersiveChange?.(false);
  }, [view, onImmersiveChange]);

  // Get athlete's active plans - ahora solo muestra planes si tiene entrenador
  const myPlans = myTrainer
    ? getActivePlans(myTrainer.id, currentUser?.id)
    : [];

  const handlePlanClick = (plan) => {
    setSelectedPlan(plan);
    setView("plan-detail");
  };

  const handleBack = () => {
    if (
      view === "plan-detail" ||
      view === "trainer-search" ||
      view === "gym-booking" ||
      view === "appointments"
    ) {
      setView("home");
      setSelectedPlan(null);
    } else {
      onExit();
    }
  };

  const handleFindTrainer = () => {
    setView("trainer-search");
  };

  // Vista de búsqueda de entrenador
  if (view === "trainer-search") {
    return (
      <div className="athlete-dashboard">
        <div className="dashboard-header">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={handleBack}
          >
            Volver
          </Button>
          <h2>Buscar Entrenador</h2>
        </div>
        <TrainerSearch onCancel={handleBack} />
      </div>
    );
  }

  if (view === "plan-detail" && selectedPlan) {
    return (
      <PlanDetail
        plan={selectedPlan.planObject}
        client={selectedPlan}
        onBack={handleBack}
      />
    );
  }

  if (view === "gym-booking") {
    return (
      <div className="athlete-dashboard">
        <div className="dashboard-header">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={handleBack}
          >
            Volver
          </Button>
          <h2>Reservas de Gimnasio</h2>
        </div>
        <GymBookingSystem athleteId={currentUser?.id} />
      </div>
    );
  }

  if (view === "appointments") {
    return (
      <div className="athlete-dashboard">
        <div className="dashboard-header">
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={handleBack}
          >
            Volver
          </Button>
          <h2>Mis Citas</h2>
        </div>
        <AppointmentScheduler athleteId={currentUser?.id} />
      </div>
    );
  }

  // Vista principal del dashboard
  const desktopTabs = [
    { id: "entrenamientos", label: "Entrenamientos", icon: Home },
    { id: "explorar", label: "Explorar", icon: Compass },
    { id: "progreso", label: "Progreso", icon: TrendingUp },
    { id: "perfil", label: "Perfil", icon: User },
  ];

  return (
    <div className="athlete-dashboard">
      <div className="dashboard-header">
        <div className="user-welcome">
          <div className="avatar">
            <User size={24} />
          </div>
          <div>
            <h1>Hola, {currentUser?.name?.split(" ")[0] || "Atleta"}</h1>
            <p>Vamos a entrenar hoy 💪</p>
          </div>
        </div>

        {/* Navegación por pestañas solo visible en desktop: en mobile ya
            existe el BottomNav (App.tsx) con las mismas 4 secciones. */}
        <nav className="desktop-tab-nav">
          {desktopTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`desktop-tab-item ${isActive ? "active" : ""}`}
                onClick={() => onTabChange?.(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeTab === "entrenamientos" && (
            <>
              {/* Si no tiene entrenador y no tiene solicitud pendiente */}
              {!myTrainer && !pendingRequest && (
                <Card className="no-trainer-card">
                  <div className="no-trainer-content">
                    <UserPlus size={48} color="var(--color-primary)" />
                    <h3>Busca un Entrenador</h3>
                    <p>
                      Para comenzar tu entrenamiento, primero debes vincularte
                      con un entrenador.
                    </p>
                    <p className="info-text">
                      Los entrenadores crearán planes personalizados para ti. El
                      pago se realiza directamente con tu entrenador.
                    </p>
                    <Button
                      variant="primary"
                      leftIcon={<UserPlus size={18} />}
                      onClick={handleFindTrainer}
                    >
                      Buscar Entrenador
                    </Button>
                  </div>
                </Card>
              )}

              {/* Si tiene solicitud pendiente */}
              {!myTrainer && pendingRequest && (
                <Card className="pending-request-card">
                  <div className="pending-content">
                    <Clock size={48} color="var(--color-warning)" />
                    <h3>Solicitud Pendiente</h3>
                    <p>
                      Has enviado una solicitud a{" "}
                      <strong>{pendingRequest.trainerName}</strong>
                    </p>
                    <p className="info-text">
                      El entrenador revisará tu solicitud pronto. Una vez
                      aceptada, podrá crear planes personalizados para ti.
                    </p>
                    <div className="request-date">
                      <small>
                        Enviada el{" "}
                        {new Date(
                          pendingRequest.createdAt,
                        ).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </Card>
              )}

              {/* Si tiene entrenador asignado */}
              {myTrainer && (
                <>
                  <Card className="trainer-info-card">
                    <div className="trainer-info-content">
                      <div className="trainer-icon">
                        <CheckCircle size={24} color="var(--color-success)" />
                      </div>
                      <div className="trainer-details">
                        <h4>Tu Entrenador</h4>
                        <p>
                          <strong>{myTrainer.name}</strong>
                        </p>
                        <small>
                          Tu entrenador puede crear y gestionar tus planes de
                          entrenamiento
                        </small>
                      </div>
                    </div>
                  </Card>

                  <div className="section">
                    <div className="section-header">
                      <h2>Mis Planes</h2>
                    </div>

                    {myPlans.length === 0 ? (
                      <Card className="empty-plans">
                        <p>Tu entrenador aún no ha creado planes para ti.</p>
                        <p className="hint">
                          Contacta a tu entrenador para que cree tu primer plan
                          personalizado.
                        </p>
                      </Card>
                    ) : (
                      <div className="plans-grid">
                        {myPlans.map((client) => (
                          <PlanCard
                            key={client.id}
                            plan={{
                              ...client.planObject,
                              name: `Plan para ${client.objective}`,
                              objective: client.objective,
                              duration: `${client.planDuration || 4} semanas`,
                              progress: client.progress || 0,
                              status: "active",
                            }}
                            onClick={() => handlePlanClick(client)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "explorar" && (
            <ExplorarTab
              myTrainer={myTrainer}
              onFindTrainer={handleFindTrainer}
              onGymBooking={() => setView("gym-booking")}
              onAppointments={() => setView("appointments")}
            />
          )}

          {activeTab === "progreso" && (
            <ProgresoTab myTrainer={myTrainer} myPlans={myPlans} />
          )}

          {activeTab === "perfil" && (
            <PerfilTab
              currentUser={currentUser}
              myTrainer={myTrainer}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              onExit={onExit}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .athlete-dashboard {
            padding-bottom: 80px;
            animation: fadeInUp 0.4s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-8);
            padding-bottom: var(--space-6);
            border-bottom: 2px solid var(--color-border);
        }
        .desktop-tab-nav {
            display: none;
        }
        @media (min-width: 768px) {
            .desktop-tab-nav {
                display: flex;
                gap: var(--space-2);
                background: var(--color-bg-subtle);
                padding: var(--space-1);
                border-radius: var(--radius-full);
            }
            .desktop-tab-item {
                display: flex;
                align-items: center;
                gap: var(--space-2);
                padding: var(--space-2) var(--space-4);
                border-radius: var(--radius-full);
                border: none;
                background: transparent;
                color: var(--color-text-muted);
                font-weight: 600;
                font-size: var(--text-sm);
                cursor: pointer;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .desktop-tab-item:hover {
                color: var(--color-text);
            }
            .desktop-tab-item.active {
                background: var(--color-primary);
                color: white;
                box-shadow: var(--shadow-sm);
            }
        }
        .user-welcome {
            display: flex;
            align-items: center;
            gap: var(--space-4);
        }
        .avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--color-primary-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: var(--shadow-lg);
            transition: transform var(--transition-normal);
        }
        .avatar:hover {
            transform: scale(1.05) rotate(5deg);
        }
        .user-welcome h1 {
            margin: 0;
            font-size: var(--text-2xl);
            font-weight: 700;
            letter-spacing: -0.02em;
            background: var(--color-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .user-welcome p {
            margin: 0;
            color: var(--color-text-muted);
            font-size: var(--text-base);
            font-weight: 500;
        }

        /* Card de No Trainer */
        .no-trainer-card,
        .pending-request-card,
        .trainer-info-card {
            margin-bottom: 2rem;
        }

        .no-trainer-content,
        .pending-content {
            text-align: center;
            padding: var(--space-8) var(--space-4);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-4);
        }

        @media (min-width: 480px) {
            .no-trainer-content,
            .pending-content {
                padding: var(--space-12) var(--space-8);
            }
        }

        .no-trainer-content h3,
        .pending-content h3 {
            margin: 0;
            font-size: 1.5rem;
            color: var(--color-text);
        }

        .no-trainer-content p,
        .pending-content p {
            margin: 0.5rem 0;
            color: var(--color-text);
            font-size: 1rem;
            max-width: 500px;
        }

        .info-text {
            color: var(--color-text-secondary) !important;
            font-size: 0.9rem !important;
        }

        .request-date {
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: var(--color-surface-raised);
            border-radius: var(--radius-md);
        }

        .request-date small {
            color: var(--color-text-muted);
        }

        /* Trainer Info Card */
        .trainer-info-card {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
            border: 2px solid var(--color-primary);
        }

        .trainer-info-content {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1.5rem;
        }

        .trainer-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .trainer-details {
            flex: 1;
        }

        .trainer-details h4 {
            margin: 0 0 0.5rem 0;
            color: var(--color-text-secondary);
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .trainer-details p {
            margin: 0 0 0.5rem 0;
            color: var(--color-text);
            font-size: 1.25rem;
        }

        .trainer-details small {
            color: var(--color-text-secondary);
            font-size: 0.875rem;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: var(--space-4);
            margin-bottom: var(--space-6);
        }
        .section-header h2 {
            margin: 0;
            font-size: var(--text-xl);
            font-weight: 700;
        }
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
            gap: var(--space-6);
        }
        .empty-plans {
            text-align: center;
            padding: var(--space-12) var(--space-6);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-4);
            min-height: 250px;
            justify-content: center;
        }
        .empty-plans p {
            margin: 0;
            color: var(--color-text-secondary);
            font-size: 1rem;
        }
        .empty-plans .hint {
            font-size: 0.875rem;
            color: var(--color-text-muted);
        }
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .user-welcome h1 {
            font-size: var(--text-xl);
          }
          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .plans-grid {
            grid-template-columns: 1fr;
          }
          .trainer-info-content {
            flex-direction: column;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .avatar {
            width: 48px;
            height: 48px;
          }
          .user-welcome {
            gap: var(--space-3);
          }
        }
      `}</style>
    </div>
  );
};

export default AthleteDashboard;
