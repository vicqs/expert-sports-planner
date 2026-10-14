// Sistema de autenticación multi-tenant con localStorage
// En producción, esto se reemplazaría con un backend real
import type { User } from "../types";
import { logAdminAction } from "../admin/utils/auditLog";

export const ROLES = {
  TRAINER: "TRAINER",
  ATHLETE: "ATHLETE",
  ADMIN: "ADMIN",
} as const;

// Mantener compatibilidad con código anterior
export const USER_ROLES = {
  ATHLETE: "ATHLETE",
  COACH: "TRAINER",
};

export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  BASIC: "BASIC",
  PRO: "PRO",
  GYM: "GYM",
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  TRIAL: "TRIAL",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
} as const;

export const PLAN_LIMITS = {
  FREE: {
    maxAthletes: 3,
    maxActivePlans: 2,
    trialDays: 14,
  },
  BASIC: {
    maxAthletes: 15,
    maxActivePlans: Infinity,
    trialDays: 0,
  },
  PRO: {
    maxAthletes: 50,
    maxActivePlans: Infinity,
    trialDays: 0,
  },
  GYM: {
    maxAthletes: Infinity,
    maxActivePlans: Infinity,
    maxTrainers: 5,
    trialDays: 0,
  },
};

export const PLAN_FEATURES = {
  FREE: [
    "Hasta 3 atletas",
    "Máximo 2 planes activos",
    "Funcionalidad completa por 14 días",
    "Marca de agua 'Modo Demo'",
  ],
  BASIC: [
    "Hasta 15 atletas",
    "Planes ilimitados",
    "Soporte por email",
    "Branding personalizable",
  ],
  PRO: [
    "Hasta 50 atletas",
    "Todo lo de Básico",
    "Reportes avanzados",
    "Integraciones futuras",
    "Soporte prioritario",
  ],
  GYM: [
    "Hasta 5 entrenadores",
    "Atletas ilimitados",
    "Panel de administración",
    "White-label",
    "API access",
  ],
};

// Hash de contraseñas con Web Crypto API.
// Formato actual: "pbkdf2$<iteraciones>$<sal hex>$<hash hex>" (PBKDF2-SHA256 con
// sal aleatoria por usuario). Los hashes antiguos (SHA-256 hex sin sal) siguen
// siendo válidos al iniciar sesión y se migran al formato nuevo automáticamente.
// En producción usar bcrypt/argon2 en el backend.
const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_PREFIX = "pbkdf2";

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fromHex = (hex: string) =>
  new Uint8Array((hex.match(/.{1,2}/g) ?? []).map((h) => parseInt(h, 16)));

const assertCrypto = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "El hashing seguro requiere un contexto seguro (HTTPS/localhost).",
    );
  }
};

const sha256Hex = async (password: string) => {
  assertCrypto();
  const data = new TextEncoder().encode(password);
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

const pbkdf2Hex = async (
  password: string,
  salt: Uint8Array,
  iterations: number,
) => {
  assertCrypto();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return toHex(bits);
};

const hashPassword = async (password: string) => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2Hex(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PREFIX}$${PBKDF2_ITERATIONS}$${toHex(salt)}$${hash}`;
};

const isLegacyHash = (stored?: string | null) =>
  !!stored && !stored.startsWith(`${PBKDF2_PREFIX}$`);

// Comparación en tiempo constante para cadenas hex
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const verifyPassword = async (
  password: string,
  stored?: string | null,
): Promise<boolean> => {
  if (!stored) return false;
  if (isLegacyHash(stored)) {
    return safeEqual(await sha256Hex(password), stored);
  }
  const [, iterStr, saltHex, hashHex] = stored.split("$");
  const iterations = Number(iterStr);
  if (!Number.isInteger(iterations) || !saltHex || !hashHex) return false;
  return safeEqual(
    await pbkdf2Hex(password, fromHex(saltHex), iterations),
    hashHex,
  );
};

/** Política mínima de contraseña (usuarios) y de administrador. */
export const MIN_PASSWORD_LENGTH = 6;
export const ADMIN_MIN_PASSWORD_LENGTH = 10;

/** Validación básica de formato de email. */
export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

const assertValidEmail = (email?: string | null) => {
  if (email && !isValidEmail(email)) {
    throw new Error("El formato del email no es válido");
  }
};

// Lectura segura de JSON: un localStorage corrupto nunca debe romper la app
const safeParse = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Datos corruptos en localStorage (${key}):`, error);
    return fallback;
  }
};

