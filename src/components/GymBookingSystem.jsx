import React, { useState, useEffect } from 'react';
import { useMockDatabase } from '../context/MockDatabase';
import { Button, Card } from './ui';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const GymBookingSystem = ({ athleteId }) => {
    const { getGymSchedule, bookGymSlot, gymBookings, cancelGymBooking } = useMockDatabase();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [myBookings, setMyBookings] = useState([]);

    useEffect(() => {
        setAvailableSlots(getGymSchedule(selectedDate));
    }, [selectedDate, getGymSchedule]);

    useEffect(() => {
        // Filter bookings for this athlete
        setMyBookings(gymBookings.filter(b => b.athleteId === athleteId && b.status !== 'CANCELLED'));
    }, [gymBookings, athleteId]);

    const handleBook = (slotId) => {
        const result = bookGymSlot(athleteId, selectedDate, slotId);
        if (result.success) {
            alert('Reserva confirmada');
        } else {
            alert(result.message);
        }
    };

    const handleCancel = (bookingId) => {
        if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
            cancelGymBooking(bookingId);
        }
    };

    const isSlotBooked = (slotId) => {
        return myBookings.some(b => b.date === selectedDate && b.slotId === slotId);
    };

    return (
        <div className="gym-booking">
            <div className="booking-header">
                <h2>Reservar Gimnasio</h2>
                <div className="date-selector">
                    <label>Fecha:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            </div>

            <div className="booking-content">
                <div className="slots-section">
                    <h3>Horarios Disponibles</h3>
                    {availableSlots.length === 0 ? (
                        <Card className="empty-slots">
                            <p>No hay horarios disponibles para esta fecha.</p>
                        </Card>
                    ) : (
                        <div className="slots-grid">
                            {availableSlots.map(slot => {
                                const booked = isSlotBooked(slot.id);
                                const full = slot.reserved >= slot.capacity;

                                return (
                                    <Card key={slot.id} className={`slot-card ${booked ? 'booked' : ''} ${full ? 'full' : ''}`}>
                                        <div className="slot-time">
                                            <Clock size={16} />
                                            <span>{slot.start} - {slot.end}</span>
                                        </div>
                                        <div className="slot-info">
                                            <div className="capacity-bar">
                                                <div
                                                    className="fill"
                                                    style={{ width: `${(slot.reserved / slot.capacity) * 100}%` }}
                                                ></div>
                                            </div>
                                            <small>{slot.reserved}/{slot.capacity} cupos</small>
                                        </div>
                                        <Button
                                            variant={booked ? "success" : (full ? "secondary" : "primary")}
                                            size="sm"
                                            disabled={booked || full}
                                            onClick={() => handleBook(slot.id)}
                                            className="book-btn"
                                        >
                                            {booked ? 'Reservado' : (full ? 'Lleno' : 'Reservar')}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="my-bookings-section">
                    <h3>Mis Reservas Activas</h3>
                    {myBookings.length === 0 ? (
                        <p className="no-bookings">No tienes reservas activas.</p>
                    ) : (
                        <div className="bookings-list">
                            {myBookings.map(booking => (
                                <Card key={booking.id} className="booking-item">
                                    <div className="booking-details">
                                        <span className="booking-date">{booking.date}</span>
                                        {/* Ideally we'd lookup the slot time here, but for now just date */}
                                        <span className="status-badge">Confirmada</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleCancel(booking.id)} className="cancel-btn">
                                        Cancelar
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .gym-booking {
            padding-bottom: 80px;
        }
        .booking-header {
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
        .booking-content {
            display: grid;
            gap: 2rem;
        }
        .slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }
        .slot-card {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            border: 1px solid transparent;
        }
        .slot-card.booked {
            border-color: var(--color-success);
            background: rgba(16, 185, 129, 0.05);
        }
        .slot-time {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
        }
        .capacity-bar {
            height: 4px;
            background: var(--color-surface-hover);
            border-radius: 999px;
            margin-bottom: 0.25rem;
            overflow: hidden;
        }
        .capacity-bar .fill {
            height: 100%;
            background: var(--color-primary);
        }
        .book-btn {
            width: 100%;
        }
        .my-bookings-section {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--color-border);
        }
        .booking-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        .booking-details {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        .status-badge {
            font-size: 0.8rem;
            background: rgba(16, 185, 129, 0.1);
            color: var(--color-success);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
        }
        .cancel-btn {
            color: var(--color-danger);
        }
        .cancel-btn:hover {
            background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
        </div>
    );
};

export default GymBookingSystem;
