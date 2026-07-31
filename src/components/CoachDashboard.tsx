import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockDatabase } from "../context/MockDatabase";
import { useAuth } from "../context/AuthContext";
import { getAllUsers } from "../utils/auth";
import { generatePlan } from "../utils/generator";
import {
  Play,
  Check,
  Clock,
  User,
  UserCheck,
  UserX,
  X,
  Settings,
  Inbox,
  Users,
  CalendarClock,
  CalendarPlus,
  ChevronRight,
  ClipboardList,
  Mail,
  Phone,
} from "lucide-react";
import PlanEditor from "./PlanEditor";
import TrainerScheduleConfig from "./TrainerScheduleConfig";
import TrainerAppointmentCalendar from "./TrainerAppointmentCalendar";
import TrainerExerciseLibrary from "./TrainerExerciseLibrary";
import TrainerEquipmentLibrary from "./TrainerEquipmentLibrary";
import { Card, Button, useToast, ConfirmDialog } from "./ui";
import { useLocalStorage } from "../hooks/useLocalStorage";
import "@/styles/trainer-library.css";

const CoachDashboard = ({
  onExit: _onExit,
  activeTab: activeTabProp,
  onTabChange: onTabChangeProp,
  onImmersiveChange,
}: {
  onExit?: () => void;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  onImmersiveChange?: (immersive: boolean) => void;
}) => {
  const {
    getPendingClients,
    getCompletedClients,
    getActivePlans,
    updateClientPlan,
    extendPlan,
    autoCompletePlans,
    athleteRequests: allAthleteRequests,
    acceptTrainerRequest,
    rejectTrainerRequest,
    getTrainerAthletes,
    removeAthlete,
    addAppointment,
  } = useMockDatabase();
  const { getTrainerId, getUserLimits } = useAuth();
  const { addToast } = useToast();
  // Si el padre controla la pestaña activa (ej. BottomNav en mobile), se usa esa;
  // si no, cae a un estado interno propio (uso standalone / retro-compatible).
  const [internalActiveTab, setInternalActiveTab] = useState("planes");
  const activeTab = activeTabProp ?? internalActiveTab;
  const setActiveTab = onTabChangeProp ?? setInternalActiveTab;
  const [activeSubTab, setActiveSubTab] = useState("ejercicios"); // Para sub-tabs en configuración
  const [planDistanceUnit, setPlanDistanceUnit] = useLocalStorage(
    "trainer_plan_distance_unit",
    "km",
  );
  const [planWeightUnit, setPlanWeightUnit] = useLocalStorage(
    "trainer_plan_weight_unit",
    "lb",
  );
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentPlanObject, setCurrentPlanObject] = useState<any>(null);
  // Evita doble-click mientras una acción (aceptar/rechazar/quitar) está en curso.
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(
    null,
  );
  const [removingAthleteId, setRemovingAthleteId] = useState<string | null>(
    null,
  );
  // Atleta pendiente de confirmación de remoción (reemplaza window.confirm
  // por un ConfirmDialog propio del sistema de diseño).
  const [athleteToRemove, setAthleteToRemove] = useState<{
    athleteId: string;
    athleteName: string;
  } | null>(null);
  // Atleta/plan pendiente de confirmación para "Extender Plan" (el atleta
  // necesita más tiempo para trabajar el plan) + cuántas semanas elegidas.
  const [clientToExtend, setClientToExtend] = useState<any>(null);
  const [extendWeeks, setExtendWeeks] = useState(1);
  const [extendingPlanId, setExtendingPlanId] = useState<string | null>(null);
  // Avisos de "cambio de plan" descartados por el entrenador, para no
  // volver a mostrarlos apenas se recarga la pantalla. La clave incluye el
  // `endDate` del plan, así que si el plan se extiende (nuevo endDate) el
  // aviso vuelve a aparecer naturalmente cuando llegue esa nueva fecha.
  const [dismissedPlanDecisions, setDismissedPlanDecisions] = useLocalStorage(
    "trainer_dismissed_plan_decisions",
    [] as string[],
  );

  const trainerId = getTrainerId();

  // Auto-complete expired plans on component mount.
  // autoCompletePlans no está memoizada en MockDatabase; se ejecuta
  // intencionalmente una sola vez al montar el componente.
  useEffect(() => {
    autoCompletePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Oculta el BottomNav (mobile) mientras se edita un plan a pantalla completa,
  // igual que hace AthleteDashboard al entrar a una vista inmersiva.
  useEffect(() => {
    onImmersiveChange?.(!!currentPlanObject);
    return () => onImmersiveChange?.(false);
  }, [currentPlanObject, onImmersiveChange]);

  const pending = getPendingClients(trainerId);
  const activePlans = getActivePlans(trainerId);
  const completed = getCompletedClients(trainerId);

  // Planes activos que ya llegaron (o pasaron) su fecha de finalización y
  // todavía no fueron descartados por el entrenador para ese `endDate`
  // puntual. `autoCompletePlans` tiene un margen de gracia de 2 días antes
  // de auto-completar el plan, así que hay tiempo de mostrar este aviso.
  const plansNeedingDecision = activePlans.filter((c) => {
    if (!c.endDate) return false;
    const isDue = new Date(c.endDate) <= new Date();
    if (!isDue) return false;
    const key = `${c.id}:${c.endDate}`;
    return !dismissedPlanDecisions.includes(key);
  });

  // Filtrar solicitudes pendientes reactivamente
  const athleteRequests = allAthleteRequests.filter(
    (r) => r.trainerId === trainerId && r.status === "PENDING",
  );
  const myAthletes = getTrainerAthletes(trainerId);

  // Calcular límites
  const totalAthletes = pending.length + activePlans.length;
  const limits = getUserLimits(totalAthletes, activePlans.length);

  // Porcentaje de uso de cada límite (0-1), para la barra de progreso sutil.
  // Con max === Infinity (planes ilimitados) el porcentaje siempre es 0 —
  // nunca hay que mostrar advertencia/bloqueo en ese caso.
  const athletesPct =
    limits && limits.athletes.max !== Infinity
      ? Math.min(1, limits.athletes.current / limits.athletes.max)
      : 0;
  const plansPct =
    limits && limits.plans.max !== Infinity
      ? Math.min(1, limits.plans.current / limits.plans.max)
      : 0;
  const isAthleteLimitReached =
    !!limits &&
    limits.athletes.max !== Infinity &&
    limits.athletes.current >= limits.athletes.max;
  const isPlanLimitReached =
    !!limits &&
    limits.plans.max !== Infinity &&
    limits.plans.current >= limits.plans.max;

  const handleGenerate = (client) => {
    if (isPlanLimitReached) {
      addToast(
        "Llegaste al límite de planes activos de tu suscripción. Actualiza tu plan para generar más.",
        "warning",
      );
      return;
    }
    const plan = generatePlan(client);
    setCurrentPlanObject(plan);
    setSelectedClient(client);
  };

  const handleSavePlan = (finalText, planObject) => {
    updateClientPlan(selectedClient.id, finalText, planObject);
    setSelectedClient(null);
    setCurrentPlanObject(null);
  };

  const handleEdit = (client) => {
    if (client.planObject) {
      setCurrentPlanObject(client.planObject);
      setSelectedClient(client);
    } else {
      addToast(
        "Este plan es antiguo y no se puede editar visualmente.",
        "warning",
      );
    }
  };

  // Gestión de solicitudes de atletas
  const handleAcceptRequest = async (requestId) => {
    if (isAthleteLimitReached) {
      addToast(
        "Llegaste al límite de atletas de tu suscripción. Actualiza tu plan para aceptar más.",
        "warning",
      );
      return;
    }
    setProcessingRequestId(requestId);
    await acceptTrainerRequest(requestId);
    addToast("Solicitud aceptada correctamente", "success");
    setProcessingRequestId(null);
  };

  const handleRejectRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    await rejectTrainerRequest(requestId);
    addToast("Solicitud rechazada", "info");
    setProcessingRequestId(null);
  };

  const handleRemoveAthlete = async (athleteId) => {
    setRemovingAthleteId(athleteId);
    await removeAthlete(trainerId, athleteId);
    addToast("Atleta removido", "info");
    setRemovingAthleteId(null);
  };

  const handleExtendPlan = async () => {
    if (!clientToExtend) return;
    setExtendingPlanId(clientToExtend.id);
    await extendPlan(clientToExtend.id, extendWeeks);
    addToast(
      `Plan de ${clientToExtend.name} extendido ${extendWeeks} semana${extendWeeks > 1 ? "s" : ""} más`,
      "success",
    );
    setExtendingPlanId(null);
  };

  // Descarta el aviso de "cambio de plan" para este plan/endDate puntual
  // (no vuelve a aparecer a menos que el plan se extienda y cambie endDate).
  const dismissPlanDecision = (client) => {
    const key = `${client.id}:${client.endDate}`;
    setDismissedPlanDecisions((prev) =>
      prev.includes(key) ? prev : [...prev, key],
    );
  };

  // Crea una cita placeholder de "Ajuste de Plan" para el atleta (3 días a
  // partir de hoy, 10:00) y lleva al entrenador a la pestaña "Citas" para
  // que la reprograme a la fecha/hora real que acuerde con el atleta.
  const schedulePlanChangeAppointment = (client) => {
    const suggestedDate = new Date();
    suggestedDate.setDate(suggestedDate.getDate() + 3);
    addAppointment({
      trainerId,
      athleteId: client.id,
      athleteName: client.name,
      date: suggestedDate.toISOString().split("T")[0],
      time: "10:00",
      type: "adjust",
      typeName: "Ajuste de Plan",
      notes: "Cita de cambio de plan (plan anterior llegó a su fin).",
    });
    dismissPlanDecision(client);
    addToast(
      `Cita de cambio de plan creada para ${client.name}. Reprográmala a la fecha real en "Citas".`,
      "success",
    );
    setActiveTab("citas");
  };

  if (currentPlanObject) {
    return (
      <div className="coach-workspace">
        <div className="workspace-header">
          <h2>Editando Plan para {selectedClient.name}</h2>
        </div>
        <PlanEditor
          initialPlan={currentPlanObject}
          clientData={selectedClient}
          onSave={handleSavePlan}
          onCancel={() => setCurrentPlanObject(null)}
          onAutoSave={(finalText, planObject) =>
            updateClientPlan(selectedClient.id, finalText, planObject)
          }
        />
        <style>{`
          .coach-workspace {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 100px);
          }
          .workspace-header {
            margin-bottom: var(--space-6);
          }
          .workspace-header h2 {
            background: var(--color-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Panel de Entrenador</h2>
          {limits && (
            <div className="limits-display">
              <div
                className={`limit-meter ${athletesPct >= 1 ? "reached" : athletesPct >= 0.8 ? "warning" : ""}`}
                title={
                  athletesPct >= 1
                    ? "Llegaste al límite de atletas de tu plan de suscripción."
                    : "Atletas activos vs. límite de tu plan"
                }
              >
                <div className="limit-meter-top">
                  <span className="limit-meter-label">Atletas</span>
                  <span className="limit-meter-value">
                    {limits.athletes.current}/
                    {limits.athletes.max === Infinity
                      ? "∞"
                      : limits.athletes.max}
                  </span>
                </div>
                <div className="limit-meter-track">
                  <div
                    className="limit-meter-fill"
                    style={{ width: `${athletesPct * 100}%` }}
                  />
                </div>
              </div>
              <div
                className={`limit-meter ${plansPct >= 1 ? "reached" : plansPct >= 0.8 ? "warning" : ""}`}
                title={
                  plansPct >= 1
                    ? "Llegaste al límite de planes activos de tu plan de suscripción."
                    : "Planes activos vs. límite de tu plan"
                }
              >
                <div className="limit-meter-top">
                  <span className="limit-meter-label">Planes Activos</span>
                  <span className="limit-meter-value">
                    {limits.plans.current}/
                    {limits.plans.max === Infinity ? "∞" : limits.plans.max}
                  </span>
                </div>
                <div className="limit-meter-track">
                  <div
                    className="limit-meter-fill"
                    style={{ width: `${plansPct * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="header-actions">
          <div className="tabs">
            <button
              className={`tab-btn tap-ripple ${activeTab === "planes" ? "active" : ""}`}
              onClick={() => setActiveTab("planes")}
            >
              <ClipboardList size={18} />
              Planes
            </button>
            <button
              className={`tab-btn tap-ripple ${activeTab === "solicitudes-atletas" ? "active" : ""}`}
              onClick={() => setActiveTab("solicitudes-atletas")}
            >
              <UserCheck size={18} />
              Solicitudes de Atletas ({athleteRequests.length})
            </button>
            <button
              className={`tab-btn tap-ripple ${activeTab === "mis-atletas" ? "active" : ""}`}
              onClick={() => setActiveTab("mis-atletas")}
            >
              <Users size={18} />
              Mis Atletas ({myAthletes.length})
            </button>
            <button
              className={`tab-btn tap-ripple ${activeTab === "horarios" ? "active" : ""}`}
              onClick={() => setActiveTab("horarios")}
            >
              <Clock size={18} />
              Horarios de Gimnasio
            </button>
            <button
              className={`tab-btn tap-ripple ${activeTab === "citas" ? "active" : ""}`}
              onClick={() => setActiveTab("citas")}
            >
              <CalendarClock size={18} />
              Citas
            </button>
            <button
              className={`tab-btn tap-ripple ${activeTab === "configuracion" ? "active" : ""}`}
              onClick={() => setActiveTab("configuracion")}
            >
              <Settings size={18} />
              Configuración
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {activeTab === "solicitudes-atletas" ? (
            <div className="section">
              <div className="section-title">
                <UserCheck size={20} />
                <h3>Solicitudes de Atletas Pendientes</h3>
                <span className="badge badge-warning">
                  {athleteRequests.length}
                </span>
              </div>

              {athleteRequests.length === 0 ? (
                <Card className="empty-state-card">
                  <Inbox size={36} className="empty-state-icon" />
                  <p className="empty-state">
                    No hay solicitudes pendientes de atletas.
                  </p>
                  <p className="empty-state-hint">
                    Cuando un atleta te busque y envíe una solicitud, aparecerá
                    aquí para que la aceptes o rechaces.
                  </p>
                </Card>
              ) : (
                <div className="athlete-requests-grid">
                  {athleteRequests.map((request) => (
                    <Card
                      key={request.id}
                      hover
                      glass
                      className="athlete-request-card"
                    >
                      <div className="card-header-custom">
                        <div className="client-icon">
                          <User size={20} />
                        </div>
                        <h4>{request.athleteName}</h4>
                      </div>
                      <div className="card-body-custom">
                        <div className="info-row">
                          <span className="label">Email:</span>
                          <span className="value">{request.athleteEmail}</span>
                        </div>
                        {request.message && (
                          <div className="info-row">
                            <span className="label">Mensaje:</span>
                            <span className="value">{request.message}</span>
                          </div>
                        )}
                        <div className="info-row date">
                          <span>
                            Solicitud:{" "}
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="request-actions">
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<UserCheck size={16} />}
                          loading={processingRequestId === request.id}
                          disabled={
                            isAthleteLimitReached &&
                            processingRequestId !== request.id
                          }
                          title={
                            isAthleteLimitReached
                              ? "Llegaste al límite de atletas de tu suscripción"
                              : undefined
                          }
                          onClick={() => handleAcceptRequest(request.id)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<X size={16} />}
                          loading={processingRequestId === request.id}
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          Rechazar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "mis-atletas" ? (
            <div className="section">
              <div className="section-title">
                <User size={20} />
                <h3>Mis Atletas Activos</h3>
                <span className="badge badge-success">{myAthletes.length}</span>
              </div>

              {myAthletes.length === 0 ? (
                <Card className="empty-state-card">
                  <Users size={36} className="empty-state-icon" />
                  <p className="empty-state">
                    No tienes atletas activos todavía.
                  </p>
                  <p className="empty-state-hint">
                    Acepta solicitudes en la pestaña “Solicitudes” para empezar
                    a gestionar sus planes.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab("solicitudes-atletas")}
                  >
                    Ver Solicitudes
                  </Button>
                </Card>
              ) : (
                <div className="athletes-list">
                  {myAthletes.map((request) => {
                    const liveAthlete = getAllUsers().find(
                      (u) => u.id === request.athleteId,
                    );
                    return (
                      <Card
                        key={request.id}
                        hover
                        glass
                        className="athlete-active-card"
                      >
                        <div className="athlete-info">
                          <div className="client-icon">
                            <User size={20} />
                          </div>
                          <div className="athlete-details">
                            <h4>{request.athleteName}</h4>
                            <p className="athlete-contact-row">
                              <Mail size={13} />
                              {liveAthlete?.email ||
                                request.athleteEmail ||
                                "Sin correo"}
                            </p>
                            {liveAthlete?.phone && (
                              <p className="athlete-contact-row">
                                <Phone size={13} />
                                {liveAthlete.phone}
                              </p>
                            )}
                            <small>
                              Vinculado desde:{" "}
                              {new Date(
                                request.acceptedAt,
                              ).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<UserX size={16} />}
                          loading={removingAthleteId === request.athleteId}
                          onClick={() =>
                            setAthleteToRemove({
                              athleteId: request.athleteId,
                              athleteName: request.athleteName,
                            })
                          }
                          style={{ color: "var(--color-error)" }}
                        >
                          Quitar
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "horarios" ? (
            <TrainerScheduleConfig />
          ) : activeTab === "citas" ? (
            <TrainerAppointmentCalendar />
          ) : activeTab === "explorar" ? (
            <div className="section">
              <div className="section-title">
                <Users size={20} />
                <h3>Explorar</h3>
              </div>
              <div className="coach-explorar-grid">
                <button
                  className="coach-explorar-card tap-ripple"
                  onClick={() => setActiveTab("solicitudes-atletas")}
                >
                  <span className="coach-explorar-icon requests">
                    <UserCheck size={22} />
                  </span>
                  <span className="coach-explorar-card-text">
                    <strong>Solicitudes de Atletas</strong>
                    <small>
                      {athleteRequests.length === 0
                        ? "No hay solicitudes pendientes"
                        : `${athleteRequests.length} solicitud${athleteRequests.length === 1 ? "" : "es"} pendiente${athleteRequests.length === 1 ? "" : "s"}`}
                    </small>
                  </span>
                  <ChevronRight size={18} className="coach-explorar-chevron" />
                </button>

                <button
                  className="coach-explorar-card tap-ripple"
                  onClick={() => setActiveTab("citas")}
                >
                  <span className="coach-explorar-icon appt">
                    <CalendarClock size={22} />
                  </span>
                  <span className="coach-explorar-card-text">
                    <strong>Citas 1 a 1</strong>
                    <small>Gestiona tu disponibilidad y agenda</small>
                  </span>
                  <ChevronRight size={18} className="coach-explorar-chevron" />
                </button>

                <button
                  className="coach-explorar-card tap-ripple"
                  onClick={() => setActiveTab("horarios")}
                >
                  <span className="coach-explorar-icon gym">
                    <Clock size={22} />
                  </span>
                  <span className="coach-explorar-card-text">
                    <strong>Horarios de Gimnasio</strong>
                    <small>Configura cupos y franjas horarias</small>
                  </span>
                  <ChevronRight size={18} className="coach-explorar-chevron" />
                </button>
              </div>
            </div>
          ) : activeTab === "configuracion" ? (
            <div className="section">
              <div className="section-title">
                <Settings size={20} />
                <h3>Configuración</h3>
              </div>

              {/* Sub-tabs para Ejercicios y Equipamiento */}
              <div className="sub-tabs">
                <button
                  className={`sub-tab-btn tap-ripple ${activeSubTab === "ejercicios" ? "active" : ""}`}
                  onClick={() => setActiveSubTab("ejercicios")}
                >
                  Ejercicios
                </button>
                <button
                  className={`sub-tab-btn tap-ripple ${activeSubTab === "equipamiento" ? "active" : ""}`}
                  onClick={() => setActiveSubTab("equipamiento")}
                >
                  Equipamiento
                </button>
                <button
                  className={`sub-tab-btn tap-ripple ${activeSubTab === "unidades" ? "active" : ""}`}
                  onClick={() => setActiveSubTab("unidades")}
                >
                  Unidades
                </button>
              </div>

              {/* Renderizado condicional de sub-secciones */}
              {activeSubTab === "ejercicios" ? (
                <TrainerExerciseLibrary trainerId={trainerId} />
              ) : activeSubTab === "equipamiento" ? (
                <TrainerEquipmentLibrary trainerId={trainerId} />
              ) : (
                <Card className="units-settings-card">
                  <h4>Unidades de medida</h4>
                  <p className="units-settings-hint">
                    Elige las unidades por defecto para mostrar distancias y
                    pesos al crear o editar planes de entrenamiento.
                  </p>

                  <div className="units-settings-row">
                    <span className="units-settings-label">Distancia</span>
                    <div
                      className="unit-switch"
                      role="group"
                      aria-label="Unidad de distancia"
                    >
                      <button
                        className={`tap-ripple ${planDistanceUnit === "km" ? "active" : ""}`}
                        onClick={() => setPlanDistanceUnit("km")}
                      >
                        KM
                      </button>
                      <button
                        className={`tap-ripple ${planDistanceUnit === "mi" ? "active" : ""}`}
                        onClick={() => setPlanDistanceUnit("mi")}
                      >
                        MI
                      </button>
                    </div>
                  </div>

                  <div className="units-settings-row">
                    <span className="units-settings-label">Peso</span>
                    <div
                      className="unit-switch"
                      role="group"
                      aria-label="Unidad de peso"
                    >
                      <button
                        className={`tap-ripple ${planWeightUnit === "lb" ? "active" : ""}`}
                        onClick={() => setPlanWeightUnit("lb")}
                      >
                        LB
                      </button>
                      <button
                        className={`tap-ripple ${planWeightUnit === "kg" ? "active" : ""}`}
                        onClick={() => setPlanWeightUnit("kg")}
                      >
                        KG
                      </button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <>
              {plansNeedingDecision.length > 0 && (
                <div className="section plan-decision-section">
                  {plansNeedingDecision.map((client) => (
                    <Card key={client.id} className="plan-decision-banner">
                      <button
                        type="button"
                        className="plan-decision-dismiss tap-ripple"
                        aria-label="Descartar aviso"
                        onClick={() => dismissPlanDecision(client)}
                      >
                        <X size={16} />
                      </button>
                      <div className="plan-decision-icon">
                        <CalendarClock size={22} />
                      </div>
                      <div className="plan-decision-text">
                        <strong>
                          El plan de {client.name} llegó a su fecha de
                          finalización
                        </strong>
                        <p>
                          ¿Quieres extender su plan o agendar una cita de cambio
                          de plan?
                        </p>
                      </div>
                      <div className="plan-decision-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<CalendarPlus size={16} />}
                          onClick={() => {
                            setExtendWeeks(1);
                            setClientToExtend(client);
                          }}
                        >
                          Extender Plan
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<CalendarClock size={16} />}
                          onClick={() => schedulePlanChangeAppointment(client)}
                        >
                          Agendar Cita
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="section">
                <div className="section-title">
                  <ClipboardList size={20} />
                  <h3>Atletas por Generar Plan</h3>
                  <span className="badge badge-primary">{pending.length}</span>
                </div>

                {pending.length === 0 ? (
                  <Card className="empty-state-card">
                    <Inbox size={36} className="empty-state-icon" />
                    <p className="empty-state">
                      No hay atletas esperando plan.
                    </p>
                    <p className="empty-state-hint">
                      Los atletas que se vinculen contigo aparecerán aquí listos
                      para que generes su primer plan.
                    </p>
                  </Card>
                ) : (
                  <div className="client-grid">
                    {pending.map((client) => (
                      <Card key={client.id} hover glass className="client-card">
                        <div className="card-header-custom">
                          <div className="client-icon">
                            <User size={20} />
                          </div>
                          <h4>{client.name}</h4>
                        </div>
                        <div className="card-body-custom">
                          <div className="info-row">
                            <span className="label">Objetivo:</span>
                            <span className="value">{client.objective}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Nivel:</span>
                            <span className="value">{client.level}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Duración:</span>
                            <span className="value">
                              {client.planDuration || 4} semanas
                            </span>
                          </div>
                          <div className="info-row date">
                            <span>
                              {new Date(
                                client.submittedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          leftIcon={<Play size={16} />}
                          onClick={() => handleGenerate(client)}
                          className="action-button"
                          disabled={isPlanLimitReached}
                          title={
                            isPlanLimitReached
                              ? "Llegaste al límite de planes activos de tu suscripción"
                              : undefined
                          }
                        >
                          Generar Plan
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="section">
                <div className="section-title">
                  <Play size={20} />
                  <h3>Planes Activos</h3>
                  <span className="badge badge-info">{activePlans.length}</span>
                </div>

                <div className="completed-list">
                  {activePlans.length === 0 ? (
                    <Card className="empty-state-card">
                      <Play size={36} className="empty-state-icon" />
                      <p className="empty-state">No hay planes activos.</p>
                      <p className="empty-state-hint">
                        Genera un plan desde “Atletas por Generar Plan” para que
                        aparezca aquí.
                      </p>
                    </Card>
                  ) : (
                    activePlans.map((client) => (
                      <Card
                        key={client.id}
                        hover
                        glass
                        className="completed-card active-plan-card"
                      >
                        <div className="completed-card-header">
                          <div className="completed-icon active-icon">
                            <Play size={20} />
                          </div>
                          <h4>{client.name}</h4>
                          <span className="badge badge-info">Activo</span>
                        </div>
                        <div className="completed-card-body">
                          <div className="info-row">
                            <span className="label">Objetivo:</span>
                            <span className="value">{client.objective}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Progreso:</span>
                            <span className="value">
                              {client.progress || 0}%
                            </span>
                          </div>
                          {client.endDate && (
                            <div className="info-row">
                              <span className="label">Finaliza:</span>
                              <span className="value">
                                {new Date(client.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="info-row date">
                            <span>
                              Generado:{" "}
                              {new Date(
                                client.planCreatedAt || client.submittedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="active-plan-actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(client)}
                            className="action-button"
                          >
                            Editar Plan
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={<CalendarPlus size={16} />}
                            onClick={() => {
                              setExtendWeeks(1);
                              setClientToExtend(client);
                            }}
                            className="action-button"
                          >
                            Extender Plan
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>

              <div className="section">
                <div className="section-title">
                  <Check size={20} />
                  <h3>Planes Completados</h3>
                  <span className="badge badge-success">
                    {completed.length}
                  </span>
                </div>

                <div className="completed-list">
                  {completed.length === 0 ? (
                    <Card className="empty-state-card">
                      <Check size={36} className="empty-state-icon" />
                      <p className="empty-state">
                        No hay planes completados aún.
                      </p>
                      <p className="empty-state-hint">
                        Cuando un atleta termine su plan, quedará registrado
                        aquí con su progreso final.
                      </p>
                    </Card>
                  ) : (
                    completed.map((client) => (
                      <Card
                        key={client.id}
                        hover
                        glass
                        className="completed-card"
                      >
                        <div className="completed-card-header">
                          <div className="completed-icon">
                            <Check size={20} />
                          </div>
                          <h4>{client.name}</h4>
                          <span className="badge badge-success">
                            Completado
                          </span>
                        </div>
                        <div className="completed-card-body">
                          <div className="info-row">
                            <span className="label">Objetivo:</span>
                            <span className="value">{client.objective}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Progreso:</span>
                            <span className="value">
                              {client.progress || 0}%
                            </span>
                          </div>
                          {client.completedAt && (
                            <div className="info-row">
                              <span className="label">Completado:</span>
                              <span className="value">
                                {new Date(
                                  client.completedAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="info-row date">
                            <span>
                              Generado:{" "}
                              {new Date(
                                client.planCreatedAt || client.submittedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(client)}
                          className="action-button"
                        >
                          Ver Plan
                        </Button>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!athleteToRemove}
        onClose={() => setAthleteToRemove(null)}
        onConfirm={() => handleRemoveAthlete(athleteToRemove?.athleteId)}
        title="Quitar atleta"
        message={`¿Seguro que quieres quitar a ${athleteToRemove?.athleteName || "este atleta"} de tu lista? Podrá volver a enviarte una solicitud más adelante.`}
        confirmText="Quitar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={removingAthleteId === athleteToRemove?.athleteId}
      />

      <ConfirmDialog
        isOpen={!!clientToExtend}
        onClose={() => setClientToExtend(null)}
        onConfirm={handleExtendPlan}
        title="Extender plan"
        message={`¿Cuántas semanas más necesita ${clientToExtend?.name || "el atleta"} para completar su plan? La fecha de finalización se moverá y se agregarán semanas nuevas con el mismo patrón de entrenamiento.`}
        confirmText={`Extender ${extendWeeks} semana${extendWeeks > 1 ? "s" : ""}`}
        cancelText="Cancelar"
        variant="info"
        isLoading={extendingPlanId === clientToExtend?.id}
      >
        <div
          className="extend-weeks-chips"
          role="group"
          aria-label="Semanas a extender"
        >
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`extend-week-chip tap-ripple ${extendWeeks === n ? "active" : ""}`}
              onClick={() => setExtendWeeks(n)}
            >
              {n} semana{n > 1 ? "s" : ""}
            </button>
          ))}
        </div>
      </ConfirmDialog>

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--space-4);
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-6);
          border-bottom: 2px solid var(--color-border);
        }
        .dashboard-header h2 {
          margin: 0 0 0.5rem 0;
        }
        .limits-display {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0.5rem;
        }
        .limit-meter {
          min-width: 160px;
          padding: 0.5rem 0.75rem;
          background: var(--color-bg-subtle);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
        }
        .limit-meter-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
        }
        .limit-meter-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .limit-meter-value {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }
        .limit-meter-track {
          height: 6px;
          border-radius: var(--radius-full);
          background: var(--color-border);
          overflow: hidden;
        }
        .limit-meter-fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: var(--color-primary);
          transition: width var(--transition-normal) ease;
        }
        .limit-meter.warning .limit-meter-fill {
          background: #fbbf24;
        }
        .limit-meter.warning .limit-meter-value {
          color: #fbbf24;
        }
        .limit-meter.reached {
          border-color: var(--color-error);
        }
        .limit-meter.reached .limit-meter-fill {
          background: var(--color-error);
        }
        .limit-meter.reached .limit-meter-value {
          color: var(--color-error);
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            flex-wrap: wrap;
            max-width: 100%;
            min-width: 0;
        }
        .tabs {
            display: flex;
            gap: var(--space-1);
            background: var(--color-bg-subtle);
            padding: var(--space-1);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
            box-shadow: var(--shadow-sm);
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }
        .tabs::-webkit-scrollbar {
            display: none;
        }
        .tab-btn {
            background: transparent;
            border: none;
            padding: var(--space-3) var(--space-5);
            border-radius: var(--radius-md);
            color: var(--color-text-muted);
            cursor: pointer;
            font-weight: 600;
            font-size: var(--text-sm);
            transition: all var(--transition-normal);
            position: relative;
            min-height: var(--touch-target-min);
            display: inline-flex;
            align-items: center;
            gap: var(--space-2);
            justify-content: center;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .tab-btn svg {
            transition: transform 0.2s ease;
        }
        @media (hover: hover) {
            .tab-btn:not(.active):hover svg {
                transform: scale(1.15);
            }
        }
        .tab-btn:hover {
            color: var(--color-text);
            background: var(--color-surface-hover);
        }
        .tab-btn:active {
            transform: scale(0.96);
        }
        .tab-btn.active {
            background: var(--color-primary);
            color: white;
            box-shadow: var(--shadow-md);
            transform: translateY(-1px);
        }
        .tab-btn.active:active {
            transform: translateY(-1px) scale(0.96);
        }
        .tab-btn.active svg {
            transform: scale(1.08);
        }
        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 80%;
            height: 3px;
            background: var(--color-primary-glow);
            border-radius: var(--radius-full);
            animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .dashboard-header h2 {
          background: var(--color-primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .section {
          margin-bottom: var(--space-10);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        
        .section-title h3 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* Hub de "Explorar" (mobile): accesos a Solicitudes/Citas/Horarios,
           mismo patrón visual que ExplorarTab del rol Atleta. */
        .coach-explorar-grid {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .coach-explorar-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          width: 100%;
          min-height: var(--touch-target-large);
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          text-align: left;
          transition: transform var(--transition-fast), border-color var(--transition-fast);
        }
        .coach-explorar-card:active { transform: scale(0.98); }
        .coach-explorar-card:hover { border-color: var(--color-border-hover); }
        .coach-explorar-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .coach-explorar-icon.requests { background: var(--color-warning-bg); color: var(--color-warning); }
        .coach-explorar-icon.appt { background: var(--color-accent-bg); color: var(--color-accent); }
        .coach-explorar-icon.gym { background: var(--color-primary-bg); color: var(--color-primary); }
        .coach-explorar-card-text { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .coach-explorar-card-text strong { font-size: var(--text-base); color: var(--color-text-primary); }
        .coach-explorar-card-text small { color: var(--color-text-muted); font-size: var(--text-sm); }
        .coach-explorar-chevron { color: var(--color-text-subtle); flex-shrink: 0; }
        
        .badge {
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid;
        }
        
        .badge-primary {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
          border-color: rgba(139, 92, 246, 0.3);
        }
        
        .badge-info {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .badge-success {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.3);
        }

        .badge-warning {
          background: rgba(251, 191, 36, 0.15);
          color: #f59e0b;
          border-color: rgba(251, 191, 36, 0.3);
        }
        
        .client-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-6);
        }

        /* Estilos para solicitudes de atletas */
        .athlete-requests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-6);
        }

        .athlete-request-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .request-actions {
          display: flex;
          gap: var(--space-3);
          padding-top: var(--space-3);
          border-top: 1px solid var(--color-border);
        }

        .request-actions button {
          flex: 1;
        }

        /* Estilos para atletas activosLista */
        .athletes-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .athlete-active-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
        }

        .athlete-info {
          display: flex;
          align-items: center;
          gap: var(--space-4);   
          flex: 1;
        }

        .athlete-details {
          flex: 1;
        }

        .athlete-details h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          color: var(--color-text);
        }

        .athlete-details p {
          margin: 0.25rem 0;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
        }

        .athlete-contact-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .athlete-contact-row svg { color: var(--color-text-muted); flex-shrink: 0; }

        .athlete-details small {
          color: var(--color-text-muted);
          font-size: 0.75rem;
        }
        
        /* Los 6 tabs con texto completo no entran hasta ~1100px de ancho.
           En vez de comprimirlos o dejarlos cortados, se ocultan y el
           BottomNav (App.tsx, extendido para el rol Entrenador hasta
           1100px, ver BottomNav.css) asume la navegación en este rango. */
        @media (max-width: 1100px) {
          .tabs {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
          }
          .client-grid,
          .athlete-requests-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }
          .athlete-active-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .request-actions {
            width: 100%;
          }
        }
        .client-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        
        .card-header-custom {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        
        .client-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: rgba(139, 92, 246, 0.15);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card-header-custom h4 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: 600;
        }
        
        .card-body-custom {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-sm);
        }
        
        .info-row .label {
          color: var(--color-text-muted);
          font-weight: 500;
        }
        
        .info-row .value {
          color: var(--color-text);
          font-weight: 600;
        }
        
        .info-row.date {
          color: var(--color-text-subtle);
          font-size: var(--text-xs);
          justify-content: flex-end;
          margin-top: var(--space-2);
        }
        
        .action-button {
          width: 100%;
          margin-top: var(--space-2);
        }

        .active-plan-actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-top: var(--space-2);
        }

        .active-plan-actions .action-button {
          margin-top: 0;
        }

        .extend-weeks-chips {
          display: flex;
          gap: var(--space-2);
          justify-content: center;
          flex-wrap: wrap;
          margin-top: var(--space-4);
        }

        .extend-week-chip {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full, 999px);
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          font-size: var(--text-sm);
          font-weight: 600;
          cursor: pointer;
          min-height: var(--touch-target-min, 44px);
          transition: all 0.15s ease;
        }

        .extend-week-chip.active {
          background: var(--color-primary);
          border-color: var(--color-primary);
          color: white;
        }

        .plan-decision-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .plan-decision-banner {
          position: relative;
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
          padding: var(--space-4);
          border: 1px solid var(--color-warning);
          background: color-mix(in srgb, var(--color-warning) 10%, transparent);
        }

        .plan-decision-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: var(--radius-full, 999px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--color-warning) 20%, transparent);
          color: var(--color-warning);
        }

        .plan-decision-text {
          flex: 1;
          min-width: 200px;
        }

        .plan-decision-text strong {
          display: block;
          color: var(--color-text);
          margin-bottom: var(--space-1);
        }

        .plan-decision-text p {
          margin: 0;
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .plan-decision-actions {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .plan-decision-dismiss {
          position: absolute;
          top: var(--space-2);
          right: var(--space-2);
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full, 999px);
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .plan-decision-dismiss:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }

        /* Estilos para planes completados */
        .completed-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-6);
        }
        
        .completed-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          opacity: 0.85;
          background: var(--color-surface-subtle);
          border: 2px solid var(--color-success);
          position: relative;
          overflow: hidden;
        }
        
        .completed-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--color-success), var(--color-primary));
        }
        
        .completed-card:hover {
          opacity: 1;
          border-color: var(--color-primary);
        }
        
        .completed-card-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
        }
        
        .completed-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-success);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .active-icon {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        
        .active-plan-card {
          border-color: #3b82f6;
          opacity: 1;
        }
        
        .active-plan-card::before {
          background: linear-gradient(90deg, #3b82f6, var(--color-primary));
        }
        
        .completed-card-header h4 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: 600;
          flex: 1;
          min-width: 120px;
        }
        
        .completed-card-body {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        @media (max-width: 768px) {
          .completed-list {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }
        }
        
        .empty-state {
          color: var(--color-text-muted);
          font-style: italic;
          text-align: center;
          padding: var(--space-8) var(--space-8) 0;
          margin: 0;
        }
        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-2);
          padding: var(--space-8) var(--space-6);
        }
        .empty-state-icon {
          color: var(--color-text-subtle);
          margin-bottom: var(--space-2);
        }
        .empty-state-hint {
          color: var(--color-text-subtle);
          font-size: var(--text-sm);
          max-width: 360px;
          margin: 0 0 var(--space-2);
        }
      `}</style>
    </div>
  );
};

export default CoachDashboard;
