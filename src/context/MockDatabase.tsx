import React, { createContext, useContext, useState, useEffect } from "react";
import { STORAGE_KEYS, getFromStorage, setToStorage } from "../utils/storage";
import { getAllUsers, getCurrentUser } from "../utils/auth";
import { getAthleticsParts } from "../utils/athleteHistory";
import {
  getMeasurements,
  purgeMeasurements,
  saveMeasurement,
} from "../utils/measurements";
import {
  mockClients,
  mockCompletedClients,
  mockAthleteRequests,
  mockGymAvailability,
  mockGymBookings,
  mockAppointments,
  mockAppointmentAvailability,
  mockTrainerUser,
  mockAthlete1User,
  mockAthlete2User,
} from "../utils/mockProfiles";

const MockDatabaseContext = createContext<any>(null);

const MOCK_SEED_KEY = "mock_seed_version";
const MOCK_SEED_VERSION = "2";

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
    // Los perfiles mock (entrenador + 2 atletas) antes solo vivían en memoria
    // vía `startPreview()` (Zustand, ver usePreviewStore.ts) y NUNCA se
    // guardaban como registros reales en la clave "users" de localStorage
    // (la que lee `getAllUsers()` en utils/auth.ts). Esto rompía cualquier
    // función trainer-only que busca al atleta por id ahí — ej.
    // `updateAthleteBasicInfo`/`setAthleteInjuries` lanzaban "Atleta no
    // encontrado" al editar Datos Básicos/Lesiones desde "Mis Atletas" en
    // modo vista previa. Se hace upsert (igual que `mockClients` arriba) por
    // si el usuario ya tenía una copia vieja guardada de una sesión anterior.
    const liveUsers = getAllUsers();
    const byId = new Map(liveUsers.map((u: any) => [u.id, u]));
    // Con una versión de semilla nueva se reemplazan los datos demo guardados;
    // después se respetan las ediciones del usuario (nombre, empresa, etc.).
    const freshSeed = localStorage.getItem(MOCK_SEED_KEY) !== MOCK_SEED_VERSION;
    [mockTrainerUser, mockAthlete1User, mockAthlete2User].forEach((u) => {
      byId.set(
        u.id,
        freshSeed ? { ...byId.get(u.id), ...u } : { ...u, ...byId.get(u.id) },
      );
    });
    localStorage.setItem(MOCK_SEED_KEY, MOCK_SEED_VERSION);
    localStorage.setItem("users", JSON.stringify(Array.from(byId.values())));

    // Mediciones demo del Atleta 1 (solo si aún no tiene ninguna).
    if (getMeasurements(mockAthlete1User.id).length === 0) {
      const base = {
        talla: 170,
        c_torax: 0,
        d_muneca: 0,
      };
      saveMeasurement(mockAthlete1User.id, {
        id: "demo-meas-1",
        date: "2026-07-21",
        sex: "M",
        age: 36,
        values: {
          peso: 78.5,
          talla: base.talla,
          c_cintura: 86,
          c_cadera: 103,
          c_brazo: 32.5,
          c_brazoMax: 34.5,
          c_muslo: 59,
          c_pantorrilla: 40,
          c_pantorrillaMax: 40.5,
          p_triceps: 16,
          p_biceps: 10,
          p_pecho: 16,
          p_axila: 18,
          p_subescapular: 22,
          p_suprailiaco: 18,
          p_abdomen: 30,
          p_muslo: 23,
          p_pantorrilla: 13,
        },
      });
      saveMeasurement(mockAthlete1User.id, {
        id: "demo-meas-2",
        date: "2026-08-18",
        sex: "M",
        age: 36,
        values: {
          peso: 78.7,
          talla: base.talla,
          c_cintura: 87,
          c_cadera: 102.5,
          c_brazo: 32.5,
          c_brazoMax: 34.8,
          c_muslo: 58,
          c_pantorrilla: 39.5,
          c_pantorrillaMax: 40,
          p_triceps: 16,
          p_biceps: 10,
          p_pecho: 15,
          p_axila: 18,
          p_subescapular: 21,
          p_suprailiaco: 17,
          p_abdomen: 31,
          p_muslo: 21,
          p_pantorrilla: 14,
        },
      });
    }

    // Los planes ACTIVOS de los atletas mock (`mockClients`) se refrescan
    // (upsert) en cada carga en lugar de solo agregarse si faltan: sus fechas
    // se calculan relativas a "hoy", así que una copia vieja guardada en
    // localStorage de una sesión anterior podría ya tener `endDate` en el
    // pasado. `autoCompletePlans()` la marcaría como COMPLETED al vuelo y el
    // atleta demo se quedaría sin planes activos que ver. Al hacer upsert por
    // id nos aseguramos de que siempre haya un plan ACTIVO vigente para probar.
    setClients((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      const now = Date.now();
      mockClients.forEach((c) => {
        const existing = byId.get(c.id);
        // Se conserva el avance del atleta (sesiones, series y partes hechas)
        // mientras el plan guardado siga vigente; solo se regenera si falta,
        // venció o hay una versión nueva de la semilla.
        const stillValid =
          existing &&
          existing.status === "ACTIVE" &&
          existing.endDate &&
          new Date(existing.endDate).getTime() > now;
        if (freshSeed || !stillValid) byId.set(c.id, c);
      });
      mockCompletedClients.forEach((c) => {
        if (freshSeed || !byId.has(c.id)) byId.set(c.id, c);
      });
      return Array.from(byId.values());
    });

    setAthleteRequests((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const toAdd = mockAthleteRequests.filter((r) => !existingIds.has(r.id));
      // Refresca el nombre del entrenador demo en solicitudes ya guardadas
      const refreshed = prev.map((r) =>
        r.trainerId === mockTrainerUser.trainerId &&
        r.trainerName !== mockTrainerUser.name
          ? { ...r, trainerName: mockTrainerUser.name }
          : r,
      );
      const changed = refreshed.some((r, i) => r !== prev[i]);
      if (!toAdd.length && !changed) return prev;
      return [...refreshed, ...toAdd];
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

    setAppointmentAvailability((prev) => {
      const existing = new Set(
        prev.filter((d) => !d.trainerId).map((d) => d.date),
      );
      const toAdd = mockAppointmentAvailability.filter(
        (d) => !existing.has(d.date),
      );
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

  // Invariante de negocio: un mismo atleta no puede tener más de un plan
  // ACTIVO simultáneo con el mismo entrenador (puede pasar con datos legacy,
  // un reseed, o una doble generación de plan). Si se detectan varios
  // registros ACTIVE para el mismo atleta (identificados por email o, si no
  // hay email, por nombre) + entrenador, se conserva como ACTIVE solo el más
  // reciente (por `planCreatedAt`/`submittedAt`) y el resto pasa a COMPLETED
  // automáticamente. Efecto idempotente: si no hay duplicados, no dispara
  // ningún re-render (retorna la misma referencia `prev`).
  useEffect(() => {
    setClients((prev) => {
      const activeByKey = new Map<string, any[]>();
      prev.forEach((c) => {
        if (c.status !== "ACTIVE") return;
        const identity = (c.email || c.name || "").toLowerCase().trim();
        if (!identity) return;
        const key = `${c.trainerId || "none"}::${identity}`;
        const list = activeByKey.get(key) || [];
        list.push(c);
        activeByKey.set(key, list);
      });

      const toDowngrade = new Set<string>();
      activeByKey.forEach((list) => {
        if (list.length <= 1) return;
        const sorted = [...list].sort(
          (a, b) =>
            new Date(b.planCreatedAt || b.submittedAt || 0).getTime() -
            new Date(a.planCreatedAt || a.submittedAt || 0).getTime(),
        );
        sorted.slice(1).forEach((c) => toDowngrade.add(c.id));
      });

      if (toDowngrade.size === 0) return prev;

      return prev.map((c) =>
        toDowngrade.has(c.id)
          ? { ...c, status: "COMPLETED", completedAt: new Date().toISOString() }
          : c,
      );
    });
  }, [clients]);

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
    // Si el plan ya está ACTIVO se conserva su inicio y progreso (el autoguardado
    // del editor llama a esta función); solo un plan nuevo arranca desde hoy.
    const keepRunning = client?.status === "ACTIVE" && !!client?.startDate;
    const startDate = keepRunning ? new Date(client.startDate) : new Date();
    const weeks =
      Array.isArray(planObject) && planObject.length
        ? planObject.length
        : client?.planDuration || 4;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7); // semanas reales del plan
    let progress = 0;
    if (keepRunning && Array.isArray(planObject)) {
      const days = planObject.flatMap((w: any) => w?.days || []);
      const total = days.filter((d: any) => d?.session).length;
      const done = days.filter((d: any) => d?.session && d.completed).length;
      progress = total ? Math.round((done / total) * 100) : 0;
    }
    // Identidad del atleta (email si existe, si no nombre) para detectar si
    // ya tiene OTRO plan ACTIVO con este entrenador — no puede quedar más de
    // uno vigente al mismo tiempo (ver también el efecto de invariante más
    // arriba, que cubre casos que no pasan por esta función).
    const identity = (client?.email || client?.name || "").toLowerCase().trim();

    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            status: "ACTIVE",
            plan: planText,
            planObject: planObject,
            planCreatedAt: keepRunning
              ? c.planCreatedAt || new Date().toISOString()
              : new Date().toISOString(),
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            planDuration: weeks,
            progress,
          };
        }
        // Cualquier OTRO plan ACTIVE del mismo atleta con el mismo
        // entrenador pasa a COMPLETED: solo puede haber un plan activo.
        if (
          identity &&
          c.status === "ACTIVE" &&
          c.trainerId === client?.trainerId &&
          (c.email || c.name || "").toLowerCase().trim() === identity
        ) {
          return {
            ...c,
            status: "COMPLETED",
            completedAt: new Date().toISOString(),
          };
        }
        return c;
      }),
    );
  };

  /**
   * Extiende un plan ACTIVO ya existente N semanas más (1 o 2 semanas
   * típicamente), para los casos en que el atleta necesita más tiempo para
   * completar los objetivos del plan (no lo trabajó bien, se lesionó, etc.).
   * - Agrega `weeksToAdd` semanas nuevas al final de `planObject`, clonando
   *   el patrón (días/sesiones) de la ÚLTIMA semana existente, pero
   *   reseteando `completed`/`completedSets`/`note` de esos días nuevos (no
   *   deben heredar el progreso ya marcado de la semana original).
   * - Corre `endDate` hacia adelante `weeksToAdd * 7` días y suma
   *   `weeksToAdd` a `planDuration`. NO resetea `progress` (se recalcula solo
   *   cuando se marca/desmarca una sesión vía `toggleSessionCompletion`; el
   *   progreso existente sigue siendo válido, solo baja el % porque ahora hay
   *   más sesiones totales).
   */
  const extendPlan = (clientId, weeksToAdd = 1) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId || !c.planObject || c.planObject.length === 0) {
          return c;
        }

        const lastWeek = c.planObject[c.planObject.length - 1];
        const newWeeks: any[] = [];
        for (let i = 0; i < weeksToAdd; i++) {
          const clonedDays = JSON.parse(JSON.stringify(lastWeek.days)).map(
            (day: any) => {
              const { completed: _completed, note: _note, ...rest } = day;
              if (rest.session) {
                const { completedParts: _cp, ...sessionRest } = rest.session;
                rest.session = sessionRest;
              }
              if (rest.session?.exercises) {
                rest.session = {
                  ...rest.session,
                  exercises: rest.session.exercises.map((ex: any) => {
                    const { completedSets: _cs, ...exRest } = ex;
                    return exRest;
                  }),
                };
              }
              return rest;
            },
          );
          newWeeks.push({ days: clonedDays });
        }

        const newPlanObject = [...c.planObject, ...newWeeks].map((w, i) => ({
          ...w,
          weekNum: i + 1,
        }));

        const newEndDate = c.endDate ? new Date(c.endDate) : new Date();
        newEndDate.setDate(newEndDate.getDate() + weeksToAdd * 7);

        return {
          ...c,
          planObject: newPlanObject,
          planDuration: (c.planDuration || newPlanObject.length) + weeksToAdd,
          endDate: newEndDate.toISOString(),
          extendedAt: new Date().toISOString(),
        };
      }),
    );
  };

  // Porcentaje de sesiones completadas (los días de descanso tienen
  // `session: null` y no cuentan).
  const computeProgress = (planObject: any[]) => {
    let total = 0;
    let done = 0;
    planObject.forEach((week) =>
      (week.days || []).forEach((d) => {
        if (!d.session) return;
        total += 1;
        if (d.completed) done += 1;
      }),
    );
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  // Reemplaza un día sin mutar el estado previo (React StrictMode ejecuta los
  // updaters dos veces; mutar hacía que un toggle se anulara a sí mismo).
  const withUpdatedDay = (client, weekIndex, dayIndex, update) => {
    const day = client.planObject?.[weekIndex]?.days?.[dayIndex];
    if (!day) return client;
    const newPlanObject = client.planObject.map((week, w) =>
      w !== weekIndex
        ? week
        : {
            ...week,
            days: week.days.map((d, i) => (i === dayIndex ? update(d) : d)),
          },
    );
    return {
      ...client,
      planObject: newPlanObject,
      progress: computeProgress(newPlanObject),
    };
  };

  const toggleSessionCompletion = (clientId, weekIndex, dayIndex) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id !== clientId
          ? client
          : withUpdatedDay(client, weekIndex, dayIndex, (day) => ({
              ...day,
              completed: !day.completed,
            })),
      ),
    );
  };

  const updateSessionNote = (clientId, weekIndex, dayIndex, note) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id !== clientId
          ? client
          : withUpdatedDay(client, weekIndex, dayIndex, (day) => ({
              ...day,
              note,
            })),
      ),
    );
  };

  // Marca/desmarca una parte de una sesión de atletismo (calentamiento, bloque
  // principal o enfriamiento). Se guarda en `session.completedParts`. La sesión
  // queda completada cuando todas las partes están hechas y deja de estarlo si
  // se desmarca alguna.
  const toggleSessionPart = (clientId, weekIndex, dayIndex, partKey) => {
    setClients((prev) =>
      prev.map((client) =>
        client.id !== clientId
          ? client
          : withUpdatedDay(client, weekIndex, dayIndex, (day) => {
              if (!day.session) return day;
              const done = new Set<string>(day.session.completedParts || []);
              if (done.has(partKey)) done.delete(partKey);
              else done.add(partKey);
              const session = {
                ...day.session,
                completedParts: Array.from(done),
              };
              const keys = getAthleticsParts(session).map((p) => p.key);
              const allDone = keys.length > 0 && keys.every((k) => done.has(k));
              return { ...day, session, completed: allDone };
            }),
      ),
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
      prev.map((client) =>
        client.id !== clientId
          ? client
          : withUpdatedDay(client, weekIndex, dayIndex, (day) => {
              // Los ejercicios de gimnasio viven en `day.session.exercises`
              // (shape de `generatePlan()`); se mantiene el fallback a
              // `day.exercises` por compatibilidad con datos antiguos.
              const exercises = [
                ...(day.session?.exercises || day.exercises || []),
              ];
              if (!exercises[exerciseIndex]) return day;
              const exercise = { ...exercises[exerciseIndex] };

              const completed = new Set<number>(exercise.completedSets || []);
              if (completed.has(setIndex)) completed.delete(setIndex);
              else completed.add(setIndex);
              exercise.completedSets = Array.from(completed);

              exercises[exerciseIndex] = exercise;
              return day.session
                ? { ...day, session: { ...day.session, exercises } }
                : { ...day, exercises };
            }),
      ),
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

    // No puede cruzarse con una cita del atleta ese día
    const gStart = toMinutes(slot.start);
    const gEnd = toMinutes(slot.end);
    const clash = appointments.find((a) => {
      if (a.athleteId !== athleteId || a.date !== date) return false;
      if (a.status === "CANCELLED") return false;
      const aStart = toMinutes(a.time);
      const aEnd = aStart + (Number(a.duration) || 30);
      return gStart < aEnd && aStart < gEnd;
    });
    if (clash) {
      return {
        success: false,
        message: `Tienes una cita a las ${clash.time} que se cruza con este horario.`,
      };
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

  const cancelGymBooking = (bookingId, reason = "") => {
    const booking = gymBookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setGymBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: "CANCELLED",
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
            }
          : b,
      ),
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
  const toMinutes = (time: string) => {
    const [h, m] = String(time || "0:0")
      .split(":")
      .map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  /** Entrenador dueño de una cita: el guardado o el aceptado del atleta. */
  const trainerOfAppointment = (a) =>
    a.trainerId ??
    athleteRequests.find(
      (r) => r.athleteId === a.athleteId && r.status === "ACCEPTED",
    )?.trainerId ??
    null;

  /**
   * Busca una cita activa que se cruce (misma fecha, mismo entrenador o
   * mismo atleta, horarios solapados). `ignoreId` excluye la cita que se
   * reprograma. Duración por defecto: 30 min.
   */
  const findAppointmentConflict = (candidate, ignoreId = null) => {
    const start = toMinutes(candidate.time);
    const end = start + (Number(candidate.duration) || 30);
    const hhmm = (n: number) =>
      `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
    // La cita tampoco puede cruzarse con una reserva de gimnasio del atleta.
    for (const b of gymBookings) {
      if (b.status === "CANCELLED" || b.date !== candidate.date) continue;
      if (b.athleteId !== candidate.athleteId) continue;
      const slot = gymAvailability
        .find((d) => d.date === b.date)
        ?.slots.find((s) => s.id === b.slotId);
      if (!slot) continue;
      const gStart = toMinutes(slot.start);
      const gEnd = toMinutes(slot.end);
      if (start < gEnd && gStart < end) {
        return { time: hhmm(gStart), end: hhmm(gEnd), gym: true };
      }
    }
    const trainer = trainerOfAppointment(candidate);
    for (const a of appointments) {
      if (a.id === ignoreId || a.status === "CANCELLED") continue;
      if (a.date !== candidate.date) continue;
      const sameParty =
        a.athleteId === candidate.athleteId ||
        (trainer && trainerOfAppointment(a) === trainer);
      if (!sameParty) continue;
      const aStart = toMinutes(a.time);
      const aEnd = aStart + (Number(a.duration) || 30);
      if (start < aEnd && aStart < end) {
        const h = (n: number) =>
          `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
        return { time: h(aStart), end: h(aEnd) };
      }
    }
    return null;
  };

  /**
   * El entrenador efectivo sale de la sesión cuando quien opera es un
   * entrenador (ignora el id enviado por el cliente). Sin sesión o con
   * otro rol se usa el id recibido.
   */
  const conflictMessage = (c: { time: string; end: string; gym?: boolean }) =>
    c.gym
      ? `El atleta tiene una reserva de gimnasio de ${c.time} a ${c.end} ese día que se cruza con este horario.`
      : `Ya existe una cita de ${c.time} a ${c.end} ese día que se cruza con este horario.`;

  const scopeTrainer = (trainerId) => {
    const user = getCurrentUser();
    return user?.role === "TRAINER" ? user.id : trainerId;
  };

  const addAppointment = (appointmentData) => {
    const user = getCurrentUser();
    const trainerId =
      user?.role === "TRAINER"
        ? user.id
        : user?.role === "ATHLETE"
          ? trainerOfAppointment({
              athleteId: user.id,
              trainerId: null,
            })
          : (appointmentData.trainerId ??
            trainerOfAppointment(appointmentData));
    if (user?.role === "ATHLETE" && !trainerId) {
      return {
        success: false,
        error:
          "Necesitas un entrenador aceptado para agendar citas. Envía una solicitud primero.",
      };
    }
    appointmentData = { ...appointmentData, trainerId };
    const conflict = findAppointmentConflict(appointmentData);
    if (conflict) {
      return { success: false, error: conflictMessage(conflict) };
    }
    const newAppointment = {
      id: Date.now().toString(),
      status: "SCHEDULED",
      ...appointmentData,
      trainerId,
    };
    setAppointments((prev) => [...prev, newAppointment]);
    return { success: true, appointment: newAppointment };
  };

  const updateAppointmentStatus = (id, status) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  };

  const cancelAppointment = (id, reason = "") => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "CANCELLED",
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
            }
          : a,
      ),
    );
  };

  // Reprograma una cita existente a una nueva fecha/hora, sin perder
  // el resto de sus datos (atleta, tipo, notas, duración).
  const rescheduleAppointment = (id, newDate, newTime) => {
    const current = appointments.find((a) => a.id === id);
    if (!current) return { success: false, error: "Cita no encontrada" };
    const conflict = findAppointmentConflict(
      { ...current, date: newDate, time: newTime },
      id,
    );
    if (conflict) {
      return { success: false, error: conflictMessage(conflict) };
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, date: newDate, time: newTime } : a,
      ),
    );
    return { success: true };
  };

  /** Citas del día de un entrenador (sin `trainerId` devuelve todas). */
  const getTrainerAppointments = (date, trainerId = null) => {
    trainerId = scopeTrainer(trainerId);
    return appointments.filter(
      (a) =>
        a.date === date &&
        a.status !== "CANCELLED" &&
        (!trainerId || trainerOfAppointment(a) === trainerId),
    );
  };

  // Appointment Availability Management (por entrenador; las entradas sin
  // `trainerId` son antiguas y se usan como respaldo)
  const updateAppointmentAvailability = (date, slots, trainerId = null) => {
    trainerId = scopeTrainer(trainerId);
    setAppointmentAvailability((prev) => {
      const existingIndex = prev.findIndex(
        (d) => d.date === date && (d.trainerId ?? null) === trainerId,
      );
      const entry = trainerId ? { date, slots, trainerId } : { date, slots };
      if (existingIndex >= 0) {
        const newSchedule = [...prev];
        newSchedule[existingIndex] = entry;
        return newSchedule;
      }
      return [...prev, entry];
    });
  };

  const getAppointmentAvailability = (date, trainerId = null) => {
    trainerId = scopeTrainer(trainerId);
    const own = trainerId
      ? appointmentAvailability.find(
          (d) => d.date === date && d.trainerId === trainerId,
        )
      : undefined;
    const legacy = appointmentAvailability.find(
      (d) => d.date === date && !d.trainerId,
    );
    return (own ?? legacy)?.slots || [];
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

      // Filter by trainerId if provided
      if (trainerId && c.trainerId !== trainerId) return false;

      // Filter by athleteId if provided
      if (athleteId && c.id !== athleteId) return false;

      if (!c.startDate) return true; // legacy plans

      // Nota: no se filtra por `endDate` aquí a propósito. El estado
      // "ACTIVE" es la fuente de verdad de si el plan sigue vigente;
      // `autoCompletePlans` (con su margen de gracia) es quien decide
      // cuándo pasa a COMPLETED. Si filtráramos por `endDate <= now`
      // acá, el plan desaparecería del dashboard del atleta apenas
      // llega la fecha de fin, aunque el entrenador todavía no haya
      // decidido extenderlo o agendar una cita de cambio de plan.
      const startDate = new Date(c.startDate);
      return now >= startDate;
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
   * Auto-complete expired plans.
   * Se da un margen de gracia de 2 días después de `endDate` antes de marcar
   * el plan como COMPLETED (en vez de completarlo apenas vence): esto le da
   * tiempo al entrenador de ver la notificación de "cambio de plan" (ver
   * `CoachDashboard.tsx`) y decidir si extiende el plan o agenda una cita,
   * en vez de que el plan desaparezca de "Activos" de inmediato.
   */
  const autoCompletePlans = () => {
    const now = new Date();
    const GRACE_DAYS = 2;
    setClients((prev) =>
      prev.map((c) => {
        if (c.status === "ACTIVE" && c.endDate) {
          const graceDeadline = new Date(c.endDate);
          graceDeadline.setDate(graceDeadline.getDate() + GRACE_DAYS);
          if (now > graceDeadline) {
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

  // Ids con los que un usuario puede aparecer en los datos relacionados
  const userRefIds = (user) =>
    new Set([user?.id, user?.trainerId].filter(Boolean));

  const belongsTo = (ids: Set<any>, item) =>
    ids.has(item.id) ||
    ids.has(item.athleteId) ||
    ids.has(item.trainerId) ||
    ids.has(item.clientId);

  /**
   * Cuenta los datos asociados a un usuario (para avisar antes de eliminarlo)
   */
  const countUserData = (user) => {
    const ids = userRefIds(user);
    return {
      clients: clients.filter((c) => belongsTo(ids, c)).length,
      requests: athleteRequests.filter((r) => belongsTo(ids, r)).length,
      gymBookings: gymBookings.filter((b) => belongsTo(ids, b)).length,
      appointments: appointments.filter((a) => belongsTo(ids, a)).length,
    };
  };

  /**
   * Elimina en cascada los datos de un usuario eliminado y libera los cupos
   * de gimnasio de sus reservas confirmadas. Es todo-o-nada: si falla la
   * limpieza de mediciones (localStorage), se restauran los elementos
   * quitados y se relanza el error.
   */
  const purgeUserData = (user) => {
    const ids = userRefIds(user);
    const removedClients = clients.filter((c) => belongsTo(ids, c));
    const removedRequests = athleteRequests.filter((r) => belongsTo(ids, r));
    const removedAppointments = appointments.filter((a) => belongsTo(ids, a));
    const removedBookings = gymBookings.filter((b) => belongsTo(ids, b));
    const releasing = removedBookings.filter((b) => b.status === "CONFIRMED");

    const adjustSlots = (prev, sign: 1 | -1) =>
      prev.map((d) => {
        const mine = releasing.filter((b) => b.date === d.date);
        if (mine.length === 0) return d;
        return {
          ...d,
          slots: d.slots.map((s) => {
            const n = mine.filter((b) => b.slotId === s.id).length;
            return n
              ? { ...s, reserved: Math.max(0, s.reserved - sign * n) }
              : s;
          }),
        };
      });

    const keep = (removed) => (prev) =>
      prev.filter((x) => !removed.some((r) => r.id === x.id));
    const restore = (removed) => (prev) => [...prev, ...removed];

    setClients(keep(removedClients));
    setAthleteRequests(keep(removedRequests));
    setAppointments(keep(removedAppointments));
    setGymBookings(keep(removedBookings));
    if (releasing.length > 0)
      setGymAvailability((prev) => adjustSlots(prev, 1));

    try {
      ids.forEach((id) => purgeMeasurements(id));
    } catch (err) {
      setClients(restore(removedClients));
      setAthleteRequests(restore(removedRequests));
      setAppointments(restore(removedAppointments));
      setGymBookings(restore(removedBookings));
      if (releasing.length > 0)
        setGymAvailability((prev) => adjustSlots(prev, -1));
      throw err;
    }
  };

  return (
    <MockDatabaseContext.Provider
      value={{
        countUserData,
        purgeUserData,
        clients,
        addClientRequest,
        updateClientPlan,
        extendPlan,
        toggleSessionCompletion,
        updateSessionNote,
        toggleSetCompletion,
        toggleSessionPart,
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
        cancelAppointment,
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
