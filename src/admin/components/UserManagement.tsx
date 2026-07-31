import React, { useState } from "react";
import {
  Search,
  Eye,
  Trash2,
  Shield,
  User as UserIcon,
  Mail,
  Calendar,
} from "lucide-react";
import { getAllUsers, deleteUser, ROLES } from "@/utils/auth";
import { ConfirmDialog, Modal, useToast } from "@/components/ui";
import "@/admin/styles/users.css";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [userToDelete, setUserToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const allUsers = getAllUsers();
  const { addToast } = useToast();

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleViewUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    setViewingUser(user || null);
  };

  const handleDeleteUser = (userId, isSuper) => {
    if (isSuper) {
      addToast("No puedes eliminar al super administrador", "error");
      return;
    }
    const user = allUsers.find((u) => u.id === userId);
    setUserToDelete({ id: userId, name: user?.name || "este usuario" });
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    try {
      deleteUser(userToDelete.id);
      addToast(`Usuario "${userToDelete.name}" eliminado`, "success");
      setUserToDelete(null);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "No se pudo eliminar el usuario",
        "error",
      );
    }
  };

  return (
    <div className="admin-users">
      <div className="section-header">
        <h2>Gestión de Usuarios</h2>
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
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
                    {user.role === ROLES.ADMIN
                      ? "ADMIN"
                      : user.role === ROLES.TRAINER
                        ? "TRAINER"
                        : "ATHLETE"}
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
                </td>
                <td>
                  <span className="date-text">
                    {new Date(user.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon tap-ripple"
                      title="Ver detalles"
                      aria-label="Ver detalles"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <Eye size={16} />
                    </button>
                    {!user.isSuper && (
                      <button
                        className="btn-icon danger tap-ripple"
                        title="Eliminar"
                        aria-label="Eliminar usuario"
                        onClick={() => handleDeleteUser(user.id, user.isSuper)}
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
        message={`¿Estás seguro de eliminar a "${userToDelete?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />

      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
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
                {viewingUser.role === ROLES.ADMIN
                  ? "ADMIN"
                  : viewingUser.role === ROLES.TRAINER
                    ? "TRAINER"
                    : "ATHLETE"}
              </span>
            </div>
            <div className="user-detail-row">
              <Calendar size={16} />
              Registrado el{" "}
              {new Date(viewingUser.createdAt).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div className="user-detail-row">
              Plan: <strong>{viewingUser.subscription?.plan || "FREE"}</strong>{" "}
              · Estado:{" "}
              <strong>{viewingUser.subscription?.status || "ACTIVE"}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
