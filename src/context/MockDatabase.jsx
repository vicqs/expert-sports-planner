import React, { createContext, useContext, useState, useEffect } from 'react';

const MockDatabaseContext = createContext();

export const useMockDatabase = () => {
    const context = useContext(MockDatabaseContext);
    if (!context) {
        throw new Error('useMockDatabase must be used within a MockDatabaseProvider');
    }
    return context;
};

export const MockDatabaseProvider = ({ children }) => {
    // Load from local storage to persist across reloads
    const [clients, setClients] = useState(() => {
        const saved = localStorage.getItem('expert_planner_clients');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('expert_planner_clients', JSON.stringify(clients));
    }, [clients]);

    const addClientRequest = (clientData) => {
        const newClient = {
            id: crypto.randomUUID(),
            ...clientData,
            status: 'PENDING', // PENDING, COMPLETED
            submittedAt: new Date().toISOString(),
            plan: null
        };
        setClients(prev => [...prev, newClient]);
        return newClient.id;
    };

    const updateClientPlan = (clientId, planText, planObject) => {
        setClients(prev => prev.map(c =>
            c.id === clientId
                ? {
                    ...c,
                    status: 'COMPLETED',
                    plan: planText,
                    planObject: planObject,
                    completedAt: new Date().toISOString()
                }
                : c
        ));
    };

    const toggleSessionCompletion = (clientId, weekIndex, dayIndex) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;

            const newPlanObject = [...client.planObject];
            const day = newPlanObject[weekIndex].days[dayIndex];

            // Toggle completion status
            day.completed = !day.completed;

            // Calculate new progress
            const totalSessions = newPlanObject.reduce((acc, week) =>
                acc + week.days.filter(d => d.sessionType !== 'REST').length, 0);

            const completedSessions = newPlanObject.reduce((acc, week) =>
                acc + week.days.filter(d => d.completed).length, 0);

            const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

            return {
                ...client,
                planObject: newPlanObject,
                progress: progress
            };
        }));
    };

    const updateSessionNote = (clientId, weekIndex, dayIndex, note) => {
        setClients(prev => prev.map(client => {
            if (client.id !== clientId) return client;
            const newPlanObject = [...client.planObject];
            newPlanObject[weekIndex].days[dayIndex].note = note;
            return {
                ...client,
                planObject: newPlanObject
            };
        }));
    };

    const [gymAvailability, setGymAvailability] = useState([]); // { date: 'YYYY-MM-DD', slots: [] }
    const [gymBookings, setGymBookings] = useState([]); // { id, athleteId, date, slotId, status }

    // ... existing client methods ...

    // Gym Methods
    const updateGymSchedule = (date, slots) => {
        setGymAvailability(prev => {
            const existingIndex = prev.findIndex(d => d.date === date);
            if (existingIndex >= 0) {
                const newSchedule = [...prev];
                newSchedule[existingIndex] = { date, slots };
                return newSchedule;
            }
            return [...prev, { date, slots }];
        });
    };

    const getGymSchedule = (date) => {
        return gymAvailability.find(d => d.date === date)?.slots || [];
    };

    const bookGymSlot = (athleteId, date, slotId) => {
        // Check if already booked
        const existingBooking = gymBookings.find(b =>
            b.athleteId === athleteId && b.date === date && b.status !== 'CANCELLED'
        );
        if (existingBooking) return { success: false, message: 'Ya tienes una reserva para este día.' };

        // Check availability
        const daySchedule = gymAvailability.find(d => d.date === date);
        const slot = daySchedule?.slots.find(s => s.id === slotId);

        if (!slot || slot.reserved >= slot.capacity) {
            return { success: false, message: 'Cupos agotados.' };
        }

        // Create booking
        const newBooking = {
            id: Date.now().toString(),
            athleteId,
            date,
            slotId,
            status: 'CONFIRMED',
            timestamp: new Date().toISOString()
        };

        setGymBookings(prev => [...prev, newBooking]);

        // Update slot reserved count
        setGymAvailability(prev => prev.map(d => {
            if (d.date !== date) return d;
            return {
                ...d,
                slots: d.slots.map(s => s.id === slotId ? { ...s, reserved: s.reserved + 1 } : s)
            };
        }));

        return { success: true, booking: newBooking };
    };

    const cancelGymBooking = (bookingId) => {
        const booking = gymBookings.find(b => b.id === bookingId);
        if (!booking) return;

        setGymBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
        ));

        // Decrease reserved count
        setGymAvailability(prev => prev.map(d => {
            if (d.date !== booking.date) return d;
            return {
                ...d,
                slots: d.slots.map(s => s.id === booking.slotId ? { ...s, reserved: Math.max(0, s.reserved - 1) } : s)
            };
        }));
    };

    const [appointments, setAppointments] = useState([]); // { id, athleteId, date, time, type, status, notes }

    // ... existing gym methods ...

    // Appointment Methods
    const addAppointment = (appointmentData) => {
        const newAppointment = {
            id: Date.now().toString(),
            status: 'SCHEDULED',
            ...appointmentData
        };
        setAppointments(prev => [...prev, newAppointment]);
        return { success: true, appointment: newAppointment };
    };

    const updateAppointmentStatus = (id, status) => {
        setAppointments(prev => prev.map(a =>
            a.id === id ? { ...a, status } : a
        ));
    };

    const getTrainerAppointments = (date) => {
        return appointments.filter(a => a.date === date && a.status !== 'CANCELLED');
    };

    // Appointment Availability
    const [appointmentAvailability, setAppointmentAvailability] = useState([]); // { date, slots: [{id, start, end}] }

    const updateAppointmentAvailability = (date, slots) => {
        setAppointmentAvailability(prev => {
            const existingIndex = prev.findIndex(d => d.date === date);
            if (existingIndex >= 0) {
                const newSchedule = [...prev];
                newSchedule[existingIndex] = { date, slots };
                return newSchedule;
            }
            return [...prev, { date, slots }];
        });
    };

    const getAppointmentAvailability = (date) => {
        return appointmentAvailability.find(d => d.date === date)?.slots || [];
    };

    const getAthleteAppointments = (athleteId) => {
        return appointments.filter(a => a.athleteId === athleteId && a.status !== 'CANCELLED');
    };

    const getPendingClients = () => clients.filter(c => c.status === 'PENDING');
    const getCompletedClients = () => clients.filter(c => c.status === 'COMPLETED');

    return (
        <MockDatabaseContext.Provider value={{
            clients,
            addClientRequest,
            updateClientPlan,
            toggleSessionCompletion,
            updateSessionNote,
            getPendingClients,
            getCompletedClients,
            gymAvailability,
            gymBookings,
            updateGymSchedule,
            getGymSchedule,
            bookGymSlot,
            cancelGymBooking,
            appointments,
            addAppointment,
            updateAppointmentStatus,
            getTrainerAppointments,
            getAthleteAppointments,
            updateAppointmentAvailability,
            getAppointmentAvailability
        }}>
            {children}
        </MockDatabaseContext.Provider>
    );
};
