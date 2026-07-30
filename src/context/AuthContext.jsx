import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  setCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  updateSubscription,
  canAccessFeature,
  checkLimits,
  getTrialDaysRemaining,
  initializeSuperAdmin,
  ROLES,
  SUBSCRIPTION_PLANS,
} from "../utils/auth";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar super administrador al montar el componente
  useEffect(() => {
    initializeSuperAdmin();
  }, []);

  // Sincronizar con localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentUserState(getCurrentUser());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /**
   * Registrar nuevo usuario
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const newUser = registerUser(userData);
      setCurrentUser(newUser);
      setCurrentUserState(newUser);
      return { success: true, user: newUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Iniciar sesión
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const user = loginUser(email, password);
      setCurrentUser(user);
      setCurrentUserState(user);
      return { success: true, user };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = () => {
    logoutUser();
    setCurrentUserState(null);
    setError(null);
  };

  /**
   * Actualizar plan de suscripción
   */
  const upgradePlan = async (newPlan) => {
    if (!currentUser) {
      setError("No hay usuario autenticado");
      return { success: false, error: "No hay usuario autenticado" };
    }

    setLoading(true);
    setError(null);

    try {
      const updatedUser = updateSubscription(currentUser.id, newPlan);
      setCurrentUserState(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar si el usuario puede acceder a una característica
   */
  const hasFeatureAccess = (feature) => {
    return canAccessFeature(currentUser, feature);
  };

  /**
   * Obtener límites del usuario actual
   */
  const getUserLimits = (athleteCount, activePlanCount) => {
    if (!currentUser) return null;
    return checkLimits(currentUser, athleteCount, activePlanCount);
  };

  /**
   * Obtener días restantes de trial
   */
  const trialDaysRemaining = () => {
    return getTrialDaysRemaining(currentUser);
  };

  /**
   * Verificar si el usuario está autenticado
   */
  const isAuthenticated = () => {
    return currentUser !== null;
  };

  /**
   * Verificar si el usuario es entrenador
   */
  const isTrainer = () => {
    return currentUser?.role === ROLES.TRAINER;
  };

  /**
   * Verificar si el usuario es atleta
   */
  const isAthlete = () => {
    return currentUser?.role === ROLES.ATHLETE;
  };

  /**
   * Verificar si el usuario es administrador
   */
  const isAdmin = () => {
    return currentUser?.role === ROLES.ADMIN;
  };

  /**
   * Obtener ID del entrenador actual
   */
  const getTrainerId = () => {
    if (!currentUser) return null;
    if (currentUser.role === ROLES.TRAINER) {
      return currentUser.trainerId || currentUser.id;
    }
    return currentUser.trainerId;
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    upgradePlan,
    hasFeatureAccess,
    getUserLimits,
    trialDaysRemaining,
    isAuthenticated,
    isTrainer,
    isAthlete,
    isAdmin,
    getTrainerId,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
