import React, { useState, useMemo } from "react";
import { Button, Card, useToast } from "./ui";
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Clock,
  CheckCircle,
  Circle,
  Flag,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockDatabase } from "../context/MockDatabase";
import ExerciseSessionView from "./training/ExerciseSessionView";
import { formatShortDate } from "../utils/dateNav";

// `generatePlan()` (src/utils/generator.ts) y `PlanEditor.tsx` producen días
// con forma `{ dayName, isGym, session }` (donde `session` es null en días de
// descanso), NO el shape plano `{ sessionType, exercises }` que este
// visualizador esperaba antes. Estos helpers derivan lo que se necesita para
// mostrar directamente desde `day.session`/`day.isGym`, evitando mantener una
// copia duplicada de los datos que podría quedar desincronizada.
const getSessionType = (day) => {
  if (!day?.session) return "REST";
  return day.isGym ? "GYM" : "ATHLETICS";
};

// Etiqueta en español para mostrar en la UI (`getSessionType` se mantiene en
// inglés porque también se usa para armar la clase CSS `.session-type-badge.*`).
const SESSION_TYPE_LABELS = {
  REST: "Descanso",
  GYM: "Gimnasio",
  ATHLETICS: "Atletismo",
};

const getSessionTypeLabel = (day) =>
  SESSION_TYPE_LABELS[getSessionType(day)] || getSessionType(day);

const getDayExercises = (day) => {
  if (day?.isGym) return day.session?.exercises || [];
  return [];
};

