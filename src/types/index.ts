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
  isSuper?: boolean;
}
