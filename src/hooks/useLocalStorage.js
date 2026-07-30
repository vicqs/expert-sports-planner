import { useState, useEffect } from "react";
import { getFromStorage, setToStorage } from "../utils/storage";

/**
 * Custom hook for using localStorage with React state
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {Array} [value, setValue] tuple
 */
export const useLocalStorage = (key, initialValue) => {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    return getFromStorage(key, initialValue);
  });

  // Update localStorage when state changes
  useEffect(() => {
    setToStorage(key, storedValue);
  }, [key, storedValue]);

  // Return wrapped setter function that persists to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);
      setToStorage(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

export default useLocalStorage;
