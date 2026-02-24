import React, { useState, useEffect } from 'react';
import { ChevronRight, Send, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui';
import { useMockDatabase } from '../context/MockDatabase';
import PlanViewer from './PlanViewer';

const IntakeForm = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [clientId, setClientId] = useState(null);
  const [completedPlan, setCompletedPlan] = useState(null);
  const { clients } = useMockDatabase();

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    level: 'Intermedio',
    daysPerWeek: 5
  });

  // Poll for plan completion
  useEffect(() => {
    if (isSubmitted && clientId) {
      const client = clients.find(c => c.id === clientId);
      if (client && client.status === 'COMPLETED' && client.plan) {
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
    const newId = onSubmit(formData); // Expect onSubmit to return ID
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
        <p className="sub-text">Esperando que el entrenador genere tu plan...</p>
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
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className="line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
        <div className="line"></div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
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
              <select name="objective" value={formData.objective} onChange={handleChange} required>
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
                {['Principiante', 'Intermedio', 'Avanzado'].map(l => (
                  <label key={l} className={`radio-card ${formData.level === l ? 'selected' : ''}`}>
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
            <Button type="button" variant="primary" rightIcon={<ChevronRight size={16} />} onClick={nextStep}>
              Siguiente
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <h2>Confirmación</h2>
            <p className="summary-text">
              Enviar solicitud para <strong>{formData.name}</strong> con objetivo <strong>{formData.objective}</strong>.
            </p>
            <Button type="submit" variant="primary" size="lg" rightIcon={<Send size={16} />}>
              Enviar a Entrenador
            </Button>
          </div>
        )}
      </form>

      <style>{`
        .intake-card {
          background: var(--color-surface);
          padding: 2rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          max-width: 600px;
          margin: 0 auto;
        }
        .steps-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
        }
        .step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--color-surface-hover);
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .step.active {
          background: var(--color-primary);
          color: white;
        }
        .line {
          width: 40px;
          height: 2px;
          background: var(--color-surface-hover);
          margin: 0 0.5rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text);
        }
        input, select {
          width: 100%;
          padding: 0.75rem;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          color: var(--color-text);
          font-family: var(--font-sans);
        }
        input:focus, select:focus {
          outline: none;
          border-color: var(--color-primary);
        }
        .btn-primary {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          transition: background 0.2s;
          margin-top: 1rem;
          cursor: pointer;
        }
        .btn-primary:hover {
          background: var(--color-primary-hover);
        }
        .radio-group {
          display: flex;
          gap: 1rem;
        }
        .radio-card {
          flex: 1;
          padding: 1rem;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .radio-card.selected {
          border-color: var(--color-primary);
          background: rgba(59, 130, 246, 0.1);
        }
        .radio-card input {
          display: none;
        }
        .summary-text {
          margin-bottom: 1.5rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};

export default IntakeForm;
