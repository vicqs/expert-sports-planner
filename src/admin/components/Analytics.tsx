/**
 * Analytics - estadísticas y reportes del panel Admin.
 *
 * Responsabilidad: gráficos de barras CSS (registros por mes, conversión de
 * trial a pago, usuarios por rol, planes, equipamiento) y exportación CSV.
 * Lo usa: AdminDashboard (vista "analytics"), que le pasa `stats`.
 * Datos: usuarios vía useUsers (localStorage "users"); no escribe nada.
 * Efectos: descarga de archivo CSV y toast al exportar.
 */
import React, { useMemo, useState } from "react";
import { Card, Button, useToast } from "@/components/ui";
import { BarChart3, TrendingUp, Dumbbell, Download } from "lucide-react";
import { useUsers } from "@/admin/hooks";
import { ROLES } from "@/utils/auth";
import { buildCsv, downloadCsv } from "@/admin/utils/csv";
import "@/admin/styles/analytics.css";
import "@/admin/styles/admin-extras.css";

/** Rangos de meses seleccionables para "Registros por mes". */
const RANGES = [3, 6, 12];
const MONTHS_ES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

/**
 * Altura de una barra como % del valor máximo del gráfico. Mínimos: 2% si el
 * valor es 0 (barra siempre visible) y 8% si es > 0 (que no parezca vacía).
 */
const barHeight = (value: number, values: number[]) => {
  const max = Math.max(...values, 0);
  if (max === 0) return "2%";
  return `${Math.max((value / max) * 100, value > 0 ? 8 : 2)}%`;
};

/**
 * Vista de análisis del administrador.
 *
 * @param props.stats Estadísticas de AdminDashboard: `users` (trainers,
 *   athletes, admins, total, activeTrials), `plans` (active, completed,
 *   total) y `equipment` (available, maintenance, outOfService, overdue,
 *   total).
 */
