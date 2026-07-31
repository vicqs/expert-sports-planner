import React, { useState, useEffect } from "react";
import { useMockDatabase } from "../context/MockDatabase";
import { Button, Card, ConfirmDialog, useToast } from "./ui";
import { useConfirm } from "../hooks";
import { Clock, CheckCircle, CalendarOff, CalendarCheck } from "lucide-react";

const GymBookingSystem = ({ athleteId }) => {
  const { getGymSchedule, bookGymSlot, gymBookings, cancelGymBooking } =
    useMockDatabase();
  const { addToast } = useToast();
  const { isOpen, isLoading, confirm, handleConfirm, handleCancel } =
    useConfirm();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [bookingId, setBookingId] = useState<any>(null);
  const [justBookedId, setJustBookedId] = useState<any>(null);

  useEffect(() => {
    setAvailableSlots(getGymSchedule(selectedDate));
  }, [selectedDate, getGymSchedule]);

  useEffect(() => {
    // Filter bookings for this athlete
    setMyBookings(
      gymBookings.filter(
        (b) => b.athleteId === athleteId && b.status !== "CANCELLED",
      ),
    );
  }, [gymBookings, athleteId]);

  const handleBook = (slotId) => {
    setBookingId(slotId);
    setTimeout(() => {
      const result = bookGymSlot(athleteId, selectedDate, slotId);
      setBookingId(null);
      if (result.success) {
        addToast("Reserva confirmada exitosamente", "success");
        setJustBookedId(slotId);
        setTimeout(() => setJustBookedId(null), 1500);
      } else {
        addToast(result.message, "error");
      }
    }, 450);
  };

  const handleCancelClick = (bookingId) => {
    setConfirmMessage("Esta acción cancelará tu reserva de gimnasio.");
    confirm(() => {
      cancelGymBooking(bookingId);
      addToast("Reserva cancelada", "success");
    });
  };

  const isSlotBooked = (slotId) => {
    return myBookings.some(
      (b) => b.date === selectedDate && b.slotId === slotId,
    );
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
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      <div className="booking-content">
        <div className="slots-section">
          <h3>Horarios Disponibles</h3>
          {availableSlots.length === 0 ? (
            <Card className="empty-slots">
              <CalendarOff size={36} color="var(--color-text-subtle)" />
              <p>No hay horarios disponibles para esta fecha.</p>
              <span className="hint">
                Prueba eligiendo otro día en el selector de arriba.
              </span>
            </Card>
          ) : (
            <div className="slots-grid">
              {availableSlots.map((slot) => {
                const booked = isSlotBooked(slot.id);
                const full = slot.reserved >= slot.capacity;

                return (
                  <Card
                    key={slot.id}
                    className={`slot-card tap-ripple ${booked ? "booked" : ""} ${full ? "full" : ""} ${justBookedId === slot.id ? "just-booked" : ""}`}
                  >
                    <div className="slot-time">
                      <Clock size={16} />
                      <span>
                        {slot.start} - {slot.end}
                      </span>
                      {justBookedId === slot.id && (
                        <CheckCircle size={16} className="just-booked-icon" />
                      )}
                    </div>
                    <div className="slot-info">
                      <div className="capacity-bar">
                        <div
                          className="fill"
                          style={{
                            width: `${(slot.reserved / slot.capacity) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <small>
                        {slot.reserved}/{slot.capacity} cupos
                      </small>
                    </div>
                    <Button
                      variant={
                        booked ? "success" : full ? "secondary" : "primary"
                      }
                      size="sm"
                      loading={bookingId === slot.id}
                      disabled={booked || full || bookingId === slot.id}
                      onClick={() => handleBook(slot.id)}
                      className="book-btn"
                    >
                      {bookingId === slot.id
                        ? "Reservando…"
                        : booked
                          ? "Reservado"
                          : full
                            ? "Lleno"
                            : "Reservar"}
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
            <Card className="empty-slots">
              <CalendarCheck size={36} color="var(--color-text-subtle)" />
              <p>No tienes reservas activas.</p>
              <span className="hint">
                Elige un horario disponible arriba para reservar tu cupo.
              </span>
            </Card>
          ) : (
            <div className="bookings-list">
              {myBookings.map((booking) => (
                <Card key={booking.id} className="booking-item">
                  <div className="booking-details">
                    <span className="booking-date">{booking.date}</span>
                    {/* Ideally we'd lookup the slot time here, but for now just date */}
                    <span className="status-badge">Confirmada</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelClick(booking.id)}
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
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title="Cancelar Reserva"
        message={confirmMessage || "¿Estás seguro de cancelar esta reserva?"}
        confirmText="Sí, Cancelar"
        cancelText="No, Mantener"
        variant="danger"
        isLoading={isLoading}
      />

      <style>{`
        .gym-booking {
            padding-bottom: 80px;
        }
        .empty-slots {
            text-align: center;
            padding: var(--space-10) var(--space-6);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--space-2);
        }
        .empty-slots p {
            margin: 0;
            color: var(--color-text-secondary);
            font-weight: 600;
        }
        .empty-slots .hint {
            color: var(--color-text-muted);
            font-size: var(--text-sm);
            max-width: 320px;
        }
        .booking-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--space-8);
        }
        .date-input {
            padding: var(--space-2);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-sm);
            background: var(--color-surface);
            color: var(--color-text);
        }
        .booking-content {
            display: grid;
            gap: var(--space-8);
        }
        .slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
            gap: var(--space-4);
        }
        .slot-card {
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            border: 1px solid transparent;
        }
        .slot-card.booked {
            border-color: var(--color-success);
            background: rgba(16, 185, 129, 0.05);
        }
        .slot-time {
            display: flex;
            align-items: center;
            gap: var(--space-2);
            font-weight: 600;
        }
        .capacity-bar {
            height: 4px;
            background: var(--color-surface-hover);
            border-radius: var(--radius-full);
            margin-bottom: var(--space-1);
            overflow: hidden;
        }
        .capacity-bar .fill {
            height: 100%;
            background: var(--color-primary);
            transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slot-card.just-booked {
            animation: slotSuccessPulse 0.6s ease;
            border-color: var(--color-success) !important;
        }
        .just-booked-icon {
            color: var(--color-success);
            margin-left: auto;
        }
        @keyframes slotSuccessPulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
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
