// Datos de demostración (mock) para probar el "modo vista previa" del super admin.
// Permite simular cómo se ve la app para un Entrenador y para dos Atletas,
// sin necesidad de crear cuentas reales.

import {
  ROLES,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
  PLAN_LIMITS,
} from "./auth";
import { generatePlan } from "./generator";

export const MOCK_TRAINER_ID = "mock-trainer-0001";
export const MOCK_ATHLETE_1_ID = "mock-athlete-0001";
export const MOCK_ATHLETE_2_ID = "mock-athlete-0002";

// ----- Usuario Entrenador (mock) -----
export const mockTrainerUser = {
  id: "mock-trainer-user-0001",
  email: "entrenador.demo@example.com",
  name: "Carlos Mendoza (Demo)",
  role: ROLES.TRAINER,
  trainerId: MOCK_TRAINER_ID,
  subscription: {
    plan: SUBSCRIPTION_PLANS.PRO,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndsAt: null,
    currentPeriodEnd: null,
  },
  limits: PLAN_LIMITS.PRO,
  createdAt: new Date().toISOString(),
  isMock: true,
};

// ----- Usuarios Atletas (mock) -----
export const mockAthlete1User = {
  id: MOCK_ATHLETE_1_ID,
  email: "laura.demo@example.com",
  name: "Laura Gómez (Demo)",
  role: ROLES.ATHLETE,
  trainerId: null,
  subscription: {
    plan: SUBSCRIPTION_PLANS.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndsAt: null,
    currentPeriodEnd: null,
  },
  limits: PLAN_LIMITS.FREE,
  createdAt: new Date().toISOString(),
  isMock: true,
};

export const mockAthlete2User = {
  id: MOCK_ATHLETE_2_ID,
  email: "diego.demo@example.com",
  name: "Diego Ramírez (Demo)",
  role: ROLES.ATHLETE,
  trainerId: null,
  subscription: {
    plan: SUBSCRIPTION_PLANS.FREE,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndsAt: null,
    currentPeriodEnd: null,
  },
  limits: PLAN_LIMITS.FREE,
  createdAt: new Date().toISOString(),
  isMock: true,
};

// Lista para construir los botones de "vista previa" en el panel de admin
export const MOCK_PROFILES = [
  {
    key: "trainer",
    label: "Entrenador",
    description: "Panel de gestión de planes y atletas",
    user: mockTrainerUser,
  },
  {
    key: "athlete1",
    label: "Atleta 1",
    description: "Laura Gómez - Resistencia",
    user: mockAthlete1User,
  },
  {
    key: "athlete2",
    label: "Atleta 2",
    description: "Diego Ramírez - Velocidad",
    user: mockAthlete2User,
  },
];

// Marca `completed: true` en los días de entrenamiento cuya fecha ya pasó,
// para que las estadísticas/gráficos de "Progreso" (rol Atleta) tengan datos
// reales que mostrar en vez de aparecer siempre en 0. Patrón determinístico
// (no Math.random) para que el resultado sea estable entre recargas: se
// completan todos los días pasados excepto 1 de cada 4 (simula una sesión
// saltada, más realista que 100%).
const seedPastCompletion = (planObject: any[], startDate: Date) => {
  let dayCounter = 0;
  return planObject.map((week) => ({
    ...week,
    days: week.days.map((day: any) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + dayCounter);
      dayCounter += 1;
      const isPast = dayDate.getTime() < Date.now();
      const skip = dayCounter % 4 === 0;
      return {
        ...day,
        completed: Boolean(day.session) && isPast && !skip,
      };
    }),
  }));
};

const buildMockClient = (athleteUser, overrides) => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  const end = new Date(now);
  end.setDate(end.getDate() + 21);

  const planObject = generatePlan({
    level: overrides.level,
    objective: overrides.objective,
  });

  return {
    id: athleteUser.id,
    name: athleteUser.name,
    trainerId: MOCK_TRAINER_ID,
    status: "ACTIVE",
    sport: overrides.sport,
    level: overrides.level,
    objective: overrides.objective,
    planDuration: 4,
    plan: null,
    planObject: seedPastCompletion(planObject, start),
    planCreatedAt: start.toISOString(),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    progress: overrides.progress,
    submittedAt: start.toISOString(),
  };
};

