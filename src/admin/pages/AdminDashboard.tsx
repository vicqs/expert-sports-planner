import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMockDatabase } from "@/context/MockDatabase";
import { getAllUsers } from "@/utils/auth";
import { Button } from "@/components/ui";
import { Shield } from "lucide-react";
import { useAdminStats, useEquipment } from "@/admin/hooks";
import Overview from "@/admin/components/Overview";
import UserManagement from "@/admin/components/UserManagement";
import ExerciseDatabase from "@/admin/components/ExerciseDatabase";
import EquipmentManager from "@/admin/components/EquipmentManager";
import Analytics from "@/admin/components/Analytics";
import AdminSidebar from "@/admin/components/AdminSidebar";
import SystemSettings from "@/admin/components/SystemSettings";
import "@/admin/styles/dashboard.css";
import "@/admin/styles/responsive.css";

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

  const viewTitles: Record<string, string> = {
    overview: "Panel General",
    users: "Gestión de Usuarios",
    exercises: "Base de Datos de Ejercicios",
    equipment: "Gestión de Equipamiento",
    analytics: "Análisis y Estadísticas",
    settings: "Configuración",
  };

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
        return <SystemSettings />;
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
              <h1>{viewTitles[view] || "Panel de Administración CRM"}</h1>
              <p>
                Bienvenido, {currentUser.name} • Sistema de Gestión Integral
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={onExit}>
            Cerrar Sesión
          </Button>
        </div>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