const PlanDetail = ({ plan, client, onBack }) => {
  const [activeTab, setActiveTab] = useState("today"); // today, calendar, exercises
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);
  const [noteModal, setNoteModal] = useState<any>(null); // { weekIndex, dayIndex, note }
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [gymMode, setGymMode] = useState(false);
  const [showGymModeModal, setShowGymModeModal] = useState(false);
  const {
    toggleSessionCompletion,
    updateSessionNote,
    completePlan,
    toggleSetCompletion,
  } = useMockDatabase();
  const { addToast } = useToast();

  // Compute which week/day corresponds to "today" based on the plan start date.
  // Falls back to week 0 / day 0 when there is no start date or plan hasn't started yet.
  const todayIndex = useMemo(() => {
    if (!client.startDate) return { weekIndex: 0, dayIndex: 0 };
    const start = new Date(client.startDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0) return { weekIndex: 0, dayIndex: 0 };
    const daysPerWeek = plan[0]?.days?.length || 7;
    const weekIndex = Math.min(
      Math.floor(diffDays / daysPerWeek),
      plan.length - 1,
    );
    const dayIndex = Math.min(
      diffDays % daysPerWeek,
      (plan[weekIndex]?.days?.length || 1) - 1,
    );
    return { weekIndex, dayIndex };
  }, [client.startDate, plan]);

  const [todayCursor, setTodayCursor] = useState(todayIndex);

  const goToDay = (direction) => {
    setTodayCursor((prev) => {
      const daysInWeek = plan[prev.weekIndex]?.days?.length || 7;
      let { weekIndex, dayIndex } = prev;
      dayIndex += direction;
      if (dayIndex < 0) {
        weekIndex = Math.max(0, weekIndex - 1);
        dayIndex = (plan[weekIndex]?.days?.length || daysInWeek) - 1;
      } else if (dayIndex >= daysInWeek) {
        weekIndex = Math.min(plan.length - 1, weekIndex + 1);
        dayIndex = 0;
      }
      return { weekIndex, dayIndex };
    });
  };

  const todayDay = plan[todayCursor.weekIndex]?.days?.[todayCursor.dayIndex];

  // Fecha calendario real que corresponde al día actualmente mostrado en la
  // pestaña "Hoy", derivada de `client.startDate` + el offset de semana/día
  // del cursor. Permite mostrar (y editar) un selector de fecha nativo igual
  // al usado en "Reservar Gimnasio", en vez de solo el nombre del día.
  const daysPerWeek = plan[0]?.days?.length || 7;
  const todayCursorDateString = useMemo(() => {
    if (!client.startDate) return null;
    const start = new Date(client.startDate);
    const offset = todayCursor.weekIndex * daysPerWeek + todayCursor.dayIndex;
    const d = new Date(start);
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  }, [client.startDate, todayCursor, daysPerWeek]);

  // Convierte una fecha elegida en el selector nativo al par
  // { weekIndex, dayIndex } correspondiente dentro del plan, para saltar
  // directamente a ese día (clamp a los límites del plan).
  const handlePickDate = (dateStr: string) => {
    if (!client.startDate) return;
    const start = new Date(client.startDate);
    const picked = new Date(`${dateStr}T00:00:00`);
    const diffDays = Math.floor(
      (picked.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const clampedOffset = Math.max(0, diffDays);
    const weekIndex = Math.min(
      Math.floor(clampedOffset / daysPerWeek),
      plan.length - 1,
    );
    const dayIndex = Math.min(
      clampedOffset % daysPerWeek,
      (plan[weekIndex]?.days?.length || 1) - 1,
    );
    setTodayCursor({ weekIndex, dayIndex });
  };

  // Helper to get days for the selected week
  const currentWeekDays = plan[selectedWeek]?.days || [];

  // Catálogo agregado de ejercicios de todo el plan, para la pestaña "Ejercicios".
  // Se agrupa por nombre (case-insensitive) y se cuentan las sesiones donde aparece,
  // útil para que el atleta vea de un vistazo qué se repite más en su plan.
  const exerciseCatalog = useMemo(() => {
    const map = new Map<
      string,
      { name: string; sessions: number; variants: Set<string> }
    >();
    plan.forEach((week) => {
      (week.days || []).forEach((day) => {
        getDayExercises(day).forEach((ex) => {
          const key = ex.name.trim().toLowerCase();
          const entry = map.get(key) || {
            name: ex.name,
            sessions: 0,
            variants: new Set<string>(),
          };
          entry.sessions += 1;
          entry.variants.add(`${ex.sets}×${ex.reps}`);
          map.set(key, entry);
        });
      });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [plan]);

  const handleToggleComplete = (dayIndex) => {
    toggleSessionCompletion(client.id, selectedWeek, dayIndex);
  };

  const handleToggleTodayComplete = () => {
    toggleSessionCompletion(
      client.id,
      todayCursor.weekIndex,
      todayCursor.dayIndex,
    );
  };

  const handleSaveNote = (weekIndex, dayIndex, note) => {
    updateSessionNote(client.id, weekIndex, dayIndex, note);
  };

  const handleFinishPlan = () => {
    completePlan(client.id);
    addToast("Plan finalizado correctamente", "success");
    setShowFinishModal(false);
    setTimeout(() => onBack(), 500);
  };

  const handleGymModeToggleClick = () => {
    if (gymMode) {
      // Salir no necesita confirmación, solo entrar (para que sea evidente
      // qué hace antes de activarlo la primera vez).
      setGymMode(false);
      return;
    }
    setShowGymModeModal(true);
  };

  const handleConfirmGymMode = () => {
    setGymMode(true);
    setShowGymModeModal(false);
    addToast("Modo Gym activado: pantalla de alto contraste", "success");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysRemaining = () => {
    if (!client.endDate) return null;
    const now = new Date();
    const end = new Date(client.endDate);
    const diff = Math.ceil(
      (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff;
  };

  const daysRemaining = getDaysRemaining();
  const isActive = client.status === "ACTIVE";

  return (
    <div className="plan-detail">
      <div className="detail-header">
        <Button
          variant="ghost"
          leftIcon={<ArrowLeft size={18} />}
          onClick={onBack}
        >
          Volver
        </Button>
        <div className="header-content">
          <div className="header-top">
            <h2>{plan.name || "Plan de Entrenamiento"}</h2>
            <span className={`status-badge ${client.status.toLowerCase()}`}>
              {client.status === "ACTIVE"
                ? "Activo"
                : client.status === "COMPLETED"
                  ? "Completado"
                  : "Pendiente"}
            </span>
          </div>
          <div className="plan-meta-tags">
            <span className="tag">{plan.objective}</span>
            <span className="tag">{plan.length} semanas</span>
            {client.progress >= 0 && (
              <span className="tag progress-tag">
                {client.progress}% completado
              </span>
            )}
          </div>
          {client.startDate && client.endDate && (
            <div className="plan-dates">
              <span className="date-info">
                <Calendar size={14} />
                {formatDate(client.startDate)} - {formatDate(client.endDate)}
              </span>
              {daysRemaining !== null && isActive && (
                <span
                  className={`days-remaining ${daysRemaining <= 7 ? "warning" : ""}`}
                >
                  {daysRemaining > 0
                    ? `${daysRemaining} días restantes`
                    : "Plan expirado"}
                </span>
              )}
            </div>
          )}
        </div>
        {isActive && (
          <Button
            variant="ghost"
            leftIcon={<Flag size={18} />}
            onClick={() => setShowFinishModal(true)}
            className="finish-plan-btn"
          >
            Finalizar Plan
          </Button>
        )}
        <button
          className={`gym-mode-toggle ${gymMode ? "active" : "pulse"}`}
          onClick={handleGymModeToggleClick}
          title="Modo Gym: pantalla de alto contraste, sin distracciones"
        >
          <Zap size={16} /> Modo Gym
        </button>
      </div>

      {gymMode && (
        <div className="gym-mode-banner">
          <Zap size={18} />
          <span>
            <strong>Modo Gym activo</strong> · pantalla de alto contraste, sin
            distracciones
          </span>
          <button
            className="gym-mode-exit-btn"
            onClick={() => setGymMode(false)}
          >
            Salir
          </button>
        </div>
      )}

      <div className="detail-tabs">
        <button
          className={`tab-btn ${activeTab === "today" ? "active" : ""}`}
          onClick={() => setActiveTab("today")}
        >
          <Zap size={18} /> Hoy
        </button>
        <button
          className={`tab-btn ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          <Calendar size={18} /> Calendario
        </button>
        <button
          className={`tab-btn ${activeTab === "exercises" ? "active" : ""}`}
          onClick={() => setActiveTab("exercises")}
        >
          <Dumbbell size={18} /> Ejercicios
        </button>
      </div>

      <div className={`detail-content ${gymMode ? "gym-mode" : ""}`}>
        {activeTab === "today" && (
          <div className="today-view">
            <div className="today-nav">
              <button
                className="today-nav-btn"
                onClick={() => goToDay(-1)}
                aria-label="Día anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="today-nav-center">
                <span className="today-day-name">
                  {todayDay?.dayName || "—"}
                </span>
                {todayCursorDateString && (
                  <div className="today-date-picker">
                    <Calendar size={14} />
                    <span>{formatShortDate(todayCursorDateString)}</span>
                    <input
                      type="date"
                      value={todayCursorDateString}
                      onChange={(e) => handlePickDate(e.target.value)}
                      onClick={(e) => {
                        const el = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        if (typeof el.showPicker === "function") {
                          try {
                            el.showPicker();
                          } catch {
                            /* algunos navegadores lanzan si no hay gesto de usuario activo */
                          }
                        }
                      }}
                      aria-label="Elegir fecha"
                      title="Elegir fecha"
                    />
                  </div>
                )}
              </div>
              <button
                className="today-nav-btn"
                onClick={() => goToDay(1)}
                aria-label="Día siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {todayDay ? (
              <Card className="today-card">
                <div className="today-card-header">
                  <span
                    className={`session-type-badge ${getSessionType(todayDay).toLowerCase()}`}
                  >
                    {getSessionTypeLabel(todayDay)}
                  </span>
                  {todayDay.completed && (
                    <span className="today-completed-badge">
                      <CheckCircle size={16} /> Completado
                    </span>
                  )}
                </div>

                {getSessionType(todayDay) === "REST" ? (
                  <p className="rest-text today-rest-text">
                    Día de descanso o recuperación activa.
                  </p>
                ) : getSessionType(todayDay) === "GYM" ? (
                  <ExerciseSessionView
                    exercises={getDayExercises(todayDay)}
                    dayNote={todayDay.note || ""}
                    onSaveDayNote={(note) =>
                      handleSaveNote(
                        todayCursor.weekIndex,
                        todayCursor.dayIndex,
                        note,
                      )
                    }
                    onToggleSet={(exerciseIndex, setIndex) =>
                      toggleSetCompletion(
                        client.id,
                        todayCursor.weekIndex,
                        todayCursor.dayIndex,
                        exerciseIndex,
                        setIndex,
                      )
                    }
                  />
                ) : (
                  <div className="today-exercises">
                    {todayDay.session?.training && (
                      <div className="today-exercise-row">
                        <span className="today-ex-name">Entrenamiento</span>
                        <span className="today-ex-sets">
                          {todayDay.session.training?.name ||
                            todayDay.session.training}
                        </span>
                      </div>
                    )}
                    {todayDay.session?.warmup && (
                      <div className="today-exercise-row">
                        <span className="today-ex-name">Calentamiento</span>
                        <span className="today-ex-sets">
                          {todayDay.session.warmup}
                        </span>
                      </div>
                    )}
                    {todayDay.session?.mainBlock && (
                      <div className="today-exercise-row">
                        <span className="today-ex-name">Bloque principal</span>
                        <span className="today-ex-sets">
                          {todayDay.session.mainBlock}
                        </span>
                      </div>
                    )}
                    {todayDay.session?.cooldown && (
                      <div className="today-exercise-row">
                        <span className="today-ex-name">Enfriamiento</span>
                        <span className="today-ex-sets">
                          {todayDay.session.cooldown}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {getSessionType(todayDay) !== "REST" && (
                  <div className="today-actions">
                    <Button
                      variant={todayDay.completed ? "success" : "primary"}
                      size="lg"
                      className="today-complete-btn"
                      leftIcon={
                        todayDay.completed ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Circle size={20} />
                        )
                      }
                      onClick={handleToggleTodayComplete}
                    >
                      {todayDay.completed
                        ? "Completado"
                        : "Marcar como Completado"}
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <p className="no-data">No hay datos para este día.</p>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="calendar-view">
            <div className="week-selector">
              {plan.map((week, index) => (
                <button
                  key={week.weekNum}
                  className={`week-chip ${selectedWeek === index ? "active" : ""}`}
                  onClick={() => setSelectedWeek(index)}
                >
                  Semana {week.weekNum}
                </button>
              ))}
            </div>

            <div className="days-list">
              {currentWeekDays.map((day, index) => (
                <Card key={index} className="day-card-detail">
                  <div className="day-header">
                    <h4>{day.dayName}</h4>
                    <span
                      className={`session-type-badge ${getSessionType(day).toLowerCase()}`}
                    >
                      {getSessionTypeLabel(day)}
                    </span>
                  </div>

                  <div className="day-body">
                    {getSessionType(day) === "REST" ? (
                      <p className="rest-text">
                        Día de descanso o recuperación activa.
                      </p>
                    ) : (
                      <div className="session-preview">
                        <div className="preview-item">
                          <Clock size={14} />
                          <span>~60 min</span>
                        </div>
                        <div className="preview-item">
                          <Dumbbell size={14} />
                          <span>
                            {getSessionType(day) === "GYM"
                              ? "Fuerza"
                              : "Cardio"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {getSessionType(day) !== "REST" && (
                    <div className="day-actions">
                      <Button
                        variant={day.completed ? "success" : "secondary"}
                        size="sm"
                        className="start-btn"
                        leftIcon={
                          day.completed ? (
                            <CheckCircle size={16} />
                          ) : (
                            <Circle size={16} />
                          )
                        }
                        onClick={() => handleToggleComplete(index)}
                      >
                        {day.completed
                          ? "Completado"
                          : "Marcar como Completado"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDayDetail(day)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="note-btn"
                        onClick={() =>
                          setNoteModal({
                            weekIndex: selectedWeek,
                            dayIndex: index,
                            note: day.note || "",
                          })
                        }
                      >
                        {day.note ? "Editar Nota" : "Agregar Nota"}
                      </Button>
                    </div>
                  )}
                  {day.note && (
                    <div className="day-note-preview">
                      <strong>Nota:</strong> {day.note}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "exercises" && (
          <div className="exercises-view">
            {exerciseCatalog.length === 0 ? (
              <Card className="empty-exercises">
                <Dumbbell size={36} color="var(--color-text-subtle)" />
                <p>Este plan aún no tiene ejercicios cargados.</p>
              </Card>
            ) : (
              <ul className="exercise-catalog">
                {exerciseCatalog.map((entry) => (
                  <li key={entry.name} className="exercise-catalog-item">
                    <span className="exercise-catalog-icon">
                      <Dumbbell size={18} />
                    </span>
                    <div className="exercise-catalog-info">
                      <strong>{entry.name}</strong>
                      <span className="exercise-catalog-variants">
                        {Array.from(entry.variants).join(" · ")}
                      </span>
                    </div>
                    <span className="exercise-catalog-badge">
                      {entry.sessions}{" "}
                      {entry.sessions === 1 ? "sesión" : "sesiones"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedDayDetail && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDayDetail(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>{selectedDayDetail.dayName}</h3>
                <button
                  className="close-btn"
                  onClick={() => setSelectedDayDetail(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-row">
                  <span className="label">Tipo de Sesión:</span>
                  <span className="value">
                    {getSessionTypeLabel(selectedDayDetail)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Duración Estimada:</span>
                  <span className="value">~60 min</span>
                </div>

                {getSessionType(selectedDayDetail) === "ATHLETICS" && (
                  <>
                    <h4 className="section-subtitle">Detalle de la sesión</h4>
                    {selectedDayDetail.session?.training && (
                      <div className="detail-row">
                        <span className="label">Entrenamiento:</span>
                        <span className="value">
                          {selectedDayDetail.session.training?.name ||
                            selectedDayDetail.session.training}
                        </span>
                      </div>
                    )}
                    {selectedDayDetail.session?.warmup && (
                      <div className="detail-row">
                        <span className="label">Calentamiento:</span>
                        <span className="value">
                          {selectedDayDetail.session.warmup}
                        </span>
                      </div>
                    )}
                    {selectedDayDetail.session?.mainBlock && (
                      <div className="detail-row">
                        <span className="label">Bloque principal:</span>
                        <span className="value">
                          {selectedDayDetail.session.mainBlock}
                        </span>
                      </div>
                    )}
                    {selectedDayDetail.session?.cooldown && (
                      <div className="detail-row">
                        <span className="label">Enfriamiento:</span>
                        <span className="value">
                          {selectedDayDetail.session.cooldown}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <h4 className="section-subtitle">Ejercicios</h4>
                {getDayExercises(selectedDayDetail).length > 0 ? (
                  <ul className="exercise-list">
                    {getDayExercises(selectedDayDetail).map((ex, i) => (
                      <li key={i} className="exercise-item">
                        <span className="ex-name">{ex.name}</span>
                        <span className="ex-sets">
                          {ex.sets} series x {ex.reps} reps
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-data">
                    No hay ejercicios detallados para esta sesión.
                  </p>
                )}

                {selectedDayDetail.note && (
                  <div className="notes-section">
                    <h4>Notas</h4>
                    <p>{selectedDayDetail.note}</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button
                  variant="primary"
                  onClick={() => setSelectedDayDetail(null)}
                >
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {noteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setNoteModal(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Agregar Nota / Motivo</h3>
                <button
                  className="close-btn"
                  onClick={() => setNoteModal(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Si no completaste la sesión, indícanos por qué. O agrega
                  cualquier comentario sobre tu entrenamiento.
                </p>
                <textarea
                  className="note-textarea"
                  value={noteModal.note}
                  onChange={(e) =>
                    setNoteModal({ ...noteModal, note: e.target.value })
                  }
                  placeholder="Ej: Me sentí cansado, me dolió la rodilla, no tuve tiempo..."
                  rows={4}
                />
              </div>
              <div className="modal-footer">
                <Button variant="secondary" onClick={() => setNoteModal(null)}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    handleSaveNote(
                      noteModal.weekIndex,
                      noteModal.dayIndex,
                      noteModal.note,
                    );
                    setNoteModal(null);
                  }}
                >
                  Guardar Nota
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinishModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFinishModal(false)}
          >
            <motion.div
              className="modal-content finish-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="header-icon warning">
                  <AlertCircle size={24} />
                </div>
                <h3>Finalizar Plan</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowFinishModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  ¿Estás seguro de que quieres finalizar este plan antes de
                  tiempo?
                </p>
                <p className="warning-text">
                  El plan se marcará como completado y podrás crear uno nuevo.
                  Esta acción no afectará tu historial de progreso.
                </p>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setShowFinishModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleFinishPlan}
                  leftIcon={<Flag size={16} />}
                >
                  Finalizar Plan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGymModeModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowGymModeModal(false)}
          >
            <motion.div
              className="modal-content gym-mode-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="header-icon gym">
                  <Zap size={24} />
                </div>
                <h3>Activar Modo Gym</h3>
                <button
                  className="close-btn"
                  onClick={() => setShowGymModeModal(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  El Modo Gym cambia la pantalla a una versión de alto contraste
                  y letra grande, pensada para usar el teléfono mientras
                  entrenas en el gimnasio.
                </p>
                <ul className="gym-mode-features">
                  <li>Textos y series más grandes, fáciles de leer de lejos</li>
                  <li>
                    Se ocultan detalles que no necesitas durante el
                    entrenamiento
                  </li>
                  <li>
                    Puedes salir en cualquier momento con el botón
                    &quot;Salir&quot;
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  onClick={() => setShowGymModeModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmGymMode}
                  leftIcon={<Zap size={16} />}
                >
                  Activar Modo Gym
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
            backdrop-filter: blur(4px);
        }
        .modal-content {
            background: var(--color-surface);
            border-radius: var(--radius-md);
            width: 100%;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--color-border);
        }
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--color-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 {
            margin: 0;
            font-size: 1.2rem;
        }
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--color-text-muted);
        }
        .modal-body {
            padding: 1.5rem;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--color-border-subtle);
        }
        .label {
            color: var(--color-text-muted);
        }
        .value {
            font-weight: 500;
        }
        .section-subtitle {
            margin: 1.5rem 0 1rem 0;
            font-size: 1rem;
            color: var(--color-primary);
        }
        .exercise-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .exercise-item {
            display: flex;
            justify-content: space-between;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--color-border-subtle);
        }
        .ex-name {
            font-weight: 500;
        }
        .ex-sets {
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        .no-data {
            color: var(--color-text-muted);
            font-style: italic;
        }
        .empty-exercises {
            text-align: center;
            padding: var(--space-10) var(--space-6);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-2);
        }
        .empty-exercises p {
            margin: 0;
            color: var(--color-text-secondary);
            font-weight: 600;
        }
        .exercise-catalog {
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
        }
        .exercise-catalog-item {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-3) var(--space-4);
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
        }
        .exercise-catalog-icon {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border-radius: var(--radius-md);
            background: var(--color-primary-bg);
            color: var(--color-primary);
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .exercise-catalog-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .exercise-catalog-info strong {
            color: var(--color-text-primary);
            font-size: var(--text-base);
        }
        .exercise-catalog-variants {
            color: var(--color-text-muted);
            font-size: var(--text-sm);
            font-family: var(--font-display);
            font-variant-numeric: tabular-nums;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .exercise-catalog-badge {
            flex-shrink: 0;
            font-size: var(--text-xs);
            font-weight: 700;
            color: var(--color-text-muted);
            background: var(--color-bg-elevated);
            padding: var(--space-1) var(--space-2);
            border-radius: var(--radius-full);
            white-space: nowrap;
        }
        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--color-border);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        .day-note-preview {
            margin-top: 0.75rem;
            padding: 0.5rem;
            background: var(--color-bg-subtle);
            border-radius: 4px;
            font-size: 0.85rem;
            color: var(--color-text-subtle);
            border-left: 3px solid var(--color-primary);
        }
        .note-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-surface);
            color: var(--color-text);
            resize: vertical;
            font-family: inherit;
        }
        .modal-description {
            margin-bottom: 1rem;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        .plan-detail {
            padding-bottom: 80px;
        }

        .gym-mode-toggle {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 0.9rem;
            border-radius: var(--radius-full);
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text-muted);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: var(--touch-target-comfortable);
        }
        .gym-mode-toggle.active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
            box-shadow: var(--shadow-glow);
        }
        .gym-mode-toggle.pulse {
            animation: gymTogglePulse 2.2s ease-in-out infinite;
        }
        @keyframes gymTogglePulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.35);
            }
            50% {
                box-shadow: 0 0 0 6px rgba(139, 92, 246, 0);
            }
        }
        .gym-mode-banner {
            position: sticky;
            top: 0;
            z-index: 5;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            border-radius: var(--radius-md);
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: white;
            font-size: 0.9rem;
            box-shadow: var(--shadow-md);
        }
        .gym-mode-banner span {
            flex: 1;
        }
        .gym-mode-exit-btn {
            border: 1px solid rgba(255, 255, 255, 0.5);
            background: rgba(255, 255, 255, 0.15);
            color: white;
            padding: 0.4rem 0.9rem;
            border-radius: var(--radius-full);
            font-weight: 700;
            font-size: 0.8rem;
            cursor: pointer;
            flex-shrink: 0;
        }
        .gym-mode-exit-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* ===== Today View (default landing) ===== */
        .today-view {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .today-nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
        }
        .today-nav-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--touch-target-comfortable);
            height: var(--touch-target-comfortable);
            border-radius: var(--radius-full);
            border: 1px solid var(--color-border);
            background: var(--color-surface);
            color: var(--color-text);
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .today-nav-btn:hover {
            background: var(--color-surface-hover);
            border-color: var(--color-primary);
        }
        .today-day-name {
            font-family: var(--font-display);
            font-size: 1.25rem;
            font-weight: 700;
            min-width: 140px;
            text-align: center;
        }
        .today-nav-center {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.35rem;
            min-width: 160px;
        }
        .today-nav-center .today-day-name {
            min-width: 0;
        }
        .today-date-picker {
            position: relative;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.3rem 0.7rem;
            border-radius: var(--radius-full);
            border: 1px solid var(--color-border);
            background: var(--color-surface-subtle);
            color: var(--color-text-muted);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .today-date-picker:hover {
            border-color: var(--color-primary);
            color: var(--color-text);
        }
        .today-date-picker input[type="date"] {
            position: absolute;
            inset: 0;
            opacity: 0;
            cursor: pointer;
            width: 100%;
        }
        .today-card {
            padding: 1.5rem;
        }
        .today-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .today-completed-badge {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            color: var(--color-success);
            font-weight: 600;
            font-size: 0.85rem;
        }
        .today-rest-text {
            font-size: 1.1rem;
        }
        .today-exercises {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .today-exercise-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            padding: 0.9rem 1rem;
            background: var(--color-bg-subtle);
            border-radius: var(--radius-md);
        }
        .today-ex-name {
            font-weight: 600;
            font-size: 1rem;
        }
        .today-ex-sets {
            font-family: var(--font-display);
            font-weight: 700;
            color: var(--color-primary);
        }
        .today-note-fab {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: var(--radius-full);
            border: 1px dashed var(--color-border-hover);
            background: transparent;
            color: var(--color-text-muted);
            cursor: pointer;
            flex-shrink: 0;
            transition: all 0.2s ease;
        }
        .today-note-fab:hover {
            color: var(--color-primary);
            border-color: var(--color-primary);
            background: var(--color-primary-bg);
        }
        .today-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
            flex-wrap: wrap;
        }
        .today-complete-btn {
            flex: 1;
            min-height: var(--touch-target-large);
            font-size: 1.05rem;
        }

        /* ===== Gym Mode: high contrast, minimal distractions ===== */
        .detail-content.gym-mode {
            background: var(--color-bg);
            padding: 1rem;
            border-radius: var(--radius-lg);
        }
        .detail-content.gym-mode .today-day-name {
            font-size: 1.8rem;
        }
        .detail-content.gym-mode .today-nav-btn {
            width: 56px;
            height: 56px;
        }
        .detail-content.gym-mode .today-ex-name {
            font-size: 1.3rem;
        }
        .detail-content.gym-mode .today-ex-sets {
            font-size: 1.5rem;
        }
        .detail-content.gym-mode .today-exercise-row {
            padding: 1.2rem 1.25rem;
        }
        .detail-content.gym-mode .today-card {
            background: var(--color-bg);
            border: 3px solid var(--color-primary);
        }
        .detail-content.gym-mode .today-complete-btn {
            min-height: 64px;
            font-size: 1.2rem;
        }
        .detail-content.gym-mode .session-type-badge {
            font-size: 1rem;
            padding: 0.5rem 1rem;
        }
        .detail-content.gym-mode .detail-tabs .tab-btn:not(.active) {
            opacity: 0.5;
        }
        .detail-content.gym-mode .plan-meta-tags,
        .detail-content.gym-mode .plan-dates {
            display: none;
        }

        .detail-header {
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 1rem;
            flex-wrap: wrap;
        }
        .header-content {
            margin-top: 1rem;
            flex: 1;
        }
        .header-top {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
        }
        .header-content h2 {
            margin: 0;
            font-size: 1.5rem;
        }
        .status-badge {
            padding: 0.35rem 0.75rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .status-badge.active {
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-badge.completed {
            background: rgba(100, 116, 139, 0.15);
            color: #64748b;
            border: 1px solid rgba(100, 116, 139, 0.3);
        }
        .status-badge.pending {
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .plan-meta-tags {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;
        }
        .tag {
            background: var(--color-surface-hover);
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }
        .progress-tag {
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
            font-weight: 600;
        }
        .plan-dates {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-top: 0.5rem;
            font-size: 0.85rem;
        }
        .date-info {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            color: var(--color-text-muted);
        }
        .days-remaining {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            font-weight: 600;
        }
        .days-remaining.warning {
            background: rgba(251, 191, 36, 0.1);
            color: #fbbf24;
        }
        .finish-plan-btn {
            margin-top: 1rem;
        }
        .finish-modal .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
        }
        .finish-modal .header-icon.warning {
            background: rgba(251, 191, 36, 0.15);
            color: #fbbf24;
        }
        .gym-mode-modal .header-icon,
        .gym-mode-modal .modal-header {
            display: flex;
        }
        .gym-mode-modal .header-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.5rem;
        }
        .gym-mode-modal .header-icon.gym {
            background: rgba(139, 92, 246, 0.15);
            color: #8b5cf6;
        }
        .gym-mode-modal .modal-header {
            flex-direction: column;
            align-items: flex-start;
            position: relative;
        }
        .gym-mode-modal .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
        }
        .gym-mode-features {
            margin: 0.75rem 0 0;
            padding-left: 1.1rem;
            color: var(--color-text-muted);
            font-size: 0.85rem;
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        .finish-modal .modal-header {
            flex-direction: column;
            align-items: flex-start;
            position: relative;
        }
        .finish-modal .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
        }
        .warning-text {
            margin-top: 0.5rem;
            color: var(--color-text-muted);
            font-size: 0.85rem;
            padding: 0.75rem;
            background: rgba(251, 191, 36, 0.05);
            border-left: 3px solid #fbbf24;
            border-radius: 4px;
        }
        .detail-tabs {
            display: flex;
            gap: var(--space-2);
            margin-bottom: var(--space-8);
            background: var(--color-bg-subtle);
            padding: var(--space-1);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
        }
        .tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            min-height: var(--touch-target-min);
            padding: var(--space-4) var(--space-5);
            color: var(--color-text-muted);
            font-weight: 600;
            font-size: var(--text-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--space-2);
            cursor: pointer;
            position: relative;
            border-radius: var(--radius-md);
            transition: all var(--transition-normal);
        }
        .tab-btn:hover {
            color: var(--color-text);
            background: var(--color-surface-hover);
        }
        .tab-btn.active {
            color: var(--color-primary);
            background: var(--color-surface);
            box-shadow: var(--shadow-md);
        }
        .tab-btn.active::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--color-primary-gradient);
            border-radius: var(--radius-full) var(--radius-full) 0 0;
        }
        .week-selector {
            display: flex;
            gap: var(--space-3);
            overflow-x: auto;
            padding: var(--space-2) var(--space-1) var(--space-6) var(--space-1);
            margin: 0 calc(-1 * var(--space-1)) var(--space-6);
            scrollbar-width: thin;
            scrollbar-color: var(--color-border) transparent;
        }
        .week-selector::-webkit-scrollbar {
            height: 6px;
        }
        .week-selector::-webkit-scrollbar-track {
            background: transparent;
        }
        .week-selector::-webkit-scrollbar-thumb {
            background: var(--color-border);
            border-radius: var(--radius-full);
        }
        .week-chip {
            background: var(--color-surface);
            border: 2px solid var(--color-border);
            padding: var(--space-3) var(--space-5);
            border-radius: var(--radius-full);
            white-space: nowrap;
            color: var(--color-text);
            font-weight: 600;
            font-size: var(--text-sm);
            cursor: pointer;
            transition: all var(--transition-normal);
            min-height: var(--touch-target-min);
            display: inline-flex;
            align-items: center;
        }
        .week-chip:hover {
            border-color: var(--color-primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
        }
        .week-chip.active {
            background: var(--color-primary-gradient);
            color: white;
            border-color: transparent;
            box-shadow: var(--shadow-md), var(--shadow-glow);
            transform: scale(1.05);
        }
        .days-list {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            animation: fadeInList 0.4s ease-out;
        }
        @keyframes fadeInList {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .day-card-detail {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            transition: all var(--transition-normal);
            border: 1px solid var(--color-border);
        }
        .day-card-detail:hover {
            border-color: var(--color-border-hover);
            box-shadow: var(--shadow-lg);
            transform: translateX(4px);
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .day-header h4 {
            margin: 0;
            font-size: var(--text-lg);
            font-weight: 700;
            color: var(--color-text);
        }
        .session-type-badge {
            font-size: var(--text-xs);
            padding: var(--space-2) var(--space-3);
            border-radius: var(--radius-md);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            box-shadow: var(--shadow-sm);
        }
        .session-type-badge.gym { 
            background: rgba(139, 92, 246, 0.15); 
            color: #8b5cf6;
            border: 1px solid rgba(139, 92, 246, 0.3);
        }
        .session-type-badge.athletics { 
            background: rgba(16, 185, 129, 0.15); 
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .session-type-badge.rest { 
            background: rgba(148, 163, 184, 0.15); 
            color: #94a3b8;
            border: 1px solid rgba(148, 163, 184, 0.3);
        }
        
        .session-preview {
            display: flex;
            gap: 1rem;
        }
        .preview-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.9rem;
            color: var(--color-text-muted);
        }
        .day-actions {
            display: flex;
            flex-wrap: wrap;
            gap: var(--space-2);
        }
        .start-btn {
            flex: 1;
            min-width: 180px;
        }
        @media (max-width: 768px) {
          .detail-tabs {
            gap: var(--space-1);
          }
          .tab-btn {
            font-size: var(--text-xs);
            padding: var(--space-3) var(--space-4);
          }
          .tab-btn svg {
            width: 16px;
            height: 16px;
          }
          .week-chip {
            font-size: var(--text-xs);
            padding: var(--space-2) var(--space-4);
          }
          .day-actions {
            flex-direction: column;
          }
          .start-btn {
            width: 100%;
            min-width: auto;
          }
          .day-card-detail:hover {
            transform: none;
          }
        }
        @media (max-width: 480px) {
          .detail-header {
            margin-bottom: var(--space-4);
          }
          .header-content h2 {
            font-size: var(--text-xl);
          }
          .plan-meta-tags {
            flex-wrap: wrap;
          }
          .session-preview {
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default PlanDetail;
