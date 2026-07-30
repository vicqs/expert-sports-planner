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
    planObject,
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
