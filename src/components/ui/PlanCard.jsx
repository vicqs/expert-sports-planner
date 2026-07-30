import React from "react";
import { Card, Button } from "./index";
import { ChevronRight, Trophy, Clock } from "lucide-react";
import "./PlanCard.css";

const PlanCard = ({ plan, onClick }) => {
  const isCompleted = plan.status === "completed"; // Or logic based on dates
  const isActive = plan.status === "active" || !isCompleted; // Simplified for now

  // Mock progress for now, or calculate from plan data if available
  const progress = plan.progress || 0;

  return (
    <Card hover glass className="plan-card" onClick={onClick}>
      <div className="plan-card-header">
        <div className="plan-info">
          <h3>{plan.name || "Plan Personalizado"}</h3>
          <p className="coach-name">Por: Coach Expert</p>
        </div>
        <div className="plan-status">
          {isActive && <span className="badge badge-primary">Activo</span>}
          {isCompleted && (
            <span className="badge badge-secondary">Completado</span>
          )}
        </div>
      </div>

      <div className="plan-card-body">
        <div className="plan-meta">
          <div className="meta-item">
            <Clock size={16} />
            <span>{plan.duration || "4 semanas"}</span>
          </div>
          <div className="meta-item">
            <Trophy size={16} />
            <span>{plan.objective || "General"}</span>
          </div>
        </div>

        <div className="plan-progress">
          <div className="progress-text">
            <span className="label">Progreso</span>
            <span className="value">{progress}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="plan-card-footer">
        <span className="next-session">
          Próxima: <strong>Mañana</strong>
        </span>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={<ChevronRight size={16} />}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Ver Plan
        </Button>
      </div>
    </Card>
  );
};

export default PlanCard;
