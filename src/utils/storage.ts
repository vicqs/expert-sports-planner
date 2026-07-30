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
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key doesn't exist or parsing fails
 * @returns {*} Parsed data or default value
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Safely set data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export const setToStorage = (key, value) => {
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
 * @param {string} key - Storage key
 */
export const removeFromStorage = (key) => {
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