// JSON.stringify convierte Infinity en null. Como ningún límite válido es
// null, al leer se restaura null -> Infinity ("sin límite").
const LIMIT_KEYS = ["maxAthletes", "maxActivePlans", "maxTrainers"] as const;
const normalizeUser = (user: User): User => {
  if (!user || !user.limits) return user;
  const limits: Record<string, number | null> = { ...(user.limits as any) };
  let changed = false;
  LIMIT_KEYS.forEach((key) => {
    if (key in limits && limits[key] === null) {
      limits[key] = Infinity;
      changed = true;
    }
  });
  return changed ? { ...user, limits: limits as any } : user;
};

// Email siempre en minúsculas y sin espacios para evitar duplicados
export const normalizeEmail = (email?: string | null) =>
  email ? email.trim().toLowerCase() : null;

// Obtener usuario actual desde localStorage
export const getCurrentUser = (): User | null => {
  const user = safeParse<User | null>("currentUser", null);
  return user ? normalizeUser(user) : null;
};

// Guardar usuario actual
export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
};

// Obtener todos los usuarios registrados
export const getAllUsers = (): User[] => {
  const users = safeParse<User[]>("users", []);
  return Array.isArray(users) ? users.map(normalizeUser) : [];
};

// Evento para que las vistas reactivas (useUsers) se refresquen
export const USERS_CHANGED_EVENT = "users:changed";

// Guardar usuarios
const saveUsers = (users: User[]) => {
  localStorage.setItem("users", JSON.stringify(users));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(USERS_CHANGED_EVENT));
  }
};

const TRIAL_DAYS_KEY = "admin_trial_days";
/** Evento emitido cuando el admin cambia la duración del trial. */
export const TRIAL_DAYS_CHANGED_EVENT = "trial-days:changed";

/**
 * Duración del trial para nuevos registros (configurable por el admin).
 * Lee localStorage["admin_trial_days"]; si falta o está fuera de 1-365 usa el
 * valor por defecto del plan FREE (PLAN_LIMITS.FREE.trialDays).
 * @returns Días de trial.
 */
export const getTrialDays = (): number => {
  const n = Number(localStorage.getItem(TRIAL_DAYS_KEY));
  return Number.isInteger(n) && n >= 1 && n <= 365
    ? n
    : PLAN_LIMITS.FREE.trialDays;
};

/**
 * Guarda la duración del trial para cuentas nuevas (no altera las existentes).
 * Efectos: escribe localStorage["admin_trial_days"] y emite
 * TRIAL_DAYS_CHANGED_EVENT. No verifica el rol: la UI solo la expone al admin.
 * @param days Entero entre 1 y 365; si no, lanza Error.
 */
export const setTrialDays = (days: number) => {
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("Los días deben ser un entero entre 1 y 365");
  }
  localStorage.setItem(TRIAL_DAYS_KEY, String(days));
  window.dispatchEvent(new Event(TRIAL_DAYS_CHANGED_EVENT));
};

/**
 * Marca como EXPIRED los trials vencidos, tanto en la lista de usuarios como
 * en la sesión actual.
 * Efectos: reescribe localStorage["users"] (emite USERS_CHANGED_EVENT) y, si
 * aplica, el usuario actual. AuthContext la invoca al montar y periódicamente.
 * @returns true si algún usuario cambió.
 */
export const expireTrials = (): boolean => {
  const now = Date.now();
  const isExpired = (u: User) =>
    u.subscription?.status === SUBSCRIPTION_STATUS.TRIAL &&
    !!u.subscription.trialEndsAt &&
    new Date(u.subscription.trialEndsAt).getTime() < now;

  const users = getAllUsers();
  let changed = false;
  const next = users.map((u) => {
    if (!isExpired(u)) return u;
    changed = true;
    return {
      ...u,
      subscription: { ...u.subscription, status: SUBSCRIPTION_STATUS.EXPIRED },
    };
  });
  if (changed) saveUsers(next);

  const current = getCurrentUser();
  if (current && isExpired(current)) {
    setCurrentUser({
      ...current,
      subscription: {
        ...current.subscription,
        status: SUBSCRIPTION_STATUS.EXPIRED,
      },
    });
    changed = true;
  }
  return changed;
};

