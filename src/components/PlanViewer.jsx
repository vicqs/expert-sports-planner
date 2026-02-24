import React from 'react';
import { Copy, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from './ui';

const PlanViewer = ({ planText, onReset }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(planText);
    alert('Plan copiado al portapapeles');
  };

  return (
    <div className="plan-viewer">
      <div className="toolbar">
        <Button variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={onReset}>
          Volver
        </Button>
        <div className="actions">
          <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={onReset}>
            Regenerar
          </Button>
          <Button variant="primary" leftIcon={<Copy size={16} />} onClick={handleCopy}>
            Copiar Texto
          </Button>
        </div>
      </div>

      <div className="output-container">
        <pre>{planText}</pre>
      </div>

      <style>{`
        .plan-viewer {
          animation: fadeIn 0.5s ease;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .actions {
          display: flex;
          gap: 1rem;
        }
        .btn-secondary {
          background: transparent;
          border: 1px solid var(--color-border);
          color: var(--color-text);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: var(--color-surface-hover);
        }
        .output-container {
          background: #1e1e1e; /* Darker background for code */
          padding: 2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          overflow-x: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        pre {
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PlanViewer;
