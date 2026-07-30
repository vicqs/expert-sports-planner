import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMockDatabase } from "@/context/MockDatabase";
import { getAllUsers } from "@/utils/auth";
import { Button } from "@/components/ui";
import { Shield, Settings } from "lucide-react";
import { useAdminStats, useEquipment } from "@/admin/hooks";
import Overview from "@/admin/components/Overview";
import UserManagement from "@/admin/components/UserManagement";
import ExerciseDatabase from "@/admin/components/ExerciseDatabase";
import EquipmentManager from "@/admin/components/EquipmentManager";
import Analytics from "@/admin/components/Analytics";
import AdminSidebar from "@/admin/components/AdminSidebar";
import "@/admin/styles/dashboard.css";
import "@/admin/styles/responsive-utils.css";
import "@/admin/styles/breakpoint-fixes.css";
import "@/admin/styles/mobile-devices.css";

const AdminDashboard = ({ onExit }) => {
  const { currentUser } = useAuth();
  const {
    clients,
    getActivePlans,
    getCompletedPlans,
    gymBookings,
    appointments,
  } = useMockDatabase();
  const [view, setView] = useState("overview");
  const { equipment } = useEquipment();

  const allUsers = getAllUsers();
  const activePlans = getActivePlans();
  const completedPlans = getCompletedPlans();

  // Usar el hook de estadísticas
  const stats = useAdminStats({
    clients,
    activePlans,
    completedPlans,
    equipment,
  });

  // Agregar datos adicionales al objeto de stats
  const enhancedStats = {
    ...stats,
    users: {
      ...stats.users,
      activeTrials: allUsers.filter((u) => u.subscription?.status === "TRIAL")
        .length,
    },
    bookings: {
      gym: gymBookings?.length || 0,
      appointments: appointments?.length || 0,
    },
  };

  const renderView = () => {
    switch (view) {
      case "overview":
        return <Overview stats={enhancedStats} />;
      case "users":
        return <UserManagement />;
      case "exercises":
        return <ExerciseDatabase />;
      case "equipment":
        return <EquipmentManager />;
      case "analytics":
        return <Analytics stats={enhancedStats} />;
      case "settings":
        return (
          <div className="settings-placeholder">
            <Settings size={48} />
            <h2>Configuración del Sistema</h2>
            <p>Opciones de configuración disponibles próximamente</p>
          </div>
        );
      default:
        return <Overview stats={enhancedStats} />;
    }
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab={view} onTabChange={setView} />

      <div className="admin-main">
        <div className="admin-header">
          <div className="admin-title">
            <Shield size={32} />
            <div>
              <h1>Panel de Administración CRM</h1>
              <p>
                Bienvenido, {currentUser.name} • Sistema de Gestión Integral
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={onExit}>
            Cerrar Sesión
          </Button>
        </div>

        <div className="admin-content">{renderView()}</div>
      </div>
    </div>
  );
};

export default AdminDashboard;