// Inicializar super usuario administrador
export const initializeSuperAdmin = async () => {
  const users = getAllUsers();

  // Leer credenciales desde variables de entorno (configuradas en .env.local)
  // ⚠️ IMPORTANTE: .env.local NO debe subirse a Git (está en .gitignore)
  const adminEmail = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL);
  const ADMIN_PASSWORD_HASH = import.meta.env.VITE_ADMIN_PASSWORD_HASH;
  const adminName = import.meta.env.VITE_ADMIN_NAME || "Administrador";

  // Validar que las credenciales estén configuradas
  if (!ADMIN_PASSWORD_HASH || !adminEmail) {
    console.error(
      "❌ ERROR: Variables de entorno NO configuradas correctamente",
    );
    console.error(
      "   Verifica que .env.local existe y el servidor se reinició",
    );
    throw new Error(
      "Credenciales de administrador no configuradas. Ver .env.example",
    );
  }

  // Verificar si ya existe el admin
  const existingAdminIndex = users.findIndex(
    (u) =>
      u.id === "admin-super-user" ||
      (u.email === adminEmail && u.role === ROLES.ADMIN),
  );

  const now = new Date();
  const newPasswordHash = ADMIN_PASSWORD_HASH;

  // Si existe el admin, verificar si las credenciales cambiaron
  if (existingAdminIndex !== -1) {
    const existingAdmin = users[existingAdminIndex];

    // Actualizar si el email, el hash de .env o el nombre cambiaron. La
    // contraseña solo se pisa cuando cambia el hash de .env (envPasswordHash),
    // así un cambio hecho desde el panel no se revierte al recargar.
    const envChanged = existingAdmin.envPasswordHash !== newPasswordHash;
    if (
      existingAdmin.email !== adminEmail ||
      envChanged ||
      existingAdmin.name !== adminName
    ) {
      console.log("🔄 Actualizando credenciales del super administrador...");

      users[existingAdminIndex] = {
        ...existingAdmin,
        email: adminEmail,
        envPasswordHash: newPasswordHash,
        ...(envChanged ? { passwordHash: newPasswordHash } : {}),
        name: adminName,
      };

      saveUsers(users);

      console.log("✅ Super admin actualizado desde .env.local");

      return users[existingAdminIndex];
    }

    return existingAdmin;
  }

  // Si no existe, crear el admin
  const superAdmin = {
    id: "admin-super-user",
    email: adminEmail,
    phone: null,
    passwordHash: newPasswordHash,
    envPasswordHash: newPasswordHash,
    name: adminName,
    role: ROLES.ADMIN,
    trainerId: null,
    subscription: {
      plan: SUBSCRIPTION_PLANS.GYM,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      trialEndsAt: null,
      currentPeriodEnd: null,
    },
    limits: {
      maxAthletes: Infinity,
      maxActivePlans: Infinity,
      maxTrainers: Infinity,
    },
    createdAt: now.toISOString(),
    isSuper: true,
  };

  users.push(superAdmin);
  saveUsers(users);

  console.log("✅ Super admin creado desde .env.local");

  return superAdmin;
};

// Registrar nuevo usuario
export const registerUser = async ({
  email,
  password,
  name,
  role = ROLES.TRAINER,
}: {
  email?: string | null;
  password?: string | null;
  name: string;
  role?: User["role"];
}): Promise<User> => {
  const users = getAllUsers();
  email = normalizeEmail(email);
  assertValidEmail(email);
  name = (name ?? "").trim();
  if (!name) {
    throw new Error("El nombre es obligatorio");
  }

  // Verificar si el email ya existe (solo si se proporciona)
  if (email && users.find((u) => normalizeEmail(u.email) === email)) {
    throw new Error("Este email ya está registrado");
  }

  // Verificar si el nombre ya existe
  if (users.find((u) => u.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("Este nombre ya está en uso");
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + getTrialDays());

  const newUser = {
    id: crypto.randomUUID(),
    email: email || null,
    phone: null,
    passwordHash: password ? await hashPassword(password) : null,
    name,
    role,
    trainerId: role === ROLES.ATHLETE ? null : crypto.randomUUID(),
    subscription: {
      plan: SUBSCRIPTION_PLANS.FREE,
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndsAt: trialEnd.toISOString(),
      currentPeriodEnd: trialEnd.toISOString(),
    },
    limits: PLAN_LIMITS.FREE,
    createdAt: now.toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
};

// Límite básico de intentos fallidos (mitigación local; el control real
// debe vivir en el backend): 5 fallos => bloqueo de 60 segundos.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 60_000;
const ATTEMPTS_KEY = "login_attempts";
type AttemptMap = Record<string, { count: number; lockedUntil: number }>;

const assertNotLocked = (identifier: string) => {
  const entry = safeParse<AttemptMap>(ATTEMPTS_KEY, {})[identifier];
  if (entry && entry.lockedUntil > Date.now()) {
    const secs = Math.ceil((entry.lockedUntil - Date.now()) / 1000);
    throw new Error(
      `Demasiados intentos fallidos. Intenta de nuevo en ${secs} s`,
    );
  }
};

const registerFailedAttempt = (identifier: string) => {
  const map = safeParse<AttemptMap>(ATTEMPTS_KEY, {});
  const prev = map[identifier];
  const expired = prev && prev.lockedUntil && prev.lockedUntil <= Date.now();
  const count = (expired ? 0 : (prev?.count ?? 0)) + 1;
  map[identifier] = {
    count: count >= MAX_FAILED_ATTEMPTS ? 0 : count,
    lockedUntil: count >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_MS : 0,
  };
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(map));
};

const clearFailedAttempts = (identifier: string) => {
  const map = safeParse<AttemptMap>(ATTEMPTS_KEY, {});
  if (map[identifier]) {
    delete map[identifier];
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(map));
  }
};

