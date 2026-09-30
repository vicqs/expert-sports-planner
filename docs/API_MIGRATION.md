# Guía de Migración a API REST

## Descripción General

Este documento describe cómo migrar **Expert Sports Planner** de usar `MockDatabase` con `localStorage` a una API REST real.

### Estado actual y brechas a cubrir

| Tema                          | Estado actual                                                                            | Implicación para la API                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Roles                         | `TRAINER`, `ATHLETE`, `ADMIN` (mayúsculas)                                               | Los ejemplos de este documento usan `coach`/`athlete`; mapear `coach` → `TRAINER` y añadir `ADMIN` |
| Capa de servicios             | `services/dataServices.ts` existe, con `USE_MOCK = true`, y **ningún componente la usa** | Los componentes hablan con `MockDatabase`; hay que reconectarlos (ver «Cambios en el Frontend»)    |
| Autenticación                 | Hash SHA-256 en cliente, usuarios en `localStorage`                                      | Mover a servidor (bcrypt/argon2, JWT o cookie `HttpOnly`)                                          |
| Vinculación entrenador–atleta | Solicitudes (`athleteRequests`) y `trainerId` en el usuario                              | Requiere tablas y endpoints propios (ver «Ampliaciones del modelo»)                                |
| Datos de perfil               | Avatar, contacto de emergencia, lesiones, notas médicas, preferencias de notificación    | Columnas/tablas adicionales                                                                        |
| Suscripciones                 | Planes `FREE`/`BASIC`/`PRO`/`GYM`, trial y límites                                       | Modelo de suscripción en servidor                                                                  |

Documentos relacionados: [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md), [API_SERVICES.md](./API_SERVICES.md), [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md), [SECURITY.md](./SECURITY.md).

---

## Arquitectura Objetivo

### Antes (Estado Actual)

```
┌────────────────┐
│   Navegador    │
│                │
│  React App     │
│  MockDatabase  │
│  localStorage  │
└────────────────┘
```

### Después (Con API)

```
┌────────────────┐         ┌────────────────┐
│   Navegador    │ HTTP    │   Servidor     │
│                │◄───────►│                │
│  React App     │ REST    │  API Backend   │
│  Data Services │         │  Database      │
└────────────────┘         └────────────────┘
```

---

## Backend API - Especificación

### Stack Tecnológico Recomendado

**Opción 1: Node.js + Express**

```javascript
// express + postgresql
npm install express pg jsonwebtoken bcrypt cors helmet
```

**Opción 2: Python + FastAPI**

```python
# fastapi + postgresql
pip install fastapi uvicorn sqlalchemy psycopg2 python-jose passlib
```

**Opción 3: .NET Core**

```bash
dotnet new webapi -n ExpertSportsAPI
```

---

## Modelo de Datos PostgreSQL

### Esquema de Base de Datos

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ATHLETE', 'TRAINER', 'ADMIN')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de clientes/solicitudes de planes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(100) NOT NULL,
    age INTEGER,
    experience_level VARCHAR(50),
    training_goals TEXT,
    available_days JSONB,
    injuries TEXT,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED')),
    plan TEXT,
    plan_object JSONB,
    progress INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de disponibilidad de gimnasio
CREATE TABLE gym_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    slots JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de reservas de gimnasio
CREATE TABLE gym_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, date, status)
);

-- Tabla de citas
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time VARCHAR(10) NOT NULL,
    reason TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de disponibilidad de citas
