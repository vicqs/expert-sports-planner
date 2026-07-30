import { useMemo } from "react";
import { getAllUsers } from "../../utils/auth";
import { ROLES } from "../../utils/auth";

/**
 * Hook para calcular estadísticas del panel de administración
 */
export const useAdminStats = ({
  clients,
  activePlans,
  completedPlans,
  equipment,
}) => {
  const allUsers = getAllUsers();

  const stats = useMemo(() => {
    const trainers = allUsers.filter((u) => u.role === ROLES.TRAINER);
    const athletes = allUsers.filter((u) => u.role === ROLES.ATHLETE);
    const admins = allUsers.filter((u) => u.role === ROLES.ADMIN);

    const equipmentAvailable =
      equipment?.filter((e) => e.status === "Disponible").length || 0;
    const equipmentMaintenance =
      equipment?.filter((e) => e.status === "Mantenimiento").length || 0;

    return {
      users: {
        trainers: trainers.length,
        athletes: athletes.length,
        admins: admins.length,
        total: allUsers.length,
      },
      plans: {
        active: activePlans?.length || 0,
        completed: completedPlans?.length || 0,
        total: (activePlans?.length || 0) + (completedPlans?.length || 0),
      },
      equipment: {
        available: equipmentAvailable,
        maintenance: equipmentMaintenance,
        total: equipment?.length || 0,
      },
      clients: clients?.length || 0,
    };
  }, [allUsers, clients, activePlans, completedPlans, equipment]);

  return stats;
};