// Planes/entrenamientos de demostración que aparecerán en el dashboard del entrenador
// y en el dashboard de cada atleta cuando se activa la vista previa.
export const mockClients = [
  buildMockClient(mockAthlete1User, {
    sport: "Atletismo",
    level: "INTERMEDIO",
    objective: "RESISTENCIA",
    progress: 45,
  }),
  buildMockClient(mockAthlete2User, {
    sport: "Atletismo",
    level: "AVANZADO",
    objective: "VELOCIDAD",
    progress: 70,
  }),
];

// Historial de un plan ya finalizado por cada atleta, para probar el listado
// de "planes completados" del entrenador y la lógica de progreso al 100%.
const buildCompletedMockClient = (athleteUser, overrides) => {
  const start = new Date();
  start.setDate(start.getDate() - overrides.weeksAgo * 7 - 7);
  const end = new Date();
  end.setDate(end.getDate() - overrides.weeksAgo * 7);

  const planObject = generatePlan({
    level: overrides.level,
    objective: overrides.objective,
  });

  return {
    id: `${athleteUser.id}-completed-1`,
    name: athleteUser.name,
    trainerId: MOCK_TRAINER_ID,
    status: "COMPLETED",
    sport: overrides.sport,
    level: overrides.level,
    objective: overrides.objective,
    planDuration: 4,
    plan: null,
    planObject,
    planCreatedAt: start.toISOString(),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    progress: 100,
    submittedAt: start.toISOString(),
    completedAt: end.toISOString(),
  };
};

export const mockCompletedClients = [
  buildCompletedMockClient(mockAthlete1User, {
    sport: "Atletismo",
    level: "PRINCIPIANTE",
    objective: "RESISTENCIA",
    weeksAgo: 5,
  }),
  buildCompletedMockClient(mockAthlete2User, {
    sport: "Atletismo",
    level: "INTERMEDIO",
    objective: "VELOCIDAD",
    weeksAgo: 8,
  }),
];

// Vínculos entrenador-atleta ya aceptados, para que ambos paneles muestren datos coherentes.
export const mockAthleteRequests = [
  {
    id: "mock-request-0001",
    athleteId: MOCK_ATHLETE_1_ID,
    trainerId: MOCK_TRAINER_ID,
    athleteName: mockAthlete1User.name,
    athleteEmail: mockAthlete1User.email,
    trainerName: mockTrainerUser.name,
    message: "",
    status: "ACCEPTED",
    createdAt: new Date().toISOString(),
    acceptedAt: new Date().toISOString(),
  },
  {
    id: "mock-request-0002",
    athleteId: MOCK_ATHLETE_2_ID,
    trainerId: MOCK_TRAINER_ID,
    athleteName: mockAthlete2User.name,
    athleteEmail: mockAthlete2User.email,
    trainerName: mockTrainerUser.name,
    message: "",
    status: "ACCEPTED",
    createdAt: new Date().toISOString(),
    acceptedAt: new Date().toISOString(),
  },
];

// Helper para generar strings "YYYY-MM-DD" relativos a hoy (positivo = futuro).
const isoDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

// ----- Reservas de Gimnasio (mock) -----
// Disponibilidad de cupos para varios días (pasados y futuros) con 3 franjas
// horarias cada uno, más las reservas confirmadas/canceladas de ambos atletas,
// para poder probar todo el flujo de "Reservar Gimnasio" sin pasos previos.
const GYM_SLOT_TEMPLATE = [
  { suffix: "morning", start: "07:00", end: "08:00", capacity: 8 },
  { suffix: "midday", start: "12:00", end: "13:00", capacity: 10 },
  { suffix: "evening", start: "18:00", end: "19:00", capacity: 12 },
];