CREATE TABLE appointment_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL UNIQUE,
    slots JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX idx_clients_athlete_id ON clients(athlete_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_gym_bookings_athlete_id ON gym_bookings(athlete_id);
CREATE INDEX idx_gym_bookings_date ON gym_bookings(date);
CREATE INDEX idx_appointments_athlete_id ON appointments(athlete_id);
CREATE INDEX idx_appointments_date ON appointments(date);
```

---

### Ampliaciones del modelo (no cubiertas por el esquema anterior)

Derivadas de `src/types/index.ts` y de la lógica actual ([BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)):

- `users`: `avatar_id`, `trainer_id` (FK a `users`), `is_super` (administrador protegido), `subscription_plan`, `subscription_status`, `trial_ends_at`, `emergency_contact` (JSONB), `injuries` (JSONB, editable solo por el entrenador), `basic_info` (JSONB), `notification_prefs` (JSONB).
- `athlete_requests`: solicitudes de un atleta a un entrenador (`athlete_id`, `trainer_id`, `status`, fechas).
- Biblioteca del entrenador: tablas `exercises` y `equipment` (por entrenador, con metadatos) que hoy se guardan desde los hooks `useCustomExercises`/`useEquipment`/`useTrainerLibrary`.
- `gym_availability`, `appointment_availability`: añadir `trainer_id` si hay más de un entrenador (hoy la disponibilidad es global).

Validar cada campo contra los tipos reales antes de escribir las migraciones.

---

## Endpoints de la API

### Autenticación

#### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "securePassword123",
  "name": "Juan Pérez",
  "role": "athlete"
}

Response 201:
{
  "user": {
    "id": "uuid",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "athlete"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "role": "athlete"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Authorization: Bearer <token>

Response 200:
{
  "token": "newTokenHere..."
}
```

---

### Clientes y Planes

#### Obtener Clientes

```http
GET /api/clients?status=PENDING
Authorization: Bearer <token>

# Atleta: retorna solo sus clientes
# Entrenador: retorna todos los clientes

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "athleteId": "uuid",
      "name": "Juan Pérez",
      "sport": "Fútbol",
      "status": "PENDING",
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### Crear Solicitud de Plan

```http
POST /api/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Juan Pérez",
  "sport": "Fútbol",
  "age": 25,
  "experienceLevel": "intermediate",
  "trainingGoals": "Mejorar resistencia",
  "availableDays": ["monday", "wednesday", "friday"],
  "injuries": "Ninguna"
}

Response 201:
{
  "id": "uuid",
  "athleteId": "uuid",
  "status": "PENDING",
  "submittedAt": "2024-01-15T10:30:00Z"
}
```

#### Actualizar Plan (Coach only)

```http
PUT /api/clients/:id/plan
Authorization: Bearer <token>
Content-Type: application/json

{
  "planText": "Plan de entrenamiento personalizado...",
  "planObject": [
    {
      "week": 1,
      "days": [...]
    }
  ]
}

Response 200:
{
  "id": "uuid",
  "status": "COMPLETED",
  "completedAt": "2024-01-15T11:00:00Z"
}
```

#### Marcar Sesión Completada

```http
POST /api/clients/:id/sessions/toggle
Authorization: Bearer <token>
Content-Type: application/json

{
  "weekIndex": 0,
  "dayIndex": 2
}

Response 200:
{
  "progress": 45,
  "session": {
    "completed": true
  }
}
```

---

### Gimnasio

#### Obtener Horarios

```http
GET /api/gym/schedule?date=2024-01-20
Authorization: Bearer <token>

Response 200:
{
  "date": "2024-01-20",
  "slots": [
    {
      "id": "morning",
      "time": "06:00 - 08:00",
      "capacity": 15,
      "reserved": 8
    }
  ]
}
```

#### Actualizar Horarios (Coach only)

```http
PUT /api/gym/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "slots": [
    {
      "id": "morning",
      "time": "06:00 - 08:00",
      "capacity": 15,
      "reserved": 0
    }
  ]
}

Response 200:
{
  "date": "2024-01-20",
  "slots": [...]
}
```

#### Reservar Gimnasio

```http
POST /api/gym/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "slotId": "morning"
}

Response 201:
{
  "id": "uuid",
  "athleteId": "uuid",
  "date": "2024-01-20",
  "slotId": "morning",
  "status": "CONFIRMED"
}

Response 409 (Conflict):
{
  "error": "Ya tienes una reserva para este día"
}
```

#### Obtener Mis Reservas

```http
GET /api/gym/bookings
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "date": "2024-01-20",
      "slotId": "morning",
      "time": "06:00 - 08:00",
      "status": "CONFIRMED"
    }
  ]
}
```

#### Cancelar Reserva

```http
DELETE /api/gym/bookings/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

---

### Citas

#### Crear Cita

```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-20",
  "time": "10:00",
  "reason": "Evaluación inicial"
}

Response 201:
{
  "id": "uuid",
  "athleteId": "uuid",
  "date": "2024-01-20",
  "time": "10:00",
  "status": "SCHEDULED"
}
```

#### Obtener Mis Citas

```http
GET /api/appointments
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "date": "2024-01-20",
      "time": "10:00",
      "reason": "Evaluación inicial",
      "status": "SCHEDULED"
    }
  ]
}
```

#### Obtener Citas del Día (Coach)

