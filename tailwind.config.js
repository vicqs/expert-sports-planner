/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  // Se desactiva el preflight (reset de estilos) para no chocar con el
  // sistema de estilos CSS existente (variables.css / main.css) durante
  // la adopción incremental de Tailwind.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          purple: "var(--color-primary-purple)",
          blue: "var(--color-primary-blue)",
          hover: "var(--color-primary-hover)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          lime: "var(--color-accent-lime)",
          cyan: "var(--color-accent-cyan)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
