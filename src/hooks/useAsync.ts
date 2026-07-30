import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for handling async operations
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount
 * @returns {Object} Async state and execution function
 */
export const useAsync = (
  asyncFunction: (...args: any[]) => Promise<any>,
  immediate = false,
) => {
  const [status, setStatus] = useState("idle"); // 'idle' | 'pending' | 'success' | 'error'
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);

  // The execute function wraps asyncFunction and handles settings state
  const execute = useCallback(
    async (...params: any[]) => {
      setStatus("pending");
      setData(null);
      setError(null);

      try {
        const response = await asyncFunction(...params);
        setData(response);
        setStatus("success");
        return response;
      } catch (err) {
        setError(err);
        setStatus("error");
        throw err;
      }
    },
    [asyncFunction],
  );

  // Call execute if we want to fire it right away
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    isIdle: status === "idle",
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
  };
};

export default useAsync;
