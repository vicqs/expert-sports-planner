import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { Button, Card, useToast } from "./ui";
import { Plus, Trash2, Save } from "lucide-react";

const TrainerScheduleConfig = () => {
  const { updateGymSchedule, getGymSchedule } = useMockDatabase();
  const { addToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    const existingSlots = getGymSchedule(selectedDate);
    setSlots(existingSlots.length > 0 ? existingSlots : []);
  }, [selectedDate, getGymSchedule]);

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

  const handleSave = () => {
    updateGymSchedule(selectedDate, slots);
    addToast("Horarios guardados correctamente", "success");
  };

  return (
    <div className="schedule-config">
      <div className="config-header">
        <h2>Configurar Horarios Gimnasio</h2>
        <div className="date-selector">
          <label>Fecha:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="date-input"
          />
        </div>
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
          <div className="slots-list">
            {slots.map((slot, index) => (
              <Card key={slot.id} className="slot-card">
                <div className="slot-header">
                  <span className="slot-number">Bloque {index + 1}</span>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteSlot(slot.id)}
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
              >
                Guardar Cambios
              </Button>
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
            margin-bottom: 2rem;
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
        .slot-card {
            background: var(--color-surface);
        }
        .slot-header {
            display: flex;
            justify-content: space-between;
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
