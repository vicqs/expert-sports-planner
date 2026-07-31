import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext<any>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<any[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type = "info", duration = 3000) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type, duration }]);

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
        @media (max-width: 640px) {
          .toast-container {
            bottom: calc(var(--space-4, 1rem) + env(safe-area-inset-bottom, 0px));
            right: var(--space-4, 1rem);
            left: var(--space-4, 1rem);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: any;
  onRemove: (id: string) => void;
}) => {
  const icons: Record<string, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  const accentColors: Record<string, string> = {
    success: "var(--color-success)",
    error: "var(--color-error)",
    warning: "var(--color-warning)",
    info: "var(--color-primary)",
  };

  const accent = accentColors[toast.type] || accentColors.info;
  const duration = toast.duration ?? 3000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="toast-item"
      style={{ ["--toast-accent" as any]: accent }}
    >
      <div className="toast-icon" style={{ color: accent }}>
        {icons[toast.type] || icons.info}
      </div>
      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
      </div>
      <button
        className="toast-close tap-ripple"
        onClick={() => onRemove(toast.id)}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
      {duration > 0 && (
        <motion.div
          className="toast-progress"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
        />
      )}
      <style>{`
        .toast-item {
          pointer-events: auto;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0.9rem 1rem;
          border-radius: var(--radius-lg, 14px);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow-lg), 0 0 0 1px rgba(0, 0, 0, 0.02);
          min-width: 320px;
          max-width: 400px;
          background: var(--color-surface);
          background-image: linear-gradient(
            135deg,
            color-mix(in srgb, var(--toast-accent) 8%, var(--color-surface)) 0%,
            var(--color-surface) 60%
          );
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        @media (max-width: 640px) {
          .toast-item {
            min-width: 0;
            max-width: none;
            width: 100%;
          }
        }
        .toast-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full, 999px);
          background: color-mix(in srgb, var(--toast-accent) 16%, transparent);
        }
        .toast-content {
          flex: 1;
          padding-top: 0.15rem;
        }
        .toast-message {
          font-size: 0.9rem;
          font-weight: 500;
          line-height: 1.4;
          color: var(--color-text);
          margin: 0;
        }
        .toast-close {
          flex-shrink: 0;
          background: transparent;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.2s, color 0.2s;
        }
        .toast-close:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }
        .toast-progress {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 3px;
          width: 100%;
          background: var(--toast-accent);
          transform-origin: left center;
          opacity: 0.6;
        }
      `}</style>
    </motion.div>
  );
};
