# Guía de Persistencia de Datos

## Descripción General

Esta guía documenta cómo funciona la persistencia de datos en **Expert Sports Planner** y cómo está preparada para migrar a una API REST en el futuro.

---

## Arquitectura de Persistencia

### Capas de la Arquitectura

```
┌─────────────────────────────────────┐
│      Componentes React              │
│  (UI: Dashboards, Forms, etc.)      │
└──────────────┬──────────────────────┘
               │ usa
┌──────────────▼──────────────────────┐
│      Servicios de Datos             │
│  (ClientService, GymService, etc.)  │
└──────────────┬──────────────────────┘
               │ delega a
┌──────────────▼──────────────────────┐
│      MockDatabase Context           │
│  (Estado global + LocalStorage)     │
└──────────────┬──────────────────────┘
               │ usa
┌──────────────▼──────────────────────┐
│      Storage Utils                  │
│  (Abstracción de localStorage)      │
└─────────────────────────────────────┘
```

---

## Sistema de Sesiones

### useSession Hook

El hook `useSession` gestiona la autenticación y sesión del usuario:

```javascript
import { useSession, USER_ROLES } from "./utils/auth";

function MyComponent() {
  const { session, login, logout, isAthlete, isCoach } = useSession();

  // Login
  const handleLogin = () => {
    login(USER_ROLES.ATHLETE);
  };

  // Logout
  const handleLogout = () => {
    logout(false); // false = mantener datos, true = borrar todo
  };

  return (
    <div>
      {session ? (
        <p>
          Bienvenido {session.role} - ID: {session.userId}
        </p>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

### Estructura de Sesión

```javascript
{
  role: "athlete" | "coach",
  userId: "athlete_<uuid>" | "coach_<uuid>",
  loginAt: "2024-01-15T10:30:00.000Z"
}
```

### Persistencia de Sesión

- La sesión se guarda automáticamente en `localStorage` bajo la clave `expert_planner_user_session`
- Al recargar la página, la sesión se restaura automáticamente
- El logout limpia la sesión pero mantiene los datos (planes, reservas, etc.)

---

## Servicios de Datos

Los servicios abstraen las operaciones de datos y preparan para la migración a API.

### ClientService

Gestiona clientes y planes de entrenamiento:

```javascript
import { createServices } from "./services/dataServices";

const { clientService } = createServices(mockDb);

// Obtener planes activos (solo del atleta actual)
const plans = await clientService.getActivePlans();

// Crear solicitud de plan (solo atletas)
await clientService.addClientRequest({
  name: "Juan Pérez",
  sport: "Fútbol",
  // ...
});

// Actualizar plan (solo entrenadores)
await clientService.updateClientPlan(clientId, planText, planObject);
```

### GymService

Gestiona reservas de gimnasio:

```javascript
const { gymService } = createServices(mockDb);

// Reservar slot (solo atletas)
const result = await gymService.bookGymSlot(date, slotId);

// Obtener reservas del atleta actual
const bookings = await gymService.getAthleteGymBookings();

// Configurar horarios (solo entrenadores)
await gymService.updateGymSchedule(date, slots);
```

### AppointmentService

Gestiona citas con el entrenador:

```javascript
const { appointmentService } = createServices(mockDb);

// Crear cita (solo atletas)
await appointmentService.addAppointment({
  date: "2024-01-20",
  time: "10:00",
  reason: "Evaluación inicial",
});

// Ver citas del atleta
const appointments = await appointmentService.getAthleteAppointments();

// Ver citas del día (solo entrenadores)
const todayAppointments = await appointmentService.getTrainerAppointments(date);
```

---

## Control de Acceso por Rol

Todos los servicios implementan validación de rol:

### Operaciones por Rol

| Operación               | Atleta | Entrenador |
| ----------------------- | ------ | ---------- |
| Ver propios planes      | ✅     | ❌         |
| Ver todos los planes    | ❌     | ✅         |
| Crear solicitud de plan | ✅     | ❌         |
| Actualizar plan         | ❌     | ✅         |
| Reservar gimnasio       | ✅     | ❌         |
| Configurar gimnasio     | ❌     | ✅         |
| Crear cita              | ✅     | ❌         |
| Ver todas las citas     | ❌     | ✅         |

### Filtrado de Datos

Los servicios filtran automáticamente los datos según el rol:

```javascript
// En ClientService.getActivePlans()
if (session.role === USER_ROLES.ATHLETE) {
  // Solo devuelve planes del atleta actual
  return plans.filter((p) => p.athleteId === session.userId);
}

