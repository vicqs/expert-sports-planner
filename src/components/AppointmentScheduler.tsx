import React, { useState, useRef } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { Button, Card, ConfirmDialog, useToast } from "./ui";
import { useConfirm } from "../hooks";
import { Calendar, Clock, CheckCircle, CalendarX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CANCEL_REASON_OPTIONS = [
  "Imprevisto personal",
  "Problema de salud",
  "Cambio de horario",
  "Ya no lo necesito",
  "Otro",
];

const APPOINTMENT_TYPES = [
  { id: "eval", label: "Evaluación Inicial", duration: 60, icon: "📊" },
  { id: "followup", label: "Seguimiento", duration: 30, icon: "💬" },
  { id: "weight", label: "Control de Peso", duration: 15, icon: "⚖️" },
  { id: "adjust", label: "Ajuste de Plan", duration: 45, icon: "🎯" },
];

const AppointmentScheduler = ({ athleteId }) => {
  const { addAppointment, getAthleteAppointments, cancelAppointment } =
    useMockDatabase();
  const { addToast } = useToast();
  const { isOpen, isLoading, confirm, handleConfirm, handleCancel } =
    useConfirm();
  const [step, setStep] = useState(1); // 1: Type, 2: Date/Time, 3: Confirm
  const [selectedType, setSelectedType] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [customCancelReason, setCustomCancelReason] = useState("");
  const cancelReasonRef = useRef("");
  const customCancelReasonRef = useRef("");

  const myAppointments = getAthleteAppointments(athleteId);

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleCancelClick = (appointmentId) => {
    setCancelReason("");
    setCustomCancelReason("");
    cancelReasonRef.current = "";
    customCancelReasonRef.current = "";
    confirm(() => {
      const reason =
        cancelReasonRef.current === "Otro"
          ? customCancelReasonRef.current.trim()
          : cancelReasonRef.current;
      cancelAppointment(appointmentId, reason);
      addToast("Cita cancelada", "success");
      setCancelReason("");
      setCustomCancelReason("");
    });
  };

  const selectCancelReason = (value: string) => {
    setCancelReason(value);
    cancelReasonRef.current = value;
  };

  const updateCustomCancelReason = (value: string) => {
    setCustomCancelReason(value);
    customCancelReasonRef.current = value;
  };

  const isCancelReasonValid =
    cancelReason !== "" &&
    (cancelReason !== "Otro" || customCancelReason.trim().length > 0);

  const handleCancelDialogClose = () => {
    setCancelReason("");
    setCustomCancelReason("");
    handleCancel();
  };

  const handleConfirmBooking = () => {
    setConfirming(true);
    setTimeout(() => {
      const result = addAppointment({
        athleteId,
        date: selectedDate,
        time: selectedTime,
        type: selectedType.id,
        typeName: selectedType.label,
        duration: selectedType.duration,
        notes,
      });

      setConfirming(false);
      if (result.success) {
        addToast("Cita agendada correctamente", "success");
        setJustConfirmed(true);
        setTimeout(() => {
          setJustConfirmed(false);
          setStep(1);
          setSelectedType(null);
          setSelectedDate("");
          setSelectedTime("");
          setNotes("");
        }, 1400);
      }
    }, 500);
  };

  return (
    <div className="appointment-scheduler">
      <AnimatePresence>
        {justConfirmed && (
          <motion.div
            className="confirm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
            >
              <CheckCircle size={56} color="var(--color-success)" />
            </motion.div>
            <p>¡Cita confirmada!</p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="scheduler-content">
        {step === 1 && (
          <div className="step-container">
            <h3>Selecciona el tipo de cita</h3>
            <div className="types-grid">
              {APPOINTMENT_TYPES.map((type) => (
                <Card
                  key={type.id}
                  className="type-card tap-ripple"
                  onClick={() => handleTypeSelect(type)}
                  hover
                >
                  <span className="type-icon">{type.icon}</span>
                  <div className="type-info">
                    <h4>{type.label}</h4>
                    <span className="duration">{type.duration} min</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-container">
            <h3>Elige fecha y hora</h3>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Notas para el entrenador (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={3}
              />
            </div>
            <div className="actions">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                variant="primary"
                disabled={!selectedDate || !selectedTime || confirming}
                loading={confirming}
                onClick={handleConfirmBooking}
              >
                {confirming ? "Confirmando…" : "Confirmar Cita"}
              </Button>
            </div>
          </div>
        )}

        <div className="my-appointments">
          <h3>Mis Citas Programadas</h3>
          {myAppointments.length === 0 ? (
            <Card className="empty-appointments">
              <CalendarX size={36} color="var(--color-text-subtle)" />
              <p>No tienes citas próximas.</p>
              <span className="hint">
                Agenda una arriba eligiendo el tipo de cita.
              </span>
            </Card>
          ) : (
            <div className="appointments-list">
              {myAppointments.map((app) => (
                <Card key={app.id} className="appointment-card">
                  <div className="app-header">
                    <span className="app-type">{app.typeName}</span>
                    <span className="app-status">{app.status}</span>
                  </div>
                  <div className="app-details">
                    <div className="detail-item">
                      <Calendar size={14} /> {app.date}
                    </div>
                    <div className="detail-item">
                      <Clock size={14} /> {app.time} ({app.duration} min)
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelClick(app.id)}
                    className="cancel-btn"
                  >
                    Cancelar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancelDialogClose}
        onConfirm={handleConfirm}
        title="Cancelar Cita"
        message="¿Estás seguro de cancelar esta cita?"
        confirmText="Sí, Cancelar"
        cancelText="No, Mantener"
        variant="danger"
        isLoading={isLoading}
        confirmDisabled={!isCancelReasonValid}
      >
        <div className="cancel-reason-picker">
          <span className="cancel-reason-label">
            Motivo de cancelación (obligatorio)
          </span>
          <div className="cancel-reason-chips">
            {CANCEL_REASON_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`cancel-reason-chip${
                  cancelReason === option ? " selected" : ""
                }`}
                onClick={() => selectCancelReason(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {cancelReason === "Otro" && (
            <input
              type="text"
              className="cancel-reason-input"
              placeholder="Cuéntanos el motivo..."
              value={customCancelReason}
              onChange={(e) => updateCustomCancelReason(e.target.value)}
              maxLength={200}
              autoFocus
            />
          )}
        </div>
      </ConfirmDialog>

      <style>{`
                .appointment-scheduler {
                    padding-bottom: 80px;
                    position: relative;
                }
                .cancel-reason-picker {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2);
                    width: 100%;
                }
                .cancel-reason-label {
                    font-size: var(--text-sm);
                    font-weight: 600;
                    color: var(--color-text-secondary);
                }
                .cancel-reason-chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: var(--space-2);
                }
                .cancel-reason-chip {
                    border: 1px solid var(--color-border);
                    background: var(--color-bg-elevated);
                    color: var(--color-text-primary);
                    border-radius: var(--radius-full);
                    padding: var(--space-2) var(--space-3);
                    font-size: var(--text-sm);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .cancel-reason-chip:hover {
                    border-color: var(--color-error);
                }
                .cancel-reason-chip.selected {
                    background: var(--color-error);
                    border-color: var(--color-error);
                    color: white;
                    font-weight: 600;
                }
                .cancel-reason-input {
                    width: 100%;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-md);
                    padding: var(--space-2) var(--space-3);
                    font-size: var(--text-sm);
                    font-family: inherit;
                    color: var(--color-text-primary);
                    background: var(--color-bg-elevated);
                }
                .cancel-reason-input:focus {
                    outline: none;
                    border-color: var(--color-error);
                }
                .confirm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(4px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    z-index: 2000;
                }
                .confirm-overlay p {
                    color: white;
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .step-container {
                    margin-bottom: var(--space-8);
                }
                .types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr));
                    gap: var(--space-4);
                    margin-top: var(--space-4);
                }
                .type-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: var(--space-2);
                    cursor: pointer;
                    padding: var(--space-6);
                }
                .type-icon {
                    font-size: var(--text-3xl);
                }
                .type-info h4 {
                    margin: 0;
                    font-size: var(--text-sm);
                }
                .duration {
                    font-size: var(--text-xs);
                    color: var(--color-text-muted);
                }
                .form-group {
                    margin-bottom: var(--space-4);
                }
                .form-group label {
                    display: block;
                    margin-bottom: var(--space-2);
                    font-size: var(--text-sm);
                    color: var(--color-text-muted);
                }
                .input-field {
                    width: 100%;
                    min-height: var(--touch-target-min);
                    padding: var(--space-3);
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    background: var(--color-surface);
                    color: var(--color-text);
                    font-size: 16px;
                    transition: all var(--transition-normal);
                }
                .input-field:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px var(--color-primary-subtle, rgba(139, 92, 246, 0.1));
                }
                textarea.input-field {
                    min-height: 88px;
                    resize: vertical;
                }
                .actions {
                    display: flex;
                    gap: var(--space-4);
                    margin-top: var(--space-6);
                }
                .my-appointments {
                    margin-top: var(--space-8);
                    padding-top: var(--space-8);
                    border-top: 1px solid var(--color-border);
                }
                .empty-text {
                    color: var(--color-text-muted);
                    text-align: center;
                }
                .empty-appointments {
                    text-align: center;
                    padding: var(--space-10) var(--space-6);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--space-2);
                }
                .empty-appointments p {
                    margin: 0;
                    color: var(--color-text-secondary);
                    font-weight: 600;
                }
                .empty-appointments .hint {
                    color: var(--color-text-muted);
                    font-size: var(--text-sm);
                    max-width: 320px;
                }
                .appointments-list {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-4);
                }
                .appointment-card {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-2);
                }
                .app-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 600;
                }
                .app-status {
                    font-size: var(--text-xs);
                    padding: var(--space-1) var(--space-2);
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--color-success);
                    border-radius: var(--radius-sm);
                }
                .app-details {
                    display: flex;
                    gap: var(--space-4);
                    font-size: var(--text-sm);
                    color: var(--color-text-muted);
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: var(--space-1);
                }
            `}</style>
    </div>
  );
};

export default AppointmentScheduler;
