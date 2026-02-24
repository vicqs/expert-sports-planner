import React, { useState } from 'react';
import { useMockDatabase } from '../context/MockDatabase';
import { generatePlan } from '../utils/generator';
import { Play, Check, Clock, User, ArrowLeft } from 'lucide-react';
import PlanEditor from './PlanEditor';
import TrainerScheduleConfig from './TrainerScheduleConfig';
import TrainerAppointmentCalendar from './TrainerAppointmentCalendar';
import { Card, Button } from './ui';

const CoachDashboard = ({ onExit }) => {
  const { getPendingClients, getCompletedClients, updateClientPlan } = useMockDatabase();
  const [activeTab, setActiveTab] = useState('pending'); // pending, completed, horarios
  const [selectedClient, setSelectedClient] = useState(null);
  const [currentPlanObject, setCurrentPlanObject] = useState(null);

  const pending = getPendingClients();
  const completed = getCompletedClients();

  const handleGenerate = (client) => {
    const plan = generatePlan(client);
    setCurrentPlanObject(plan);
    setSelectedClient(client);
  };

  const handleSavePlan = (finalText, planObject) => {
    updateClientPlan(selectedClient.id, finalText, planObject);
    setSelectedClient(null);
    setCurrentPlanObject(null);
  };

  const handleEdit = (client) => {
    if (client.planObject) {
      setCurrentPlanObject(client.planObject);
      setSelectedClient(client);
    } else {
      alert("Este plan es antiguo y no se puede editar visualmente.");
    }
  };

  if (currentPlanObject) {
    return (
      <div className="coach-workspace">
        <div className="workspace-header">
          <h2>Editando Plan para {selectedClient.name}</h2>
        </div>
        <PlanEditor
          initialPlan={currentPlanObject}
          clientData={selectedClient}
          onSave={handleSavePlan}
          onCancel={() => setCurrentPlanObject(null)}
        />
        <style>{`
          .coach-workspace {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 100px);
          }
          .workspace-header {
            margin-bottom: var(--space-6);
          }
          .workspace-header h2 {
            background: var(--color-primary-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Panel de Entrenador</h2>
        <div className="header-actions">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pendientes
            </button>
            <button
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completados
            </button>
            <button
              className={`tab-btn ${activeTab === 'horarios' ? 'active' : ''}`}
              onClick={() => setActiveTab('horarios')}
            >
              Horarios Gym
            </button>
            <button
              className={`tab-btn ${activeTab === 'citas' ? 'active' : ''}`}
              onClick={() => setActiveTab('citas')}
            >
              Citas
            </button>
          </div>
          <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={onExit}>
            Salir
          </Button>
        </div>
      </div>

      {activeTab === 'horarios' ? (
        <TrainerScheduleConfig />
      ) : activeTab === 'citas' ? (
        <TrainerAppointmentCalendar />
      ) : (
        <>

          <div className="section">
            <div className="section-title">
              <Clock size={20} />
              <h3>Solicitudes Pendientes</h3>
              <span className="badge badge-primary">{pending.length}</span>
            </div>

            {pending.length === 0 ? (
              <Card>
                <p className="empty-state">No hay solicitudes nuevas.</p>
              </Card>
            ) : (
              <div className="client-grid">
                {pending.map(client => (
                  <Card key={client.id} hover glass className="client-card">
                    <div className="card-header-custom">
                      <div className="client-icon">
                        <User size={20} />
                      </div>
                      <h4>{client.name}</h4>
                    </div>
                    <div className="card-body-custom">
                      <div className="info-row">
                        <span className="label">Objetivo:</span>
                        <span className="value">{client.objective}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Nivel:</span>
                        <span className="value">{client.level}</span>
                      </div>
                      <div className="info-row date">
                        <span>{new Date(client.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      leftIcon={<Play size={16} />}
                      onClick={() => handleGenerate(client)}
                      className="action-button"
                    >
                      Generar Plan
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <div className="section-title">
              <Check size={20} />
              <h3>Planes Completados</h3>
              <span className="badge badge-success">{completed.length}</span>
            </div>

            <Card>
              <div className="client-list">
                {completed.length === 0 ? (
                  <p className="empty-state">No hay planes completados aún.</p>
                ) : (
                  completed.map(client => (
                    <div key={client.id} className="list-item">
                      <div className="list-item-content">
                        <User size={16} />
                        <span>{client.name}</span>
                      </div>
                      <div className="list-actions">
                        <span className="badge badge-success">Completado</span>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(client)}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-8);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--color-border);
        }
        .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .tabs {
            display: flex;
            gap: 0.5rem;
            background: var(--color-surface);
            padding: 0.25rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--color-border);
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: var(--radius-sm);
            color: var(--color-text-muted);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: var(--color-primary);
            color: white;
        }
        
        .dashboard-header h2 {
          background: var(--color-primary-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .section {
          margin-bottom: var(--space-10);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
          color: var(--color-text);
        }
        
        .section-title h3 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: 600;
        }
        
        .client-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--space-6);
        }
        
        @media (max-width: 768px) {
          .client-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .client-card {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        
        .card-header-custom {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        
        .client-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background: rgba(139, 92, 246, 0.15);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .card-header-custom h4 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: 600;
        }
        
        .card-body-custom {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--text-sm);
        }
        
        .info-row .label {
          color: var(--color-text-muted);
          font-weight: 500;
        }
        
        .info-row .value {
          color: var(--color-text);
          font-weight: 600;
        }
        
        .info-row.date {
          color: var(--color-text-subtle);
          font-size: var(--text-xs);
          justify-content: flex-end;
          margin-top: var(--space-2);
        }
        
        .action-button {
          width: 100%;
          margin-top: var(--space-2);
        }
        
        .client-list {
          display: flex;
          flex-direction: column;
        }
        
        .list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-4);
          border-bottom: 1px solid var(--color-border-subtle);
        }
        
        .list-item:last-child {
          border-bottom: none;
        }
        
        .list-item-content {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          color: var(--color-text);
        }
        
        .list-actions {
            display: flex;
            align-items: center;
            gap: var(--space-4);
        }
        
        .empty-state {
          color: var(--color-text-muted);
          font-style: italic;
          text-align: center;
          padding: var(--space-8);
        }
      `}</style>
    </div>
  );
};

export default CoachDashboard;
