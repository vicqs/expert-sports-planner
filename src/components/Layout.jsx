import React from 'react';
import { Activity, Dumbbell } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <header className="header">
                <div className="logo">
                    <Activity className="icon" />
                    <span>ExpertPlanner</span>
                </div>
                <nav>
                    <span className="badge">v2.0 Beta</span>
                </nav>
            </header>
            <main className="main-content">
                {children}
            </main>
            <footer className="footer">
                <p>© 2025 Expert Sports Planning System</p>
            </footer>

            <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--color-primary);
        }
        .badge {
          background: var(--color-surface-hover);
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
          width: 100%;
        }
        .footer {
          text-align: center;
          padding: 2rem;
          color: var(--color-text-muted);
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
};

export default Layout;
