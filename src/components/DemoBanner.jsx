import React from "react";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Zap } from "lucide-react";
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_PLANS } from "../utils/auth";

const DemoBanner = ({ onUpgradeClick: _onUpgradeClick }) => {
  const { currentUser, trialDaysRemaining } = useAuth();

  if (!currentUser) return null;

  const { subscription } = currentUser;
  const daysLeft = trialDaysRemaining();

  // No mostrar si no está en trial o plan free
  if (
    subscription.status !== SUBSCRIPTION_STATUS.TRIAL &&
    subscription.plan !== SUBSCRIPTION_PLANS.FREE
  ) {
    return null;
  }

  const isExpired = subscription.status === SUBSCRIPTION_STATUS.EXPIRED;
  const isNearExpiry = daysLeft <= 3 && daysLeft > 0;

  return (
    <div
      className={`demo-banner ${isExpired ? "expired" : isNearExpiry ? "warning" : ""}`}
    >
      <div className="banner-content">
        <div className="banner-icon">
          {isExpired ? <AlertCircle size={20} /> : <Zap size={20} />}
        </div>
        <div className="banner-text">
          <strong>
            {isExpired
              ? "Período de prueba expirado"
              : `Modo Demo · ${daysLeft} día${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
          </strong>
          <span>
            {isExpired
              ? "Tu período de prueba ha finalizado. Disfruta las funciones disponibles."
              : "Versión de demostración gratuita"}
          </span>
        </div>
      </div>

      <style>{`
        .demo-banner {
          background: linear-gradient(135deg, 
            rgba(139, 92, 246, 0.1) 0%, 
            rgba(59, 130, 246, 0.1) 100%
          );
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: var(--radius-lg);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: var(--space-6);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .demo-banner.warning {
          background: linear-gradient(135deg, 
            rgba(251, 191, 36, 0.1) 0%, 
            rgba(245, 158, 11, 0.1) 100%
          );
          border-color: rgba(251, 191, 36, 0.4);
        }

        .demo-banner.expired {
          background: linear-gradient(135deg, 
            rgba(239, 68, 68, 0.1) 0%, 
            rgba(220, 38, 38, 0.1) 100%
          );
          border-color: rgba(239, 68, 68, 0.4);
        }

        .banner-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .banner-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(139, 92, 246, 0.15);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .demo-banner.warning .banner-icon {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .demo-banner.expired .banner-icon {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .banner-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .banner-text strong {
          color: var(--color-text);
          font-weight: 700;
        }

        .banner-text span {
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }

        .upgrade-btn {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all var(--transition-normal);
          white-space: nowrap;
        }

        .upgrade-btn:hover {
          background: var(--color-primary-dark);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        @media (max-width: 768px) {
          .demo-banner {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .banner-content {
            flex-direction: column;
            text-align: center;
          }

          .upgrade-btn {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DemoBanner;
