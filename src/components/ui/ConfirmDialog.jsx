import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

/**
 * Confirmation Dialog Component
 *
 * Modern replacement for window.confirm()
 * UX Best Practices 2026:
 * - Clear visual hierarchy
 * - Explicit action buttons
 * - Icon for context
 * - Non-blocking
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "warning", // warning, danger, info, success
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <XCircle size={48} color="var(--color-error)" />;
      case "success":
        return <CheckCircle size={48} color="var(--color-success)" />;
      case "info":
        return <Info size={48} color="var(--color-primary)" />;
      case "warning":
      default:
        return <AlertTriangle size={48} color="var(--color-warning)" />;
    }
  };

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : "primary"}
        onClick={handleConfirm}
        disabled={isLoading}
      >
        {isLoading ? "Procesando..." : confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      variant={variant}
      size="sm"
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem 0",
        }}
      >
        {getIcon()}
        <p
          style={{
            margin: 0,
            textAlign: "center",
            color: "var(--color-text-primary)",
            fontSize: "1rem",
            lineHeight: "1.5",
          }}
        >
          {message}
        </p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
