# Guía de Migración a API REST

## Descripción General

Este documento describe cómo migrar **Expert Sports Planner** de usar `MockDatabase` con `localStorage` a una API REST real.

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
    role VARCHAR(20) NOT NULL CHECK (role IN ('athlete', 'coach')),
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

### 1. Configuración de Variables de Entorno

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_MOCK=true

# .env.production
VITE_API_BASE_URL=https://api.expert-planner.com/v1
VITE_USE_MOCK=false
```

### 2. Actualizar dataServices.js

```javascript
// src/services/dataServices.js

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  TIMEOUT: 30000,
  USE_MOCK: import.meta.env.VITE_USE_MOCK === "true", // Desde .env
};
```

### 3. Añadir Login/Register UI

```jsx
// src/components/Login.jsx
import { useState } from "react";
import { useSession } from "../utils/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loginWithCredentials } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const { user, token } = await response.json();

      // Guardar sesión con token
      loginWithCredentials(user.role, { token, ...user });
    } catch (error) {
      console.error(error);
      alert("Error al iniciar sesión");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
}
```

### 4. Actualizar useSession para API

```javascript
// src/utils/auth.js

export const loginWithCredentials = async (email, password) => {
  const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const { user, token } = await response.json();

  const session = {
    role: user.role,
    userId: user.id,
    token,
    email: user.email,
    name: user.name,
    loginAt: new Date().toISOString(),
  };

  saveSession(session);
  return session;
};
```

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

- [ ] Actualizar variables de entorno
- [ ] Cambiar `USE_MOCK` a `false`
- [ ] Crear componentes de Login/Register
- [ ] Actualizar `useSession` para manejar tokens
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

1. **Semana 1-2**: Desarrollar backend API
2. **Semana 3**: Integrar frontend con API
3. **Semana 4**: Testing y corrección de bugs
4. **Semana 5**: Deploy y monitoreo

---

## Referencias

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://jwt.io/introduction)
- [REST API Design](https://restfulapi.net/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
