import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { Button, Card, useToast } from "./ui";
import {
  Plus,
  Trash2,
  Save,
  Copy,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  addDaysToDateString,
  formatDayName,
  formatShortDate,
} from "../utils/dateNav";

const TrainerScheduleConfig = () => {
  const { updateGymSchedule, getGymSchedule } = useMockDatabase();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState<any[]>([]);
  const [copyTargetDate, setCopyTargetDate] = useState("");

  useEffect(() => {
    const existingSlots = getGymSchedule(selectedDate);
    setSlots(existingSlots.length > 0 ? existingSlots : []);
  }, [selectedDate, getGymSchedule]);

  const goToDay = (direction) => {
    setSelectedDate((prev) => addDaysToDateString(prev, direction));
  };

  const handleAddSlot = () => {
    let newStart = "08:00";
    let newEnd = "09:00";

    // Si ya hay bloques, calcular la siguiente hora basándose en el último
    if (slots.length > 0) {
      const lastSlot = slots[slots.length - 1];
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
      capacity: 10,
      reserved: 0,
    };
    setSlots([...slots, newSlot]);
  };

  const handleUpdateSlot = (id, field, value) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleDeleteSlot = (id) => {
    setSlots(slots.filter((s) => s.id !== id));
  };

  // Un bloque es inválido si su hora de fin no es posterior a la de inicio.
  const isSlotInvalid = (slot) => slot.end <= slot.start;
  const hasInvalidSlots = slots.some(isSlotInvalid);

  const handleSave = () => {
    if (hasInvalidSlots) {
      addToast(
        "Revisa los bloques marcados: la hora de fin debe ser posterior a la de inicio.",
        "warning",
      );
      return;
    }
    updateGymSchedule(selectedDate, slots);
    addToast("Horarios guardados correctamente", "success");
  };

  const handleCopyToDate = () => {
    if (!copyTargetDate) {
      addToast("Selecciona una fecha destino para copiar.", "warning");
      return;
    }
    if (hasInvalidSlots) {
      addToast("Corrige los bloques inválidos antes de copiar.", "warning");
      return;
    }
    updateGymSchedule(copyTargetDate, slots);
    addToast(`Horarios copiados a ${copyTargetDate}`, "success");
    setCopyTargetDate("");
  };

  const sortedSlots = [...slots].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="schedule-config">
      <div className="config-header">
        <h2>Configurar Horarios Gimnasio</h2>
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

      <div className="slots-container">
        {slots.length === 0 ? (
          <div className="empty-state">
            <p>No hay horarios configurados para este día.</p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddSlot}
              leftIcon={<Plus size={16} />}
            >
              Agregar Primer Bloque
            </Button>
          </div>
        ) : (
          <div className="slots-list timeline">
            {sortedSlots.map((slot, index) => (
              <Card
                key={slot.id}
                className={`slot-card ${isSlotInvalid(slot) ? "invalid" : ""}`}
              >
                <div className="timeline-marker">
                  <span className="timeline-dot" />
                  {index < sortedSlots.length - 1 && (
                    <span className="timeline-line" />
                  )}
                </div>
                <div className="slot-content">
                  <div className="slot-header">
                    <span className="slot-number">Bloque {index + 1}</span>
                    {isSlotInvalid(slot) && (
                      <span className="invalid-flag">
                        <AlertTriangle size={14} />
                        Fin debe ser posterior al inicio
                      </span>
                    )}
                    <button
                      className="delete-btn tap-ripple"
                      onClick={() => handleDeleteSlot(slot.id)}
                      title="Eliminar bloque"
                      aria-label="Eliminar bloque"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="slot-form">
                    <div className="form-group">
                      <label>Inicio</label>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          handleUpdateSlot(slot.id, "start", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Fin</label>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          handleUpdateSlot(slot.id, "end", e.target.value)
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Cupos</label>
                      <input
                        type="number"
                        value={slot.capacity}
                        onChange={(e) =>
                          handleUpdateSlot(
                            slot.id,
                            "capacity",
                            parseInt(e.target.value),
                          )
                        }
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="slot-stats">
                    <small>{slot.reserved} reservados</small>
                  </div>
                </div>
              </Card>
            ))}

            <div className="actions-row">
              <Button
                variant="secondary"
                onClick={handleAddSlot}
                leftIcon={<Plus size={16} />}
              >
                Agregar Bloque
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                leftIcon={<Save size={16} />}
                disabled={hasInvalidSlots}
                title={
                  hasInvalidSlots
                    ? "Corrige los bloques inválidos antes de guardar"
                    : undefined
                }
              >
                Guardar Cambios
              </Button>
            </div>

            <div className="copy-row">
              <label>Copiar estos horarios a otro día:</label>
              <div className="copy-controls">
                <input
                  type="date"
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="date-input"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToDate}
                  leftIcon={<Copy size={16} />}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .schedule-config {
            padding: 1rem;
        }
        .config-header {
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
            background: var(--color-surface-subtle);
            border-radius: var(--radius-md);
        }
        .slots-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .timeline .slot-card {
            display: flex;
            gap: 0.75rem;
            align-items: flex-start;
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
        .slot-content {
            flex: 1;
        }
        .slot-card.invalid {
            border: 1px solid var(--color-error);
        }
        .invalid-flag {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            color: var(--color-error);
            font-size: 0.75rem;
            font-weight: 600;
        }
        .copy-row {
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid var(--color-border);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .copy-row label {
            font-size: 0.85rem;
            color: var(--color-text-muted);
        }
        .copy-controls {
            display: flex;
            gap: 0.75rem;
            align-items: center;
        }
        .slot-card {
            background: var(--color-surface);
        }
        .slot-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
            font-weight: 600;
        }
        .delete-btn {
            background: none;
            border: none;
            color: var(--color-danger);
            cursor: pointer;
        }
        .slot-form {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .form-group label {
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }
        .form-group input {
            padding: 0.5rem;
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-bg);
            color: var(--color-text);
            width: 100%;
        }
        .actions-row {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default TrainerScheduleConfig;
