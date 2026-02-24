import React from "react";
import { Copy, RefreshCw, ArrowLeft } from "lucide-react";
import { Button, useToast } from "./ui";

const PlanViewer = ({ planText, onReset }) => {
  const { addToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(planText);
    addToast("Plan copiado al portapapeles", "success");
  };

  return (
    <div className="plan-viewer">
      <div className="toolbar">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onReset}
        >
          Volver
        </Button>
        <div className="actions">
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={16} />}
            onClick={onReset}
          >
            Regenerar
          </Button>
          <Button
            variant="primary"
            leftIcon={<Copy size={16} />}
            onClick={handleCopy}
          >
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
          background: var(--color-surface);
          padding: 2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          overflow-x: auto;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        pre {
          color: var(--color-text);
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
          margin: 0;
        }
        
        /* Modo claro: fondo blanco, texto negro */
        [data-theme="light"] .output-container {
          background: white;
        }
        [data-theme="light"] pre {
          color: #1a1a1a;
        }
        
        /* Modo oscuro: fondo oscuro suave, texto claro */
        [data-theme="dark"] .output-container {
          background: #1e1e1e;
        }
        [data-theme="dark"] pre {
          color: #e5e5e5;
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
