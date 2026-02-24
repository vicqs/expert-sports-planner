import React, { useState } from 'react';
import { useMockDatabase } from '../context/MockDatabase';
import { Button, Card } from './ui';
import IntakeForm from './IntakeForm';
import PlanCard from './ui/PlanCard';
import PlanDetail from './PlanDetail';
import GymBookingSystem from './GymBookingSystem';
import AppointmentScheduler from './AppointmentScheduler';
import { Plus, User, ArrowLeft, Calendar, Dumbbell } from 'lucide-react';

const AthleteDashboard = ({ onExit }) => {
    const { clients } = useMockDatabase();
    const [view, setView] = useState('home'); // home, intake, plan-detail
    const [selectedPlan, setSelectedPlan] = useState(null);

    // For demo purposes, let's filter clients that have a plan (status COMPLETED)
    // In a real app, this would filter by the logged-in user ID
    const myPlans = clients.filter(c => c.status === 'COMPLETED' && c.planObject);

    const handlePlanClick = (plan) => {
        setSelectedPlan(plan);
        setView('plan-detail');
    };

    const handleBack = () => {
        if (view === 'plan-detail') {
            setView('home');
            setSelectedPlan(null);
        } else if (view === 'intake') {
            setView('home');
        } else {
            onExit();
        }
    };

    if (view === 'intake') {
        return (
            <div className="athlete-dashboard">
                <div className="dashboard-header">
                    <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={handleBack}>
                        Volver
                    </Button>
                    <h2>Solicitar Nuevo Plan</h2>
                </div>
                <IntakeForm
                    onSubmit={(data) => {
                        // IntakeForm handles submission to DB
                        // We just need to know it's done to maybe switch view or show success
                        // For now IntakeForm has its own success view, so we might leave it there
                        // or pass a callback to return to home after success
                        return data; // Pass through
                    }}
                    onCancel={handleBack}
                />
            </div>
        );
    }

    if (view === 'plan-detail' && selectedPlan) {
        return (
            <PlanDetail
                plan={selectedPlan.planObject}
                client={selectedPlan}
                onBack={handleBack}
            />
        );
    }

    if (view === 'gym-booking') {
        // Mock ID for now, in real app would be from auth
        const currentAthleteId = myPlans[0]?.id || 'guest';
        return (
            <div className="athlete-dashboard">
                <div className="dashboard-header">
                    <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={handleBack}>
                        Volver
                    </Button>
                    <h2>Reservas de Gimnasio</h2>
                </div>
                <GymBookingSystem athleteId={currentAthleteId} />
            </div>
        );
    }

    return (
        <div className="athlete-dashboard">
            <div className="dashboard-header">
                <div className="user-welcome">
                    <div className="avatar">
                        <User size={24} />
                    </div>
                    <div>
                        <h1>Hola, Atleta</h1>
                        <p>Vamos a entrenar</p>
                    </div>
                </div>
                <Button variant="ghost" onClick={onExit}>Salir</Button>
            </div>

            <div className="section">
                <div className="section-header">
                    <h2>Mis Planes</h2>
                    <div className="header-actions">
                        <Button variant="secondary" size="sm" leftIcon={<Calendar size={16} />} onClick={() => setView('appointments')}>
                            Citas
                        </Button>
                        <Button variant="secondary" size="sm" leftIcon={<Dumbbell size={16} />} onClick={() => setView('gym-booking')}>
                            Reservar Gym
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<Plus size={16} />} onClick={() => setView('intake')}>
                            Nuevo
                        </Button>
                    </div>
                </div>

                {myPlans.length === 0 ? (
                    <Card className="empty-plans">
                        <p>No tienes planes activos.</p>
                        <Button variant="primary" onClick={() => setView('intake')}>
                            Solicitar mi primer plan
                        </Button>
                    </Card>
                ) : (
                    <div className="plans-grid">
                        {myPlans.map(client => (
                            <PlanCard
                                key={client.id}
                                plan={{
                                    ...client.planObject,
                                    name: `Plan para ${client.objective}`,
                                    objective: client.objective,
                                    duration: '4 semanas', // Mock
                                    progress: 0, // Mock
                                    status: 'active'
                                }}
                                onClick={() => handlePlanClick(client)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        .athlete-dashboard {
            padding-bottom: 80px; /* Space for bottom nav */
        }
        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
        }
        .user-welcome {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--color-primary-gradient);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .user-welcome h1 {
            margin: 0;
            font-size: 1.2rem;
            font-weight: 700;
        }
        .user-welcome p {
            margin: 0;
            color: var(--color-text-muted);
            font-size: 0.9rem;
        }
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        .plans-grid {
            display: grid;
            gap: 1rem;
        }
        .empty-plans {
            text-align: center;
            padding: 3rem 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            color: var(--color-text-muted);
        }
      `}</style>
        </div>
    );
};

export default AthleteDashboard;
