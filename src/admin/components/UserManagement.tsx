/**
 * UserManagement - gestión de usuarios (vista Admin).
 *
 * Responsabilidad: tabla con búsqueda, filtros por rol/plan, orden,
 * paginación, detalle en modal, cambio de plan, extensión de trial y
 * eliminación en cascada.
 * Lo usa: AdminDashboard (vista "users").
 * Datos: useUsers (localStorage "users"); las mutaciones pasan por
 * adminDeleteUser/adminChangePlan/adminExtendTrial (utils/auth.ts), que
 * verifican que el actor sea admin. La cascada de datos huérfanos (planes,
 * solicitudes, reservas, citas) la hace purgeUserData de MockDatabase.
 * Efectos: toasts y registro en la bitácora (logAdminAction).
 */
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Download,
} from "lucide-react";
import {
  adminDeleteUser,
  adminRestoreUser,
  adminChangePlan,
  adminExtendTrial,
  adminSetSuspended,
  adminResetUserPassword,
  adminUpdateUser,
  adminCreateUser,
  ROLES,
  SUBSCRIPTION_PLANS,
} from "@/utils/auth";
import { ConfirmDialog, Modal, useToast } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useMockDatabase } from "@/context/MockDatabase";
import { useUsers } from "@/admin/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { buildCsv, downloadCsv } from "@/admin/utils/csv";
import { logAdminAction } from "@/admin/utils/auditLog";
import { consumeSearchPrefill } from "@/admin/utils/searchPrefill";
import type { User, SubscriptionPlan } from "@/types";
import "@/admin/styles/users.css";
import "@/admin/styles/admin-extras.css";

/** Filas por página de la tabla. */
const PAGE_SIZE = 10;

/** Columnas ordenables. */
type SortKey = "name" | "createdAt" | "plan";

/**
 * Días restantes del trial si vence en 7 días o menos (0 incluido); en
 * cualquier otro caso (sin trial, ya vencido o lejano) devuelve null.
 * Se usa para mostrar el aviso "N d" junto al estado.
 */
const trialDaysLeft = (user: User): number | null => {
  if (user.subscription?.status !== "TRIAL" || !user.subscription?.trialEndsAt)
    return null;
  const days = Math.ceil(
    (new Date(user.subscription.trialEndsAt).getTime() - Date.now()) / 86400000,
  );
  return days >= 0 && days <= 7 ? days : null;
};

