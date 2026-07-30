import React, { useState, useEffect } from "react";
import { ChevronRight, Send, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui";
import { useMockDatabase } from "../context/MockDatabase";
import PlanViewer from "./PlanViewer";

const IntakeForm = ({ onCancel, trainerId = null }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [clientId, setClientId] = useState<any>(null);
  const [completedPlan, setCompletedPlan] = useState<any>(null);
  const { clients, addClientRequest } = useMockDatabase();

  const [formData, setFormData] = useState({
    name: "",
    objective: "",
    level: "Intermedio",
    daysPerWeek: 5,
    planDuration: 4, // weeks
  });

  // Poll for plan completion
  useEffect(() => {
    if (isSubmitted && clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client && client.status === "COMPLETED" && client.plan) {
        setCompletedPlan(client.plan);
      }
    }
  }, [isSubmitted, clientId, clients]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(step + 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newId = addClientRequest(formData, trainerId);
    setClientId(newId);
    setIsSubmitted(true);
  };

  if (completedPlan) {
    return (
      <div className="plan-ready-view">
        <div className="success-banner">
          <CheckCircle size={24} />
          <h3>¡Tu plan está listo!</h3>
        </div>
        <PlanViewer planText={completedPlan} onReset={onCancel} />
        <style>{`
                .plan-ready-view {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .success-banner {
                    background: rgba(16, 185, 129, 0.1);
                    color: var(--color-success);
                    padding: 1rem;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                    border: 1px solid var(--color-success);
                }
                .success-banner h3 {
                    margin: 0;
                    font-size: 1.1rem;
                }
              `}</style>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="intake-card success-view">
        <div className="loading-pulse">
          <CheckCircle size={64} className="success-icon" />
        </div>
        <h2>¡Solicitud Enviada!</h2>
        <p>Tu perfil ha sido enviado al entrenador.</p>
        <p className="sub-text">
          Esperando que el entrenador genere tu plan...
        </p>
        <div className="waiting-indicator">
          <RefreshCw size={20} className="spin" />
          <span>Verificando actualizaciones en tiempo real</span>
        </div>
        <Button variant="ghost" onClick={onCancel} className="mt-4">
          Volver al Inicio
        </Button>
        <style>{`
          .success-view {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 3rem;
          }
          .success-icon {
            color: var(--color-success);
            margin-bottom: 1rem;
          }
          .sub-text {
            color: var(--color-text-muted);
            margin-bottom: 1rem;
          }
          .waiting-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-text-muted);
            font-size: 0.9rem;
            background: var(--color-surface-hover);
            padding: 0.5rem 1rem;
            border-radius: 999px;
          }
          .spin {
            animation: spin 2s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .mt-4 { margin-top: 1rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="intake-card">
      <div className="steps-indicator">
        <div className={`step ${step >= 1 ? "active" : ""}`}>1</div>
        <div className="line"></div>
        <div className={`step ${step >= 2 ? "active" : ""}`}>2</div>
        <div className="line"></div>
        <div className={`step ${step >= 3 ? "active" : ""}`}>3</div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="form-step">
            <h2>Perfil del Atleta</h2>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>
            <div className="form-group">
              <label>Objetivo Principal</label>
              <select
                name="objective"
                value={formData.objective}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="10k">Mejorar 10k</option>
                <option value="21k">Medio Maratón</option>
                <option value="fitness">Fitness General</option>
              </select>
            </div>
            <button type="button" className="btn-primary" onClick={nextStep}>
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <h2>Datos Técnicos</h2>
            <div className="form-group">
              <label>Nivel de Experiencia</label>
              <div className="radio-group">
                {["Principiante", "Intermedio", "Avanzado"].map((l) => (
                  <label
                    key={l}
                    className={`radio-card ${formData.level === l ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={l}
                      checked={formData.level === l}
                      onChange={handleChange}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Duración del Plan</label>
              <div className="radio-group">
                {[
                  { weeks: 4, label: "4 semanas" },
                  { weeks: 6, label: "6 semanas" },
                  { weeks: 8, label: "8 semanas" },
                  { weeks: 12, label: "12 semanas" },
                ].map((option) => (
                  <label
                    key={option.weeks}
                    className={`radio-card ${formData.planDuration === option.weeks ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="planDuration"
                      value={option.weeks}
                      checked={formData.planDuration === option.weeks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          planDuration: parseInt(e.target.value),
                        })
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              rightIcon={<ChevronRight size={16} />}
              onClick={nextStep}
            >
              Siguiente
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Confirmación</h2>
            <p className="summary-text">
              Enviar solicitud para <strong>{formData.name}</strong> con
              objetivo <strong>{formData.objective}</strong>.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              rightIcon={<Send size={16} />}
            >
              Enviar a Entrenador
            </Button>
          </div>
        )}
      </form>

      <style>{`
        .intake-card {
          background: var(--color-surface);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          border: 1px solid var(--color-border);
          max-width: 650px;
          margin: 0 auto;
          box-shadow: var(--shadow-lg);
          animation: slideIn 0.4s ease-out;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-8);
          padding: var(--space-4);
          background: var(--color-bg-subtle);
          border-radius: var(--radius-lg);
        }
        .step {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--color-surface-hover);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-lg);
          transition: all var(--transition-normal);
          position: relative;
          z-index: 2;
        }
        .step.active {
          background: var(--color-primary-gradient);
          color: white;
          box-shadow: var(--shadow-md), var(--shadow-glow);
          transform: scale(1.1);
        }
        .line {
          width: 60px;
          height: 3px;
          background: var(--color-border);
          margin: 0 var(--space-2);
          position: relative;
          z-index: 1;
        }
        .form-step {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .form-step h2 {
          font-size: var(--text-2xl);
          font-weight: 700;
          margin-bottom: var(--space-6);
          color: var(--color-text);
          text-align: center;
        }
        .form-group {
          margin-bottom: var(--space-6);
        }
        label {
          display: block;
          margin-bottom: var(--space-3);
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--color-text);
          letter-spacing: 0.02em;
        }
        input, select {
          width: 100%;
          min-height: var(--touch-target-min);
          padding: var(--space-4);
          background: var(--color-bg);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-sans);
          font-size: var(--text-base);
          transition: all var(--transition-normal);
        }
        input:focus, select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          transform: translateY(-1px);
        }
        input::placeholder {
          color: var(--color-text-muted);
        }
        .btn-primary {
          background: var(--color-primary-gradient);
          color: white;
          border: none;
          min-height: var(--touch-target-min);
          padding: var(--space-4) var(--space-6);
          border-radius: var(--radius-md);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          font-weight: 700;
          font-size: var(--text-base);
          transition: all var(--transition-normal);
          margin-top: var(--space-6);
          cursor: pointer;
          width: 100%;
          box-shadow: var(--shadow-md);
        }
        .btn-primary:hover {
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          transform: translateY(-2px);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .radio-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-3);
        }
        .radio-card {
          padding: var(--space-5);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: center;
          font-weight: 600;
          transition: all var(--transition-normal);
          background: var(--color-surface);
          min-height: var(--touch-target-min);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radio-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .radio-card.selected {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
          transform: scale(1.02);
        }
        .radio-card input {
          display: none;
        }
        .summary-text {
          margin-bottom: var(--space-6);
          padding: var(--space-5);
          background: var(--color-bg-subtle);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--color-primary);
          color: var(--color-text);
          font-size: var(--text-base);
          line-height: var(--leading-relaxed);
        }
        .summary-text strong {
          color: var(--color-primary);
          font-weight: 700;
        }
        @media (max-width: 768px) {
          .intake-card {
            padding: var(--space-6);
          }
          .step {
            width: 36px;
            height: 36px;
            font-size: var(--text-base);
          }
          .line {
            width: 40px;
          }
        }
        @media (max-width: 480px) {
          .intake-card {
            padding: var(--space-4);
            border-radius: var(--radius-lg);
          }
          .steps-indicator {
            padding: var(--space-3);
          }
          .step {
            width: 32px;
            height: 32px;
            font-size: var(--text-sm);
          }
          .line {
            width: 30px;
          }
          .form-step h2 {
            font-size: var(--text-xl);
          }
          .radio-group {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default IntakeForm;
