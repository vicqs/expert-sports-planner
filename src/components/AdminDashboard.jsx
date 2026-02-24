import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useMockDatabase } from "../context/MockDatabase";
import { getAllUsers } from "../utils/auth";
import { Card, Button } from "./ui";
import {
  Users,
  Shield,
  Database,
  TrendingUp,
  Calendar,
  Settings,
  User,
  Trash2,
  Eye,
  Dumbbell,
  Activity,
  Package,
  Target,
  PlusCircle,
  Edit,
  Search,
  Download,
  BarChart3,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import {
  GYM_EXERCISES,
  SESSION_TYPES,
  TRAINING_TYPES,
} from "../utils/constants";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const allUsers = getAllUsers();

  const activePlans = getActivePlans();
  const completedPlans = getCompletedPlans();

  // Estados para modales
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);

  // Form states
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    category: "",
    status: "Disponible",
    quantity: 1,
    lastMaintenance: new Date().toISOString().split("T")[0],
  });

  const [exerciseForm, setExerciseForm] = useState({
    name: "",
    category: "LOWER",
  });

  const [equipment, setEquipment] = useState(() => {
    const stored = localStorage.getItem("crm_equipment");
    return stored
      ? JSON.parse(stored)
      : [
          {
            id: 1,
            name: "Barra Olímpica",
            category: "Pesas Libres",
            status: "Disponible",
            quantity: 5,
            lastMaintenance: "2026-01-15",
          },
          {
            id: 2,
            name: "Mancuernas 5-50kg",
            category: "Pesas Libres",
            status: "Disponible",
            quantity: 10,
            lastMaintenance: "2026-02-01",
          },
          {
            id: 3,
            name: "Rack Sentadilla",
            category: "Máquinas",
            status: "Disponible",
            quantity: 2,
            lastMaintenance: "2026-01-20",
          },
          {
            id: 4,
            name: "Cinta de Correr",
            category: "Cardio",
            status: "Mantenimiento",
            quantity: 8,
            lastMaintenance: "2026-02-20",
          },
          {
            id: 5,
            name: "Bicicleta Estática",
            category: "Cardio",
            status: "Disponible",
            quantity: 10,
            lastMaintenance: "2026-02-10",
          },
          {
            id: 6,
            name: "Banco Plano",
            category: "Bancos",
            status: "Disponible",
            quantity: 6,
            lastMaintenance: "2026-01-25",
          },
          {
            id: 7,
            name: "Banco Inclinado",
            category: "Bancos",
            status: "Disponible",
            quantity: 4,
            lastMaintenance: "2026-01-25",
          },
          {
            id: 8,
            name: "Polea Alta/Baja",
            category: "Poleas",
            status: "Disponible",
            quantity: 3,
            lastMaintenance: "2026-02-05",
          },
          {
            id: 9,
            name: "Kettlebells",
            category: "Pesas Libres",
            status: "Disponible",
            quantity: 15,
            lastMaintenance: "2026-02-01",
          },
          {
            id: 10,
            name: "TRX",
            category: "Funcional",
            status: "Disponible",
            quantity: 6,
            lastMaintenance: "2026-01-30",
          },
        ];
  });

  // Ejercicios personalizados (agregados por el admin)
  const [customExercises, setCustomExercises] = useState(() => {
    const stored = localStorage.getItem("crm_custom_exercises");
    return stored ? JSON.parse(stored) : {};
  });

  useEffect(() => {
    localStorage.setItem("crm_equipment", JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem(
      "crm_custom_exercises",
      JSON.stringify(customExercises),
    );
  }, [customExercises]);

  // ===== FUNCIONES CRUD EQUIPAMIENTO =====
  const openEquipmentModal = (item = null) => {
    if (item) {
      setEditingEquipment(item);
      setEquipmentForm({
        name: item.name,
        category: item.category,
        status: item.status,
        quantity: item.quantity,
        lastMaintenance: item.lastMaintenance,
      });
    } else {
      setEditingEquipment(null);
      setEquipmentForm({
        name: "",
        category: "",
        status: "Disponible",
        quantity: 1,
        lastMaintenance: new Date().toISOString().split("T")[0],
      });
    }
    setShowEquipmentModal(true);
  };

  const closeEquipmentModal = () => {
    setShowEquipmentModal(false);
    setEditingEquipment(null);
    setEquipmentForm({
      name: "",
      category: "",
      status: "Disponible",
      quantity: 1,
      lastMaintenance: new Date().toISOString().split("T")[0],
    });
  };

  const handleEquipmentSubmit = (e) => {
    e.preventDefault();
    if (editingEquipment) {
      // Editar equipo existente
      setEquipment(
        equipment.map((item) =>
          item.id === editingEquipment.id
            ? { ...equipmentForm, id: item.id }
            : item,
        ),
      );
    } else {
      // Agregar nuevo equipo
      const newEquipment = {
        ...equipmentForm,
        id: Date.now(),
      };
      setEquipment([...equipment, newEquipment]);
    }
    closeEquipmentModal();
  };

  const handleDeleteEquipment = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este equipo?")) {
      setEquipment(equipment.filter((item) => item.id !== id));
    }
  };

  // ===== FUNCIONES CRUD EJERCICIOS =====
  const allExercises = { ...GYM_EXERCISES, ...customExercises };

  const openExerciseModal = (category = null, exercise = null) => {
    if (exercise && category) {
      setEditingExercise({ category, name: exercise });
      setExerciseForm({
        name: exercise,
        category: category,
      });
    } else {
      setEditingExercise(null);
      setExerciseForm({
        name: "",
        category: "LOWER",
      });
    }
    setShowExerciseModal(true);
  };

  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    setEditingExercise(null);
    setExerciseForm({
      name: "",
      category: "LOWER",
    });
  };

  const handleExerciseSubmit = (e) => {
    e.preventDefault();
    const { category, name } = exerciseForm;

    if (editingExercise) {
      // Editar ejercicio (solo si es personalizado)
      if (customExercises[editingExercise.category]) {
        const updatedCustom = { ...customExercises };
        updatedCustom[editingExercise.category] = updatedCustom[
          editingExercise.category
        ].map((ex) => (ex === editingExercise.name ? name : ex));

        // Si cambió de categoría
        if (editingExercise.category !== category) {
          updatedCustom[editingExercise.category] = updatedCustom[
            editingExercise.category
          ].filter((ex) => ex !== editingExercise.name);
          updatedCustom[category] = [...(updatedCustom[category] || []), name];
        }

        setCustomExercises(updatedCustom);
      }
    } else {
      // Agregar nuevo ejercicio
      const updatedCustom = { ...customExercises };
      updatedCustom[category] = [...(updatedCustom[category] || []), name];
      setCustomExercises(updatedCustom);
    }
    closeExerciseModal();
  };

  const handleDeleteExercise = (category, exercise) => {
    // Solo se pueden eliminar ejercicios personalizados
    if (!customExercises[category]) {
      alert("No puedes eliminar ejercicios predefinidos del sistema.");
      return;
    }

    if (window.confirm(`¿Eliminar ejercicio "${exercise}"?`)) {
      const updatedCustom = { ...customExercises };
      updatedCustom[category] = updatedCustom[category].filter(
        (ex) => ex !== exercise,
      );
      if (updatedCustom[category].length === 0) {
        delete updatedCustom[category];
      }
      setCustomExercises(updatedCustom);
    }
  };

  const stats = {
    totalUsers: allUsers.length,
    trainers: allUsers.filter((u) => u.role === "TRAINER").length,
    athletes: allUsers.filter((u) => u.role === "ATHLETE").length,
    totalClients: clients?.length || 0,
    totalPlans: (activePlans?.length || 0) + (completedPlans?.length || 0),
    activeTrials: allUsers.filter((u) => u.subscription?.status === "TRIAL")
      .length,
    activePlansCount: activePlans?.length || 0,
    completedPlansCount: completedPlans?.length || 0,
    gymBookingsCount: gymBookings?.length || 0,
    appointmentsCount: appointments?.length || 0,
    totalExercises: Object.values(allExercises).reduce(
      (acc, cat) => acc + cat.length,
      0,
    ),
    equipmentCount: equipment.length,
    equipmentAvailable: equipment.filter((e) => e.status === "Disponible")
      .length,
    equipmentMaintenance: equipment.filter((e) => e.status === "Mantenimiento")
      .length,
  };

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-icon users">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Usuarios Totales</p>
            <small>
              {stats.trainers} Trainers • {stats.athletes} Atletas
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon plans">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalPlans}</h3>
            <p>Planes de Entrenamiento</p>
            <small>
              {stats.activePlansCount} Activos • {stats.completedPlansCount}{" "}
              Completados
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon trials">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.activeTrials}</h3>
            <p>Trials Activos</p>
            <small>Plan FREE de 14 días</small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon equipment">
            <Dumbbell size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.equipmentCount}</h3>
            <p>Equipamiento Registrado</p>
            <small>
              {stats.equipmentAvailable} Disponible •{" "}
              {stats.equipmentMaintenance} Mantenimiento
            </small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon exercises">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.totalExercises}</h3>
            <p>Ejercicios en BD</p>
            <small>{Object.keys(GYM_EXERCISES).length} Categorías</small>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon bookings">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.gymBookingsCount + stats.appointmentsCount}</h3>
            <p>Reservas y Citas</p>
            <small>
              {stats.gymBookingsCount} Gimnasio • {stats.appointmentsCount}{" "}
              Citas
            </small>
          </div>
        </Card>
      </div>

      <div className="quick-stats-row">
        <Card className="quick-stat">
          <h4>Tipos de Sesión</h4>
          <div className="stat-items">
            {Object.values(SESSION_TYPES).map((type) => (
              <div key={type.code} className="stat-item">
                <span className="stat-label">{type.code}</span>
                <span className="stat-value">{type.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="quick-stat">
          <h4>Tipos de Entrenamiento</h4>
          <div className="stat-items">
            {Object.values(TRAINING_TYPES)
              .slice(0, 6)
              .map((type) => (
                <div key={type.code} className="stat-item">
                  <span className="stat-label">{type.code}</span>
                  <span className="stat-value">{type.name}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => {
    const filteredUsers = allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );

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

        <div className="users-table">
          <table>
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
                      <div className="user-avatar">{user.name[0]}</div>
                      <span>{user.name}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.subscription?.plan || "FREE"}</td>
                  <td>
                    <span
                      className={`status-badge ${user.subscription?.status?.toLowerCase()}`}
                    >
                      {user.subscription?.status || "ACTIVE"}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" title="Ver detalles">
                        <Eye size={16} />
                      </button>
                      {!user.isSuper && (
                        <button className="btn-icon danger" title="Eliminar">
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
      </div>
    );
  };

  const renderExercises = () => {
    const categories = Object.keys(allExercises);
    const filteredCategory =
      selectedCategory === "all" ? categories : [selectedCategory];

    return (
      <div className="admin-exercises">
        <div className="section-header">
          <h2>Base de Datos de Ejercicios</h2>
          <div className="filters">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-filter"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({allExercises[cat].length})
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={18} />}
              onClick={() => openExerciseModal()}
            >
              Agregar Ejercicio
            </Button>
          </div>
        </div>

        <div className="exercises-grid">
          {filteredCategory.map((category) => (
            <Card key={category} className="category-card">
              <div className="category-header">
                <h3>{category}</h3>
                <span className="count-badge">
                  {allExercises[category].length} ejercicios
                </span>
              </div>
              <div className="exercise-list">
                {allExercises[category].map((exercise, idx) => {
                  const isCustom =
                    customExercises[category]?.includes(exercise);
                  return (
                    <div key={idx} className="exercise-item">
                      <Activity size={16} />
                      <span>{exercise}</span>
                      {isCustom && (
                        <div className="exercise-item-actions">
                          <button
                            className="btn-icon-mini"
                            onClick={() =>
                              openExerciseModal(category, exercise)
                            }
                            title="Editar"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            className="btn-icon-mini danger"
                            onClick={() =>
                              handleDeleteExercise(category, exercise)
                            }
                            title="Eliminar"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderEquipment = () => {
    const filteredEquipment = equipment.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
      <div className="admin-equipment">
        <div className="section-header">
          <h2>Gestión de Equipamiento</h2>
          <div className="header-actions">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar equipamiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<PlusCircle size={18} />}
              onClick={() => openEquipmentModal()}
            >
              Agregar Equipo
            </Button>
          </div>
        </div>

        <div className="equipment-grid">
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="equipment-card">
              <div className="equipment-header">
                <div className="equipment-icon">
                  <Package size={24} />
                </div>
                <span
                  className={`status-indicator ${item.status.toLowerCase()}`}
                >
                  {item.status === "Disponible" ? (
                    <Check size={16} />
                  ) : (
                    <AlertCircle size={16} />
                  )}
                </span>
              </div>
              <h4>{item.name}</h4>
              <div className="equipment-meta">
                <span className="category-tag">{item.category}</span>
                <span className="quantity">Cantidad: {item.quantity}</span>
              </div>
              <div className="equipment-footer">
                <small>
                  Mantenimiento:{" "}
                  {new Date(item.lastMaintenance).toLocaleDateString()}
                </small>
                <div className="equipment-actions">
                  <button
                    className="btn-icon"
                    onClick={() => openEquipmentModal(item)}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => handleDeleteEquipment(item.id)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="admin-analytics">
      <div className="section-header">
        <h2>Estadísticas y Análisis</h2>
        <Button variant="secondary" leftIcon={<Download size={18} />}>
          Exportar Reporte
        </Button>
      </div>

      <div className="analytics-grid">
        <Card className="analytics-card">
          <h4>
            <BarChart3 size={18} /> Usuarios por Rol
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar"
                style={{
                  height: `${(stats.trainers / stats.totalUsers) * 100}%`,
                }}
              >
                <span>{stats.trainers}</span>
              </div>
              <div
                className="bar"
                style={{
                  height: `${(stats.athletes / stats.totalUsers) * 100}%`,
                }}
              >
                <span>{stats.athletes}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Entrenadores</span>
              <span>Atletas</span>
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h4>
            <TrendingUp size={18} /> Planes de Entrenamiento
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar active"
                style={{
                  height: `${(stats.activePlansCount / stats.totalPlans) * 100 || 50}%`,
                }}
              >
                <span>{stats.activePlansCount}</span>
              </div>
              <div
                className="bar completed"
                style={{
                  height: `${(stats.completedPlansCount / stats.totalPlans) * 100 || 50}%`,
                }}
              >
                <span>{stats.completedPlansCount}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Activos</span>
              <span>Completados</span>
            </div>
          </div>
        </Card>

        <Card className="analytics-card">
          <h4>
            <Dumbbell size={18} /> Estado del Equipamiento
          </h4>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div
                className="bar available"
                style={{
                  height: `${(stats.equipmentAvailable / stats.equipmentCount) * 100}%`,
                }}
              >
                <span>{stats.equipmentAvailable}</span>
              </div>
              <div
                className="bar maintenance"
                style={{
                  height: `${(stats.equipmentMaintenance / stats.equipmentCount) * 100}%`,
                }}
              >
                <span>{stats.equipmentMaintenance}</span>
              </div>
            </div>
            <div className="chart-labels">
              <span>Disponible</span>
              <span>Mantenimiento</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <Shield size={32} />
          <div>
            <h1>Panel de Administración CRM</h1>
            <p>Bienvenido, {currentUser.name} • Sistema de Gestión Integral</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onExit}>
          Cerrar Sesión
        </Button>
      </div>

      <div className="admin-nav">
        <button
          className={`nav-btn ${view === "overview" ? "active" : ""}`}
          onClick={() => {
            setView("overview");
            setSearchTerm("");
          }}
        >
          <TrendingUp size={18} />
          Resumen
        </button>
        <button
          className={`nav-btn ${view === "users" ? "active" : ""}`}
          onClick={() => {
            setView("users");
            setSearchTerm("");
          }}
        >
          <Users size={18} />
          Usuarios
        </button>
        <button
          className={`nav-btn ${view === "exercises" ? "active" : ""}`}
          onClick={() => {
            setView("exercises");
            setSearchTerm("");
            setSelectedCategory("all");
          }}
        >
          <Activity size={18} />
          Ejercicios
        </button>
        <button
          className={`nav-btn ${view === "equipment" ? "active" : ""}`}
          onClick={() => {
            setView("equipment");
            setSearchTerm("");
          }}
        >
          <Dumbbell size={18} />
          Equipamiento
        </button>
        <button
          className={`nav-btn ${view === "analytics" ? "active" : ""}`}
          onClick={() => {
            setView("analytics");
            setSearchTerm("");
          }}
        >
          <BarChart3 size={18} />
          Estadísticas
        </button>
        <button
          className={`nav-btn ${view === "settings" ? "active" : ""}`}
          onClick={() => {
            setView("settings");
            setSearchTerm("");
          }}
        >
          <Settings size={18} />
          Configuración
        </button>
      </div>

      <div className="admin-content">
        {view === "overview" && renderOverview()}
        {view === "users" && renderUsers()}
        {view === "exercises" && renderExercises()}
        {view === "equipment" && renderEquipment()}
        {view === "analytics" && renderAnalytics()}
        {view === "settings" && (
          <Card>
            <h2>Configuración del Sistema</h2>
            <p style={{ color: "var(--color-text-secondary)" }}>
              Opciones de configuración disponibles próximamente
            </p>
          </Card>
        )}
      </div>

      {/* Modal de Equipamiento */}
      {showEquipmentModal && (
        <div className="modal-overlay" onClick={closeEquipmentModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingEquipment ? "Editar Equipo" : "Agregar Nuevo Equipo"}
              </h3>
              <button className="modal-close" onClick={closeEquipmentModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEquipmentSubmit}>
              <div className="form-group">
                <label>Nombre del Equipo</label>
                <input
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) =>
                    setEquipmentForm({ ...equipmentForm, name: e.target.value })
                  }
                  required
                  placeholder="Ej: Barra Olímpica"
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input
                  type="text"
                  value={equipmentForm.category}
                  onChange={(e) =>
                    setEquipmentForm({
                      ...equipmentForm,
                      category: e.target.value,
                    })
                  }
                  required
                  placeholder="Ej: Pesas Libres, Máquinas, Cardio"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    value={equipmentForm.status}
                    onChange={(e) =>
                      setEquipmentForm({
                        ...equipmentForm,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={equipmentForm.quantity}
                    onChange={(e) =>
                      setEquipmentForm({
                        ...equipmentForm,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Último Mantenimiento</label>
                <input
                  type="date"
                  value={equipmentForm.lastMaintenance}
                  onChange={(e) =>
                    setEquipmentForm({
                      ...equipmentForm,
                      lastMaintenance: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeEquipmentModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingEquipment ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ejercicios */}
      {showExerciseModal && (
        <div className="modal-overlay" onClick={closeExerciseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingExercise
                  ? "Editar Ejercicio"
                  : "Agregar Nuevo Ejercicio"}
              </h3>
              <button className="modal-close" onClick={closeExerciseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExerciseSubmit}>
              <div className="form-group">
                <label>Nombre del Ejercicio</label>
                <input
                  type="text"
                  value={exerciseForm.name}
                  onChange={(e) =>
                    setExerciseForm({ ...exerciseForm, name: e.target.value })
                  }
                  required
                  placeholder="Ej: Sentadilla Búlgara"
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select
                  value={exerciseForm.category}
                  onChange={(e) =>
                    setExerciseForm({
                      ...exerciseForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="LOWER">LOWER (Tren Inferior)</option>
                  <option value="UPPER_PUSH">
                    UPPER_PUSH (Empuje Superior)
                  </option>
                  <option value="UPPER_PULL">
                    UPPER_PULL (Tracción Superior)
                  </option>
                  <option value="CORE">CORE (Núcleo/Abdomen)</option>
                </select>
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeExerciseModal}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingExercise ? "Actualizar" : "Agregar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard{max-width:1400px;margin:0 auto;padding:2rem;background:var(--color-bg);min-height:100vh}
        .admin-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:2px solid var(--color-border)}
        .admin-title{display:flex;align-items:center;gap:1rem}
        .admin-title svg{color:var(--color-primary)}
        .admin-title h1{margin:0;font-size:1.75rem;background:linear-gradient(135deg,var(--color-primary),#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
        .admin-title p{margin:0;color:var(--color-text-secondary);font-size:.9rem}
        .admin-nav{display:flex;gap:.5rem;margin-bottom:2rem;border-bottom:2px solid var(--color-border);overflow-x:auto}
        .nav-btn{background:none;border:none;padding:.75rem 1.25rem;display:flex;align-items:center;gap:.5rem;color:var(--color-text-secondary);cursor:pointer;border-bottom:2px solid transparent;transition:all .2s;font-weight:500;white-space:nowrap}
        .nav-btn:hover{color:var(--color-text);background:rgba(139,92,246,.05)}
        .nav-btn.active{color:var(--color-primary);border-bottom-color:var(--color-primary)}
        .admin-content{animation:fadeIn .3s ease-in}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-bottom:2rem}
        .stat-card{display:flex;align-items:flex-start;gap:1rem;padding:1.5rem;background:var(--color-surface);border-radius:var(--radius-lg);border:1px solid var(--color-border);transition:all .3s}
        .stat-card:hover{transform:translateY(-4px);box-shadow:0 8px 24px rgba(139,92,246,.15);border-color:var(--color-primary)}
        .stat-icon{width:56px;height:56px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .stat-icon.users{background:linear-gradient(135deg,#3b82f6,#2563eb);color:white}
        .stat-icon.plans{background:linear-gradient(135deg,#f59e0b,#d97706);color:white}
        .stat-icon.trials{background:linear-gradient(135deg,#ef4444,#dc2626);color:white}
        .stat-icon.equipment{background:linear-gradient(135deg,#6366f1,#4f46e5);color:white}
        .stat-icon.exercises{background:linear-gradient(135deg,#14b8a6,#0d9488);color:white}
        .stat-icon.bookings{background:linear-gradient(135deg,#f97316,#ea580c);color:white}
        .stat-content{flex:1}
        .stat-content h3{margin:0 0 .25rem 0;font-size:2rem;font-weight:700;color:var(--color-text)}
        .stat-content p{margin:0;color:var(--color-text-secondary);font-size:.9rem;font-weight:500}
        .stat-content small{display:block;margin-top:.5rem;color:var(--color-text-muted);font-size:.75rem}
        .quick-stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:1.5rem;margin-top:2rem}
        .quick-stat{padding:1.5rem}
        .quick-stat h4{margin:0 0 1rem 0;font-size:1rem;color:var(--color-text)}
        .stat-items{display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem}
        .stat-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;background:var(--color-surface-raised);border-radius:var(--radius-sm)}
        .stat-label{display:inline-block;padding:.25rem .5rem;background:var(--color-primary);color:white;border-radius:var(--radius-xs);font-size:.7rem;font-weight:700}
        .stat-value{font-size:.85rem;color:var(--color-text-secondary)}
        .section-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
        .section-header h2{margin:0;font-size:1.5rem;color:var(--color-text)}
        .search-bar{display:flex;align-items:center;gap:.5rem;padding:.5rem 1rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);min-width:250px}
        .search-bar svg{color:var(--color-text-muted)}
        .search-bar input{border:none;background:none;outline:none;color:var(--color-text);width:100%}
        .header-actions{display:flex;gap:1rem;align-items:center}
        .filters{display:flex;gap:1rem;align-items:center}
        .category-filter{padding:.5rem 1rem;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--radius-md);color:var(--color-text);cursor:pointer;outline:none}
        .users-table{overflow-x:auto;background:var(--color-surface);border-radius:var(--radius-lg);border:1px solid var(--color-border)}
        table{width:100%;border-collapse:collapse}
        th,td{padding:1rem;text-align:left;border-bottom:1px solid var(--color-border)}
        th{background:var(--color-surface-raised);font-weight:600;color:var(--color-text);font-size:.875rem;text-transform:uppercase;letter-spacing:.05em}
        tr:last-child td{border-bottom:none}
        tbody tr{transition:background .2s}
        tbody tr:hover{background:rgba(139,92,246,.05)}
        .user-cell{display:flex;align-items:center;gap:.75rem}
        .user-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--color-primary),#3b82f6);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem}
        .role-badge,.status-badge{display:inline-block;padding:.25rem .75rem;border-radius:var(--radius-sm);font-size:.75rem;font-weight:600;text-transform:uppercase}
        .role-badge.trainer{background:rgba(139,92,246,.1);color:#8b5cf6}
        .role-badge.athlete{background:rgba(59,130,246,.1);color:#3b82f6}
        .role-badge.admin{background:rgba(239,68,68,.1);color:#ef4444}
        .status-badge.active{background:rgba(16,185,129,.1);color:#10b981}
        .status-badge.trial{background:rgba(245,158,11,.1);color:#f59e0b}
        .status-badge.expired{background:rgba(107,114,128,.1);color:#6b7280}
        .action-buttons{display:flex;gap:.5rem}
        .btn-icon{background:none;border:1px solid var(--color-border);padding:.5rem;border-radius:var(--radius-sm);cursor:pointer;color:var(--color-text-secondary);transition:all .2s;display:flex;align-items:center;justify-content:center}
        .btn-icon:hover{background:rgba(139,92,246,.1);border-color:var(--color-primary);color:var(--color-primary)}
        .btn-icon.danger:hover{background:rgba(239,68,68,.1);border-color:#ef4444;color:#ef4444}
        .exercises-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
        .category-card{padding:1.5rem}
        .category-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:2px solid var(--color-border)}
        .category-header h3{margin:0;font-size:1.1rem;color:var(--color-text)}
        .count-badge{padding:.25rem .75rem;background:var(--color-primary);color:white;border-radius:var(--radius-full);font-size:.75rem;font-weight:600}
        .exercise-list{display:flex;flex-direction:column;gap:.5rem}
        .exercise-item{display:flex;align-items:center;gap:.5rem;padding:.5rem;background:var(--color-surface-raised);border-radius:var(--radius-sm);font-size:.85rem;color:var(--color-text-secondary);transition:all .2s}
        .exercise-item:hover:not(.more){background:rgba(139,92,246,.1);color:var(--color-primary)}
        .exercise-item.more{justify-content:center;color:var(--color-text-muted);font-style:italic}
        .equipment-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem}
        .equipment-card{padding:1.5rem;position:relative}
        .equipment-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem}
        .equipment-icon{width:48px;height:48px;border-radius:var(--radius-md);background:linear-gradient(135deg,var(--color-primary),#3b82f6);color:white;display:flex;align-items:center;justify-content:center}
        .status-indicator{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center}
        .status-indicator.disponible{background:rgba(16,185,129,.1);color:#10b981}
        .status-indicator.mantenimiento{background:rgba(245,158,11,.1);color:#f59e0b}
        .equipment-card h4{margin:0 0 .75rem 0;font-size:1.1rem;color:var(--color-text)}
        .equipment-meta{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:1rem}
        .category-tag{padding:.25rem .75rem;background:var(--color-surface-raised);border-radius:var(--radius-sm);font-size:.75rem;color:var(--color-text-secondary)}
        .quantity{font-size:.85rem;color:var(--color-text-secondary);font-weight:600}
        .equipment-footer{padding-top:.75rem;border-top:1px solid var(--color-border);display:flex;justify-content:space-between;align-items:center}
        .equipment-footer small{color:var(--color-text-muted);font-size:.75rem}
        .equipment-actions{display:flex;gap:.5rem}
        .analytics-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem}
        .analytics-card{padding:1.5rem}
        .analytics-card h4{margin:0 0 1.5rem 0;display:flex;align-items:center;gap:.5rem;font-size:1rem;color:var(--color-text)}
        .chart-placeholder{height:200px;display:flex;flex-direction:column;justify-content:space-between}
        .bar-chart{flex:1;display:flex;align-items:flex-end;justify-content:space-around;gap:1rem;padding:1rem 0}
        .bar{flex:1;background:linear-gradient(to top,var(--color-primary),#3b82f6);border-radius:var(--radius-sm) var(--radius-sm) 0 0;display:flex;align-items:flex-start;justify-content:center;padding-top:.5rem;color:white;font-weight:700;min-height:40px;transition:all .3s}
        .bar:hover{transform:scaleY(1.05)}
        .bar.active{background:linear-gradient(to top,#10b981,#059669)}
        .bar.completed{background:linear-gradient(to top,#6b7280,#4b5563)}
        .bar.available{background:linear-gradient(to top,#10b981,#059669)}
        .bar.maintenance{background:linear-gradient(to top,#f59e0b,#d97706)}
        .chart-labels{display:flex;justify-content:space-around;gap:1rem;padding-top:.75rem;border-top:1px solid var(--color-border)}
        .chart-labels span{flex:1;text-align:center;font-size:.85rem;color:var(--color-text-secondary)}
        .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;animation:fadeIn .2s}
        .modal-content{background:var(--color-surface);border-radius:var(--radius-lg);max-width:500px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3);animation:slideUp .3s ease-out}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:1.5rem;border-bottom:1px solid var(--color-border)}
        .modal-header h3{margin:0;font-size:1.25rem;color:var(--color-text)}
        .modal-close{background:none;border:none;cursor:pointer;color:var(--color-text-secondary);padding:.5rem;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);transition:all .2s}
        .modal-close:hover{background:rgba(239,68,68,.1);color:#ef4444}
        .modal-content form{padding:1.5rem}
        .form-group{margin-bottom:1.25rem}
        .form-group label{display:block;margin-bottom:.5rem;font-weight:600;color:var(--color-text);font-size:.9rem}
        .form-group input,.form-group select{width:100%;padding:.75rem;border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface-raised);color:var(--color-text);font-size:.9rem;outline:none;transition:all .2s}
        .form-group input:focus,.form-group select:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px rgba(139,92,246,.1)}
        .form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        .modal-actions{display:flex;gap:1rem;justify-content:flex-end;margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--color-border)}
        .exercise-item-actions{margin-left:auto;display:flex;gap:.25rem}
        .btn-icon-mini{background:none;border:1px solid var(--color-border);padding:.25rem;border-radius:var(--radius-xs);cursor:pointer;color:var(--color-text-secondary);transition:all .2s;display:flex;align-items:center;justify-content:center}
        .btn-icon-mini:hover{background:rgba(139,92,246,.1);border-color:var(--color-primary);color:var(--color-primary)}
        .btn-icon-mini.danger:hover{background:rgba(239,68,68,.1);border-color:#ef4444;color:#ef4444}
        .exercise-item{justify-content:space-between}
        @media (max-width:768px){
          .admin-dashboard{padding:1rem}
          .stats-grid{grid-template-columns:1fr}
          .admin-header{flex-direction:column;gap:1rem;align-items:flex-start}
          .admin-nav{overflow-x:auto;-webkit-overflow-scrolling:touch}
          .section-header{flex-direction:column;align-items:flex-start}
          .users-table{font-size:.875rem}
          th,td{padding:.75rem .5rem}
          .exercises-grid,.equipment-grid,.analytics-grid{grid-template-columns:1fr}
          .form-row{grid-template-columns:1fr}
          .modal-content{width:95%;max-width:none}
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