if (session.role === USER_ROLES.COACH) {
  // Devuelve todos los planes
  return plans;
}
```

---

## Datos Persistidos

### Estructura de localStorage

```javascript
// Sesión de usuario
expert_planner_user_session: {
  role: "athlete",
  userId: "athlete_123-456-789",
  loginAt: "2024-01-15T10:30:00.000Z"
}

// Clientes y planes
expert_planner_clients: [
  {
    id: "uuid",
    athleteId: "athlete_123-456-789", // Vinculado al usuario
    name: "Juan Pérez",
    sport: "Fútbol",
    status: "COMPLETED",
    plan: "Plan de entrenamiento...",
    planObject: [...],
    progress: 45
  }
]

// Reservas de gimnasio
expert_planner_gym_bookings: [
  {
    id: "timestamp",
    athleteId: "athlete_123-456-789", // Vinculado al usuario
    date: "2024-01-20",
    slotId: "morning",
    status: "CONFIRMED"
  }
]

// Citas
expert_planner_appointments: [
  {
    id: "timestamp",
    athleteId: "athlete_123-456-789", // Vinculado al usuario
    date: "2024-01-20",
    time: "10:00",
    status: "SCHEDULED"
  }
]

// Disponibilidad de gimnasio (compartida)
expert_planner_gym_availability: [...]

// Disponibilidad de citas (compartida)
expert_planner_appointment_availability: [...]
```

### Datos por Usuario vs Compartidos

**Datos por Usuario** (filtrados por `athleteId`):

- Clientes/Planes
- Reservas de gimnasio
- Citas

**Datos Compartidos**:

- Disponibilidad de gimnasio (configurada por entrenador)
- Disponibilidad de citas (configurada por entrenador)

---

## Migración a API REST

### Configuración Actual

En [`src/services/dataServices.js`](../src/services/dataServices.js):

```javascript
const API_CONFIG = {
  BASE_URL: process.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  TIMEOUT: 30000,
  USE_MOCK: true, // ← Cambiar a false cuando la API esté lista
};
```

### Pasos para Migración

1. **Crear API Backend**
   - Implementar endpoints REST
   - Añadir autenticación JWT
   - Implementar filtrado por usuario en el backend

2. **Configurar Variables de Entorno**

   ```bash
   # .env.production
   VITE_API_BASE_URL=https://api.expert-planner.com/v1
   ```

3. **Activar Modo API**

   ```javascript
   const API_CONFIG = {
     BASE_URL: process.env.VITE_API_BASE_URL,
     TIMEOUT: 30000,
     USE_MOCK: false, // ← Cambiar a false
   };
   ```

4. **Sin Cambios en Componentes**
   - Los componentes siguen usando los mismos servicios
   - La interfaz no cambia
   - Los servicios manejan la transición internamente

### Ejemplo de Endpoints API

```
GET    /api/clients                    # Obtener clientes (filtrado por usuario)
POST   /api/clients                    # Crear solicitud de plan
PUT    /api/clients/:id/plan           # Actualizar plan

GET    /api/gym/schedule?date=...      # Obtener horarios
POST   /api/gym/bookings               # Reservar gimnasio
DELETE /api/gym/bookings/:id           # Cancelar reserva

