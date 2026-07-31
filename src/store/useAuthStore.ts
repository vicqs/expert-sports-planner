import { create } from "zustand";
import {
  getCurrentUser,
  setCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateSubscription,
  updateUserProfile,
  changePassword,
  exportUserData,
  deleteAccount,
  canAccessFeature,
  checkLimits,
  getTrialDaysRemaining,
  getAllUsers,
  ROLES,
} from "../utils/auth";
import type { User, SubscriptionPlan } from "../types";

interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

interface RegisterInput {
  email?: string | null;
  password?: string | null;
  name: string;
  role?: User["role"];
}

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  register: (userData: RegisterInput) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  quickAdminLogin: () => Promise<AuthResult>;
  logout: () => void;
  upgradePlan: (newPlan: SubscriptionPlan) => Promise<AuthResult>;
  updateProfile: (updates: {
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
  }) => Promise<AuthResult>;
  changeUserPassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
  exportMyData: () => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteMyAccount: () => Promise<AuthResult>;
  syncFromStorage: () => void;
}

/**
 * Store de autenticación (Zustand). Reemplaza el estado interno que antes
 * vivía como useState dentro de AuthContext. Se mantiene fuera del árbol de
 * React para evitar el re-render en cascada que producía el Context al
 * cambiar loading/error, y para permitir acceso fuera de componentes si
 * hace falta (ej. interceptores, utilidades).
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getCurrentUser(),
  loading: false,
  error: null,

  syncFromStorage: () => set({ currentUser: getCurrentUser() }),

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const newUser = await registerUser(userData);
      setCurrentUser(newUser);
      set({ currentUser: newUser });
      return { success: true, user: newUser };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await loginUser(email, password);
      setCurrentUser(user);
      set({ currentUser: user });
      return { success: true, user };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  quickAdminLogin: async () => {
    if (!import.meta.env.DEV) {
      const message = "quickAdminLogin no está disponible en producción";
      set({ error: message });
      return { success: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const users = getAllUsers();
      const admin = users.find((u: User) => u.role === ROLES.ADMIN);
      if (!admin) {
        throw new Error("No se encontró un super administrador configurado");
      }
      setCurrentUser(admin);
      set({ currentUser: admin });
      return { success: true, user: admin };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    logoutUser();
    set({ currentUser: null, error: null });
  },

  upgradePlan: async (newPlan) => {
    const { currentUser } = get();
    if (!currentUser) {
      const message = "No hay usuario autenticado";
      set({ error: message });
      return { success: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const updatedUser = updateSubscription(currentUser.id, newPlan);
      set({ currentUser: updatedUser });
      return { success: true, user: updatedUser };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) {
      const message = "No hay usuario autenticado";
      set({ error: message });
      return { success: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const updatedUser = updateUserProfile(currentUser.id, updates);
      set({ currentUser: updatedUser });
      return { success: true, user: updatedUser };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  changeUserPassword: async (currentPassword, newPassword) => {
    const { currentUser } = get();
    if (!currentUser) {
      const message = "No hay usuario autenticado";
      set({ error: message });
      return { success: false, error: message };
    }

    set({ loading: true, error: null });
    try {
      const updatedUser = await changePassword(
        currentUser.id,
        currentPassword,
        newPassword,
      );
      set({ currentUser: updatedUser });
      return { success: true, user: updatedUser };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  exportMyData: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      return { success: false, error: "No hay usuario autenticado" };
    }
    try {
      const data = exportUserData(currentUser.id);
      return { success: true, data };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  },

  deleteMyAccount: async () => {
    const { currentUser } = get();
    if (!currentUser) {
      const message = "No hay usuario autenticado";
      set({ error: message });
      return { success: false, error: message };
    }
    try {
      deleteAccount(currentUser.id);
      set({ currentUser: null, error: null });
      return { success: true };
    } catch (err) {
      const message = (err as Error).message;
      set({ error: message });
      return { success: false, error: message };
    }
  },
}));

// Selectores derivados reutilizables (evitan recomputar en cada consumidor)
export const hasFeatureAccess = (user: User | null, feature: string) =>
  canAccessFeature(user, feature);

export const getUserLimits = (
  user: User | null,
  athleteCount: number,
  activePlanCount: number,
) => (user ? checkLimits(user, athleteCount, activePlanCount) : null);

export const trialDaysRemaining = (user: User | null) =>
  getTrialDaysRemaining(user);
