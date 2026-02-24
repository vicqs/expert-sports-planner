import React from "react";
import TopBar from "./TopBar";

const Layout = ({ children, onExit, userRole }) => {
  return (
    <div className="layout">
      {onExit && <TopBar onExit={onExit} userRole={userRole} />}

      <main className="main-content">{children}</main>

      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-bg-primary);
        }
        
        .main-content {
          flex: 1;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .main-content {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .main-content {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
