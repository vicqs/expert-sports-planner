import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import IntakeForm from './components/IntakeForm';
import RoleSelector from './components/RoleSelector';
import CoachDashboard from './components/CoachDashboard';
import AthleteDashboard from './components/AthleteDashboard';
import BottomNav from './components/ui/BottomNav';
import { MockDatabaseProvider, useMockDatabase } from './context/MockDatabase';
import { ToastProvider } from './components/ui/Toast';

function AppContent() {
    const [role, setRole] = useState(null); // 'athlete', 'coach', or null
    const [activeTab, setActiveTab] = useState('entrenamientos');
    const { addClientRequest } = useMockDatabase();

    // Add class to body for bottom nav padding
    useEffect(() => {
        if (role) {
            document.body.classList.add('has-bottom-nav');
        } else {
            document.body.classList.remove('has-bottom-nav');
        }
        return () => document.body.classList.remove('has-bottom-nav');
    }, [role]);

    const handleAthleteSubmit = (data) => {
        return addClientRequest(data);
        // IntakeForm handles the success view internally
    };

    const renderContent = () => {
        if (!role) {
            return <RoleSelector onSelect={setRole} />;
        }

        if (role === 'athlete') {
            return (
                <AthleteDashboard onExit={() => setRole(null)} />
            );
        }

        if (role === 'coach') {
            // Different views based on active tab
            switch (activeTab) {
                case 'entrenamientos':
                    return <CoachDashboard onExit={() => setRole(null)} />;
                case 'explorar':
                    return <div className="container" style={{ padding: '2rem' }}>
                        <h2>Explorar</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Biblioteca de planes y ejercicios</p>
                    </div>;
                case 'progreso':
                    return <div className="container" style={{ padding: '2rem' }}>
                        <h2>Progreso</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Estadísticas y análisis</p>
                    </div>;
                case 'perfil':
                    return <div className="container" style={{ padding: '2rem' }}>
                        <h2>Perfil</h2>
                        <p style={{ color: 'var(--color-text-muted)' }}>Configuración y datos del usuario</p>
                    </div>;
                default:
                    return <CoachDashboard onExit={() => setRole(null)} />;
            }
        }
    };

    return (
        <Layout>
            <div className="animate-fade-in">
                {renderContent()}
            </div>
            {role && <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />}
        </Layout>
    );
}

function App() {
    return (
        <MockDatabaseProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </MockDatabaseProvider>
    );
}

export default App;
