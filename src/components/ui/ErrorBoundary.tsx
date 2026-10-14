/**
 * ErrorBoundary - evita la pantalla en blanco si una vista falla al renderizar.
 * Se reinicia al cambiar `resetKey` (ej. pestaña activa) o con "Reintentar".
 */
import React from "react";

interface Props {
  children: React.ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Error de render:", error);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          margin: "2rem auto",
          maxWidth: 480,
          padding: "1.5rem",
          textAlign: "center",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Algo salió mal en esta sección</h3>
        <p style={{ color: "var(--color-text-muted)" }}>
          Tus datos guardados no se perdieron. Puedes reintentar o cambiar de
          sección.
        </p>
        <button
          type="button"
          className="tap-ripple"
          style={{
            minHeight: "var(--touch-target-min, 44px)",
            padding: "0 1.25rem",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--color-primary)",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
          onClick={() => this.setState({ error: null })}
        >
          Reintentar
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
