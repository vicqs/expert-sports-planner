import React, { useState } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMockDatabase } from "../context/MockDatabase";

const PlanDetail = ({ plan, client, onBack }) => {
  const [activeTab, setActiveTab] = useState("calendar"); // calendar, exercises
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);
  const [noteModal, setNoteModal] = useState<any>(null); // { weekIndex, dayIndex, note }
  const [showFinishModal, setShowFinishModal] = useState(false);
  const { toggleSessionCompletion, updateSessionNote, completePlan } =
    useMockDatabase();
  const { addToast } = useToast();

  // Helper to get days for the selected week
  const currentWeekDays = plan[selectedWeek]?.days || [];

  const handleToggleComplete = (dayIndex) => {
    toggleSessionCompletion(client.id, selectedWeek, dayIndex);
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
      </div>

      <div className="detail-tabs">
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

      <div className="detail-content">
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
                      className={`session-type-badge ${(day.sessionType || "rest").toLowerCase()}`}
                    >
                      {day.sessionType || "REST"}
                    </span>
                  </div>

                  <div className="day-body">
                    {day.sessionType === "REST" ? (
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
                            {day.sessionType === "GYM" ? "Fuerza" : "Cardio"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {day.sessionType !== "REST" && (
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
            <Card>
              <p className="placeholder-text">
                Vista de lista de ejercicios próximamente.
              </p>
            </Card>
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
                  <span className="value">{selectedDayDetail.sessionType}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Duración Estimada:</span>
                  <span className="value">~60 min</span>
                </div>

                <h4 className="section-subtitle">Ejercicios</h4>
                {selectedDayDetail.exercises &&
                selectedDayDetail.exercises.length > 0 ? (
                  <ul className="exercise-list">
                    {selectedDayDetail.exercises.map((ex, i) => (
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

                {selectedDayDetail.notes && (
                  <div className="notes-section">
                    <h4>Notas</h4>
                    <p>{selectedDayDetail.notes}</p>
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
        .placeholder-text {
            text-align: center;
            color: var(--color-text-muted);
            padding: 2rem;
        }
      `}</style>
    </div>
  );
};

export default PlanDetail;
