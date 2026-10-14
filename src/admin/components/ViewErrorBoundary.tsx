/**
 * ViewErrorBoundary - aísla fallos de render de una vista del panel Admin.
 *
 * Lo usa: AdminDashboard (una instancia por vista, con `key` = vista activa
 * para que se reinicie al cambiar de sección).
 */
import React from "react";

interface State {
  error: Error | null;
}

class ViewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Error en vista de administración:", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{ padding: 24 }}>
        <h3>Esta sección tuvo un error</h3>
        <p>Puedes reintentar o cambiar de sección desde el menú.</p>
        <button
          type="button"
          className="admin-btn tap-ripple"
          onClick={() => this.setState({ error: null })}
        >
          Reintentar
        </button>
      </div>
    );
  }
}

export default ViewErrorBoundary;
