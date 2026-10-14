/**
 * useUsers - lista reactiva de usuarios para el panel Admin.
 *
 * Lo usan: useAdminStats y UserManagement.
 * Lee: localStorage["users"] (vía getAllUsers).
 * Escucha: USERS_CHANGED_EVENT (misma pestaña) y "storage" (otras pestañas).
 */
import { useState, useEffect, useCallback } from "react";
import { getAllUsers, USERS_CHANGED_EVENT } from "@/utils/auth";
import type { User } from "@/types";

/**
 * Lista reactiva de usuarios: se refresca cuando cualquier parte de la app
 * guarda usuarios (evento interno) o cuando otra pestaña modifica `users`.
 *
 * @returns `users` (lista actual) y `refresh()` para forzar relectura.
 */
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>(() => getAllUsers());

  const refresh = useCallback(() => setUsers(getAllUsers()), []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      // key === null ocurre cuando se ejecuta localStorage.clear()
      if (e.key === "users" || e.key === null) refresh();
    };
    window.addEventListener(USERS_CHANGED_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(USERS_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  return { users, refresh };
};
