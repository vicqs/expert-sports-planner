import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  LogIn,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { ROLES } from "../utils/auth";

const AuthPage = ({ onSuccess }: { onSuccess?: (role?: string) => void }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
    role: ROLES.TRAINER,
  });
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { login, register, loading, quickAdminLogin } = useAuth();

  const handleQuickAdminLogin = async () => {
    setFormError("");
    const result = await quickAdminLogin();
    if (result.success) {
      onSuccess && onSuccess(result.user);
    } else {
      setFormError(result.error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (isLoginMode) {
      // Login
      const result = await login(formData.email, formData.password);
      if (result.success) {
        onSuccess && onSuccess(result.user);
      } else {
        setFormError(result.error);
      }
    } else {
      // Register
      if (formData.password !== formData.confirmPassword) {
        setFormError("Las contraseñas no coinciden");
        return;
      }

      if (formData.password.length < 6) {
        setFormError("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      const result = await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
      });

      if (result.success) {
        onSuccess && onSuccess(result.user);
      } else {
        setFormError(result.error);
      }
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormError("");
    setFormData({
      email: "",
      password: "",
      name: "",
      confirmPassword: "",
      role: ROLES.TRAINER,
    });
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Expert Sports Planner</h1>
          <p className="subtitle">
            {isLoginMode
              ? "Inicia sesión en tu cuenta"
              : "Crea tu cuenta gratuita"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label htmlFor="name">
                  <User size={18} />
                  Nombre Completo
                </label>
                <div className="input-shell">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de Cuenta</label>
                <div className="radio-group-auth">
                  <label
                    className={`radio-option ${formData.role === ROLES.TRAINER ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={ROLES.TRAINER}
                      checked={formData.role === ROLES.TRAINER}
                      onChange={handleChange}
                    />
                    <span>Entrenador</span>
                    <small>Gestiona atletas y planes</small>
                  </label>
                  <label
                    className={`radio-option ${formData.role === ROLES.ATHLETE ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={ROLES.ATHLETE}
                      checked={formData.role === ROLES.ATHLETE}
                      onChange={handleChange}
                    />
                    <span>Atleta</span>
                    <small>Recibe y sigue tu plan</small>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <div className="input-shell">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                autoComplete="email"
                inputMode="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Contraseña
            </label>
            <div className="input-shell">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isLoginMode ? "current-password" : "new-password"}
                required
                minLength={6}
              />
              <button
                type="button"
                className="input-suffix-btn tap-ripple"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLoginMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                Confirmar Contraseña
              </label>
              <div className="input-shell">
                <Lock size={18} className="input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="input-suffix-btn tap-ripple"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          )}

          {formError && (
            <div className="form-error">
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="submit-btn"
            leftIcon={
              isLoginMode ? <LogIn size={20} /> : <UserPlus size={20} />
            }
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : isLoginMode
                ? "Iniciar Sesión"
                : "Crear Cuenta Gratis"}
          </Button>

          {!isLoginMode && (
            <div className="trial-notice">
              <AlertCircle size={16} />
              <span>14 días de prueba gratis · Sin tarjeta de crédito</span>
            </div>
          )}
        </form>

        <div className="auth-footer">
          <p>
            {isLoginMode ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            <button type="button" className="toggle-btn" onClick={toggleMode}>
              {isLoginMode ? "Crear cuenta gratis" : "Iniciar sesión"}
            </button>
          </p>
        </div>

        <div className="dev-quick-access">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            leftIcon={<Shield size={16} />}
            onClick={handleQuickAdminLogin}
            disabled={loading}
          >
            Acceso temporal como Super Admin (dev)
          </Button>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: linear-gradient(135deg, 
            var(--color-primary) 0%, 
            var(--color-primary-dark) 100%
          );
        }

        .auth-container {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 480px;
          padding: 3rem 2rem;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2rem;
          background: var(--color-primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: var(--color-text-muted);
          margin: 0;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: var(--color-text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .input-shell {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        .form-group input {
          width: 100%;
          padding: 0.875rem 2.75rem 0.875rem 2.75rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-surface);
          color: var(--color-text);
          font-size: 16px;
          transition: all var(--transition-normal);
        }

        .input-shell .input-suffix-btn ~ input,
        .input-suffix-btn {
          padding-right: 2.75rem;
        }

        .input-suffix-btn {
          position: absolute;
          right: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: color var(--transition-normal);
        }

        .input-suffix-btn:hover {
          color: var(--color-primary);
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .radio-group-auth {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .radio-option {
          display: flex;
          flex-direction: column;
          padding: 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-normal);
          position: relative;
        }

        .radio-option input {
          position: absolute;
          opacity: 0;
        }

        .radio-option span {
          font-weight: 600;
          color: var(--color-text);
        }

        .radio-option small {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .radio-option:hover {
          border-color: var(--color-primary);
          background: rgba(139, 92, 246, 0.05);
        }

        .radio-option.selected {
          border-color: var(--color-primary);
          background: rgba(139, 92, 246, 0.1);
        }

        .form-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: #ef4444;
          font-size: 0.875rem;
        }

        .submit-btn {
          margin-top: 0.5rem;
        }

        .trial-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: var(--radius-md);
          color: #10b981;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .auth-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--color-border);
          text-align: center;
        }

        .auth-footer p {
          margin: 0;
          color: var(--color-text-muted);
        }

        .dev-quick-access {
          margin-top: 1rem;
          text-align: center;
          opacity: 0.7;
        }

        .toggle-btn {
          background: none;
          border: none;
          color: var(--color-primary);
          font-weight: 600;
          cursor: pointer;
          margin-left: 0.5rem;
          transition: opacity var(--transition-normal);
        }

        .toggle-btn:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .auth-page {
            padding: 1rem;
          }

          .auth-container {
            padding: 2rem 1.5rem;
          }

          .auth-header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
