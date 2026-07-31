import React, { createContext, useContext, useState, useEffect } from "react";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "../utils/storage";
import {
  mockClients,
  mockCompletedClients,
  mockAthleteRequests,
  mockGymAvailability,
  mockGymBookings,
  mockAppointments,
} from "../utils/mockProfiles";

const MockDatabaseContext = createContext<any>(null);

export const useMockDatabase = () => {
  const context = useContext(MockDatabaseContext);
  if (!context) {
    throw new Error(
      "useMockDatabase must be used within a MockDatabaseProvider",
    );
  }
  return context;
};

export const MockDatabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Load from local storage to persist across reloads
  const [clients, setClients] = useState<any[]>(() => {
    return getFromStorage<any[]>(STORAGE_KEYS.CLIENTS, []);
  });

  const [gymAvailability, setGymAvailability] = useState<any[]>(() => {
    return getFromStorage<any[]>(STORAGE_KEYS.GYM_AVAILABILITY, []);
  });

  const [gymBookings, setGymBookings] = useState<any[]>(() => {
    return getFromStorage<any[]>(STORAGE_KEYS.GYM_BOOKINGS, []);
  });

  const [appointments, setAppointments] = useState<any[]>(() => {
    return getFromStorage<any[]>(STORAGE_KEYS.APPOINTMENTS, []);
  });

  const [appointmentAvailability, setAppointmentAvailability] = useState<any[]>(
    () => {
      return getFromStorage<any[]>(STORAGE_KEYS.APPOINTMENT_AVAILABILITY, []);
    },
  );

  // Sistema de solicitudes atleta-entrenador
  const [athleteRequests, setAthleteRequests] = useState<any[]>(() => {
    return getFromStorage<any[]>("athleteRequests", []);
  });

  // Limpiar solicitudes antiguas con trainerId incorrecto (una sola vez)
  useEffect(() => {
    const cleanupKey = "athleteRequests_cleanup_v1";
    const cleanupDone = localStorage.getItem(cleanupKey);

    if (!cleanupDone) {
      setAthleteRequests([]);
      localStorage.setItem(cleanupKey, "true");
    }
  }, []);

  // Sembrar datos de demostración (mock) en cada carga: un entrenador y dos
  // atletas de prueba (con planes activos, un plan completado, reservas de
  // gimnasio y citas), usados por el "modo vista previa" del super admin.
  // Se ejecuta en CADA mount (no solo la primera vez) porque las fechas de
  // `mockGymAvailability`/`mockAppointments` son relativas a "hoy": si solo
  // sembráramos una vez, los cupos de gimnasio quedarían fechados al día en
  // que se sembraron originalmente y ya no aparecerían como disponibles hoy.
  // Es seguro repetirlo: cada bloque hace dedupe por id/fecha antes de agregar.
  useEffect(() => {
    // Los planes ACTIVOS de los atletas mock (`mockClients`) se refrescan
    // (upsert) en cada carga en lugar de solo agregarse si faltan: sus fechas
    // se calculan relativas a "hoy", así que una copia vieja guardada en
    // localStorage de una sesión anterior podría ya tener `endDate` en el
    // pasado. `autoCompletePlans()` la marcaría como COMPLETED al vuelo y el
    // atleta demo se quedaría sin planes activos que ver. Al hacer upsert por
    // id nos aseguramos de que siempre haya un plan ACTIVO vigente para probar.
    setClients((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      mockClients.forEach((c) => byId.set(c.id, c));
      mockCompletedClients.forEach((c) => {
        if (!byId.has(c.id)) byId.set(c.id, c);
      });
      return Array.from(byId.values());
    });

    setAthleteRequests((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = mockAthleteRequests.filter((r) => !existingIds.has(r.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });

    setGymAvailability((prev) => {
      const existingDates = new Set(prev.map((d) => d.date));
      const toAdd = mockGymAvailability.filter(
        (d) => !existingDates.has(d.date),
      );
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });

    setGymBookings((prev) => {
      const existingIds = new Set(prev.map((b) => b.id));
      const toAdd = mockGymBookings.filter((b) => !existingIds.has(b.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });

    setAppointments((prev) => {
      const existingIds = new Set(prev.map((a) => a.id));
      const toAdd = mockAppointments.filter((a) => !existingIds.has(a.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  }, []);

  // Persist all state changes to localStorage
  useEffect(() => {
    setToStorage(STORAGE_KEYS.CLIENTS, clients);
  }, [clients]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.GYM_AVAILABILITY, gymAvailability);
  }, [gymAvailability]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.GYM_BOOKINGS, gymBookings);
  }, [gymBookings]);

  useEffect(() => {
    setToStorage(STORAGE_KEYS.APPOINTMENTS, appointments);
  }, [appointments]);

  useEffect(() => {
    setToStorage(
      STORAGE_KEYS.APPOINTMENT_AVAILABILITY,
      appointmentAvailability,
    );
  }, [appointmentAvailability]);

  useEffect(() => {
    setToStorage("athleteRequests", athleteRequests);
  }, [athleteRequests]);

  const addClientRequest = (clientData, trainerId = null) => {
    const newClient = {
      id: crypto.randomUUID(),
      ...clientData,
      trainerId: trainerId || clientData.trainerId || null,
      status: "PENDING", // PENDING, ACTIVE, COMPLETED, DELETED
      submittedAt: new Date().toISOString(),
      plan: null,
      planDuration: clientData.planDuration || 4, // weeks
    };
    setClients((prev) => [...prev, newClient]);
    return newClient.id;
  };

  const updateClientPlan = (clientId, planText, planObject) => {
    const client = clients.find((c) => c.id === clientId);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (client?.planDuration || 4) * 7); // weeks to days

    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: "ACTIVE",
              plan: planText,
              planObject: planObject,
              planCreatedAt: new Date().toISOString(),
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              progress: 0,
            }
          : c,
      ),
    );
  };

  const toggleSessionCompletion = (clientId, weekIndex, dayIndex) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;

        const newPlanObject = [...client.planObject];
        const day = newPlanObject[weekIndex].days[dayIndex];

        // Toggle completion status
        day.completed = !day.completed;

        // Calculate new progress
        // `generatePlan()` marca los días de descanso con `session: null`; los
        // días con entrenamiento (gym o atletismo) tienen `session` definido.
        const totalSessions = newPlanObject.reduce(
          (acc, week) => acc + week.days.filter((d) => d.session).length,
          0,
        );

        const completedSessions = newPlanObject.reduce(
          (acc, week) => acc + week.days.filter((d) => d.completed).length,
          0,
        );

        const progress =
          totalSessions > 0
            ? Math.round((completedSessions / totalSessions) * 100)
            : 0;

        return {
          ...client,
          planObject: newPlanObject,
          progress: progress,
        };
      }),
    );
  };

  const updateSessionNote = (clientId, weekIndex, dayIndex, note) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;
        const newPlanObject = [...client.planObject];
        newPlanObject[weekIndex].days[dayIndex].note = note;
        return {
          ...client,
          planObject: newPlanObject,
        };
      }),
    );
  };

  // Marca/desmarca una serie individual de un ejercicio como completada.
  // Se persiste en `exercise.completedSets` (array de índices de serie) para
  // que el atleta no pierda su progreso al salir y volver a la vista "Hoy".
  const toggleSetCompletion = (
    clientId,
    weekIndex,
    dayIndex,
    exerciseIndex,
    setIndex,
  ) => {
    setClients((prev) =>
      prev.map((client) => {
        if (client.id !== clientId) return client;

        const newPlanObject = [...client.planObject];
        const day = { ...newPlanObject[weekIndex].days[dayIndex] };
        // Los ejercicios de gimnasio viven en `day.session.exercises`
        // (shape de `generatePlan()`); se mantiene el fallback a `day.exercises`
        // por compatibilidad con datos antiguos que pudieran tener el shape plano.
        const exercises = [...(day.session?.exercises || day.exercises || [])];
        const exercise = { ...exercises[exerciseIndex] };

        const completed = new Set<number>(exercise.completedSets || []);
        if (completed.has(setIndex)) completed.delete(setIndex);
        else completed.add(setIndex);
        exercise.completedSets = Array.from(completed);

        exercises[exerciseIndex] = exercise;
        if (day.session) {
          day.session = { ...day.session, exercises };
        } else {
          day.exercises = exercises;
        }
        newPlanObject[weekIndex].days[dayIndex] = day;

        return {
          ...client,
          planObject: newPlanObject,
        };
      }),
    );
  };

  // Gym Methods
  const updateGymSchedule = (date, slots) => {
    setGymAvailability((prev) => {
      const existingIndex = prev.findIndex((d) => d.date === date);
      if (existingIndex >= 0) {
        const newSchedule = [...prev];
        newSchedule[existingIndex] = { date, slots };
        return newSchedule;
      }
      return [...prev, { date, slots }];
    });
  };

  const getGymSchedule = (date) => {
    return gymAvailability.find((d) => d.date === date)?.slots || [];
  };

  const bookGymSlot = (athleteId, date, slotId) => {
    // Check if already booked
    const existingBooking = gymBookings.find(
      (b) =>
        b.athleteId === athleteId &&
        b.date === date &&
        b.status !== "CANCELLED",
    );
    if (existingBooking)
      return {
        success: false,
        message: "Ya tienes una reserva para este día.",
      };

    // Check availability
    const daySchedule = gymAvailability.find((d) => d.date === date);
    const slot = daySchedule?.slots.find((s) => s.id === slotId);

    if (!slot || slot.reserved >= slot.capacity) {
      return { success: false, message: "Cupos agotados." };
    }

    // Create booking
    const newBooking = {
      id: Date.now().toString(),
      athleteId,
      date,
      slotId,
      status: "CONFIRMED",
      timestamp: new Date().toISOString(),
    };

    setGymBookings((prev) => [...prev, newBooking]);

    // Update slot reserved count
    setGymAvailability((prev) =>
      prev.map((d) => {
        if (d.date !== date) return d;
        return {
          ...d,
          slots: d.slots.map((s) =>
            s.id === slotId ? { ...s, reserved: s.reserved + 1 } : s,
          ),
        };
      }),
    );

    return { success: true, booking: newBooking };
  };

  const cancelGymBooking = (bookingId) => {
    const booking = gymBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setGymBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b)),
    );

    // Decrease reserved count
    setGymAvailability((prev) =>
      prev.map((d) => {
        if (d.date !== booking.date) return d;
        return {
          ...d,
          slots: d.slots.map((s) =>
            s.id === booking.slotId
              ? { ...s, reserved: Math.max(0, s.reserved - 1) }
              : s,
          ),
        };
      }),
    );
  };

  // Appointment Methods
  const addAppointment = (appointmentData) => {
    const newAppointment = {
      id: Date.now().toString(),
      status: "SCHEDULED",
      ...appointmentData,
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return { success: true, appointment: newAppointment };
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  // Reprograma una cita existente a una nueva fecha/hora, sin perder
  // el resto de sus datos (atleta, tipo, notas, duración).
  const rescheduleAppointment = (id, newDate, newTime) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, date: newDate, time: newTime } : a,
      ),
    );
  };

  const getTrainerAppointments = (date) => {
    return appointments.filter(
      (a) => a.date === date && a.status !== "CANCELLED",
    );
  };

  // Appointment Availability Management
  const updateAppointmentAvailability = (date, slots) => {
    setAppointmentAvailability((prev) => {
      const existingIndex = prev.findIndex((d) => d.date === date);
      if (existingIndex >= 0) {
        const newSchedule = [...prev];
        newSchedule[existingIndex] = { date, slots };
        return newSchedule;
      }
      return [...prev, { date, slots }];
    });
  };

  const getAppointmentAvailability = (date) => {
    return appointmentAvailability.find((d) => d.date === date)?.slots || [];
  };

  const getAthleteAppointments = (athleteId) => {
    return appointments.filter(
      (a) => a.athleteId === athleteId && a.status !== "CANCELLED",
    );
  };

  const getPendingClients = (trainerId = null) => {
    if (trainerId) {
      return clients.filter(
        (c) => c.status === "PENDING" && c.trainerId === trainerId,
      );
    }
    return clients.filter((c) => c.status === "PENDING");
  };

  const getCompletedClients = (trainerId = null) => {
    if (trainerId) {
      return clients.filter(
        (c) => c.status === "COMPLETED" && c.trainerId === trainerId,
      );
    }
    return clients.filter((c) => c.status === "COMPLETED");
  };

  /**
   * Get all active plans (within date range)
   * @param {string|null} trainerId - Filter by trainer ID (optional)
   * @param {string|null} athleteId - Filter by athlete ID (optional)
   */
  const getActivePlans = (trainerId = null, athleteId = null) => {
    const now = new Date();
    return clients.filter((c) => {
      if (c.status !== "ACTIVE" || !c.planObject) return false;
      if (!c.startDate || !c.endDate) return true; // legacy plans

      // Filter by trainerId if provided
      if (trainerId && c.trainerId !== trainerId) return false;

      // Filter by athleteId if provided
      if (athleteId && c.id !== athleteId) return false;

      const startDate = new Date(c.startDate);
      const endDate = new Date(c.endDate);
      return now >= startDate && now <= endDate;
    });
  };

  /**
   * Get all completed plans
   * @param {string|null} trainerId - Filter by trainer ID (optional)
   */
  const getCompletedPlans = (trainerId = null) => {
    if (trainerId) {
      return clients.filter(
        (c) =>
          c.status === "COMPLETED" && c.planObject && c.trainerId === trainerId,
      );
    }
    return clients.filter((c) => c.status === "COMPLETED" && c.planObject);
  };

  /**
   * Get athlete bookings by athleteId
   */
  const getAthleteGymBookings = (athleteId) => {
    return gymBookings.filter(
      (b) => b.athleteId === athleteId && b.status !== "CANCELLED",
    );
  };

  /**
   * Delete a plan (mark as deleted)
   */
  const deletePlan = (clientId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: "DELETED",
              deletedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
  };

  /**
   * Complete a plan manually
   */
  const completePlan = (clientId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              status: "COMPLETED",
              completedAt: new Date().toISOString(),
            }
          : c,
      ),
    );
  };

  /**
   * Auto-complete expired plans
   */
  const autoCompletePlans = () => {
    const now = new Date();
    setClients((prev) =>
      prev.map((c) => {
        if (c.status === "ACTIVE" && c.endDate) {
          const endDate = new Date(c.endDate);
          if (now > endDate) {
            return {
              ...c,
              status: "COMPLETED",
              completedAt: now.toISOString(),
            };
          }
        }
        return c;
      }),
    );
  };

  // ===== SISTEMA DE SOLICITUDES ATLETA-ENTRENADOR =====

  /**
   * Obtener todos los entrenadores disponibles
   */
  const getAllTrainers = () => {
    const users = getFromStorage<any[]>("users", []);
    return users
      .filter((u) => u.role === "TRAINER")
      .map((trainer) => ({
        id: trainer.trainerId, // Usar trainerId en lugar de id para que coincida con getTrainerId()
        name: trainer.name,
        email: trainer.email,
        code: (trainer.trainerId || trainer.id).substring(0, 8).toUpperCase(), // Código único
      }));
  };

  /**
   * Enviar solicitud de atleta a entrenador
   */
  const sendTrainerRequest = (athleteId, trainerId, message = "") => {
    const users = getFromStorage<any[]>("users", []);
    const athlete = users.find((u) => u.id === athleteId);
    const trainer = users.find((u) => u.trainerId === trainerId);

    if (!athlete || !trainer) {
      return { success: false, message: "Usuario no encontrado" };
    }

    // Verificar que el atleta tenga email y contraseña
    if (!athlete.email || !athlete.passwordHash) {
      return {
        success: false,
        requiresCompletion: true,
        message:
          "Debes completar tu registro con email y contraseña antes de enviar solicitudes",
      };
    }

    // Verificar si ya tiene una solicitud pendiente o aceptada
    const existing = athleteRequests.find(
      (r) =>
        r.athleteId === athleteId &&
        r.trainerId === trainerId &&
        (r.status === "PENDING" || r.status === "ACCEPTED"),
    );

    if (existing) {
      return {
        success: false,
        message:
          existing.status === "ACCEPTED"
            ? "Ya estás vinculado con este entrenador"
            : "Ya tienes una solicitud pendiente con este entrenador",
      };
    }

    const newRequest = {
      id: crypto.randomUUID(),
      athleteId,
      trainerId,
      athleteName: athlete.name,
      athleteEmail: athlete.email,
      trainerName: trainer.name,
      message,
      status: "PENDING", // PENDING, ACCEPTED, REJECTED
      createdAt: new Date().toISOString(),
    };

    setAthleteRequests((prev) => [...prev, newRequest]);

    return { success: true, request: newRequest };
  };

  /**
   * Obtener solicitudes pendientes de un entrenador
   */
  const getTrainerRequests = (trainerId, status = "PENDING") => {
    return athleteRequests.filter(
      (r) => r.trainerId === trainerId && r.status === status,
    );
  };

  /**
   * Aceptar solicitud de atleta
   */
  const acceptTrainerRequest = (requestId) => {
    setAthleteRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "ACCEPTED",
              acceptedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  };

  /**
   * Rechazar solicitud de atleta
   */
  const rejectTrainerRequest = (requestId) => {
    setAthleteRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: "REJECTED",
              rejectedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  };

  /**
   * Obtener atletas aceptados de un entrenador
   */
  const getTrainerAthletes = (trainerId) => {
    return athleteRequests.filter(
      (r) => r.trainerId === trainerId && r.status === "ACCEPTED",
    );
  };

  /**
   * Quitar un atleta (el entrenador lo remueve)
   */
  const removeAthlete = (trainerId, athleteId) => {
    setAthleteRequests((prev) =>
      prev.map((r) =>
        r.trainerId === trainerId &&
        r.athleteId === athleteId &&
        r.status === "ACCEPTED"
          ? {
              ...r,
              status: "REMOVED",
              removedAt: new Date().toISOString(),
            }
          : r,
      ),
    );
  };

  /**
   * Obtener el entrenador asignado de un atleta
   */
  const getAthleteTrainer = (athleteId) => {
    const accepted = athleteRequests.find(
      (r) => r.athleteId === athleteId && r.status === "ACCEPTED",
    );

    if (!accepted) return null;

    return {
      id: accepted.trainerId,
      name: accepted.trainerName,
      requestId: accepted.id,
    };
  };

  /**
   * Obtener solicitud pendiente de un atleta
   */
  const getAthletePendingRequest = (athleteId) => {
    return athleteRequests.find(
      (r) => r.athleteId === athleteId && r.status === "PENDING",
    );
  };

  return (
    <MockDatabaseContext.Provider
      value={{
        clients,
        addClientRequest,
        updateClientPlan,
        toggleSessionCompletion,
        updateSessionNote,
        toggleSetCompletion,
        getPendingClients,
        getCompletedClients,
        getActivePlans,
        gymAvailability,
        gymBookings,
        updateGymSchedule,
        getGymSchedule,
        bookGymSlot,
        cancelGymBooking,
        getAthleteGymBookings,
        appointments,
        addAppointment,
        updateAppointmentStatus,
        rescheduleAppointment,
        getTrainerAppointments,
        getAthleteAppointments,
        updateAppointmentAvailability,
        getAppointmentAvailability,
        deletePlan,
        completePlan,
        autoCompletePlans,
        getCompletedPlans,
        // Sistema de solicitudes atleta-entrenador
        athleteRequests,
        getAllTrainers,
        sendTrainerRequest,
        getTrainerRequests,
        acceptTrainerRequest,
        rejectTrainerRequest,
        getTrainerAthletes,
        removeAthlete,
        getAthleteTrainer,
        getAthletePendingRequest,
      }}
    >
      {children}
    </MockDatabaseContext.Provider>
  );
};