// Iniciar sesión
export const loginUser = async (
  email: string,
  password?: string | null,
): Promise<User> => {
  const users = getAllUsers();

  // Si no hay contraseña, intentar login por nombre (atletas sin perfil
  // completo). Nunca aplica a cuentas de administrador.
  if (!password) {
    const user = users.find(
      (u) => u.name === email && !u.passwordHash && u.role === ROLES.ATHLETE,
    );
    if (user) {
      return user;
    }
  }

  const identifier = normalizeEmail(email) ?? "";
  assertNotLocked(identifier);

  // Buscar por email y verificar la contraseña (PBKDF2 o hash antiguo)
  let user: User | undefined;
  if (password) {
    const candidate = users.find(
      (u) => normalizeEmail(u.email) === identifier && !!u.passwordHash,
    );
    if (candidate && (await verifyPassword(password, candidate.passwordHash))) {
      user = candidate;
    }
  }

  if (!user) {
    registerFailedAttempt(identifier);
    // Solo cuentas admin existentes se auditan (evita llenar la bitácora con
    // correos arbitrarios)
    const adminTarget = users.find(
      (u) => u.role === ROLES.ADMIN && normalizeEmail(u.email) === identifier,
    );
    if (adminTarget) {
      logAdminAction(adminTarget.id, "Intento de acceso fallido", identifier);
    }
    throw new Error("Email o contraseña incorrectos");
  }
  clearFailedAttempts(identifier);
  if (user.suspended) {
    throw new Error("Tu cuenta está suspendida. Contacta al administrador");
  }
  // Migración transparente de hashes SHA-256 antiguos al formato PBKDF2
  if (password && isLegacyHash(user.passwordHash)) {
    const upgraded: User = {
      ...user,
      passwordHash: await hashPassword(password),
    };
    saveUsers(users.map((u) => (u.id === upgraded.id ? upgraded : u)));
    user = upgraded;
  }

  // Verificar si el trial expiró
  if (user.subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEndsAt ?? 0);
    if (now > trialEnd) {
      user.subscription.status = SUBSCRIPTION_STATUS.EXPIRED;
      const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
      saveUsers(updatedUsers);
    }
  }

  return user;
};

// Cerrar sesión
export const logoutUser = () => {
  setCurrentUser(null);
};

// Eliminar usuario (no permite eliminar al super admin)
export const deleteUser = (userId: string) => {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (user?.isSuper) {
    throw new Error("No se puede eliminar al super administrador");
  }
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  saveUsers(users.filter((u) => u.id !== userId));
};

/**
 * Guarda de seguridad: verifica que quien ejecuta la acción exista y sea
 * ADMIN. Es defensa en profundidad: sin backend no puede sustituir a la
 * validación real del servidor.
 * @param actorId Id del usuario que ejecuta la acción.
 * @returns El usuario actor; lanza Error si no es administrador.
 */
const assertAdmin = (actorId: string | undefined | null) => {
  const actor = getAllUsers().find((u) => u.id === actorId);
  if (!actor || actor.role !== ROLES.ADMIN) {
    throw new Error("Acción reservada a administradores");
  }
  // Si hay sesión activa, debe ser la del propio actor (evita suplantación por id)
  const session = getCurrentUser();
  if (session && session.id !== actor.id) {
    throw new Error("Acción reservada a administradores");
  }
  return actor;
};