const Analytics = ({ stats }) => {
  const { addToast } = useToast();
  const { users } = useUsers();
  const [months, setMonths] = useState(6);

  // Cohorte = usuarios no admin registrados dentro del rango. `trend` cuenta
  // altas por mes (buckets calendario del más antiguo al actual) y `cohort`
  // calcula la conversión: planes de pago ACTIVOS / registros del rango.
  const { trend, cohort } = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: months }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - (months - 1 - i),
        1,
      );
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MONTHS_ES[d.getMonth()],
        count: 0,
      };
    });
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - (months - 1),
      1,
    ).getTime();
    const inRange = users.filter(
      (u) => u.role !== ROLES.ADMIN && new Date(u.createdAt).getTime() >= start,
    );
    inRange.forEach((u) => {
      const d = new Date(u.createdAt);
      const b = buckets.find(
        (x) => x.key === `${d.getFullYear()}-${d.getMonth()}`,
      );
      if (b) b.count += 1;
    });
    const paid = inRange.filter(
      (u) =>
        u.subscription?.plan !== "FREE" && u.subscription?.status === "ACTIVE",
    ).length;
    const expired = inRange.filter(
      (u) => u.subscription?.status === "EXPIRED",
    ).length;
    return {
      trend: buckets,
      cohort: {
        total: inRange.length,
        paid,
        expired,
        rate: inRange.length ? Math.round((paid / inRange.length) * 100) : 0,
      },
    };
  }, [users, months]);

  /** Altas del mes actual vs el anterior (independiente del rango). */
  const comparison = useMemo(() => {
    const now = new Date();
    const countIn = (offset: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return users.filter((u) => {
        if (u.role === ROLES.ADMIN) return false;
        const c = new Date(u.createdAt);
        return (
          c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
        );
      }).length;
    };
    const current = countIn(0);
    const previous = countIn(1);
    const delta = previous
      ? Math.round(((current - previous) / previous) * 100)
      : null;
    return { current, previous, delta };
  }, [users]);

  /** Genera y descarga el reporte CSV (con BOM UTF-8 para Excel). */
  const handleExport = () => {
    const rows: [string, string | number][] = [
      ["Fecha del reporte", new Date().toLocaleString("es-ES")],
      [`Registros (últimos ${months} meses)`, cohort.total],
      ["Convertidos a plan de pago", cohort.paid],
      ["Trials vencidos", cohort.expired],
      ["Conversión (%)", cohort.rate],
      ["Altas mes actual", comparison.current],
      ["Altas mes anterior", comparison.previous],
      ...trend.map((t): [string, number] => [`Registros ${t.label}`, t.count]),
      ["Total usuarios", stats.users.total],
      ["Entrenadores", stats.users.trainers],
      ["Atletas", stats.users.athletes],
      ["Administradores", stats.users.admins],
      ["Trials activos", stats.users.activeTrials || 0],
      ["Planes activos", stats.plans.active],
      ["Planes completados", stats.plans.completed],
      ["Total planes", stats.plans.total],
      ["Equipamiento total", stats.equipment.total],
      ["Equipamiento disponible", stats.equipment.available],
      ["Equipamiento en mantenimiento", stats.equipment.maintenance],
      ["Equipamiento fuera de servicio", stats.equipment.outOfService || 0],
      ["Mantenimientos vencidos", stats.equipment.overdue || 0],
    ];
    downloadCsv(
      `reporte-admin-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(["Métrica", "Valor"], rows),
    );
    addToast("Reporte exportado", "success");
  };

  const userValues = [stats.users.trainers, stats.users.athletes];
  const planValues = [stats.plans.active, stats.plans.completed];
  const equipValues = [
    stats.equipment.available,
    stats.equipment.maintenance,
    stats.equipment.outOfService || 0,
  ];

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
            <TrendingUp size={18} /> Registros por mes
          </h4>
          <div
            role="group"
            aria-label="Rango de meses"
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}
          >
            {RANGES.map((m) => (
              <Button
                key={m}
                size="sm"
                variant={m === months ? "primary" : "secondary"}
                onClick={() => setMonths(m)}
              >
                {m} meses
              </Button>
            ))}
          </div>
          <div className="chart-placeholder">
            <div className="bar-chart">
              {trend.map((t) => (
                <div
                  key={t.key}
                  className="bar athletes"
                  style={{
                    height: barHeight(
                      t.count,
                      trend.map((x) => x.count),
                    ),
                  }}
                >
                  <span>{t.count}</span>
                </div>
              ))}
            </div>
            <div className="chart-labels">
              {trend.map((t) => (
                <span key={t.key}>{t.label}</span>
              ))}
            </div>
            {trend.every((t) => t.count === 0) && <small>Sin datos</small>}
          </div>
          <small style={{ color: "var(--color-text-muted)" }}>
            Este mes: {comparison.current} • Mes anterior: {comparison.previous}
            {comparison.delta !== null &&
              ` • ${comparison.delta > 0 ? "+" : ""}${comparison.delta}%`}
          </small>
        </Card>

        <Card className="analytics-card">
          <h4>
            <BarChart3 size={18} /> Conversión de trial a pago
          </h4>
          <p className="stat-value" style={{ fontSize: "2rem", margin: 0 }}>
            {cohort.rate}%
          </p>
          <small style={{ color: "var(--color-text-muted)" }}>
            {cohort.paid} de {cohort.total} registros de los últimos {months}{" "}
            meses • {cohort.expired} trials vencidos sin conversión
          </small>
        </Card>

        <Card className="analytics-card">
          <h4>
            <BarChart3 size={18} /> Usuarios por Rol
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar trainers"
                style={{ height: barHeight(userValues[0], userValues) }}
              >
                <span>{stats.users.trainers}</span>
              </div>
              <div
                className="bar athletes"
                style={{ height: barHeight(userValues[1], userValues) }}
              >
                <span>{stats.users.athletes}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Entrenadores</span>
              <span>Atletas</span>
            </div>
            {userValues[0] + userValues[1] === 0 && <small>Sin datos</small>}
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
                style={{ height: barHeight(planValues[0], planValues) }}
              >
                <span>{stats.plans.active}</span>
              </div>
              <div
                className="bar completed"
                style={{ height: barHeight(planValues[1], planValues) }}
              >
                <span>{stats.plans.completed}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Activos</span>
              <span>Completados</span>
            </div>
            {planValues[0] + planValues[1] === 0 && <small>Sin datos</small>}
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
                style={{ height: barHeight(equipValues[0], equipValues) }}
              >
                <span>{stats.equipment.available}</span>
              </div>
              <div
                className="bar maintenance"
                style={{ height: barHeight(equipValues[1], equipValues) }}
              >
                <span>{stats.equipment.maintenance}</span>
              </div>
              <div
                className="bar bar-outofservice"
                style={{ height: barHeight(equipValues[2], equipValues) }}
              >
                <span>{stats.equipment.outOfService || 0}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Disponible</span>
              <span>Mantenimiento</span>
              <span>Fuera de servicio</span>
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
          <div className="summary-stat">
            <span className="stat-label">Mantenimientos vencidos</span>
            <span className="stat-value">{stats.equipment.overdue || 0}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
