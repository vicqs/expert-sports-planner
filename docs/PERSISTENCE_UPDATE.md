# Actualización de Persistencia y Preparación para API

## Fecha

**16 de Enero, 2024**

## Resumen Ejecutivo

Se ha implementado un sistema completo de gestión de sesiones y persistencia de datos preparado para migración a API REST. Los cambios incluyen:

- ✅ **Sistema de Sesiones Persistentes**: Los usuarios mantienen su sesión tras recargar la página
- ✅ **Control de Acceso por Rol**: Atletas y entrenadores ven solo los datos que les corresponden
- ✅ **Capa de Servicios**: Abstracción completa de MockDatabase para facilitar migración a API
- ✅ **Arquitectura API-Ready**: Un cambio de configuración permite usar API real sin modificar componentes

---

## Cambios Implementados

### 1. Sistema de Autenticación y Sesiones

#### Archivo: `src/utils/auth.js`

**Antes:**

- Solo se manejaba `athleteId` sin persistencia de rol
- No había logout completo
- No se diferenciaba entre atleta y entrenador

**Después:**

```javascript
const { session, login, logout, isAthlete, isCoach } = useSession();

// Login con rol
login(USER_ROLES.ATHLETE);

// Logout (mantiene datos)
logout(false);

// Logout completo (borra todo)
logout(true);

// Verificar rol
if (isAthlete) {
  /* ... */
}
if (isCoach) {
  /* ... */
}
```

**Beneficios:**

- Sesión persiste entre recargas de página
- Logout limpia la sesión correctamente
- Código más limpio y semántico

---

### 2. Capa de Servicios de Datos

#### Archivo: `src/services/dataServices.js`

Nueva capa de abstracción que prepara para API:

```javascript
const { clientService, gymService, appointmentService } =
  createServices(mockDb);

// Todas las operaciones pasan por servicios
const plans = await clientService.getActivePlans();
const bookings = await gymService.getAthleteGymBookings();
const appointments = await appointmentService.getAthleteAppointments();
```

**Características:**

1. **Filtrado Automático por Rol**
   - Atletas ven solo sus datos
   - Entrenadores ven todos los datos

2. **Validación de Permisos**
   - Cada método verifica que el usuario tenga permisos
   - Lanza excepciones si no está autorizado

3. **API-Ready**

   ```javascript
   const API_CONFIG = {
     BASE_URL: process.env.VITE_API_BASE_URL,
     USE_MOCK: true, // ← Cambiar a false para usar API real
   };
   ```

4. **Sin Cambios en Componentes**
   - Los componentes usan servicios igual con Mock o API
   - Solo se cambia la configuración

---

### 3. Actualización del App Component

#### Archivo: `src/App.jsx`

**Cambios:**

- Usa `useSession()` en lugar de `useState(role)`
- La sesión persiste automáticamente
- Pasa servicios a los dashboards

**Antes:**

```jsx
const [role, setRole] = useState(null);

<AthleteDashboard onExit={() => setRole(null)} />;
```

**Después:**

```jsx
const { session, login, logout, isAthlete, isCoach } = useSession();

<AthleteDashboard onExit={logout} services={services} />;
```

---

### 4. Actualización de Storage Keys

#### Archivo: `src/utils/storage.js`

Nueva clave para sesión de usuario:

```javascript
export const STORAGE_KEYS = {
  // Nuevo
  USER_SESSION: "expert_planner_user_session",

  // Existentes
  CLIENTS: "expert_planner_clients",
  GYM_AVAILABILITY: "expert_planner_gym_availability",
  // ...
};
```

---

## Flujo de Datos con Nueva Arquitectura

### Antes (Acoplado a MockDatabase)

```
Componente
    ↓
useMockDatabase()
    ↓
localStorage
```

### Después (Preparado para API)

```
Componente
    ↓
Services (ClientService, GymService, etc.)
    ↓
    ├── USE_MOCK = true → MockDatabase → localStorage
    ├── USE_MOCK = false → API Client → Backend API
```

---

## Control de Acceso por Rol

### Operaciones Permitidas

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

### Ejemplo de Filtrado

```javascript
// En ClientService.getActivePlans()
async getActivePlans() {
  const session = getCurrentSession();
  const allPlans = this.mockDb.getActivePlans();

  if (session.role === USER_ROLES.ATHLETE) {
    // Atleta ve solo sus planes
    return allPlans.filter(p => p.athleteId === session.userId);
  }

  if (session.role === USER_ROLES.COACH) {
    // Entrenador ve todos
    return allPlans;
  }

  return [];
}
```

---

## Datos Persistidos

### Estructura en localStorage