/** Normaliza para buscar sin distinguir mayúsculas ni tildes. */
const fold = (s: string) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Vista de usuarios del administrador. No recibe props. */
const UserManagement = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPlan, setBulkPlan] = useState<string>(SUBSCRIPTION_PLANS.BASIC);
  const [bulkTrialDays, setBulkTrialDays] = useState(7);
  const [searchTerm, setSearchTerm] = useState(() =>
    consumeSearchPrefill("users"),
  );
  const debouncedSearch = useDebounce(searchTerm, 250);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkConfirmText, setBulkConfirmText] = useState("");
  // Se guarda el id (no el objeto) para que el modal refleje cambios de plan
  // o trial en vivo cuando useUsers se refresca.
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(7);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: ROLES.TRAINER as User["role"],
  });
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const { users: allUsers } = useUsers();
  const { currentUser } = useAuth();
  const { countUserData, purgeUserData } = useMockDatabase();
  const { addToast } = useToast();

  // Id del admin que ejecuta las acciones (guarda de seguridad y auditoría)
  const actorId = currentUser?.id as string;
  const viewingUser = allUsers.find((u) => u.id === viewingUserId) || null;
  const viewingData = viewingUser ? countUserData(viewingUser) : null;

  // Filtra por rol, plan (sin suscripción = FREE) y texto (nombre o email);
  // luego ordena según la columna activa.
  const filteredUsers = useMemo(() => {
    const term = fold(debouncedSearch.trim());
    const list = allUsers.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (
        planFilter !== "ALL" &&
        (user.subscription?.plan || "FREE") !== planFilter
      )
        return false;
      if (!term) return true;
      return (
        fold(user.name ?? "").includes(term) ||
        fold(user.email ?? "").includes(term)
      );
    });
    const dir = sortDir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortKey === "name")
        return dir * (a.name ?? "").localeCompare(b.name ?? "");
      if (sortKey === "plan")
        return (
          dir *
          (a.subscription?.plan || "FREE").localeCompare(
            b.subscription?.plan || "FREE",
          )
        );
      return (
        dir *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    });
  }, [allUsers, debouncedSearch, roleFilter, planFilter, sortKey, sortDir]);

  // Paginación en cliente. currentPage se acota a totalPages para no quedar en
  // una página inexistente si la lista se reduce (p. ej. tras eliminar).
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Volver a la primera página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, planFilter, sortKey, sortDir]);

  // Al abrir otro usuario, precargar el formulario de edición y ocultar la
  // clave temporal anterior.
  useEffect(() => {
    setEditName(viewingUser?.name ?? "");
    setEditEmail(viewingUser?.email ?? "");
    setTempPassword(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingUserId]);

  /** Corrige nombre y email del usuario abierto. */
  const handleSaveProfile = () => {
    if (!viewingUser) return;
    try {
      adminUpdateUser(actorId, viewingUser.id, {
        name: editName,
        email: editEmail.trim() || null,
      });
      logAdminAction(actorId, "Usuario editado", viewingUser.name);
      addToast("Datos del usuario actualizados", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  };

  /** Suspende o reactiva la cuenta abierta. */
  const handleToggleSuspended = () => {
    if (!viewingUser) return;
    const next = !viewingUser.suspended;
    try {
      adminSetSuspended(actorId, viewingUser.id, next);
      logAdminAction(
        actorId,
        next ? "Cuenta suspendida" : "Cuenta reactivada",
        viewingUser.name,
      );
      addToast(next ? "Cuenta suspendida" : "Cuenta reactivada", "success");
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  };

  /** Crea la cuenta y muestra las credenciales una sola vez. */
  /** Copia texto al portapapeles y avisa del resultado. */
  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("Copiado al portapapeles", "success");
    } catch {
      addToast("No se pudo copiar; selecciónalo manualmente", "error");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { user, tempPassword: pwd } = await adminCreateUser(
        actorId,
        newUser,
      );
      logAdminAction(actorId, "Usuario creado", `${user.name} (${user.role})`);
      setCreatedCreds({ email: user.email ?? "", password: pwd });
      setNewUser({ name: "", email: "", role: ROLES.TRAINER });
      addToast(`Usuario "${user.name}" creado`, "success");
    } catch (err) {
      addToast((err as Error).message, "error");
    }
  };

  /** Genera una clave temporal y la muestra una sola vez en el modal. */
  const handleResetPassword = async () => {
    if (!viewingUser) return;
    try {
      const temp = await adminResetUserPassword(actorId, viewingUser.id);
      setTempPassword(temp);
      logAdminAction(actorId, "Clave temporal generada", viewingUser.name);
    } catch (e) {
      addToast((e as Error).message, "error");
    }
  };

  // Solo se pueden seleccionar para acciones en lote entrenadores y atletas
  // (nunca administradores, super admin ni el propio actor).
  const isSelectable = (u: User) =>
    !u.isSuper && u.role !== ROLES.ADMIN && u.id !== actorId;
  const selectablePageIds = pageUsers.filter(isSelectable).map((u) => u.id);
  const allPageSelected =
    selectablePageIds.length > 0 &&
    selectablePageIds.every((id) => selectedIds.has(id));
  // Descarta ids que ya no existen (p. ej. usuario eliminado)
  const validSelected = allUsers.filter(
    (u) => selectedIds.has(u.id) && isSelectable(u),
  );

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePageSelection = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      selectablePageIds.forEach((id) =>
        allPageSelected ? next.delete(id) : next.add(id),
      );
      return next;
    });

  /** Ejecuta una acción sobre cada seleccionado y resume éxitos/fallos. */
  const runBulk = (
    label: string,
    action: (u: User) => void,
    detail: string,
  ) => {
    let ok = 0;
    let failed = 0;
    validSelected.forEach((u) => {
      try {
        action(u);
        ok++;
      } catch {
        failed++;
      }
    });
    logAdminAction(actorId, label, `${ok} usuario(s): ${detail}`);
    addToast(
      failed
        ? `${label}: ${ok} correctos, ${failed} con error`
        : `${label}: ${ok} usuario(s)`,
      failed ? "error" : "success",
    );
    setSelectedIds(new Set());
  };

  const handleBulkPlan = () =>
    runBulk(
      "Plan modificado (lote)",
      (u) => adminChangePlan(actorId, u.id, bulkPlan as SubscriptionPlan),
      `→ ${bulkPlan}`,
    );

  const handleBulkTrial = () =>
    runBulk(
      "Trial extendido (lote)",
      (u) => adminExtendTrial(actorId, u.id, bulkTrialDays),
      `+${bulkTrialDays} días`,
    );

  /** Exporta a CSV la selección (o, si no hay, la lista filtrada). */
  const handleExportCsv = () => {
    const rows = validSelected.length > 0 ? validSelected : filteredUsers;
    const header = ["Nombre", "Email", "Rol", "Plan", "Estado", "Registro"];
    downloadCsv(
      `usuarios-${new Date().toISOString().slice(0, 10)}.csv`,
      buildCsv(
        header,
        rows.map((u) => [
          u.name,
          u.email,
          u.role,
          u.subscription?.plan || "FREE",
          u.subscription?.status || "ACTIVE",
          u.createdAt,
        ]),
      ),
    );
    logAdminAction(
      actorId,
      "Usuarios exportados",
      `${rows.length} fila(s); ${
        validSelected.length > 0
          ? "selección manual"
          : `filtros: rol=${roleFilter}, plan=${planFilter}, texto="${searchTerm.trim()}"`
      }`,
    );
    addToast(`${rows.length} usuario(s) exportados`, "success");
    const noEmail = rows.filter((u) => !u.email).length;
    if (noEmail > 0) {
      addToast(`${noEmail} usuario(s) sin email en el archivo`, "warning");
    }
  };

  /**
   * Inicia el flujo de eliminación. El super administrador está protegido y
   * nunca llega al diálogo de confirmación.
   */
  const handleDeleteUser = (user) => {
    if (user.isSuper) {
      addToast("No puedes eliminar al super administrador", "error");
      return;
    }
    setUserToDelete(user);
  };

  // Conteo de datos asociados que se borrarán en cascada (se muestra en el
  // mensaje de confirmación)
  const orphanData = userToDelete ? countUserData(userToDelete) : null;
  const orphanTotal = orphanData
    ? Object.values(orphanData as Record<string, number>).reduce(
        (a, b) => a + b,
        0,
      )
    : 0;

  /**
   * Elimina al usuario confirmado: primero la cuenta (adminDeleteUser valida
   * el rol del actor y protege al super admin) y luego sus datos asociados
   * (purgeUserData). Registra auditoría y muestra toast.
   */
  /**
   * Elimina cuenta y datos asociados de forma atómica: si la purga falla se
   * restaura la cuenta (la purga ya revierte sus propios cambios).
   */
  const deleteUserAtomic = (user: User) => {
    const removed = adminDeleteUser(actorId, user.id);
    try {
      purgeUserData(user);
    } catch (err) {
      adminRestoreUser(actorId, removed);
      throw err;
    }
  };

  /** Frase que el admin debe escribir para confirmar el borrado en lote. */
  const bulkPhrase = `ELIMINAR ${validSelected.length}`;

  /** Elimina la selección (cada usuario de forma atómica) y audita el resultado. */
  const confirmBulkDelete = () => {
    if (bulkConfirmText.trim() !== bulkPhrase) return;
    let ok = 0;
    const failed: string[] = [];
    validSelected.forEach((u) => {
      try {
        deleteUserAtomic(u);
        ok++;
      } catch {
        failed.push(u.name);
      }
    });
    logAdminAction(
      actorId,
      "Usuarios eliminados (lote)",
      `${ok} eliminado(s)${failed.length ? `, ${failed.length} con error` : ""}`,
    );
    addToast(
      failed.length
        ? `Eliminados ${ok}; fallaron ${failed.length}`
        : `${ok} usuario(s) eliminados`,
      failed.length ? "error" : "success",
    );
    setSelectedIds(new Set());
    setBulkDeleteOpen(false);
    setBulkConfirmText("");
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    try {
      deleteUserAtomic(userToDelete);
      logAdminAction(
        actorId,
        "Usuario eliminado",
        `${userToDelete.name} (${userToDelete.email ?? userToDelete.id})`,
      );
      addToast(`Usuario "${userToDelete.name}" eliminado`, "success");
      if (viewingUserId === userToDelete.id) setViewingUserId(null);
      setUserToDelete(null);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "No se pudo eliminar el usuario",
        "error",
      );
      setUserToDelete(null);
    }
  };

  /**
   * Cambia el plan del usuario en detalle (adminChangePlan valida al actor).
   * @param plan Valor de SUBSCRIPTION_PLANS.
   */
  const handleChangePlan = (plan: string) => {
    if (!viewingUser) return;
    try {
      adminChangePlan(actorId, viewingUser.id, plan as SubscriptionPlan);
      logAdminAction(
        actorId,
        "Plan modificado",
        `${viewingUser.name}: ${viewingUser.subscription?.plan || "FREE"} → ${plan}`,
      );
      addToast(`Plan actualizado a ${plan}`, "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "No se pudo cambiar el plan",
        "error",
      );
    }
  };

  /** Extiende el trial del usuario en detalle `trialDays` días. */
  const handleExtendTrial = () => {
    if (!viewingUser) return;
    try {
      adminExtendTrial(actorId, viewingUser.id, trialDays);
      logAdminAction(
        actorId,
        "Trial extendido",
        `${viewingUser.name}: +${trialDays} días`,
      );
      addToast(`Trial extendido ${trialDays} días`, "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "No se pudo extender el trial",
        "error",
      );
    }
  };

  /**
   * Orden por columna: al repetir la misma alterna asc/desc; al cambiar de
   * columna, fecha empieza desc (más recientes) y el resto asc.
   */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "createdAt" ? "desc" : "asc");
    }
  };

  /** Flecha de dirección junto al encabezado de la columna activa. */
  const sortIndicator = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  /** Valor de aria-sort para el encabezado de la columna. */
  const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
    sortKey === key ? (sortDir === "asc" ? "ascending" : "descending") : "none";

  /** Etiqueta del rol para la insignia (la clase CSS usa el rol en minúsculas). */
  const roleLabel = (role: string) =>
    role === ROLES.ADMIN
      ? "ADMIN"
      : role === ROLES.TRAINER
        ? "TRAINER"
        : "ATHLETE";

  /**
   * Formatea una fecha ISO en es-ES; "—" si falta o es inválida.
   * @param long Si es true usa el mes completo (detalle del usuario).
   */
  const formatDate = (value?: string | null, long = false) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: long ? "long" : "short",
      year: "numeric",
    });
  };

  // El super admin y otros administradores no tienen suscripción editable
  const canEditSubscription =
    viewingUser && !viewingUser.isSuper && viewingUser.role !== ROLES.ADMIN;

  return (
    <div className="admin-users">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            aria-label="Buscar usuarios"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-filters">
        <select
          className="admin-select"
          aria-label="Filtrar por rol"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">Todos los roles</option>
          <option value={ROLES.TRAINER}>Entrenadores</option>
          <option value={ROLES.ATHLETE}>Atletas</option>
          <option value={ROLES.ADMIN}>Administradores</option>
        </select>
        <select
          className="admin-select"
          aria-label="Filtrar por plan"
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
        >
          <option value="ALL">Todos los planes</option>
          {Object.values(SUBSCRIPTION_PLANS).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <span className="admin-filters-count">
          {filteredUsers.length} de {allUsers.length}
        </span>
        <button className="admin-btn tap-ripple" onClick={handleExportCsv}>
          <Download size={16} /> Exportar CSV
        </button>
        <button
          className="admin-btn tap-ripple"
          onClick={() => {
            setCreatedCreds(null);
            setCreateOpen(true);
          }}
        >
          <UserIcon size={16} /> Nuevo usuario
        </button>
      </div>

      {validSelected.length > 0 && (
        <div
          className="admin-filters"
          role="region"
          aria-label="Acciones en lote"
        >
          <strong>{validSelected.length} seleccionado(s)</strong>
          <select
            className="admin-select"
            aria-label="Plan para el lote"
            value={bulkPlan}
            onChange={(e) => setBulkPlan(e.target.value)}
          >
            {Object.values(SUBSCRIPTION_PLANS).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button className="admin-btn tap-ripple" onClick={handleBulkPlan}>
            Aplicar plan
          </button>
          <select
            className="admin-select"
            aria-label="Días de trial para el lote"
            value={bulkTrialDays}
            onChange={(e) => setBulkTrialDays(Number(e.target.value))}
          >
            {[7, 14, 30].map((d) => (
              <option key={d} value={d}>
                +{d} días
              </option>
            ))}
          </select>
          <button className="admin-btn tap-ripple" onClick={handleBulkTrial}>
            Extender trial
          </button>
          <button
            className="admin-btn tap-ripple"
            onClick={() => {
              setBulkConfirmText("");
              setBulkDeleteOpen(true);
            }}
          >
            <Trash2 size={16} /> Eliminar
          </button>
          <button
            className="admin-btn tap-ripple"
            onClick={() => setSelectedIds(new Set())}
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los de la página"
                  checked={allPageSelected}
                  disabled={selectablePageIds.length === 0}
                  onChange={togglePageSelection}
                />
              </th>
              <th aria-sort={ariaSort("name")}>
                <button
                  className="th-sort tap-ripple"
                  onClick={() => toggleSort("name")}
                >
                  Nombre{sortIndicator("name")}
                </button>
              </th>
              <th>Email</th>
              <th>Rol</th>
              <th aria-sort={ariaSort("plan")}>
                <button
                  className="th-sort tap-ripple"
                  onClick={() => toggleSort("plan")}
                >
                  Plan{sortIndicator("plan")}
                </button>
              </th>
              <th>Estado</th>
              <th aria-sort={ariaSort("createdAt")}>
                <button
                  className="th-sort tap-ripple"
                  onClick={() => toggleSort("createdAt")}
                >
                  Registro{sortIndicator("createdAt")}
                </button>
              </th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${user.name}`}
                    checked={selectedIds.has(user.id)}
                    disabled={!isSelectable(user)}
                    onChange={() => toggleSelected(user.id)}
                  />
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      {user.isSuper ? (
                        <Shield size={16} />
                      ) : (
                        <UserIcon size={16} />
                      )}
                    </div>
                    <span>{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role.toLowerCase()}`}>
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td>
                  <span className="plan-text">
                    {user.subscription?.plan || "FREE"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge ${user.subscription?.status?.toLowerCase() || "active"}`}
                  >
                    {user.subscription?.status || "ACTIVE"}
                  </span>
                  {trialDaysLeft(user) !== null && (
                    <span className="badge-warning">
                      {trialDaysLeft(user)} d
                    </span>
                  )}
                </td>
                <td>
                  <span className="date-text">
                    {formatDate(user.createdAt)}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon tap-ripple"
                      title="Ver detalles"
                      aria-label="Ver detalles"
                      onClick={() => setViewingUserId(user.id)}
                    >
                      <Eye size={16} />
                    </button>
                    {/* No se permite eliminar al super admin ni a uno mismo */}
                    {!user.isSuper && user.id !== actorId && (
                      <button
                        className="btn-icon danger tap-ripple"
                        title="Eliminar"
                        aria-label="Eliminar usuario"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <UserIcon size={48} />
          <p>No se encontraron usuarios</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="btn-icon tap-ripple"
            aria-label="Página anterior"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="btn-icon tap-ripple"
            aria-label="Página siguiente"
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="users-summary">
        <div className="summary-item">
          <span className="summary-label">Total Usuarios:</span>
          <span className="summary-value">{allUsers.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Entrenadores:</span>
          <span className="summary-value">
            {allUsers.filter((u) => u.role === ROLES.TRAINER).length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Atletas:</span>
          <span className="summary-value">
            {allUsers.filter((u) => u.role === ROLES.ATHLETE).length}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Administradores:</span>
          <span className="summary-value">
            {allUsers.filter((u) => u.role === ROLES.ADMIN).length}
          </span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar a "${userToDelete?.name}"? Esta acción no se puede deshacer.${
          orphanTotal > 0 && orphanData
            ? ` También se eliminarán sus datos asociados: ${orphanData.clients} plan(es), ${orphanData.requests} solicitud(es), ${orphanData.gymBookings} reserva(s) de gimnasio y ${orphanData.appointments} cita(s).`
            : " No tiene datos asociados."
        }`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo usuario"
        size="sm"
      >
        {createdCreds ? (
          <div role="status" aria-live="polite">
            <p>
              Cuenta creada. Entrega estas credenciales (se muestran una vez):
            </p>
            <p>
              Email: <code>{createdCreds.email}</code>
            </p>
            <p>
              Clave temporal: <code>{createdCreds.password}</code>
            </p>
            <button
              className="admin-btn tap-ripple"
              onClick={() =>
                copyText(
                  `Email: ${createdCreds.email}\nClave temporal: ${createdCreds.password}`,
                )
              }
            >
              Copiar
            </button>{" "}
            <button
              className="admin-btn tap-ripple"
              onClick={() => {
                setCreatedCreds(null);
                setCreateOpen(false);
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateUser}>
            <input
              className="admin-select"
              aria-label="Nombre"
              placeholder="Nombre"
              value={newUser.name}
              maxLength={80}
              required
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              className="admin-select"
              type="email"
              aria-label="Email"
              placeholder="Email"
              value={newUser.email}
              required
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
            <select
              className="admin-select"
              aria-label="Rol"
              value={newUser.role}
              onChange={(e) =>
                setNewUser({ ...newUser, role: e.target.value as User["role"] })
              }
            >
              <option value={ROLES.TRAINER}>Entrenador</option>
              <option value={ROLES.ATHLETE}>Atleta</option>
            </select>
            <div className="admin-filters">
              <button
                type="button"
                className="admin-btn tap-ripple"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="admin-btn tap-ripple">
                Crear
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Eliminar usuarios seleccionados"
        size="sm"
      >
        <p>
          Se eliminarán {validSelected.length} cuenta(s) y todos sus datos
          asociados (planes, solicitudes, reservas, citas y mediciones). Esta
          acción no se puede deshacer.
        </p>
        <p>
          Para confirmar escribe <strong>{bulkPhrase}</strong>:
        </p>
        <input
          type="text"
          className="admin-select"
          aria-label="Frase de confirmación"
          value={bulkConfirmText}
          onChange={(e) => setBulkConfirmText(e.target.value)}
        />
        <div className="admin-filters">
          <button
            className="admin-btn tap-ripple"
            onClick={() => setBulkDeleteOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="admin-btn tap-ripple"
            disabled={bulkConfirmText.trim() !== bulkPhrase}
            onClick={confirmBulkDelete}
          >
            Eliminar definitivamente
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUserId(null)}
        title="Detalles del usuario"
        size="sm"
      >
        {viewingUser && (
          <div className="user-detail">
            <div className="user-detail-avatar">
              {viewingUser.isSuper ? (
                <Shield size={28} />
              ) : (
                <UserIcon size={28} />
              )}
            </div>
            <h3 className="user-detail-name">{viewingUser.name}</h3>
            <div className="user-detail-row">
              <Mail size={16} /> {viewingUser.email || "Sin email"}
            </div>
            <div className="user-detail-row">
              <Shield size={16} />
              <span className={`role-badge ${viewingUser.role.toLowerCase()}`}>
                {roleLabel(viewingUser.role)}
              </span>
            </div>
            <div className="user-detail-row">
              <Calendar size={16} />
              Registrado el {formatDate(viewingUser.createdAt, true)}
            </div>
            <div className="user-detail-row">
              Plan: <strong>{viewingUser.subscription?.plan || "FREE"}</strong>{" "}
              · Estado:{" "}
              <strong>{viewingUser.subscription?.status || "ACTIVE"}</strong>
              {viewingUser.suspended && (
                <>
                  {" "}
                  · <strong>SUSPENDIDA</strong>
                </>
              )}
            </div>
            {viewingUser.role !== ROLES.ADMIN && viewingData && (
              <div className="user-detail-row">
                Datos asociados: {viewingData.clients} plan(es),{" "}
                {viewingData.requests} solicitud(es), {viewingData.gymBookings}{" "}
                reserva(s) de gimnasio, {viewingData.appointments} cita(s)
              </div>
            )}
            {viewingUser.subscription?.trialEndsAt && (
              <div className="user-detail-row">
                Trial hasta:{" "}
                <strong>
                  {formatDate(viewingUser.subscription.trialEndsAt, true)}
                </strong>
              </div>
            )}

            {canEditSubscription && (
              <div className="user-admin-actions">
                <label className="admin-field">
                  <span>Nombre</span>
                  <input
                    type="text"
                    className="admin-select"
                    value={editName}
                    maxLength={80}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <label className="admin-field">
                  <span>Email</span>
                  <input
                    type="email"
                    className="admin-select"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </label>
                <div className="admin-inline">
                  <button
                    className="admin-btn tap-ripple"
                    onClick={handleSaveProfile}
                  >
                    Guardar datos
                  </button>
                  <button
                    className="admin-btn tap-ripple"
                    onClick={handleToggleSuspended}
                  >
                    {viewingUser.suspended
                      ? "Reactivar cuenta"
                      : "Suspender cuenta"}
                  </button>
                  <button
                    className="admin-btn tap-ripple"
                    onClick={handleResetPassword}
                  >
                    Clave temporal
                  </button>
                </div>
                {tempPassword && (
                  <div role="status" aria-live="polite">
                    Clave temporal (se muestra una sola vez):{" "}
                    <code>{tempPassword}</code>{" "}
                    <button
                      className="admin-btn tap-ripple"
                      onClick={() => copyText(tempPassword)}
                    >
                      Copiar
                    </button>
                  </div>
                )}
                <label className="admin-field">
                  <span>Cambiar plan</span>
                  <select
                    className="admin-select"
                    value={viewingUser.subscription?.plan || "FREE"}
                    onChange={(e) => handleChangePlan(e.target.value)}
                  >
                    {Object.values(SUBSCRIPTION_PLANS).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="admin-field">
                  <span>Extender trial</span>
                  <div className="admin-inline">
                    <select
                      className="admin-select"
                      aria-label="Días a extender"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Number(e.target.value))}
                    >
                      {[7, 14, 30].map((d) => (
                        <option key={d} value={d}>
                          +{d} días
                        </option>
                      ))}
                    </select>
                    <button
                      className="admin-btn tap-ripple"
                      onClick={handleExtendTrial}
                    >
                      <CalendarPlus size={16} /> Extender
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
