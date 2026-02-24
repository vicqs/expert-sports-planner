import React, { useState } from 'react';
import { Button, Card } from './ui';
import { ArrowLeft, Calendar, Dumbbell, Clock, CheckCircle, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMockDatabase } from '../context/MockDatabase';

const PlanDetail = ({ plan, client, onBack }) => {
    const [activeTab, setActiveTab] = useState('calendar'); // calendar, exercises
    const [selectedWeek, setSelectedWeek] = useState(0);
    const [selectedDayDetail, setSelectedDayDetail] = useState(null);
    const [noteModal, setNoteModal] = useState(null); // { weekIndex, dayIndex, note }
    const { toggleSessionCompletion, updateSessionNote } = useMockDatabase();

    // Helper to get days for the selected week
    const currentWeekDays = plan[selectedWeek]?.days || [];

    const handleToggleComplete = (dayIndex) => {
        toggleSessionCompletion(client.id, selectedWeek, dayIndex);
    };

    const handleSaveNote = (weekIndex, dayIndex, note) => {
        updateSessionNote(client.id, weekIndex, dayIndex, note);
    };

    return (
        <div className="plan-detail">
            <div className="detail-header">
                <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onBack}>
                    Volver
                </Button>
                <div className="header-content">
                    <h2>{plan.name || 'Plan de Entrenamiento'}</h2>
                    <div className="plan-meta-tags">
                        <span className="tag">{plan.objective}</span>
                        <span className="tag">{plan.length} semanas</span>
                    </div>
                </div>
            </div>

            <div className="detail-tabs">
                <button
                    className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    <Calendar size={18} /> Calendario
                </button>
                <button
                    className={`tab-btn ${activeTab === 'exercises' ? 'active' : ''}`}
                    onClick={() => setActiveTab('exercises')}
                >
                    <Dumbbell size={18} /> Ejercicios
                </button>
            </div>

            <div className="detail-content">
                {activeTab === 'calendar' && (
                    <div className="calendar-view">
                        <div className="week-selector">
                            {plan.map((week, index) => (
                                <button
                                    key={week.weekNum}
                                    className={`week-chip ${selectedWeek === index ? 'active' : ''}`}
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
                                        <span className={`session-type-badge ${(day.sessionType || 'rest').toLowerCase()}`}>
                                            {day.sessionType || 'REST'}
                                        </span>
                                    </div>

                                    <div className="day-body">
                                        {day.sessionType === 'REST' ? (
                                            <p className="rest-text">Día de descanso o recuperación activa.</p>
                                        ) : (
                                            <div className="session-preview">
                                                <div className="preview-item">
                                                    <Clock size={14} />
                                                    <span>~60 min</span>
                                                </div>
                                                <div className="preview-item">
                                                    <Dumbbell size={14} />
                                                    <span>{day.sessionType === 'GYM' ? 'Fuerza' : 'Cardio'}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {day.sessionType !== 'REST' && (
                                        <div className="day-actions">
                                            <Button
                                                variant={day.completed ? "success" : "secondary"}
                                                size="sm"
                                                className="start-btn"
                                                leftIcon={day.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                                                onClick={() => handleToggleComplete(index)}
                                            >
                                                {day.completed ? 'Completado' : 'Marcar como Completado'}
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedDayDetail(day)}>
                                                Ver Detalles
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="note-btn"
                                                onClick={() => setNoteModal({ weekIndex: selectedWeek, dayIndex: index, note: day.note || '' })}
                                            >
                                                {day.note ? 'Editar Nota' : 'Agregar Nota'}
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

                {activeTab === 'exercises' && (
                    <div className="exercises-view">
                        <Card>
                            <p className="placeholder-text">Vista de lista de ejercicios próximamente.</p>
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
                                <button className="close-btn" onClick={() => setSelectedDayDetail(null)}>×</button>
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
                                {selectedDayDetail.exercises && selectedDayDetail.exercises.length > 0 ? (
                                    <ul className="exercise-list">
                                        {selectedDayDetail.exercises.map((ex, i) => (
                                            <li key={i} className="exercise-item">
                                                <span className="ex-name">{ex.name}</span>
                                                <span className="ex-sets">{ex.sets} series x {ex.reps} reps</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-data">No hay ejercicios detallados para esta sesión.</p>
                                )}

                                {selectedDayDetail.notes && (
                                    <div className="notes-section">
                                        <h4>Notas</h4>
                                        <p>{selectedDayDetail.notes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <Button variant="primary" onClick={() => setSelectedDayDetail(null)}>
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
                                <button className="close-btn" onClick={() => setNoteModal(null)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="modal-description">
                                    Si no completaste la sesión, indícanos por qué. O agrega cualquier comentario sobre tu entrenamiento.
                                </p>
                                <textarea
                                    className="note-textarea"
                                    value={noteModal.note}
                                    onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
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
                                        handleSaveNote(noteModal.weekIndex, noteModal.dayIndex, noteModal.note);
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
        }
        .header-content {
            margin-top: 1rem;
        }
        .header-content h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
        }
        .plan-meta-tags {
            display: flex;
            gap: 0.5rem;
        }
        .tag {
            background: var(--color-surface-hover);
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.8rem;
            color: var(--color-text-muted);
        }
        .detail-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--color-border);
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 0.75rem 1rem;
            color: var(--color-text-muted);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            position: relative;
        }
        .tab-btn.active {
            color: var(--color-primary);
        }
        .tab-btn.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 100%;
            height: 2px;
            background: var(--color-primary);
        }
        .week-selector {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
            padding-bottom: 1rem;
            margin-bottom: 1rem;
            scrollbar-width: none;
        }
        .week-chip {
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            padding: 0.5rem 1rem;
            border-radius: 999px;
            white-space: nowrap;
            color: var(--color-text);
            cursor: pointer;
            transition: all 0.2s;
        }
        .week-chip.active {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
        }
        .days-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .day-card-detail {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .day-header h4 {
            margin: 0;
            font-size: 1.1rem;
        }
        .session-type-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .session-type-badge.gym { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .session-type-badge.athletics { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .session-type-badge.rest { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
        
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
            gap: 0.5rem;
        }
        .start-btn {
            flex: 1;
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