```javascript
// Sesión de usuario (NUEVO)
{
  "expert_planner_user_session": {
    "role": "athlete",
    "userId": "athlete_123-456-789",
    "loginAt": "2024-01-16T10:30:00.000Z"
  }
}

// Clientes/Planes (con athleteId vinculado)
{
  "expert_planner_clients": [
    {
      "id": "uuid",
      "athleteId": "athlete_123-456-789", // Vinculado al usuario
      "name": "Juan Pérez",
      "status": "COMPLETED",
      "planObject": [...],
      "progress": 45
    }
  ]
}

// Reservas de gimnasio (con athleteId vinculado)
{
  "expert_planner_gym_bookings": [
    {
      "id": "uuid",
      "athleteId": "athlete_123-456-789", // Vinculado al usuario
      "date": "2024-01-20",
      "status": "CONFIRMED"
    }
  ]
}

// Similar para appointments...
```

---

## Migración a API - Pasos

### 1. Desarrollar Backend

Ver documentación completa en [API_MIGRATION.md](./API_MIGRATION.md)

```bash
# Crear proyecto backend
npm init
npm install express pg jsonwebtoken bcrypt cors helmet
```

### 2. Configurar Variables de Entorno

```bash
# .env.production
VITE_API_BASE_URL=https://api.expert-planner.com/v1
VITE_USE_MOCK=false
```

### 3. Activar Modo API

```javascript
// src/services/dataServices.js
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  USE_MOCK: import.meta.env.VITE_USE_MOCK === "true", // false en producción
};
```

### 4. ¡Sin Cambios en Componentes!

Los componentes siguen usando los servicios exactamente igual:

```jsx
// Este código funciona con Mock o con API
const { clientService } = createServices(mockDb);
const plans = await clientService.getActivePlans();
```

---

## Testing

### Escenarios de Prueba

#### 1. Persistencia de Sesión

```
1. Login como atleta
2. Recargar página
3. ✅ Sesión debe mantenerse
```

#### 2. Separación de Datos

```
1. Login como atleta A
2. Crear plan
3. Logout
4. Login como atleta B
5. ✅ No debe ver el plan de atleta A
```

#### 3. Control de Acceso

```
1. Login como atleta
2. Intentar configurar horario de gimnasio
3. ✅ Debe recibir error "Unauthorized"
```

#### 4. Logout Completo

```
1. Login como atleta
2. Crear datos
3. Logout completo (true)
4. ✅ Datos deben borrarse
```

---

## Archivos Modificados

### Archivos Nuevos

- ✅ `src/services/dataServices.js` (450+ líneas)
- ✅ `docs/PERSISTENCE_GUIDE.md` (600+ líneas)
- ✅ `docs/API_MIGRATION.md` (800+ líneas)

### Archivos Modificados

- ✅ `src/utils/auth.js` (expandido con useSession)
- ✅ `src/utils/storage.js` (agregado USER_SESSION key)
- ✅ `src/App.jsx` (integración con useSession y servicios)

---

## Mejoras de Arquitectura

### Antes

```
❌ Rol en useState (se pierde al recargar)
❌ Componentes acoplados a MockDatabase
❌ Sin validación de permisos
❌ No preparado para API
```

### Después

```
✅ Rol persiste en localStorage
✅ Componentes desacoplados (usan servicios)
✅ Validación de permisos en cada operación
✅ API-ready con configuración
```

---

## Próximas Mejoras Sugeridas

### Corto Plazo

- [ ] Añadir UI de Login/Register (actualmente solo RoleSelector)
- [ ] Implementar refresh token
- [ ] Añadir indicadores de loading en operaciones async
- [ ] Implementar manejo de errores visual (toasts)

### Mediano Plazo

- [ ] Desarrollar backend API (Node.js/Python/.NET)
- [ ] Configurar base de datos PostgreSQL
- [ ] Implementar autenticación JWT
- [ ] Migrar de Mock a API real

### Largo Plazo

- [ ] Implementar sincronización offline/online
- [ ] Añadir websockets para actualizaciones en tiempo real
- [ ] Implementar caché de datos
- [ ] Añadir analytics y monitoreo

---

## Comandos de Verificación

### Build de Producción

```bash
npm run build
```

### Verificar localStorage

```javascript
// En DevTools Console
localStorage.getItem("expert_planner_user_session");
```

### Simular Diferentes Usuarios

```javascript
// Login como atleta 1
login(USER_ROLES.ATHLETE);

// Logout sin borrar datos
logout(false);

// Login como atleta 2 (diferente ID)
login(USER_ROLES.ATHLETE);
```

---

## Referencias

- [Guía de Persistencia](./PERSISTENCE_GUIDE.md) - Documentación detallada de persistencia
- [Guía de Migración a API](./API_MIGRATION.md) - Pasos completos para migrar a API
- [Arquitectura de la Aplicación](./ARCHITECTURE.md) - Diagrama de arquitectura completo
- [Mejores Prácticas](./BEST_PRACTICES.md) - Estándares de código

---

## Contacto y Soporte

Para preguntas sobre la implementación:

1. Revisar documentación en `docs/`
2. Verificar ejemplos de código en los servicios
3. Ejecutar tests de integración

---

**Estado**: ✅ Implementación Completa
**Próximo Milestone**: Desarrollo de Backend API
