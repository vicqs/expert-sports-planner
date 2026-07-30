import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";
import PlanEditor from "./PlanEditor";
import TrainerScheduleConfig from "./TrainerScheduleConfig";
import TrainerAppointmentCalendar from "./TrainerAppointmentCalendar";
import TrainerExerciseLibrary from "./TrainerExerciseLibrary";
import TrainerEquipmentLibrary from "./TrainerEquipmentLibrary";
import { Card, Button, useToast } from "./ui";
import "@/styles/trainer-library.css";

const CoachDashboard = ({ onExit: _onExit }) => {
  const {
    getPendingClients,
    getCompletedClients,
    getActivePlans,
    updateClientPlan,
    autoCompletePlans,
    athleteRequests: allAthleteRequests,
    acceptTrainerRequest,
    rejectTrainerRequest,
    getTrainerAthletes,
    removeAthlete,
  } = useMockDatabase();
  const { getTrainerId, getUserLimits } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("planes"); // planes, horarios, citas, solicitudes-atletas, mis-atletas, configuracion
  const [activeSubTab, setActiveSubTab] = useState("ejercicios"); // Para sub-tabs en configuración
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPlanObject, setCurrentPlanObject] = useState(null);

  const trainerId = getTrainerId();

  // Auto-complete expired plans on component mount.
  // autoCompletePlans no está memoizada en MockDatabase; se ejecuta
  // intencionalmente una sola vez al montar el componente.
  useEffect(() => {
    autoCompletePlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = getPendingClients(trainerId);
  const activePlans = getActivePlans(trainerId);
  const completed = getCompletedClients(trainerId);

  // Filtrar solicitudes pendientes reactivamente
  const athleteRequests = allAthleteRequests.filter(
    (r) => r.trainerId === trainerId && r.status === "PENDING",
  );
  const myAthletes = getTrainerAthletes(trainerId);

  // Calcular límites
  const totalAthletes = pending.length + activePlans.length;
  const limits = getUserLimits(totalAthletes, activePlans.length);

  const handleGenerate = (client) => {
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
  const handleAcceptRequest = (requestId) => {
    acceptTrainerRequest(requestId);
    addToast("Solicitud aceptada correctamente", "success");
  };

  const handleRejectRequest = (requestId) => {
    rejectTrainerRequest(requestId);
    addToast("Solicitud rechazada", "info");
  };

  const handleRemoveAthlete = (athleteId) => {
    if (window.confirm("¿Estás seguro de quitar a este atleta?")) {
      removeAthlete(trainerId, athleteId);
      addToast("Atleta removido", "info");
    }
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
              <span
                className={`limit-badge ${limits.athletes.current >= limits.athletes.max ? "warning" : ""}`}
              >
                {limits.athletes.current}/
                {limits.athletes.max === Infinity ? "∞" : limits.athletes.max}{" "}
                Atletas
              </span>
              <span
                className={`limit-badge ${limits.plans.current >= limits.plans.max ? "warning" : ""}`}
              >
                {limits.plans.current}/
                {limits.plans.max === Infinity ? "∞" : limits.plans.max} Planes
                Activos
              </span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "planes" ? "active" : ""}`}
              onClick={() => setActiveTab("planes")}
            >
              Planes
            </button>
            <button
              className={`tab-btn ${activeTab === "solicitudes-atletas" ? "active" : ""}`}
              onClick={() => setActiveTab("solicitudes-atletas")}
            >
              Solicitudes ({athleteRequests.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "mis-atletas" ? "active" : ""}`}
              onClick={() => setActiveTab("mis-atletas")}
            >
              Mis Atletas ({myAthletes.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "horarios" ? "active" : ""}`}
              onClick={() => setActiveTab("horarios")}
            >
              Horarios Gym
            </button>
            <button
              className={`tab-btn ${activeTab === "citas" ? "active" : ""}`}
              onClick={() => setActiveTab("citas")}
            >
              Citas
            </button>
            <button
              className={`tab-btn ${activeTab === "configuracion" ? "active" : ""}`}
              onClick={() => setActiveTab("configuracion")}
            >
              <Settings size={18} />
              Configuración
            </button>
          </div>
        </div>
      </div>

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
            <Card>
              <p className="empty-state">
                No hay solicitudes pendientes de atletas.
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
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Aceptar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<X size={16} />}
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
            <Card>
              <p className="empty-state">
                No tienes atletas activos. Acepta solicitudes para comenzar.
              </p>
            </Card>
          ) : (
            <div className="athletes-list">
              {myAthletes.map((request) => (
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
                      <p>{request.athleteEmail}</p>
                      <small>
                        Vinculado desde:{" "}
                        {new Date(request.acceptedAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<UserX size={16} />}
                    onClick={() => handleRemoveAthlete(request.athleteId)}
                    style={{ color: "var(--color-error)" }}
                  >
                    Quitar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "horarios" ? (
        <TrainerScheduleConfig />
      ) : activeTab === "citas" ? (
        <TrainerAppointmentCalendar />
      ) : activeTab === "configuracion" ? (
        <div className="section">
          <div className="section-title">
            <Settings size={20} />
            <h3>Configuración de Biblioteca</h3>
          </div>

          {/* Sub-tabs para Ejercicios y Equipamiento */}
          <div className="sub-tabs">
            <button
              className={`sub-tab-btn ${activeSubTab === "ejercicios" ? "active" : ""}`}
              onClick={() => setActiveSubTab("ejercicios")}
            >
              Ejercicios
            </button>
            <button
              className={`sub-tab-btn ${activeSubTab === "equipamiento" ? "active" : ""}`}
              onClick={() => setActiveSubTab("equipamiento")}
            >
              Equipamiento
            </button>
          </div>

          {/* Renderizado condicional de sub-secciones */}
          {activeSubTab === "ejercicios" ? (
            <TrainerExerciseLibrary trainerId={trainerId} />
          ) : (
            <TrainerEquipmentLibrary trainerId={trainerId} />
          )}
        </div>
      ) : (
        <>
          <div className="section">
            <div className="section-title">
              <Clock size={20} />
              <h3>Solicitudes Pendientes</h3>
              <span className="badge badge-primary">{pending.length}</span>
            </div>

            {pending.length === 0 ? (
              <Card>
                <p className="empty-state">No hay solicitudes nuevas.</p>
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
                          {new Date(client.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      leftIcon={<Play size={16} />}
                      onClick={() => handleGenerate(client)}
                      className="action-button"
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
                <Card>
                  <p className="empty-state">No hay planes activos.</p>
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
                        <span className="value">{client.progress || 0}%</span>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(client)}
                      className="action-button"
                    >
                      Editar Plan
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-title">
              <Check size={20} />
              <h3>Planes Completados</h3>
              <span className="badge badge-success">{completed.length}</span>
            </div>

            <div className="completed-list">
              {completed.length === 0 ? (
                <Card>
                  <p className="empty-state">No hay planes completados aún.</p>
                </Card>
              ) : (
                completed.map((client) => (
                  <Card key={client.id} hover glass className="completed-card">
                    <div className="completed-card-header">
                      <div className="completed-icon">
                        <Check size={20} />
                      </div>
                      <h4>{client.name}</h4>
                      <span className="badge badge-success">Completado</span>
                    </div>
                    <div className="completed-card-body">
                      <div className="info-row">
                        <span className="label">Objetivo:</span>
                        <span className="value">{client.objective}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Progreso:</span>
                        <span className="value">{client.progress || 0}%</span>
                      </div>
                      {client.completedAt && (
                        <div className="info-row">
                          <span className="label">Completado:</span>
                          <span className="value">
                            {new Date(client.completedAt).toLocaleDateString()}
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
        .limit-badge {
          padding: 0.375rem 0.75rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--color-primary);
        }
        .limit-badge.warning {
          background: rgba(251, 191, 36, 0.1);
          border-color: rgba(251, 191, 36, 0.3);
          color: #fbbf24;
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: var(--space-4);
            flex-wrap: wrap;
        }
        .tabs {
            display: flex;
            gap: var(--space-1);
            background: var(--color-bg-subtle);
            padding: var(--space-1);
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
            box-shadow: var(--shadow-sm);
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
            justify-content: center;
        }
        .tab-btn:hover {
            color: var(--color-text);
            background: var(--color-surface-hover);
        }
        .tab-btn.active {
            background: var(--color-primary);
            color: white;
            box-shadow: var(--shadow-md);
            transform: translateY(-1px);
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

        .athlete-details small {
          color: var(--color-text-muted);
          font-size: 0.75rem;
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
          }
          .tabs {
            width: 100%;
            flex-wrap: wrap;
          }
          .tab-btn {
            flex: 1;
            padding: var(--space-3);
            min-width: 80px;
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
        @media (max-width: 480px) {
          .tab-btn {
            font-size: var(--text-xs);
            padding: var(--space-2) var(--space-3);
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
          padding: var(--space-8);
        }
      `}</style>
    </div>
  );
};

export default CoachDashboard;
