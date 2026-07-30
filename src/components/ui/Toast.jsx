import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
      <style>{`
        .toast-container {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          z-index: 100;
          pointer-events: none; /* Allow clicking through container */
        }
      `}</style>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  const icons = {
    success: <CheckCircle size={20} className="text-success" />,
    error: <AlertCircle size={20} className="text-error" />,
    info: <Info size={20} className="text-primary" />,
  };

  const bgColors = {
    success: "var(--color-success-bg)",
    error: "var(--color-error-bg)",
    info: "var(--color-surface)",
  };

  const borderColors = {
    success: "var(--color-success)",
    error: "var(--color-error)",
    info: "var(--color-border)",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="toast-item"
      style={{
        background: bgColors[toast.type] || bgColors.info,
        borderColor: borderColors[toast.type] || borderColors.info,
      }}
    >
      <div className="toast-icon">{icons[toast.type] || icons.info}</div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button className="toast-close" onClick={() => onRemove(toast.id)}>
        <X size={16} />
      </button>
      <style>{`
        .toast-item {
          pointer-events: auto;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          box-shadow: var(--shadow-lg);
          min-width: 300px;
          max-width: 400px;
          background: var(--color-surface); /* Fallback */
        }
        .text-success { color: var(--color-success); }
        .text-error { color: var(--color-error); }
        .text-primary { color: var(--color-primary); }
        
        .toast-content {
          flex: 1;
        }
        .toast-message {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--color-text);
          margin: 0;
        }
        .toast-close {
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s;
        }
        .toast-close:hover {
          background: rgba(0,0,0,0.05);
          color: var(--color-text);
        }
      `}</style>
    </motion.div>
  );
};
