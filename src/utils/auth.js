// Sistema de autenticación multi-tenant con localStorage
// En producción, esto se reemplazaría con un backend real

export const ROLES = {
  TRAINER: "TRAINER",
  ATHLETE: "ATHLETE",
  ADMIN: "ADMIN",
};

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
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: "ACTIVE",
  TRIAL: "TRIAL",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

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

// Hash de contraseñas usando Web Crypto API (mejor que simpleHash pero aún no es producción)
// En producción usar bcrypt o argon2 en el backend
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// Versión síncrona para compatibilidad (menos segura)
const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

// Obtener usuario actual desde localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
};

// Guardar usuario actual
export const setCurrentUser = (user) => {
  if (user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  } else {
    localStorage.removeItem("currentUser");
  }
};

// Obtener todos los usuarios registrados
export const getAllUsers = () => {
  const usersStr = localStorage.getItem("users");
  return usersStr ? JSON.parse(usersStr) : [];
};

// Guardar usuarios
const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

// Inicializar super usuario administrador
export const initializeSuperAdmin = () => {
  const users = getAllUsers();

  // Leer credenciales desde variables de entorno (configuradas en .env.local)
  // ⚠️ IMPORTANTE: .env.local NO debe subirse a Git (está en .gitignore)
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
  const adminName = import.meta.env.VITE_ADMIN_NAME || "Administrador";

  // Validar que las credenciales estén configuradas
  if (!ADMIN_PASSWORD) {
    console.error("❌ ERROR: VITE_ADMIN_PASSWORD no está configurada");
    console.error(
      "   Copia .env.example a .env.local y configura las credenciales",
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
  const newPasswordHash = simpleHash(ADMIN_PASSWORD);

  // Si existe el admin, verificar si las credenciales cambiaron
  if (existingAdminIndex !== -1) {
    const existingAdmin = users[existingAdminIndex];

    // Actualizar si el email, password o nombre cambiaron
    if (
      existingAdmin.email !== adminEmail ||
      existingAdmin.passwordHash !== newPasswordHash ||
      existingAdmin.name !== adminName
    ) {
      console.log("🔄 Actualizando credenciales del super administrador...");

      users[existingAdminIndex] = {
        ...existingAdmin,
        email: adminEmail,
        passwordHash: newPasswordHash,
        name: adminName,
      };

      saveUsers(users);

      console.log(
        "✅ Super administrador actualizado desde variables de entorno",
      );
      console.log(`   Email: ${adminEmail}`);
      console.log("   Contraseña: [Configurada en .env.local]");

      return users[existingAdminIndex];
    }

    return existingAdmin;
  }

  // Si no existe, crear el admin
  const superAdmin = {
    id: "admin-super-user",
    email: adminEmail,
    passwordHash: newPasswordHash,
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

  console.log("✅ Super administrador creado desde variables de entorno");
  console.log(`   Email: ${adminEmail}`);
  console.log("   Contraseña: [Configurada en .env.local]");

  return superAdmin;
};

// Registrar nuevo usuario
export const registerUser = ({
  email,
  password,
  name,
  role = ROLES.TRAINER,
}) => {
  const users = getAllUsers();

  // Verificar si el email ya existe
  if (users.find((u) => u.email === email)) {
    throw new Error("Este email ya está registrado");
  }

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);

  const newUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash: simpleHash(password),
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

// Iniciar sesión
export const loginUser = (email, password) => {
  const users = getAllUsers();
  const user = users.find(
    (u) => u.email === email && u.passwordHash === simpleHash(password),
  );

  if (!user) {
    throw new Error("Email o contraseña incorrectos");
  }

  // Verificar si el trial expiró
  if (user.subscription.status === SUBSCRIPTION_STATUS.TRIAL) {
    const now = new Date();
    const trialEnd = new Date(user.subscription.trialEndsAt);
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
  const diffTime = trialEnd - now;
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
