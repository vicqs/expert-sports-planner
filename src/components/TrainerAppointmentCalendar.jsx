import React, { useState } from 'react';
import { useMockDatabase } from '../context/MockDatabase';
import { Card, Button } from './ui';
import { Calendar, Clock, User, CheckCircle, XCircle } from 'lucide-react';

const TrainerAppointmentCalendar = () => {
    const { getTrainerAppointments, updateAppointmentStatus, updateAppointmentAvailability, getAppointmentAvailability } = useMockDatabase();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [view, setView] = useState('appointments'); // 'appointments' | 'availability'
    const [availSlots, setAvailSlots] = useState([]);

    // Load availability when date changes or view changes
    React.useEffect(() => {
        if (view === 'availability') {
            const slots = getAppointmentAvailability(selectedDate);
            setAvailSlots(slots.length > 0 ? slots : []);
        }
    }, [selectedDate, view, getAppointmentAvailability]);

    // In a real app, we'd fetch for a range or the selected date
    // For this mock, we'll filter all appointments by date
    const appointments = getTrainerAppointments(selectedDate);

    const handleStatusChange = (id, status) => {
        updateAppointmentStatus(id, status);
    };

    const handleAddSlot = () => {
        const newSlot = {
            id: Date.now().toString(),
            start: '09:00',
            end: '10:00'
        };
        setAvailSlots([...availSlots, newSlot]);
    };

    const handleUpdateSlot = (id, field, value) => {
        setAvailSlots(availSlots.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleDeleteSlot = (id) => {
        setAvailSlots(availSlots.filter(s => s.id !== id));
    };

    const handleSaveAvailability = () => {
        updateAppointmentAvailability(selectedDate, availSlots);
        alert('Disponibilidad guardada correctamente'); // Will replace with Toast later if context allows
    };

    return (
        <div className="trainer-calendar">
            <div className="calendar-header">
                <h2>{view === 'appointments' ? 'Calendario de Citas' : 'Configurar Disponibilidad'}</h2>
                <div className="header-controls">
                    <div className="date-selector">
                        <label>Fecha:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                    <div className="view-toggle">
                        <Button
                            variant={view === 'appointments' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('appointments')}
                        >
                            Citas
                        </Button>
                        <Button
                            variant={view === 'availability' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('availability')}
                        >
                            Disponibilidad
                        </Button>
                    </div>
                </div>
            </div>

            {view === 'appointments' ? (
                <div className="appointments-section">
                    {appointments.length === 0 ? (
                        <Card className="empty-state">
                            <p>No hay citas programadas para este día.</p>
                        </Card>
                    ) : (
                        <div className="appointments-list">
                            {appointments.map(app => (
                                <Card key={app.id} className="appointment-card-trainer">
                                    <div className="app-time">
                                        <Clock size={16} />
                                        <span>{app.time}</span>
                                        <span className="duration">({app.duration} min)</span>
                                    </div>
                                    <div className="app-info">
                                        <h4>{app.typeName}</h4>
                                        <div className="athlete-info">
                                            <User size={14} />
                                            <span>Atleta ID: {app.athleteId}</span>
                                            {/* In real app, we'd join with user table to get name */}
                                        </div>
                                        {app.notes && (
                                            <p className="notes">"{app.notes}"</p>
                                        )}
                                    </div>
                                    <div className="app-actions">
                                        {app.status === 'SCHEDULED' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="action-btn success"
                                                    onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                                                >
                                                    <CheckCircle size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="action-btn danger"
                                                    onClick={() => handleStatusChange(app.id, 'CANCELLED')}
                                                >
                                                    <XCircle size={18} />
                                                </Button>
                                            </>
                                        )}
                                        {app.status === 'COMPLETED' && (
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
                                <p className="empty-text">No hay horarios definidos. Agrega bloques de tiempo disponibles.</p>
                            )}
                            {availSlots.map((slot, index) => (
                                <div key={slot.id} className="slot-item">
                                    <span className="slot-label">Bloque {index + 1}</span>
                                    <input
                                        type="time"
                                        value={slot.start}
                                        onChange={(e) => handleUpdateSlot(slot.id, 'start', e.target.value)}
                                        className="time-input"
                                    />
                                    <span>-</span>
                                    <input
                                        type="time"
                                        value={slot.end}
                                        onChange={(e) => handleUpdateSlot(slot.id, 'end', e.target.value)}
                                        className="time-input"
                                    />
                                    <button className="delete-btn" onClick={() => handleDeleteSlot(slot.id)}>×</button>
                                </div>
                            ))}
                        </div>
                        <div className="avail-actions">
                            <Button variant="secondary" size="sm" onClick={handleAddSlot}>
                                + Agregar Bloque
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleSaveAvailability}>
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
                    margin-bottom: 2rem;
                }
                .header-controls {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
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
                .action-btn.success { color: var(--color-success); }
                .action-btn.danger { color: var(--color-danger); }
                
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
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
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
