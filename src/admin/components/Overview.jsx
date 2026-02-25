import React from "react";
import { Card } from "@/components/ui";
import {
  Users,
  Calendar,
  TrendingUp,
  Dumbbell,
  Activity,
  Target,
} from "lucide-react";
import {
  GYM_EXERCISES,
  SESSION_TYPES,
  TRAINING_TYPES,
} from "@/utils/constants";
import "@/admin/styles/overview.css";

const Overview = ({ stats }) => {
  return (
    <div className="admin-overview">
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.users.total}</h3>
            <p>Usuarios Totales</p>
            <small>
              {stats.users.trainers} Trainers • {stats.users.athletes} Atletas
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
