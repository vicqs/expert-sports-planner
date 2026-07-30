import React from "react";
import { Card, Button } from "@/components/ui";
import { BarChart3, TrendingUp, Dumbbell, Download } from "lucide-react";
import "@/admin/styles/analytics.css";

const Analytics = ({ stats }) => {
  const handleExport = () => {
    console.log("Exporting report...");
    // Implementar exportación de reportes
    alert("Funcionalidad de exportación en desarrollo");
  };

  return (
    <div className="admin-analytics">
      <div className="section-header">
        <h2>Estadísticas y Análisis</h2>
        <Button
          variant="secondary"
          leftIcon={<Download size={18} />}
          onClick={handleExport}
        >
          Exportar Reporte
        </Button>
      </div>

      <div className="analytics-grid">
        <Card className="analytics-card">
          <h4>
            <BarChart3 size={18} /> Usuarios por Rol
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar trainers"
                style={{
                  height:
                    stats.users.total > 0
                      ? `${(stats.users.trainers / stats.users.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.users.trainers}</span>
              </div>
              <div
                className="bar athletes"
                style={{
                  height:
                    stats.users.total > 0
                      ? `${(stats.users.athletes / stats.users.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.users.athletes}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Entrenadores</span>
              <span>Atletas</span>
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h4>
            <TrendingUp size={18} /> Planes de Entrenamiento
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar active"
                style={{
                  height:
                    stats.plans.total > 0
                      ? `${(stats.plans.active / stats.plans.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.plans.active}</span>
              </div>
              <div
                className="bar completed"
                style={{
                  height:
                    stats.plans.total > 0
                      ? `${(stats.plans.completed / stats.plans.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.plans.completed}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Activos</span>
              <span>Completados</span>
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h4>
            <Dumbbell size={18} /> Estado del Equipamiento
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar available"
                style={{
                  height:
                    stats.equipment.total > 0
                      ? `${(stats.equipment.available / stats.equipment.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.equipment.available}</span>
              </div>
              <div
                className="bar maintenance"
                style={{
                  height:
                    stats.equipment.total > 0
                      ? `${(stats.equipment.maintenance / stats.equipment.total) * 100}%`
                      : "50%",
                }}
              >
                <span>{stats.equipment.maintenance}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Disponible</span>
              <span>Mantenimiento</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="analytics-summary">
        <h4>Resumen General</h4>
        <div className="summary-grid">
          <div className="summary-stat">
            <span className="stat-label">Total Usuarios</span>
            <span className="stat-value">{stats.users.total}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Total Planes</span>
            <span className="stat-value">{stats.plans.total}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Total Equipamiento</span>
            <span className="stat-value">{stats.equipment.total}</span>
          </div>
          <div className="summary-stat">
            <span className="stat-label">Trials Activos</span>
            <span className="stat-value">{stats.users.activeTrials || 0}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
