import React from "react";
import { User, ShieldCheck } from "lucide-react";
import Card from "./ui/Card";

const RoleSelector = ({ onSelect }) => {
  return (
    <div className="role-selector-container">
      <div className="role-header">
        <h1>Bienvenido a Expert Sports Planner</h1>
        <p>Sistema Experto de Planificación Deportiva</p>
      </div>

      <div className="cards-container">
        <Card
          hover
          glass
          gradient="purple-blue"
          className="role-card"
          onClick={() => onSelect("athlete")}
        >
          <div className="icon-wrapper athlete">
            <User size={48} />
          </div>
          <h3>Soy Atleta</h3>
          <p>Quiero solicitar un plan de entrenamiento personalizado.</p>
          <div className="card-arrow">→</div>
        </Card>

        <Card
          hover
          glass
          gradient="purple-blue"
          className="role-card"
          onClick={() => onSelect("coach")}
        >
          <div className="icon-wrapper coach">
            <ShieldCheck size={48} />
          </div>
          <h3>Soy Entrenador</h3>
          <p>Quiero revisar solicitudes y generar planes expertos.</p>
          <div className="card-arrow">→</div>
        </Card>
      </div>

      <style>{`
        .role-selector-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh;
          text-align: center;
          padding: var(--space-6);
        }
        
        .role-header {
          margin-bottom: var(--space-12);
        }
        
        .role-header h1 {
          font-size: var(--text-4xl);
          background: var(--color-primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-4);
        }
        
        .role-header p {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
        }
        
        .cards-container {
          display: flex;
          gap: var(--space-8);
          flex-wrap: wrap;
          justify-content: center;
          max-width: 800px;
        }
        
        .role-card {
          position: relative;
          padding: var(--space-8);
          width: 320px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          overflow: hidden;
        }
        
        .role-card:hover .icon-wrapper {
          transform: scale(1.1);
        }
        
        .role-card:hover .card-arrow {
          transform: translateX(8px);
          opacity: 1;
        }
        
        .icon-wrapper {
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          transition: transform var(--transition-normal);
          margin-bottom: var(--space-2);
        }
        
        .icon-wrapper.athlete {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
          color: var(--color-primary);
        }
        
        .icon-wrapper.coach {
          background: rgba(132, 204, 22, 0.15);
          color: var(--color-accent-lime);
        }
        
        .role-card h3 {
          margin: 0;
          font-size: var(--text-2xl);
          font-weight: 700;
        }
        
        .role-card p {
          color: var(--color-text-muted);
          font-size: var(--text-base);
          line-height: var(--leading-relaxed);
          margin: 0;
        }
        
        .card-arrow {
          position: absolute;
          bottom: var(--space-6);
          right: var(--space-6);
          font-size: var(--text-2xl);
          color: var(--color-primary);
          opacity: 0;
          transition: all var(--transition-normal);
        }
        
        @media (max-width: 768px) {
          .role-selector-container {
            padding: var(--space-4);
          }
          .role-header h1 {
            font-size: var(--text-3xl);
          }
          .role-header p {
            font-size: var(--text-base);
          }
          .cards-container {
            gap: var(--space-6);
          }
          .role-card {
            width: 100%;
            max-width: 400px;
          }
        }
        @media (max-width: 480px) {
          .role-header h1 {
            font-size: var(--text-2xl);
          }
          .role-header p {
            font-size: var(--text-sm);
          }
          .role-card {
            padding: var(--space-6);
          }
          .icon-wrapper {
            width: 80px;
            height: 80px;
          }
          .icon-wrapper svg {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </div>
  );
};

export default RoleSelector;
