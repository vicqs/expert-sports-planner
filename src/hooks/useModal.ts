import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal state
 *
 * @returns {Object} Modal state and handlers
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

/**
 * Custom hook for confirmation dialogs
 *
 * @param {Function} onConfirm - Function to execute on confirmation
 * @returns {Object} Confirmation dialog state and handlers
 */
export const useConfirm = (onConfirm) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const confirm = useCallback((action) => {
    setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      if (pendingAction) {
        await pendingAction();
      }
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      setPendingAction(null);
    }
  }, [pendingAction, onConfirm]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return {
    isOpen,
    isLoading,
    confirm,
    handleConfirm,
    handleCancel,
  };
};

export default useModal;