/**
 * Cambia la contraseña del propio administrador validando la actual.
 * @param actorId Id del admin (validado con assertAdmin).
 * @param currentPassword Contraseña actual.
 * @param newPassword Mínimo ADMIN_MIN_PASSWORD_LENGTH caracteres y distinta de la actual.
 * Efectos: reescribe users (nuevo hash PBKDF2) y la sesión. No toca .env: el
 * cambio persiste mientras VITE_ADMIN_PASSWORD_HASH no cambie.
 */
export const adminChangeOwnPassword = async (
  actorId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const actor = assertAdmin(actorId);
  if (!(await verifyPassword(currentPassword, actor.passwordHash))) {
    throw new Error("La contraseña actual no es correcta");
  }
  if ((newPassword ?? "").length < ADMIN_MIN_PASSWORD_LENGTH) {
    throw new Error(
      `La nueva contraseña debe tener al menos ${ADMIN_MIN_PASSWORD_LENGTH} caracteres`,
    );
  }
  if (newPassword === currentPassword) {
    throw new Error("La nueva contraseña debe ser distinta de la actual");
  }
  const users = getAllUsers();
  const updated: User = {
    ...actor,
    passwordHash: await hashPassword(newPassword),
  };
  saveUsers(users.map((u) => (u.id === updated.id ? updated : u)));
  if (getCurrentUser()?.id === updated.id) setCurrentUser(updated);
  return updated;
};

/**
 * Elimina un usuario como administrador (solo la cuenta; los datos asociados
 * los limpia purgeUserData de MockDatabase).
 * @param actorId Id del admin que ejecuta (validado con assertAdmin).
 * @param userId Id del usuario a eliminar; no puede ser el propio actor ni el
 *   super admin (lo rechaza deleteUser). Lanza Error si no cumple.
 * Efecto: reescribe localStorage["users"] y emite USERS_CHANGED_EVENT.
 */
export const adminDeleteUser = (actorId: string, userId: string) => {
  assertAdmin(actorId);
  if (actorId === userId) {
    throw new Error("No puedes eliminar tu propia cuenta desde el panel");
  }
  const user = getAllUsers().find((u) => u.id === userId);
  deleteUser(userId);
  return user as User;
};

/**
 * Reinserta una cuenta eliminada con adminDeleteUser (rollback si falló la
 * limpieza de sus datos asociados). No hace nada si el id ya existe.
 * @param actorId Id del admin (validado con assertAdmin).
 * @param user Cuenta devuelta por adminDeleteUser.
 */
export const adminRestoreUser = (actorId: string, user: User) => {
  assertAdmin(actorId);
  const users = getAllUsers();
  if (!user || users.some((u) => u.id === user.id)) return;
  saveUsers([...users, user]);
};

/**
 * Cambia el plan de un usuario como administrador.
 * @param actorId Id del admin (validado con assertAdmin).
 * @param userId Id del usuario objetivo; el super admin no es modificable.
 * @param plan Clave de PLAN_LIMITS (FREE, BASIC, PRO, GYM); si no existe, Error.
 * @returns El usuario actualizado (delegado en updateSubscription, que
 *   persiste y emite los eventos correspondientes).
 */
export const adminChangePlan = (
  actorId: string,
  userId: string,
  plan: keyof typeof PLAN_LIMITS,
) => {
  assertAdmin(actorId);
  if (!PLAN_LIMITS[plan]) {
    throw new Error("Plan inválido");
  }
  if (actorId === userId) {
    throw new Error("No puedes cambiar tu propio plan");
  }
  const target = getAllUsers().find((u) => u.id === userId);
  if (!target) throw new Error("Usuario no encontrado");
  if (target.isSuper) {
    throw new Error("No se puede modificar el plan del super administrador");
  }
  return updateSubscription(userId, plan);
};

/**
 * Extiende el trial de un usuario N días, contados desde hoy o desde su fin
 * actual (lo que sea mayor, para no acortar trials vigentes). Deja el estado
 * en TRIAL (reactiva los EXPIRED).
 * @param actorId Id del admin (validado con assertAdmin).
 * @param userId Id del usuario objetivo; admins y super admin no tienen trial.
 * @param days Entero entre 1 y 365.
 * @returns El usuario actualizado.
 * Efectos: reescribe localStorage["users"], emite USERS_CHANGED_EVENT y, si es
 * el usuario en sesión, actualiza la sesión.
 */
