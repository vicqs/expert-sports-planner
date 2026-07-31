import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Modal } from "@/components/ui";
import PulseLoader from "@/components/ui/PulseLoader";
import {
  Users,
  Calendar,
  TrendingUp,
  Dumbbell,
  Activity,
  Target,
  Eye,
  ChevronDown,
  Loader,
} from "lucide-react";
import {
  GYM_EXERCISES,
  SESSION_TYPES,
  TRAINING_TYPES,
} from "@/utils/constants";
import { useAuth } from "@/context/AuthContext";
import { useMockDatabase } from "@/context/MockDatabase";
import { MOCK_PROFILES } from "@/utils/mockProfiles";
import "@/admin/styles/overview.css";

const Overview = ({ stats }) => {
  const { startPreview } = useAuth();
  const { clients, gymBookings, appointments } = useMockDatabase();
  const [profilesOpen, setProfilesOpen] = useState(true);
  const [showLoaderPreview, setShowLoaderPreview] = useState(false);

  // Conteos de data mock por perfil (planes, reservas de gym, citas), para
  // que el admin pueda verificar de un vistazo que los datos de prueba de
  // cada atleta sí existen, sin tener que entrar al "Ver como".
  const mockDataCounts = (userId) => ({
    plans: clients.filter(
      (c) => c.id === userId || c.id === `${userId}-completed-1`,
    ).length,
    gym: gymBookings.filter(
      (b) => b.athleteId === userId && b.status !== "CANCELLED",
    ).length,
    appointments: appointments.filter(
      (a) => a.athleteId === userId && a.status !== "CANCELLED",
    ).length,
  });

  return (
    <div className="admin-overview">
      <Card className="profile-preview-card" style={{ marginBottom: "1.5rem" }}>
        <button
          className="profile-preview-toggle tap-ripple"
          onClick={() => setProfilesOpen((open) => !open)}
          aria-expanded={profilesOpen}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Eye size={20} />
            <h3 style={{ margin: 0 }}>Panel Demo</h3>
          </span>
          <ChevronDown
            size={20}
            className={`profile-preview-chevron ${profilesOpen ? "open" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {profilesOpen && (
            <motion.div
              key="profile-preview-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <p
                style={{
                  color: "var(--color-text-muted)",
                  marginTop: "0.25rem",
                }}
              >
                Ingresa como un perfil de demostración para ver el alcance y
                comportamiento de la app para Entrenadores y Atletas.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  marginTop: "1rem",
                }}
              >
                {MOCK_PROFILES.map((profile) => {
                  const counts =
                    profile.key !== "trainer"
                      ? mockDataCounts(profile.user.id)
                      : null;
                  return (
                    <div
                      key={profile.key}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                      }}
                    >
                      <Button
                        variant="secondary"
                        onClick={() => startPreview(profile.user)}
                        title={profile.description}
                      >
                        Ver como {profile.label}
                      </Button>
                      {counts && (
                        <small style={{ color: "var(--color-text-muted)" }}>
                          {counts.plans} planes • {counts.gym} gym •{" "}
                          {counts.appointments} citas
                        </small>
                      )}
                    </div>
                  );
                })}
                <Button
                  variant="ghost"
                  leftIcon={<Loader size={16} />}
                  onClick={() => setShowLoaderPreview(true)}
                >
                  Ver ícono de carga
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      <Modal
        isOpen={showLoaderPreview}
        onClose={() => setShowLoaderPreview(false)}
        title="Ícono de carga (pulso)"
        size="sm"
      >
        <PulseLoader fullScreen={false} />
      </Modal>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.users.total.toLocaleString("es-ES")}</h3>
            <p>Usuarios Totales</p>
            <small>
              {stats.users.trainers} Entrenadores • {stats.users.athletes}{" "}
              Atletas
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon plans">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.plans.total}</h3>
            <p>Planes de Entrenamiento</p>
            <small>
              {stats.plans.active} Activos • {stats.plans.completed} Completados
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon trials">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.users.activeTrials || 0}</h3>
            <p>Trials Activos</p>
            <small>Plan FREE de 14 días</small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon equipment">
            <Dumbbell size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.equipment.total}</h3>
            <p>Equipamiento Registrado</p>
            <small>
              {stats.equipment.available} Disponible •{" "}
              {stats.equipment.maintenance} Mantenimiento
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon exercises">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>
              {stats.exercises?.total ||
                Object.values(GYM_EXERCISES).reduce(
                  (acc, cat) => acc + cat.length,
                  0,
                )}
            </h3>
            <p>Ejercicios en BD</p>
            <small>{Object.keys(GYM_EXERCISES).length} Categorías</small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon bookings">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>
              {(stats.bookings?.gym || 0) + (stats.bookings?.appointments || 0)}
            </h3>
            <p>Reservas y Citas</p>
            <small>
              {stats.bookings?.gym || 0} Gimnasio •{" "}
              {stats.bookings?.appointments || 0} Citas
            </small>
          </div>
        </Card>
      </div>

      <div className="quick-stats-row">
        <Card className="quick-stat">
          <h4>Tipos de Sesión</h4>
          <div className="stat-items">
            {Object.values(SESSION_TYPES).map((type) => (
              <div key={type.code} className="stat-item">
                <span className="stat-label">{type.code}</span>
                <span className="stat-value">{type.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="quick-stat">
          <h4>Tipos de Entrenamiento</h4>
          <div className="stat-items">
            {Object.values(TRAINING_TYPES)
              .slice(0, 6)
              .map((type) => (
                <div key={type.code} className="stat-item">
                  <span className="stat-label">{type.code}</span>
                  <span className="stat-value">{type.name}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