const GYM_DAY_OFFSETS = [-3, -2, -1, 0, 1, 2, 3, 4, 5, 7];

export const mockGymAvailability = GYM_DAY_OFFSETS.map((offset) => {
  const date = isoDateOffset(offset);
  return {
    date,
    slots: GYM_SLOT_TEMPLATE.map((slot) => ({
      id: `${date}-${slot.suffix}`,
      start: slot.start,
      end: slot.end,
      capacity: slot.capacity,
      reserved: 0,
    })),
  };
});

export const mockGymBookings = [
  {
    id: "mock-gym-booking-0001",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(-2),
    slotId: `${isoDateOffset(-2)}-morning`,
    status: "CONFIRMED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-gym-booking-0002",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(1),
    slotId: `${isoDateOffset(1)}-evening`,
    status: "CONFIRMED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-gym-booking-0003",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(-1),
    slotId: `${isoDateOffset(-1)}-midday`,
    status: "CANCELLED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-gym-booking-0004",
    athleteId: MOCK_ATHLETE_2_ID,
    date: isoDateOffset(0),
    slotId: `${isoDateOffset(0)}-midday`,
    status: "CONFIRMED",
    timestamp: new Date().toISOString(),
  },
  {
    id: "mock-gym-booking-0005",
    athleteId: MOCK_ATHLETE_2_ID,
    date: isoDateOffset(3),
    slotId: `${isoDateOffset(3)}-morning`,
    status: "CONFIRMED",
    timestamp: new Date().toISOString(),
  },
];

// Marcar como reservados los slots que ya tienen una reserva CONFIRMED, para
// que la disponibilidad mostrada sea coherente con `mockGymBookings`.
mockGymBookings
  .filter((b) => b.status === "CONFIRMED")
  .forEach((booking) => {
    const day = mockGymAvailability.find((d) => d.date === booking.date);
    const slot = day?.slots.find((s) => s.id === booking.slotId);
    if (slot) slot.reserved += 1;
  });

// ----- Citas con el entrenador (mock) -----
// Mezcla de citas pasadas (COMPLETED), próximas (SCHEDULED) y una cancelada,
// para probar el historial y el flujo de agendar/ver citas de cada atleta.
export const mockAppointments = [
  {
    id: "mock-appt-0001",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(-10),
    time: "09:00",
    type: "eval",
    typeName: "Evaluación Inicial",
    duration: 60,
    notes: "Primera evaluación física y de objetivos.",
    status: "COMPLETED",
  },
  {
    id: "mock-appt-0002",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(-4),
    time: "17:30",
    type: "weight",
    typeName: "Control de Peso",
    duration: 15,
    notes: "",
    status: "CANCELLED",
  },
  {
    id: "mock-appt-0003",
    athleteId: MOCK_ATHLETE_1_ID,
    date: isoDateOffset(3),
    time: "10:00",
    type: "followup",
    typeName: "Seguimiento",
    duration: 30,
    notes: "Revisar dolor en rodilla derecha.",
    status: "SCHEDULED",
  },
  {
    id: "mock-appt-0004",
    athleteId: MOCK_ATHLETE_2_ID,
    date: isoDateOffset(-14),
    time: "08:30",
    type: "eval",
    typeName: "Evaluación Inicial",
    duration: 60,
    notes: "",
    status: "COMPLETED",
  },
  {
    id: "mock-appt-0005",
    athleteId: MOCK_ATHLETE_2_ID,
    date: isoDateOffset(1),
    time: "16:00",
    type: "adjust",
    typeName: "Ajuste de Plan",
    duration: 45,
    notes: "Quiere aumentar volumen de velocidad.",
    status: "SCHEDULED",
  },
  {
    id: "mock-appt-0006",
    athleteId: MOCK_ATHLETE_2_ID,
    date: isoDateOffset(6),
    time: "11:00",
    type: "followup",
    typeName: "Seguimiento",
    duration: 30,
    notes: "",
    status: "SCHEDULED",
  },
];
