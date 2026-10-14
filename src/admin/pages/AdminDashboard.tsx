/**
 * AdminDashboard - página raíz del panel de administración (CRM).
 *
 * Responsabilidad: layout (sidebar + cabecera + contenido), navegación entre
 * vistas por estado local y cálculo de estadísticas globales.
 * Lo usa: App.tsx cuando el usuario autenticado tiene rol ADMIN.
 * Lee: AuthContext (admin actual), MockDatabase (clients, planes, reservas y
 * citas) y localStorage["crm_equipment"] vía useEquipment.
 * No escribe datos directamente; aplica el tema guardado con useTheme.
 */
import React, { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useMockDatabase } from "@/context/MockDatabase";
import { Button, useToast } from "@/components/ui";
import { Shield } from "lucide-react";
import { useAdminStats, useEquipment } from "@/admin/hooks";
import Overview from "@/admin/components/Overview";
import ViewErrorBoundary from "@/admin/components/ViewErrorBoundary";
import { useIdleTimeout } from "@/admin/hooks/useIdleTimeout";

// Vistas pesadas (catálogo, tablas) se cargan bajo demanda
const UserManagement = lazy(() => import("@/admin/components/UserManagement"));
const ExerciseDatabase = lazy(
  () => import("@/admin/components/ExerciseDatabase"),
);
const EquipmentManager = lazy(
  () => import("@/admin/components/EquipmentManager"),
);
const Analytics = lazy(() => import("@/admin/components/Analytics"));
const SystemSettings = lazy(() => import("@/admin/components/SystemSettings"));
import { useTheme } from "@/hooks/useTheme";
import AdminSidebar from "@/admin/components/AdminSidebar";
import AdminGlobalSearch from "@/admin/components/AdminGlobalSearch";
import { AUDIT_ERROR_EVENT, logAdminAction } from "@/admin/utils/auditLog";
import "@/admin/styles/dashboard.css";
import "@/admin/styles/responsive.css";

/**
 * Contenedor principal del rol Admin.
 *
 * @param props.onExit Callback para cerrar la sesión del administrador
 *   (botón "Cerrar Sesión" de la cabecera).
 */
const AdminDashboard = ({ onExit }) => {
  // Aplica el tema guardado desde el primer render del panel (antes solo se
  // aplicaba al abrir Configuración, lo que provocaba el salto claro/oscuro).
  useTheme();
  const { currentUser } = useAuth();
  const {
    clients,
    getActivePlans,
    getCompletedPlans,
    gymBookings,
    appointments,
  } = useMockDatabase();
  const [view, setView] = useState("overview");
  // Cambia al navegar desde la búsqueda global para remontar la vista (aunque
  // ya sea la activa) y que lea el término precargado.
  const [searchNonce, setSearchNonce] = useState(0);
  const { equipment } = useEquipment();
  const { addToast } = useToast();

  // Avisa si la bitácora no pudo guardarse (p. ej. almacenamiento lleno)
  useEffect(() => {
    const onAuditError = () =>
      addToast(
        "No se pudo guardar la acción en la bitácora (almacenamiento lleno)",
        "error",
      );
    window.addEventListener(AUDIT_ERROR_EVENT, onAuditError);
    return () => window.removeEventListener(AUDIT_ERROR_EVENT, onAuditError);
  }, [addToast]);

  // Cierre por inactividad: aviso 1 min antes y cierre de sesión
  useIdleTimeout(
    () =>
      addToast("Tu sesión se cerrará en 1 minuto por inactividad", "warning"),
    () => {
      logAdminAction(
        currentUser?.id as string,
        "Sesión cerrada por inactividad",
      );
      onExit();
    },
  );

  // Título de cabecera por vista (clave = id usado en AdminSidebar)
  const viewTitles: Record<string, string> = {
    overview: "Panel General",
    users: "Gestión de Usuarios",
    exercises: "Base de Datos de Ejercicios",
    equipment: "Gestión de Equipamiento",
    analytics: "Análisis y Estadísticas",
    settings: "Configuración",
  };

  const activePlans = getActivePlans();
  const completedPlans = getCompletedPlans();

  // Usar el hook de estadísticas
  const stats = useAdminStats({
    clients,
    activePlans,
    completedPlans,
    equipment,
  });

  // Agregar datos adicionales al objeto de stats (reservas y citas vienen
  // de MockDatabase, no de useAdminStats)
  const enhancedStats = {
    ...stats,
    bookings: {
      gym: gymBookings?.length || 0,
      appointments: appointments?.length || 0,
    },
  };

  /** Devuelve el componente de la vista activa (`view`). */
  const renderView = () => {
    switch (view) {
      case "overview":
        return <Overview stats={enhancedStats} onNavigate={setView} />;
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <AdminGlobalSearch
              onNavigate={(v) => {
                setView(v);
                setSearchNonce((n) => n + 1);
              }}
            />
            <Button variant="secondary" onClick={onExit}>
              Cerrar Sesión
            </Button>
          </div>
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
              <ViewErrorBoundary key={`${view}-${searchNonce}`}>
                <Suspense fallback={<p role="status">Cargando...</p>}>
                  {renderView()}
                </Suspense>
              </ViewErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
