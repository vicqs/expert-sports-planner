import React, { useState } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { useAuth } from "../context/AuthContext";
import { Card, Button, useToast } from "./ui";
import {
  Clock,
  User,
  CheckCircle,
  XCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  addDaysToDateString,
  formatDayName,
  formatShortDate,
} from "../utils/dateNav";

const TrainerAppointmentCalendar = () => {
  const {
    getTrainerAppointments,
    updateAppointmentStatus,
    rescheduleAppointment,
    updateAppointmentAvailability,
    getAppointmentAvailability,
    getTrainerAthletes,
  } = useMockDatabase();
  const { getTrainerId } = useAuth();
  const { addToast } = useToast();
  const trainerId = getTrainerId();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [view, setView] = useState("appointments"); // 'appointments' | 'availability'
  const [availSlots, setAvailSlots] = useState<any[]>([]);
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  // Mapa athleteId -> nombre, para mostrar el nombre real en vez del id.
  const athleteNameById = React.useMemo(() => {
    const map: Record<string, string> = {};
    getTrainerAthletes(trainerId).forEach((a) => {
      map[a.athleteId] = a.athleteName;
    });
    return map;
  }, [getTrainerAthletes, trainerId]);

  // Load availability when date changes or view changes
  React.useEffect(() => {
    if (view === "availability") {
      const slots = getAppointmentAvailability(selectedDate);
      setAvailSlots(slots.length > 0 ? slots : []);
    }
  }, [selectedDate, view, getAppointmentAvailability]);

  const goToDay = (direction) => {
    setSelectedDate((prev) => addDaysToDateString(prev, direction));
  };

  // In a real app, we'd fetch for a range or the selected date
  // For this mock, we'll filter all appointments by date
  const appointments = getTrainerAppointments(selectedDate);

  const handleStatusChange = (id, status) => {
    updateAppointmentStatus(id, status);
  };

  const openReschedule = (app) => {
    setReschedulingId(app.id);
    setRescheduleDate(app.date);
    setRescheduleTime(app.time);
  };

  const cancelReschedule = () => {
    setReschedulingId(null);
    setRescheduleDate("");
    setRescheduleTime("");
  };

  const confirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) {
      addToast("Selecciona fecha y hora para reprogramar.", "warning");
      return;
    }
    rescheduleAppointment(reschedulingId, rescheduleDate, rescheduleTime);
    addToast("Cita reprogramada correctamente", "success");
    cancelReschedule();
  };

  const handleAddSlot = () => {
    let newStart = "09:00";
    let newEnd = "10:00";

    // Si ya hay bloques, calcular la siguiente hora basándose en el último
    if (availSlots.length > 0) {
      const lastSlot = availSlots[availSlots.length - 1];
      const [hours, minutes] = lastSlot.end.split(":").map(Number);
      newStart = lastSlot.end; // Empieza donde termina el último
      // Agregar 1 hora
      const nextHour = hours + 1;
      newEnd = `${String(nextHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    const newSlot = {
      id: Date.now().toString(),
      start: newStart,
      end: newEnd,
    };
    setAvailSlots([...availSlots, newSlot]);
  };

  const handleUpdateSlot = (id, field, value) => {
    setAvailSlots(
      availSlots.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
  };

  const handleDeleteSlot = (id) => {
    setAvailSlots(availSlots.filter((s) => s.id !== id));
  };

  const handleSaveAvailability = () => {
    updateAppointmentAvailability(selectedDate, availSlots);
    addToast("Disponibilidad guardada correctamente", "success");
  };

  return (
    <div className="trainer-calendar">
      <div className="calendar-header">
        <h2>
          {view === "appointments"
            ? "Calendario de Citas"
            : "Configurar Disponibilidad"}
        </h2>
        <div className="view-toggle">
          <Button
            variant={view === "appointments" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("appointments")}
          >
            Citas
          </Button>
          <Button
            variant={view === "availability" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setView("availability")}
          >
            Disponibilidad
          </Button>
        </div>
      </div>

      <div className="day-nav">
        <button
          className="day-nav-btn tap-ripple"
          onClick={() => goToDay(-1)}
          aria-label="Día anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="day-nav-center">
          <span className="day-nav-name">{formatDayName(selectedDate)}</span>
          <div className="day-nav-date-picker">
            <Calendar size={14} />
            <span>{formatShortDate(selectedDate)}</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
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
        </div>

        <button
          className="day-nav-btn tap-ripple"
          onClick={() => goToDay(1)}
          aria-label="Día siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {view === "appointments" ? (
        <div className="appointments-section">
          {appointments.length === 0 ? (
            <Card className="empty-state">
              <p>No hay citas programadas para este día.</p>
            </Card>
          ) : (
            <div className="appointments-list timeline">
              {[...appointments]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((app, index, arr) => (
                  <Card key={app.id} className="appointment-card-trainer">
                    <div className="timeline-marker">
                      <span className="timeline-dot" />
                      {index < arr.length - 1 && (
                        <span className="timeline-line" />
                      )}
                    </div>
                    <div className="app-time">
                      <Clock size={16} />
                      <span>{app.time}</span>
                      <span className="duration">({app.duration} min)</span>
                    </div>
                    <div className="app-info">
                      <h4>{app.typeName}</h4>
                      <div className="athlete-info">
                        <User size={14} />
                        <span>
                          {athleteNameById[app.athleteId] ||
                            `Atleta ID: ${app.athleteId}`}
                        </span>
                      </div>
                      {app.notes && (
                        <p className="notes">&ldquo;{app.notes}&rdquo;</p>
                      )}
                      {reschedulingId === app.id && (
                        <div className="reschedule-form">
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="date-input"
                          />
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="time-input"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={confirmReschedule}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelReschedule}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="app-actions">
                      {app.status === "SCHEDULED" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="action-btn"
                            onClick={() => openReschedule(app)}
                            title="Reprogramar cita"
                            aria-label="Reprogramar cita"
                          >
                            <CalendarClock size={20} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="action-btn success"
                            onClick={() =>
                              handleStatusChange(app.id, "COMPLETED")
                            }
                            title="Marcar como completada"
                            aria-label="Marcar como completada"
                          >
                            <CheckCircle size={20} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="action-btn danger"
                            onClick={() =>
                              handleStatusChange(app.id, "CANCELLED")
                            }
                            title="Cancelar cita"
                            aria-label="Cancelar cita"
                          >
                            <XCircle size={20} />
                          </Button>
                        </>
                      )}
                      {app.status === "COMPLETED" && (
                        <span className="badge badge-success">Completada</span>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="availability-section">
          <Card className="availability-card">
            <div className="slots-list">
              {availSlots.length === 0 && (
                <p className="empty-text">
                  No hay horarios definidos. Agrega bloques de tiempo
                  disponibles.
                </p>
              )}
              {availSlots.map((slot, index) => (
                <div key={slot.id} className="slot-item">
                  <span className="slot-label">Bloque {index + 1}</span>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(e) =>
                      handleUpdateSlot(slot.id, "start", e.target.value)
                    }
                    className="time-input"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(e) =>
                      handleUpdateSlot(slot.id, "end", e.target.value)
                    }
                    className="time-input"
                  />
                  <button
                    className="delete-btn tap-ripple"
                    onClick={() => handleDeleteSlot(slot.id)}
                    title="Eliminar franja"
                    aria-label="Eliminar franja"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="avail-actions">
              <Button variant="secondary" size="sm" onClick={handleAddSlot}>
                + Agregar Bloque
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAvailability}
              >
                Guardar Disponibilidad
              </Button>
            </div>
          </Card>
        </div>
      )}

      <style>{`
                .trainer-calendar {
                    padding: 1rem;
                }
                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .day-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .day-nav-btn {
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
                .day-nav-btn:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-primary);
                }
                .day-nav-center {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.35rem;
                    min-width: 160px;
                }
                .day-nav-name {
                    font-family: var(--font-display);
                    font-size: 1.25rem;
                    font-weight: 700;
                    text-align: center;
                }
                .day-nav-date-picker {
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
                .day-nav-date-picker:hover {
                    border-color: var(--color-primary);
                    color: var(--color-text);
                }
                .day-nav-date-picker input[type="date"] {
                    position: absolute;
                    inset: 0;
                    opacity: 0;
                    cursor: pointer;
                    width: 100%;
                }
                .view-toggle {
                    display: flex;
                    gap: 0.5rem;
                    background: var(--color-surface);
                    padding: 0.25rem;
                    border-radius: var(--radius-md);
                    border: 1px solid var(--color-border);
                }
                .date-input {
                    padding: 0.5rem;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    background: var(--color-surface);
                    color: var(--color-text);
                }
                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: var(--color-text-muted);
                }
                .appointments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .appointment-card-trainer {
                    display: flex;
                    align-items: flex-start;
                    gap: 1.5rem;
                }
                .timeline-marker {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding-top: 0.35rem;
                }
                .timeline-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--color-primary);
                    flex-shrink: 0;
                }
                .timeline-line {
                    width: 2px;
                    flex: 1;
                    min-height: 2rem;
                    background: var(--color-border);
                    margin-top: 0.25rem;
                }
                .reschedule-form {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                    flex-wrap: wrap;
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px dashed var(--color-border);
                }
                .app-time {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 80px;
                    font-weight: 600;
                    color: var(--color-primary);
                }
                .duration {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                    font-weight: 400;
                }
                .app-info {
                    flex: 1;
                }
                .app-info h4 {
                    margin: 0 0 0.5rem 0;
                }
                .athlete-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                    margin-bottom: 0.5rem;
                }
                .notes {
                    font-style: italic;
                    font-size: 0.9rem;
                    color: var(--color-text-subtle);
                    background: var(--color-bg-subtle);
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin: 0;
                }
                .app-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .action-btn {
                    min-width: var(--touch-target-min, 44px);
                    min-height: var(--touch-target-min, 44px);
                    padding: 0;
                    border-radius: var(--radius-full);
                }
                .action-btn.success { color: var(--color-success); }
                .action-btn.danger { color: var(--color-danger); }
                @media (max-width: 480px) {
                    .app-actions {
                        gap: 0.35rem;
                    }
                    .action-btn {
                        min-width: var(--touch-target-comfortable, 48px);
                        min-height: var(--touch-target-comfortable, 48px);
                    }
                }
                
                .availability-section {
                    max-width: 600px;
                    margin: 0 auto;
                }
                .slots-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .slot-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.5rem;
                    background: var(--color-bg);
                    border-radius: 4px;
                }
                .time-input {
                    padding: 0.4rem;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                }
                .delete-btn {
                    background: none;
                    border: none;
                    color: var(--color-danger);
                    cursor: pointer;
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-width: var(--touch-target-min);
                    min-height: var(--touch-target-min);
                    padding: 0.5rem;
                    border-radius: var(--radius-sm);
                    transition: background-color 0.15s ease, color 0.15s ease;
                }
                .delete-btn:hover {
                    background: rgba(220, 38, 38, 0.1);
                }
                .delete-btn svg {
                    width: 20px;
                    height: 20px;
                }
                .avail-actions {
                    display: flex;
                    justify-content: space-between;
                    border-top: 1px solid var(--color-border);
                    padding-top: 1rem;
                }
            `}</style>
    </div>
  );
};

export default TrainerAppointmentCalendar;