export const adminExtendTrial = (
  actorId: string,
  userId: string,
  days: number,
) => {
  assertAdmin(actorId);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error("Los días deben ser un entero entre 1 y 365");
  }
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) throw new Error("Usuario no encontrado");
  const target = users[index];
  if (target.isSuper || target.role === ROLES.ADMIN) {
    throw new Error("Los administradores no tienen trial");
  }

  const base = Math.max(
    Date.now(),
    new Date(target.subscription?.trialEndsAt ?? 0).getTime(),
  );
  const newEnd = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  const updated: User = {
    ...target,
    subscription: {
      ...target.subscription,
      status: SUBSCRIPTION_STATUS.TRIAL,
      trialEndsAt: newEnd,
      currentPeriodEnd: newEnd,
    },
  };
  users[index] = updated;
  saveUsers(users);

  const current = getCurrentUser();
  if (current && current.id === userId) setCurrentUser(updated);
  return updated;
};

/** Valida actor admin y objetivo modificable (no super, no uno mismo). */
const getManageableTarget = (actorId: string, userId: string): User => {
  assertAdmin(actorId);
  if (actorId === userId) {
    throw new Error("No puedes aplicar esta acción sobre tu propia cuenta");
  }
  const target = getAllUsers().find((u) => u.id === userId);
  if (!target) throw new Error("Usuario no encontrado");
  if (target.isSuper || target.role === ROLES.ADMIN) {
    throw new Error("No se puede modificar a un administrador");
  }
  return target;
};

/** Persiste un usuario modificado, refresca la sesión si aplica y lo devuelve. */
const persistUser = (updated: User): User => {
  saveUsers(getAllUsers().map((u) => (u.id === updated.id ? updated : u)));
  const current = getCurrentUser();
  if (current && current.id === updated.id) setCurrentUser(updated);
  return updated;
};

/**
 * Suspende o reactiva una cuenta (bloquea el login). Si el usuario tiene
 * sesión abierta en este navegador, se cierra.
 */
export const adminSetSuspended = (
  actorId: string,
  userId: string,
  suspended: boolean,
): User => {
  const target = getManageableTarget(actorId, userId);
  const updated = persistUser({ ...target, suspended });
  const current = getCurrentUser();
  if (suspended && current?.id === userId) setCurrentUser(null);
  return updated;
};

/** Genera una contraseña temporal aleatoria de 12 caracteres. */
const generateTempPassword = (): string => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
};

/**
 * Crea una cuenta de entrenador o atleta desde el panel admin con contraseña
 * temporal. El email es obligatorio (se usa para iniciar sesión).
 * @returns El usuario creado y la contraseña en claro (mostrar una sola vez).
 */
export const adminCreateUser = async (
  actorId: string,
  input: { name: string; email: string; role: User["role"] },
): Promise<{ user: User; tempPassword: string }> => {
  assertAdmin(actorId);
  if (input.role !== ROLES.TRAINER && input.role !== ROLES.ATHLETE) {
    throw new Error("Solo se pueden crear entrenadores o atletas");
  }
  if (!normalizeEmail(input.email)) {
    throw new Error("El email es obligatorio");
  }
  const tempPassword = generateTempPassword();
  const user = await registerUser({
    name: input.name,
    email: input.email,
    role: input.role,
    password: tempPassword,
  });
  return { user, tempPassword };
};

/**
 * Genera una contraseña temporal y la asigna al usuario (hash PBKDF2).
 * @returns La contraseña en claro, para mostrarla una sola vez al admin.
 */
export const adminResetUserPassword = async (
  actorId: string,
  userId: string,
): Promise<string> => {
  const target = getManageableTarget(actorId, userId);
  const temp = generateTempPassword();
  persistUser({ ...target, passwordHash: await hashPassword(temp) });
  return temp;
};

/**
 * Corrige nombre y/o email de un usuario. Valida formato y que el email no
 * esté en uso por otra cuenta.
 */
export const adminUpdateUser = (
  actorId: string,
  userId: string,
  changes: { name?: string; email?: string | null },
): User => {
  const target = getManageableTarget(actorId, userId);
  const next: User = { ...target };
  if (changes.name !== undefined) {
    const name = changes.name.trim();
    if (!name || name.length > 80) {
      throw new Error("El nombre es obligatorio (máx. 80 caracteres)");
    }
    next.name = name;
  }
  if (changes.email !== undefined) {
    const email = normalizeEmail(changes.email);
    assertValidEmail(email);
    if (
      email &&
      getAllUsers().some(
        (u) => u.id !== userId && normalizeEmail(u.email) === email,
      )
    ) {
      throw new Error("Ese email ya está registrado");
    }
    next.email = email;
  }
  return persistUser(next);
};

