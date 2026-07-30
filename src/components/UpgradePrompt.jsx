import React from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, Zap, CheckCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from "../utils/auth";
import { Button } from "./ui";

const UpgradePrompt = ({ show, onClose, onUpgrade, feature, message }) => {
  const { currentUser } = useAuth();

  if (!show || !currentUser) return null;

  const currentPlan = currentUser.subscription.plan;
  const recommendedPlan =
    feature === "unlimited_plans"
      ? SUBSCRIPTION_PLANS.BASIC
      : SUBSCRIPTION_PLANS.PRO;

  return (
    <AnimatePresence>
      <motion.div
        className="upgrade-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="upgrade-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="upgrade-header">
            <div className="lock-icon">
              <Lock size={32} />
            </div>
            <h2>Función No Disponible</h2>
            <p className="upgrade-message">
              {message ||
                "Esta función no está disponible en la versión de demostración gratuita"}
            </p>
          </div>

          <div className="upgrade-body">
            <div className="plan-card-mini">
              <p
                style={{
                  textAlign: "center",
                  color: "var(--color-text-secondary)",
                  padding: "1rem",
                }}
              >
                Actualmente solo está disponible el plan de demostración
                gratuito de 14 días.
              </p>
            </div>
          </div>

          <div className="upgrade-footer">
            <Button variant="primary" onClick={onClose}>
              Entendido
            </Button>
          </div>

          <style>{`
            .upgrade-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 2000;
              padding: 1rem;
              backdrop-filter: blur(4px);
            }

            .upgrade-modal {
              background: var(--color-surface);
              border-radius: var(--radius-xl);
              width: 100%;
              max-width: 500px;
              box-shadow: var(--shadow-xl);
              border: 1px solid var(--color-border);
              position: relative;
              overflow: hidden;
            }

            .close-modal-btn {
              position: absolute;
              top: 1rem;
              right: 1rem;
              background: var(--color-surface-hover);
              border: none;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: var(--color-text-muted);
              transition: all var(--transition-normal);
              z-index: 10;
            }

            .close-modal-btn:hover {
              background: var(--color-border);
              color: var(--color-text);
            }

            .upgrade-header {
              padding: 2.5rem 2rem 1.5rem;
              text-align: center;
              background: linear-gradient(135deg, 
                rgba(139, 92, 246, 0.1) 0%, 
                rgba(59, 130, 246, 0.1) 100%
              );
              border-bottom: 1px solid var(--color-border);
            }

            .lock-icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1rem;
              border-radius: 50%;
              background: linear-gradient(135deg, var(--color-primary), #3b82f6);
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3);
            }

            .upgrade-header h2 {
              margin: 0 0 0.5rem 0;
              font-size: 1.75rem;
              color: var(--color-text);
            }

            .upgrade-message {
              margin: 0;
              color: var(--color-text-muted);
              font-size: 1rem;
            }

            .upgrade-body {
              padding: 2rem;
            }

            .plan-card-mini {
              background: var(--color-surface-subtle);
              border: 2px solid var(--color-primary);
              border-radius: var(--radius-lg);
              padding: 1.5rem;
            }

            .plan-header-mini {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              margin-bottom: 1.5rem;
              color: var(--color-primary);
            }

            .plan-header-mini h3 {
              margin: 0;
              font-size: 1.25rem;
            }

            .features-list {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }

            .feature-item {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              color: var(--color-text);
            }

            .feature-item svg {
              color: var(--color-success);
              flex-shrink: 0;
            }

            .upgrade-footer {
              padding: 1.5rem 2rem;
              border-top: 1px solid var(--color-border);
              display: flex;
              gap: 1rem;
              justify-content: flex-end;
            }

            @media (max-width: 480px) {
              .upgrade-header {
                padding: 2rem 1.5rem 1.5rem;
              }

              .upgrade-header h2 {
                font-size: 1.5rem;
              }

              .upgrade-body {
                padding: 1.5rem;
              }

              .upgrade-footer {
                flex-direction: column;
                padding: 1.5rem;
              }

              .upgrade-footer button {
                width: 100%;
              }
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradePrompt;