GET    /api/appointments               # Obtener citas
POST   /api/appointments               # Crear cita
PUT    /api/appointments/:id           # Actualizar estado
```

### Autenticación en API

Cuando se migre a API, el token se guardará en la sesión:

```javascript
// Login con API
const response = await fetch("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();

// Guardar en sesión
login(user.role, { token });

// Los servicios incluirán el token automáticamente
class ApiClient {
  getAuthHeaders() {
    const session = getCurrentSession();
    if (session?.token) {
      return {
        Authorization: `Bearer ${session.token}`,
      };
    }
    return {};
  }
}
```

---

## Gestión de Errores

### En Modo Mock

```javascript
try {
  const result = await gymService.bookGymSlot(date, slotId);

  if (!result.success) {
    // Error de negocio (cupos agotados, etc.)
    showToast(result.message, "error");
  }
} catch (error) {
  // Error del sistema
  console.error(error);
  showToast("Error al procesar la solicitud", "error");
}
```

### En Modo API

```javascript
try {
  const result = await gymService.bookGymSlot(date, slotId);
  showToast("Reserva confirmada", "success");
} catch (error) {
  if (error.status === 401) {
    // No autenticado
    logout();
    navigate("/login");
  } else if (error.status === 403) {
    // Sin permisos
    showToast("No tienes permiso para esta acción", "error");
  } else if (error.status === 409) {
    // Conflicto (cupos agotados)
    showToast("Cupos agotados para este horario", "error");
  } else {
    // Error genérico
    showToast("Error al procesar la solicitud", "error");
  }
}
```

---

## Mejores Prácticas

### 1. Siempre Usar Servicios

❌ **Incorrecto** (acceso directo a MockDatabase):

```javascript
const { clients, addClientRequest } = useMockDatabase();
```

✅ **Correcto** (usar servicios):

```javascript
const { clientService } = createServices(mockDb);
const clients = await clientService.getClients();
```

### 2. Manejar Estados de Carga

```javascript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await clientService.getActivePlans();
    setPlans(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### 3. Validar Permisos en UI

```javascript
const { isCoach, isAthlete } = useSession();

return (
  <div>
    {isAthlete && <Button onClick={createPlan}>Solicitar Plan</Button>}
    {isCoach && <Button onClick={reviewPlans}>Revisar Solicitudes</Button>}
  </div>
);
```

### 4. Limpiar Datos al Cerrar Sesión

```javascript
// Logout normal (mantiene datos)
const handleLogout = () => {
  logout(false);
};

// Logout completo (borra todo)
const handleFullLogout = () => {
  logout(true);
};
```

---

## Testing

### Probar con Diferentes Usuarios

1. **Modo Atleta**:

   ```javascript
   login(USER_ROLES.ATHLETE);
   // Crear plan, reservar gimnasio, ver solo tus datos
   ```

2. **Modo Entrenador**:

   ```javascript
   login(USER_ROLES.COACH);
   // Ver todas las solicitudes, configurar horarios
   ```

3. **Cambiar de Usuario**:

   ```javascript
   logout(false); // Mantiene datos
   login(USER_ROLES.ATHLETE); // Nuevo usuario
   ```

4. **Limpiar Todo**:
   ```javascript
   logout(true); // Borra toda la data
   ```

---

## Troubleshooting

### Problema: Los datos no persisten

**Solución**: Verificar que `setToStorage` se esté llamando en los `useEffect`:

```javascript
useEffect(() => {
  setToStorage(STORAGE_KEYS.CLIENTS, clients);
}, [clients]);
```

### Problema: Veo datos de otros usuarios

**Solución**: Verificar que el servicio esté filtrando por `athleteId`:

```javascript
const session = getCurrentSession();
return allData.filter((item) => item.athleteId === session.userId);
```

### Problema: La sesión se pierde al recargar

**Solución**: Verificar que `useSession` esté inicializando desde `getCurrentSession()`:

```javascript
const [session, setSession] = useState(() => getCurrentSession());
```

### Problema: Errores al migrar a API

**Solución**: Verificar que `USE_MOCK` esté configurado correctamente y que los endpoints coincidan.

---

## Próximas Mejoras

- [ ] Implementar sincronización offline/online
- [ ] Añadir caché de datos para mejorar performance
- [ ] Implementar websockets para actualizaciones en tiempo real
- [ ] Añadir compresión de datos en localStorage
- [ ] Implementar versionado de esquema de datos
- [ ] Añadir migraciones automáticas de datos

---

## Referencias

- [Storage Utils](../src/utils/storage.js)
- [Auth Utils](../src/utils/auth.js)
- [Data Services](../src/services/dataServices.js)
- [MockDatabase Context](../src/context/MockDatabase.jsx)
- [App Component](../src/App.jsx)
