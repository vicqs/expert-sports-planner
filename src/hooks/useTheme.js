import { useState, useEffect } from "react";

/**
 * Hook for managing theme (light/dark mode)
 * Follows UX best practices 2026:
 * - Persists user preference in localStorage
 * - Respects system preference on first load
 * - Provides smooth transitions
 * - Accessible color contrast in both modes
 */
const THEME_KEY = "expert_planner_theme";
const THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (
      savedTheme &&
      (savedTheme === THEMES.LIGHT || savedTheme === THEMES.DARK)
    ) {
      return savedTheme;
    }

    // Fall back to system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return THEMES.DARK;
    }

    return THEMES.LIGHT;
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme);

    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT,
    );
  };

  const setLightTheme = () => setTheme(THEMES.LIGHT);
  const setDarkTheme = () => setTheme(THEMES.DARK);

  return {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
  };
};

export default useTheme;