```http
GET /api/appointments?date=2024-01-20
Authorization: Bearer <token>

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "athleteId": "uuid",
      "athleteName": "Juan Pérez",
      "time": "10:00",
      "reason": "Evaluación inicial",
      "status": "SCHEDULED"
    }
  ]
}
```

---

## Implementación de Ejemplo (Node.js + Express)

### Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── auth.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── roleMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── GymBooking.js
│   │   └── Appointment.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── clients.js
│   │   ├── gym.js
│   │   └── appointments.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── clientController.js
│   │   ├── gymController.js
│   │   └── appointmentController.js
│   ├── services/
│   │   ├── clientService.js
│   │   ├── gymService.js
│   │   └── appointmentService.js
│   └── app.js
├── .env
├── package.json
└── README.md
```

### Middleware de Autenticación

```javascript
// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
```

### Middleware de Roles

```javascript
// src/middleware/roleMiddleware.js
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};

module.exports = requireRole;
```

### Controlador de Clientes

```javascript
// src/controllers/clientController.js
const clientService = require("../services/clientService");

const getClients = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let clients;

    if (userRole === "coach") {
      // Entrenador ve todos los clientes
      clients = await clientService.getAllClients(status);
    } else {
      // Atleta ve solo sus clientes
      clients = await clientService.getClientsByAthlete(userId, status);
    }

    res.json({ data: clients, total: clients.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const athleteId = req.user.id;
    const clientData = { ...req.body, athleteId };

    const client = await clientService.createClient(clientData);

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planText, planObject } = req.body;

    const client = await clientService.updatePlan(id, planText, planObject);

    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getClients,
  createClient,
  updatePlan,
};
```

### Rutas de Clientes

```javascript
// src/routes/clients.js
const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener clientes (ambos roles)
router.get("/", clientController.getClients);

// Crear cliente (solo atletas)
router.post("/", requireRole("athlete"), clientController.createClient);

// Actualizar plan (solo entrenadores)
router.put("/:id/plan", requireRole("coach"), clientController.updatePlan);

// Marcar sesión (solo atletas)
router.post(
  "/:id/sessions/toggle",
  requireRole("athlete"),
  clientController.toggleSession,
);

module.exports = router;
```

---

## Cambios en el Frontend

> Los ejemplos de esta sección están alineados con el código actual (TypeScript, Zustand). Ver [API_SERVICES.md](./API_SERVICES.md) y [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md).

### 1. Configuración de variables de entorno

Solo se consume `VITE_API_BASE_URL` (ver [src/services/dataServices.ts](../src/services/dataServices.ts)). **No existe `VITE_USE_MOCK`**: `USE_MOCK` está fijado en `true` en `API_CONFIG`.

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api

# .env.production (configurar en Vercel → Environment Variables)
VITE_API_BASE_URL=https://api.expert-planner.com/v1
```

> Toda variable `VITE_*` se incluye en el bundle público: no colocar secretos (hoy `VITE_ADMIN_PASSWORD_HASH` es una excepción temporal de la fase mock; ver [SECURITY.md](./SECURITY.md)).

### 2. Activar la capa de servicios

En `dataServices.ts`, sustituir el valor fijo por una condición basada en entorno o eliminarlo cuando la API esté lista:

```typescript
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  USE_MOCK: import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL,
};
```

Además, los componentes **hoy no consumen** `ClientService`, `GymService` ni `AppointmentService`: acceden a `MockDatabase` (`useMockDatabase()`). La migración consiste en:

1. Hacer que `MockDatabase` (o los stores que lo reemplacen) deleguen en los servicios.
2. Convertir sus operaciones síncronas en asíncronas (estados `loading`/`error`).
3. Retirar la persistencia y la siembra de datos demo (`localStorage`) del proveedor.

### 3. Autenticación

La UI de login/registro ya existe (`AuthPage`). Lo que cambia es la fuente de verdad: `useAuthStore` llama hoy a `loginUser`/`registerUser` de `utils/auth.ts` (hash SHA-256 en cliente). Debe llamar a los endpoints `/auth/*`:

```typescript
// src/store/useAuthStore.ts (esquema)
login: async (email, password) => {
  set({ loading: true, error: null });
  try {
    const { user } = await ApiClient.post("/auth/login", { email, password });
    set({ currentUser: user, loading: false });
    return { success: true, user };
  } catch (err) {
    const message = (err as Error).message;
    set({ error: message, loading: false });
    return { success: false, error: message };
  }
},
```

Puntos clave:

- Mantener el contrato `{ success, user?, error? }` para no modificar los componentes.
- Preferir un token en cookie `HttpOnly; Secure; SameSite` (el backend la fija) frente a guardarlo en `localStorage`.
- Si se usa Bearer, `ApiClient` ya lee `session.token`; adaptarlo a donde se almacene realmente.
- Interceptar `401` en `ApiClient` para ejecutar `logout()` (ver [SECURITY.md](./SECURITY.md) §4).
- Reemplazar `syncFromStorage` y el listener del evento `storage` (`AuthContext`) por una consulta `GET /auth/me` al iniciar la app.
- Eliminar `initializeSuperAdmin`, `quickAdminLogin` y el login por nombre sin contraseña.
- Las funciones trainer-only (`updateAthleteBasicInfo`, `setAthleteInjuries`) pasan a endpoints protegidos por rol en el servidor.

---

## Checklist de Migración

### Backend

- [ ] Crear proyecto backend (Node.js/Python/.NET)
- [ ] Configurar base de datos PostgreSQL
- [ ] Crear esquema de tablas
- [ ] Implementar middleware de autenticación JWT
- [ ] Implementar middleware de roles
- [ ] Crear endpoints de autenticación
- [ ] Crear endpoints de clientes
- [ ] Crear endpoints de gimnasio
- [ ] Crear endpoints de citas
- [ ] Añadir validación de datos
- [ ] Implementar manejo de errores
- [ ] Configurar CORS
- [ ] Añadir rate limiting
- [ ] Implementar logging
- [ ] Crear tests unitarios
- [ ] Crear tests de integración
- [ ] Documentar API (Swagger/OpenAPI)
- [ ] Configurar CI/CD
- [ ] Deploy a servidor

### Frontend

- [ ] Configurar `VITE_API_BASE_URL`
- [ ] Desactivar `USE_MOCK` en `API_CONFIG`
- [ ] Reconectar `MockDatabase` (o sus stores sustitutos) a los servicios
- [ ] Adaptar `useAuthStore` a los endpoints `/auth/*` (mantener `{ success, error }`)
- [ ] Manejar `401` globalmente (logout y aviso de sesión expirada)
- [ ] Eliminar `initializeSuperAdmin`, `quickAdminLogin`, login por nombre y `VITE_ADMIN_PASSWORD_HASH`
- [ ] Probar todos los flujos de usuario
- [ ] Añadir manejo de errores de red
- [ ] Implementar refresh token
- [ ] Añadir loading states
- [ ] Probar en producción
- [ ] Configurar error tracking (Sentry)

---

## Testing de la Migración

### 1. Test Local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm run dev -- --mode development
```

### 2. Test con Postman

Importar colección de endpoints y probar:

- Registro
- Login
- Obtener clientes
- Crear plan
- Reservar gimnasio

### 3. Test E2E

```javascript
// tests/e2e/booking.spec.js
describe("Gym Booking Flow", () => {
  it("should allow athlete to book a gym slot", async () => {
    // Login
    await page.goto("/login");
    await page.fill('[name="email"]', "athlete@test.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');

    // Book gym
    await page.click("text=Reservar Gimnasio");
    await page.click("text=06:00 - 08:00");
    await page.click("text=Confirmar");

    // Verify
    await expect(page.locator("text=Reserva confirmada")).toBeVisible();
  });
});
```

---

## Monitoreo y Logs

### Backend Logging

```javascript
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Log todas las requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    userId: req.user?.id,
    body: req.body,
  });
  next();
});
```

---

## Seguridad

### 1. Validación de Datos

```javascript
const { body, validationResult } = require("express-validator");

router.post(
  "/clients",
  authMiddleware,
  requireRole("athlete"),
  [
    body("name").trim().isLength({ min: 1 }).escape(),
    body("sport").trim().isLength({ min: 1 }).escape(),
    body("age").isInt({ min: 1, max: 120 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continuar...
  },
);
```

### 2. Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
});

app.use("/api/", apiLimiter);
```

### 3. Helmet (Security Headers)

```javascript
const helmet = require("helmet");

app.use(helmet());
```

---

## Próximos Pasos

1. Backend API (autenticación, usuarios, clientes/planes, vinculación, gimnasio, citas)
2. Integración del frontend con la API
3. Pruebas (ver [TESTING.md](./TESTING.md)) y corrección de errores
4. Despliegue y monitoreo

---

## Referencias

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://jwt.io/introduction)
- [REST API Design](https://restfulapi.net/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
