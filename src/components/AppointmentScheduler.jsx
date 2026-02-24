import React, { useState } from 'react';
import { useMockDatabase } from '../context/MockDatabase';
import { Button, Card } from './ui';
import { Calendar, Clock, User, CheckCircle } from 'lucide-react';

const APPOINTMENT_TYPES = [
    { id: 'eval', label: 'Evaluación Inicial', duration: 60, icon: '📊' },
    { id: 'followup', label: 'Seguimiento', duration: 30, icon: '💬' },
    { id: 'weight', label: 'Control de Peso', duration: 15, icon: '⚖️' },
    { id: 'adjust', label: 'Ajuste de Plan', duration: 45, icon: '🎯' }
];

const AppointmentScheduler = ({ athleteId }) => {
    const { addAppointment, getAthleteAppointments } = useMockDatabase();
    const [step, setStep] = useState(1); // 1: Type, 2: Date/Time, 3: Confirm
    const [selectedType, setSelectedType] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');

    const myAppointments = getAthleteAppointments(athleteId);

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setStep(2);
    };

    const handleConfirm = () => {
        const result = addAppointment({
            athleteId,
            date: selectedDate,
            time: selectedTime,
            type: selectedType.id,
            typeName: selectedType.label,
            duration: selectedType.duration,
            notes
        });

        if (result.success) {
            alert('Cita agendada correctamente');
            setStep(1);
            setSelectedType(null);
            setSelectedDate('');
            setSelectedTime('');
            setNotes('');
        }
    };

    return (
        <div className="appointment-scheduler">
            <div className="scheduler-content">
                {step === 1 && (
                    <div className="step-container">
                        <h3>Selecciona el tipo de cita</h3>
                        <div className="types-grid">
                            {APPOINTMENT_TYPES.map(type => (
                                <Card
                                    key={type.id}
                                    className="type-card"
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
                                min={new Date().toISOString().split('T')[0]}
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
                            <Button variant="secondary" onClick={() => setStep(1)}>Atrás</Button>
                            <Button
                                variant="primary"
                                disabled={!selectedDate || !selectedTime}
                                onClick={handleConfirm}
                            >
                                Confirmar Cita
                            </Button>
                        </div>
                    </div>
                )}

                <div className="my-appointments">
                    <h3>Mis Citas Programadas</h3>
                    {myAppointments.length === 0 ? (
                        <p className="empty-text">No tienes citas próximas.</p>
                    ) : (
                        <div className="appointments-list">
                            {myAppointments.map(app => (
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
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .appointment-scheduler {
                    padding-bottom: 80px;
                }
                .step-container {
                    margin-bottom: 2rem;
                }
                .types-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 1rem;
                    margin-top: 1rem;
                }
                .type-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    padding: 1.5rem;
                }
                .type-icon {
                    font-size: 2rem;
                }
                .type-info h4 {
                    margin: 0;
                    font-size: 0.9rem;
                }
                .duration {
                    font-size: 0.8rem;
                    color: var(--color-text-muted);
                }
                .form-group {
                    margin-bottom: 1rem;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                }
                .input-field {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid var(--color-border);
                    border-radius: var(--radius-sm);
                    background: var(--color-surface);
                    color: var(--color-text);
                }
                .actions {
                    display: flex;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }
                .my-appointments {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--color-border);
                }
                .empty-text {
                    color: var(--color-text-muted);
                    text-align: center;
                }
                .appointments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .appointment-card {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .app-header {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 600;
                }
                .app-status {
                    font-size: 0.8rem;
                    padding: 0.2rem 0.5rem;
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--color-success);
                    border-radius: 4px;
                }
                .app-details {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.9rem;
                    color: var(--color-text-muted);
                }
                .detail-item {
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }
            `}</style>
        </div>
    );
};

export default AppointmentScheduler;
