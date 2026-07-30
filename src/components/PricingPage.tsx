import React from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui";
import {
  CheckCircle,
  Zap,
  Crown,
  Sparkles,
  ArrowLeft,
  Star,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, PLAN_FEATURES } from "../utils/auth";

const PricingPage = ({ onBack, onSelectPlan }) => {
  const { currentUser, upgradePlan } = useAuth();

  const plans = [
    {
      id: SUBSCRIPTION_PLANS.FREE,
      name: "Gratis",
      icon: <Star size={28} />,
      price: "$0",
      period: "siempre",
      features: PLAN_FEATURES.FREE,
      cta: "Plan Actual",
      color: "gray",
      isCurrent: currentUser?.subscription.plan === SUBSCRIPTION_PLANS.FREE,
    },
    {
      id: SUBSCRIPTION_PLANS.BASIC,
      name: "Básico",
      icon: <Zap size={28} />,
      price: "$0",
      period: "gratis",
      features: PLAN_FEATURES.BASIC,
      cta: "Actualizar a Básico",
      color: "blue",
      popular: false,
      isCurrent: currentUser?.subscription.plan === SUBSCRIPTION_PLANS.BASIC,
    },
    {
      id: SUBSCRIPTION_PLANS.PRO,
      name: "Profesional",
      icon: <Crown size={28} />,
      price: "$0",
      period: "gratis",
      features: PLAN_FEATURES.PRO,
      cta: "Actualizar a Pro",
      color: "purple",
      popular: true,
      isCurrent: currentUser?.subscription.plan === SUBSCRIPTION_PLANS.PRO,
    },
    {
      id: SUBSCRIPTION_PLANS.GYM,
      name: "Gimnasio",
      icon: <Sparkles size={28} />,
      price: "$0",
      period: "gratis",
      features: PLAN_FEATURES.GYM,
      cta: "Actualizar a Gimnasio",
      color: "green",
      isCurrent: currentUser?.subscription.plan === SUBSCRIPTION_PLANS.GYM,
    },
  ];

  const handleSelectPlan = async (planId) => {
    if (planId === currentUser?.subscription.plan) {
      return;
    }

    const result = await upgradePlan(planId);
    if (result.success) {
      onSelectPlan && onSelectPlan(planId);
      onBack && onBack();
    }
  };

  return (
    <div className="pricing-page">
      <div className="pricing-header">
        {onBack && (
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={18} />}
            onClick={onBack}
            className="back-btn"
          >
            Volver
          </Button>
        )}

        <h1>Elige Tu Plan</h1>
        <p className="pricing-subtitle">
          Todos los planes son completamente gratuitos. Sin pagos, sin tarjetas.
        </p>
        <div className="free-badge">
          <Sparkles size={16} />
          100% Gratis · Sin Compromisos
        </div>
      </div>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`pricing-card ${plan.popular ? "popular" : ""} ${plan.isCurrent ? "current" : ""} ${plan.color}`}
          >
            {plan.popular && (
              <div className="popular-badge">
                <Star size={14} />
                Más Popular
              </div>
            )}

            <div className="plan-header">
              <div className={`plan-icon ${plan.color}`}>{plan.icon}</div>
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="price">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
            </div>

            <div className="plan-features">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature">
                  <CheckCircle size={18} className="check-icon" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <Button
              variant={plan.popular ? "primary" : "secondary"}
              size="lg"
              className="select-plan-btn"
              onClick={() => handleSelectPlan(plan.id)}
              disabled={plan.isCurrent}
            >
              {plan.isCurrent ? "Plan Actual" : plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <div className="pricing-footer">
        <p>
          💡 <strong>Nota:</strong> Esta es una versión de demostración. Todos
          los planes son gratuitos para que puedas probar todas las funciones.
        </p>
      </div>

      <style>{`
        .pricing-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
        }

        .back-btn {
          position: absolute;
          left: 0;
          top: 0;
        }

        .pricing-header h1 {
          font-size: 3rem;
          margin: 0 0 1rem 0;
          background: var(--color-primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .pricing-subtitle {
          color: var(--color-text-muted);
          font-size: 1.25rem;
          margin: 0 0 1rem 0;
        }

        .free-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, 
            rgba(16, 185, 129, 0.1), 
            rgba(5, 150, 105, 0.1)
          );
          border: 2px solid rgba(16, 185, 129, 0.3);
          border-radius: 999px;
          color: #10b981;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .pricing-card {
          background: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all var(--transition-normal);
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-xl);
        }

        .pricing-card.popular {
          border-color: var(--color-primary);
          box-shadow: var(--shadow-lg);
        }

        .pricing-card.current {
          background: var(--color-surface-subtle);
          border-color: var(--color-success);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--color-primary);
          color: white;
          padding: 0.375rem 1rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          box-shadow: var(--shadow-md);
        }

        .plan-header {
          text-align: center;
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--color-border);
        }

        .plan-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 1rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .plan-icon.gray {
          background: linear-gradient(135deg, #6b7280, #4b5563);
        }

        .plan-icon.blue {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .plan-icon.purple {
          background: linear-gradient(135deg, var(--color-primary), #7c3aed);
        }

        .plan-icon.green {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .plan-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: var(--color-text);
        }

        .plan-price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.25rem;
        }

        .price {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--color-text);
        }

        .period {
          font-size: 1rem;
          color: var(--color-text-muted);
        }

        .plan-features {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .feature {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .check-icon {
          color: var(--color-success);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .feature span {
          color: var(--color-text);
          line-height: 1.5;
        }

        .select-plan-btn {
          width: 100%;
        }

        .pricing-footer {
          text-align: center;
          padding: 2rem;
          background: var(--color-surface-subtle);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .pricing-footer p {
          margin: 0;
          color: var(--color-text-muted);
        }

        @media (max-width: 768px) {
          .pricing-page {
            padding: 1rem;
          }

          .pricing-header h1 {
            font-size: 2rem;
          }

          .pricing-subtitle {
            font-size: 1rem;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }

          .back-btn {
            position: static;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default PricingPage;
