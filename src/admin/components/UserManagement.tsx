import React, { useState } from "react";
import { Search, Eye, Trash2, Shield, User as UserIcon } from "lucide-react";
import { getAllUsers, ROLES } from "@/utils/auth";
import "@/admin/styles/users.css";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const allUsers = getAllUsers();

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleViewUser = (userId) => {
    console.log("View user:", userId);
    // Implementar vista de detalles del usuario
  };

  const handleDeleteUser = (userId, isSuper) => {
    if (isSuper) {
      alert("No puedes eliminar al super administrador");
      return;
    }
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      console.log("Delete user:", userId);
      // Implementar eliminación de usuario
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
                      className="btn-icon"
                      title="Ver detalles"
                      onClick={() => handleViewUser(user.id)}
                    >
                      <Eye size={16} />
                    </button>
                    {!user.isSuper && (
                      <button
                        className="btn-icon danger"
                        title="Eliminar"
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
          <span className="summary-label">Trainers:</span>
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
          <span className="summary-label">Admins:</span>
          <span className="summary-value">
            {allUsers.filter((u) => u.role === ROLES.ADMIN).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
