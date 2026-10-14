/**
 * useAdminStats - métricas agregadas del panel Admin.
 *
 * Lo usa: AdminDashboard (resultado pasado a Overview/Analytics).
 * Lee: usuarios (vía useUsers) y los datos recibidos por parámetro.
 * No escribe en localStorage ni emite eventos.
 */
import { useMemo } from "react";
import { ROLES } from "../../utils/auth";
import { useUsers } from "./useUsers";
import { isMaintenanceOverdue } from "./useEquipment";

/**
 * Hook para calcular estadísticas del panel de administración.
 * Los usuarios son reactivos: cualquier alta/baja/cambio de plan actualiza el
 * panel.
 *
 * @param params.clients Clientes (planes de atletas) de MockDatabase.
 * @param params.activePlans Planes con estado ACTIVE.
 * @param params.completedPlans Planes con estado COMPLETED.
 * @param params.equipment Equipamiento del gimnasio (useEquipment).
 * @returns `{ users, plans, equipment, clients }` con conteos.
 */
export const useAdminStats = ({
  clients,
  activePlans,
  completedPlans,
  equipment,
}) => {
  const { users: allUsers } = useUsers();

  const stats = useMemo(() => {
    const trainers = allUsers.filter((u) => u.role === ROLES.TRAINER);
    const athletes = allUsers.filter((u) => u.role === ROLES.ATHLETE);
    const admins = allUsers.filter((u) => u.role === ROLES.ADMIN);
    // Prueba activa = estado TRIAL y sin fecha de fin o con fecha futura
    // (las vencidas las marca expireTrials, pero puede haber desfase).
    const activeTrials = allUsers.filter(
      (u) =>
        u.subscription?.status === "TRIAL" &&
        (!u.subscription.trialEndsAt ||
          new Date(u.subscription.trialEndsAt).getTime() > Date.now()),
    ).length;

    const count = (status: string) =>
      equipment?.filter((e) => e.status === status).length || 0;

    return {
      users: {
        trainers: trainers.length,
        athletes: athletes.length,
        admins: admins.length,
        total: allUsers.length,
        activeTrials,
      },
      plans: {
        active: activePlans?.length || 0,
        completed: completedPlans?.length || 0,
        total: (activePlans?.length || 0) + (completedPlans?.length || 0),
      },
      equipment: {
        available: count("Disponible"),
        maintenance: count("Mantenimiento"),
        outOfService: count("Fuera de servicio"),
        overdue: equipment?.filter(isMaintenanceOverdue).length || 0,
        total: equipment?.length || 0,
      },
      clients: clients?.length || 0,
    };
  }, [allUsers, clients, activePlans, completedPlans, equipment]);

  return stats;
};