// Completar perfil de usuario (agregar email y contraseña)
export const completeUserProfile = async (userId, rawEmail, password) => {
  const users = getAllUsers();
  const email = normalizeEmail(rawEmail);
  assertValidEmail(email);

  // Verificar si el email ya existe
  if (users.find((u) => normalizeEmail(u.email) === email && u.id !== userId)) {
    throw new Error("Este email ya está registrado");
  }

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  const updatedUser = {
    ...users[userIndex],
    email,
    passwordHash: await hashPassword(password),
  };

  users[userIndex] = updatedUser;
  saveUsers(users);

  return updatedUser;
};

// Actualizar datos de contacto del perfil (email/teléfono/contacto de
// emergencia/notas médicas/notificaciones/avatar), editables por el propio usuario
export const updateUserProfile = (
  userId: string,
  updates: {
    email?: string | null;
    phone?: string | null;
    emergencyContact?: User["emergencyContact"];
    medicalNotes?: string | null;
    notificationPrefs?: User["notificationPrefs"];
    avatarId?: string | null;
    companyName?: string | null;
    companyLegalId?: string | null;
    companyPhone?: string | null;
    companyAddress?: string | null;
  },
) => {
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  if (updates.email) {
    updates = { ...updates, email: normalizeEmail(updates.email) };
    assertValidEmail(updates.email);
  }
  if (
    updates.email &&
    users.find(
      (u) => normalizeEmail(u.email) === updates.email && u.id !== userId,
    )
  ) {
    throw new Error("Este email ya está registrado por otro usuario");
  }

  const isCompanyUpdate =
    updates.companyName !== undefined ||
    updates.companyLegalId !== undefined ||
    updates.companyPhone !== undefined ||
    updates.companyAddress !== undefined;
  if (isCompanyUpdate && users[userIndex].role !== ROLES.TRAINER) {
    throw new Error("Solo un entrenador puede editar los datos de la empresa");
  }

  const updatedUser: User = {
    ...users[userIndex],
    ...(updates.email !== undefined ? { email: updates.email } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.emergencyContact !== undefined
      ? { emergencyContact: updates.emergencyContact }
      : {}),
    ...(updates.medicalNotes !== undefined
      ? { medicalNotes: updates.medicalNotes }
      : {}),
    ...(updates.notificationPrefs !== undefined
      ? { notificationPrefs: updates.notificationPrefs }
      : {}),
    ...(updates.avatarId !== undefined ? { avatarId: updates.avatarId } : {}),
    ...(updates.companyName !== undefined
      ? { companyName: updates.companyName }
      : {}),
    ...(updates.companyLegalId !== undefined
      ? { companyLegalId: updates.companyLegalId }
      : {}),
    ...(updates.companyPhone !== undefined
      ? { companyPhone: updates.companyPhone }
      : {}),
    ...(updates.companyAddress !== undefined
      ? { companyAddress: updates.companyAddress }
      : {}),
  };

  users[userIndex] = updatedUser;
  saveUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
};

// "Datos Básicos" del atleta: SOLO el Entrenador puede crear/editar esto,
// por eso vive fuera de updateUserProfile (que es autoedición) y se llama
// exclusivamente desde CoachDashboard ("Mis Atletas").
// Verifica que `trainerId` sea un entrenador y que `athleteId` sea uno de sus
// atletas aceptados (solicitudes en localStorage["athleteRequests"]).
const assertTrainerOwnsAthlete = (trainerId: string, athleteId: string) => {
  const trainer = getAllUsers().find((u) => u.id === trainerId);
  if (!trainer || trainer.role !== ROLES.TRAINER) {
    throw new Error("Solo un entrenador puede modificar estos datos");
  }
  let requests: any[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("athleteRequests") || "[]");
    requests = Array.isArray(parsed) ? parsed : [];
  } catch {
    requests = [];
  }
  const owns = requests.some(
    (r) =>
      r.trainerId === trainerId &&
      r.athleteId === athleteId &&
      r.status === "ACCEPTED",
  );
  if (!owns) throw new Error("Este atleta no pertenece a tu lista");
};

export const updateAthleteBasicInfo = (
  trainerId: string,
  athleteId: string,
  basicInfo: User["basicInfo"],
) => {
  assertTrainerOwnsAthlete(trainerId, athleteId);
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === athleteId);
  if (userIndex === -1) throw new Error("Atleta no encontrado");

  const updatedUser: User = { ...users[userIndex], basicInfo };
  users[userIndex] = updatedUser;
  saveUsers(users);
  return updatedUser;
};

