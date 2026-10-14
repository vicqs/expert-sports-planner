/**
 * UndoBar - aviso temporal con acción "Deshacer" tras una eliminación.
 *
 * Responsabilidad: mostrar un mensaje y llamar a `onUndo` si el admin pulsa
 * el botón antes de que expire (`seconds`); luego se descarta solo.
 * Lo usan: EquipmentManager y ExerciseDatabase. No persiste nada.
 */
import React, { useEffect, useRef } from "react";
import { Undo2 } from "lucide-react";

interface UndoBarProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  seconds?: number;
}

const UndoBar = ({ message, onUndo, onDismiss, seconds = 8 }: UndoBarProps) => {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), seconds * 1000);
    return () => clearTimeout(t);
  }, [message, seconds]);

  return (
    <div
      className="admin-undo-bar"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "50%",
        bottom: "1.25rem",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.75rem",
        borderRadius: 8,
        background: "var(--color-surface, #1f2937)",
        color: "var(--color-text, #fff)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <span>{message}</span>
      <button
        type="button"
        className="admin-btn tap-ripple"
        onClick={onUndo}
        style={{ minHeight: 44 }}
      >
        <Undo2 size={16} /> Deshacer
      </button>
    </div>
  );
};

export default UndoBar;
