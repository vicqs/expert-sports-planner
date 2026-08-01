// Tipos de dominio compartidos. Punto de partida de la migración incremental a TypeScript.
// Los módulos en JS existentes seguirán funcionando (allowJs) mientras se migran gradualmente.

export type Role = "TRAINER" | "ATHLETE" | "ADMIN";

export type SubscriptionPlan = "FREE" | "BASIC" | "PRO" | "GYM";

export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "EXPIRED" | "CANCELLED";

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface UserLimits {
  maxAthletes: number;
  maxActivePlans: number;
  maxTrainers?: number;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface Injury {
  id: string;
  description: string;
  date: string;
  status: "ACTIVE" | "RECOVERED";
}

export interface AthleteBasicInfo {
  birthDate: string | null;
  weightKg: number | null;
  heightCm: number | null;
  sport: string | null;
}

export interface NotificationPrefs {
  sessionReminders: boolean;
  appointmentReminders: boolean;
}

// Metadata enriquecida de un ejercicio (inspirado en el shape de ExerciseDB).
// Es un dato ADICIONAL/opcional: nunca reemplaza el nombre plano (string) que
// sigue siendo la fuente de verdad para GYM_EXERCISES/ALL_GYM_EXERCISES.
export interface ExerciseMetadata {
  exerciseId?: string;
  name?: string;
  gifUrl?: string;
  targetMuscles?: string[];
  bodyParts?: string[];
  equipments?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
}

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  name: string;
  role: Role;
  trainerId: string | null;
  subscription: Subscription;
  limits: UserLimits;
  createdAt: string;
  // Empresa a la que pertenece el entrenador (los atletas heredan esta
  // asociación mientras estén vinculados a ese entrenador; no se persiste en
  // el atleta, se deriva en vivo del entrenador vinculado — así la
  // desvinculación "cascada" ocurre automáticamente sin lógica extra).
  companyId?: string | null;
  companyName?: string | null;
  // Datos adicionales de la empresa del entrenador (por ahora hay un solo
  // entrenador por empresa, y es él quien administra estos datos desde su
  // propio perfil). Al igual que companyId/companyName, los atletas los ven
  // en vivo a través del entrenador vinculado, nunca se copian al atleta.
  companyLegalId?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  avatarId?: string | null;
  // "Datos Básicos": solo el Entrenador puede crear/editar estos campos.
  basicInfo?: AthleteBasicInfo | null;
  // "Contacto de Emergencia": visible y editable por el propio Atleta.
  emergencyContact?: EmergencyContact | null;
  // "Notas Médicas": el Atleta puede agregarlas/editarlas.
  medicalNotes?: string | null;
  // "Lesiones": solo lectura para el Atleta, solo el Entrenador las agrega/edita.
  injuries?: Injury[];
  notificationPrefs?: NotificationPrefs;
  isSuper?: boolean;
}