// "Lesiones": estrictamente solo lectura para el Atleta; únicamente el
// Entrenador puede agregar/modificar. Reemplaza la lista completa.
export const setAthleteInjuries = (
  trainerId: string,
  athleteId: string,
  injuries: User["injuries"],
) => {
  assertTrainerOwnsAthlete(trainerId, athleteId);
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === athleteId);
  if (userIndex === -1) throw new Error("Atleta no encontrado");

  const updatedUser: User = { ...users[userIndex], injuries };
  users[userIndex] = updatedUser;
  saveUsers(users);
  return updatedUser;
};

// Cambiar contraseña (requiere validar la contraseña actual)
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) throw new Error("Usuario no encontrado");

  const user = users[userIndex];
  if (
    user.passwordHash &&
    !(await verifyPassword(currentPassword, user.passwordHash))
  ) {
    throw new Error("La contraseña actual no es correcta");
  }

  const updatedUser: User = {
    ...user,
    passwordHash: await hashPassword(newPassword),
  };
  users[userIndex] = updatedUser;
  saveUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(updatedUser);
  }

  return updatedUser;
};

// Exportar los datos del usuario (simula una descarga de "mis datos" en JSON)
export const exportUserData = (userId: string) => {
  const users = getAllUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) throw new Error("Usuario no encontrado");

  // Nunca incluir el hash de contraseña en el export.
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return {
    exportedAt: new Date().toISOString(),
    profile: safeUser,
  };
};

// Eliminar cuenta (autoeliminación del propio usuario)
export const deleteAccount = (userId: string) => {
  deleteUser(userId);
  setCurrentUser(null);
};

// Actualizar suscripción de usuario
export const updateSubscription = (userId, newPlan) => {
  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    throw new Error("Usuario no encontrado");
  }

  const now = new Date();
  const user = users[userIndex];

  user.subscription = {
    plan: newPlan,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    trialEndsAt: null,
    currentPeriodEnd: new Date(
      now.getFullYear() + 1,
      now.getMonth(),
      now.getDate(),
    ).toISOString(),
  };

  user.limits = PLAN_LIMITS[newPlan];

  saveUsers(users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === userId) {
    setCurrentUser(user);
  }

  return user;
};

// Verificar si un usuario puede acceder a una característica
export const canAccessFeature = (user, feature) => {
  if (!user) return false;

  if (user.subscription.status === SUBSCRIPTION_STATUS.EXPIRED) {
    return false;
  }

  const featureAccess = {
    unlimited_plans: user.subscription.plan !== SUBSCRIPTION_PLANS.FREE,
    advanced_reports: [SUBSCRIPTION_PLANS.PRO, SUBSCRIPTION_PLANS.GYM].includes(
      user.subscription.plan,
    ),
    multiple_trainers: user.subscription.plan === SUBSCRIPTION_PLANS.GYM,
    integrations: [SUBSCRIPTION_PLANS.PRO, SUBSCRIPTION_PLANS.GYM].includes(
      user.subscription.plan,
    ),
  };

  return featureAccess[feature] !== undefined ? featureAccess[feature] : true;
};

// Verificar límites
export const checkLimits = (user, athleteCount, activePlanCount) => {
  const limits = {
    athletes: {
      current: athleteCount,
      max: user.limits.maxAthletes,
      canAdd: athleteCount < user.limits.maxAthletes,
    },
    plans: {
      current: activePlanCount,
      max: user.limits.maxActivePlans,
      canAdd: activePlanCount < user.limits.maxActivePlans,
    },
  };

  return limits;
};

// Calcular días restantes de trial
export const getTrialDaysRemaining = (user) => {
  if (
    !user ||
    user.subscription.status !== SUBSCRIPTION_STATUS.TRIAL ||
    !user.subscription.trialEndsAt
  ) {
    return 0;
  }

  const now = new Date();
  const trialEnd = new Date(user.subscription.trialEndsAt);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
};

// Compatibilidad con código anterior
export const useAthleteId = () => {
  const user = getCurrentUser();
  return user?.id || "athlete-1";
};

export const useTrainerId = () => {
  const user = getCurrentUser();
  if (user?.role === ROLES.TRAINER) {
    return user.trainerId || user.id;
  }
  return user?.trainerId || "trainer-1";
};

// Mantener compatibilidad
export const getCurrentSession = getCurrentUser;
export const saveSession = setCurrentUser;
export const clearSession = logoutUser;
export const clearAthleteSession = logoutUser; // Alias para compatibilidad con código anterior
