import React, { createContext, useContext, useEffect } from "react";
import { initializeSuperAdmin, ROLES, updateUserProfile } from "../utils/auth";
import { usePreviewStore } from "../store/usePreviewStore";
import {
  useAuthStore,
  hasFeatureAccess as hasFeatureAccessFor,
  getUserLimits as getUserLimitsFor,
  trialDaysRemaining as trialDaysRemainingFor,
} from "../store/useAuthStore";

const AuthContext = createContext<any>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const register = useAuthStore((state) => state.register);
  const login = useAuthStore((state) => state.login);
  const quickAdminLogin = useAuthStore((state) => state.quickAdminLogin);
  const logout = useAuthStore((state) => state.logout);
  const upgradePlan = useAuthStore((state) => state.upgradePlan);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changeUserPassword = useAuthStore((state) => state.changeUserPassword);
  const exportMyData = useAuthStore((state) => state.exportMyData);
  const deleteMyAccount = useAuthStore((state) => state.deleteMyAccount);
  const syncFromStorage = useAuthStore((state) => state.syncFromStorage);

  // Usuario simulado (mock) usado por el super admin para previsualizar
  // cómo se ve la app como Entrenador o Atleta, sin cerrar su sesión real.
  const previewUser = usePreviewStore((state) => state.previewUser);
  const setPreviewUserStore = usePreviewStore((state) => state.startPreview);
  const clearPreview = usePreviewStore((state) => state.stopPreview);
  const updatePreviewUser = usePreviewStore((state) => state.updatePreviewUser);

  // Usuario "efectivo": el simulado si hay vista previa activa, o el real.
  const effectiveUser = previewUser || currentUser;

  // Inicializar super administrador al montar el componente
  useEffect(() => {
    initializeSuperAdmin().catch((err) => {
      console.error("Error al inicializar super admin:", err);
    });
  }, []);

  // Sincronizar con localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      syncFromStorage();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncFromStorage]);

  /**
   * Cerrar sesión (incluye limpiar cualquier vista previa activa)
   */
  const handleLogout = () => {
    logout();
    clearPreview();
  };

  /**
   * Activar vista previa de un perfil simulado (mock). Solo pensado para
   * que el super administrador explore cómo se ve la app como Entrenador
   * o Atleta, sin perder su sesión real.
   */
  const startPreview = (mockUser) => {
    if (currentUser?.role !== ROLES.ADMIN) return;
    setPreviewUserStore(mockUser);
  };

  /**
   * Salir de la vista previa y volver al panel de administrador.
   */
  const stopPreview = () => {
    clearPreview();
  };

  const isPreviewMode = () => previewUser !== null;

  /**
   * Verificar si el usuario puede acceder a una característica
   */
  const hasFeatureAccess = (feature) =>
    hasFeatureAccessFor(currentUser, feature);

  /**
   * Obtener límites del usuario actual
   */
  const getUserLimits = (athleteCount, activePlanCount) =>
    getUserLimitsFor(currentUser, athleteCount, activePlanCount);

  /**
   * Obtener días restantes de trial
   */
  const trialDaysRemaining = () => trialDaysRemainingFor(currentUser);

  /**
   * Verificar si el usuario está autenticado
   */
  const isAuthenticated = () => currentUser !== null;

  /**
   * Actualizar el perfil del usuario "efectivo": si hay una vista previa
   * activa (super admin viendo como Entrenador/Atleta), actualiza el perfil
   * mock en localStorage (ya sembrado como usuario real, ver MockDatabase)
   * y refleja el resultado en el objeto `previewUser` en memoria. Si no,
   * delega en el `updateProfile` normal del store (usuario real logueado).
   */
  const updateProfileForEffectiveUser = async (updates: any) => {
    if (previewUser) {
      try {
        const updatedUser = updateUserProfile(previewUser.id, updates);
        updatePreviewUser(updatedUser);
        return { success: true, user: updatedUser };
      } catch (err) {
        return { success: false, error: (err as Error).message };
      }
    }
    return updateProfile(updates);
  };

  /**
   * Verificar si el usuario es entrenador
   */
  const isTrainer = () => effectiveUser?.role === ROLES.TRAINER;

  /**
   * Verificar si el usuario es atleta
   */
  const isAthlete = () => effectiveUser?.role === ROLES.ATHLETE;

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = () => effectiveUser?.role === ROLES.ADMIN;

  /**
   * Obtener ID del entrenador actual
   */
  const getTrainerId = () => {
    if (!effectiveUser) return null;
    if (effectiveUser.role === ROLES.TRAINER) {
      return effectiveUser.trainerId || effectiveUser.id;
    }
    return effectiveUser.trainerId;
  };

  const value = {
    currentUser: effectiveUser,
    realUser: currentUser,
    loading,
    error,
    register,
    login,
    logout: handleLogout,
    quickAdminLogin,
    upgradePlan,
    updateProfile: updateProfileForEffectiveUser,
    changeUserPassword,
    exportMyData,
    deleteMyAccount,
    hasFeatureAccess,
    getUserLimits,
    trialDaysRemaining,
    isAuthenticated,
    isTrainer,
    isAthlete,
    isAdmin,
    getTrainerId,
    startPreview,
    stopPreview,
    isPreviewMode,
    previewUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
