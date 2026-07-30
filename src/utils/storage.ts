// Storage utility with error handling and validation
// Centralizes all localStorage operations

export const STORAGE_KEYS = {
  // User session
  USER_SESSION: "expert_planner_user_session",
  ATHLETE_ID: "expert_planner_athlete_id", // Deprecated, use USER_SESSION

  // Master data (shared across users)
  CLIENTS: "expert_planner_clients",
  GYM_AVAILABILITY: "expert_planner_gym_availability",
  GYM_BOOKINGS: "expert_planner_gym_bookings",
  APPOINTMENTS: "expert_planner_appointments",
  APPOINTMENT_AVAILABILITY: "expert_planner_appointment_availability",
};

/**
 * Safely get data from localStorage
 */
export const getFromStorage = <T = unknown>(
  key: string,
  defaultValue: T,
): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Safely set data to localStorage
 */
export const setToStorage = (key: string, value: unknown): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Remove data from localStorage
 */
export const removeFromStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
    return false;
  }
};

/**
 * Clear all app data from localStorage
 */
export const clearAllStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error("Error clearing localStorage:", error);
    return false;
  }
};
