# Arquitectura del Sistema

## 📐 Visión General

Expert Sports Planner es una Progressive Web App (PWA) construida con React + Vite que permite a entrenadores crear planes de entrenamiento personalizados para atletas.

```
┌─────────────────────────────────────────────────┐
│              EXPERT SPORTS PLANNER              │
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │   Athlete    │         │    Coach     │    │
│  │  Dashboard   │         │  Dashboard   │    │
│  └──────┬───────┘         └──────┬───────┘    │
│         │                        │             │
│         └────────┬───────────────┘             │
│                  │                             │
│         ┌────────▼───────────┐                │
│         │  MockDatabase      │                │
│         │  (Context + LS)    │                │
│         └────────────────────┘                │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │         LocalStorage Persistence         │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🏗️ Estructura del Proyecto

```
expert-sports-planner/
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes de UI reutilizables
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ...
│   │   ├── AthleteDashboard.jsx
│   │   ├── CoachDashboard.jsx
│   │   ├── PlanEditor.jsx
│   │   └── ...
│   ├── context/              # Context API
│   │   └── MockDatabase.jsx  # Estado global + persistencia
│   ├── utils/                # Utilidades
│   │   ├── auth.js          # Autenticación (mock)
│   │   ├── constants.js     # Constantes del dominio
│   │   ├── generator.js     # Generador de planes
│   │   └── storage.js       # Abstracción de localStorage
│   ├── styles/               # Estilos globales
│   │   ├── animations.css
│   │   ├── main.css
│   │   └── variables.css
│   ├── App.jsx               # Componente raíz
│   └── main.jsx              # Entry point
├── docs/                     # Documentación
├── .gitignore
├── package.json
├── vite.config.js
└── index.html
```

---

## 🧩 Capas de la Aplicación

### 1. **Presentation Layer (UI)**

**Responsabilidad:** Renderizar UI y capturar interacciones del usuario

**Componentes principales:**

- `Layout` - Shell de la aplicación
- `RoleSelector` - Selector de rol (Atleta/Entrenador)
- `AthleteDashboard` - Panel del atleta
- `CoachDashboard` - Panel del entrenador
- `PlanEditor` - Editor de planes de entrenamiento
- `PlanDetail` - Vista detallada de un plan

**Principios:**

- ✅ Componentes presentacionales puros cuando es posible
- ✅ Lógica mínima de negocio
- ✅ Props explícitas y tipadas
- ✅ Composición sobre herencia

---

### 2. **State Management Layer**

**Responsabilidad:** Gestionar estado global y sincronización

**Implementación:** Context API + localStorage

**Archivo:** `src/context/MockDatabase.jsx`

**Estado gestionado:**

```javascript
{
  clients: [],              // Atletas y sus planes
  gymAvailability: [],      // Disponibilidad del gimnasio
  gymBookings: [],          // Reservas de gimnasio
  appointments: [],         // Citas con el entrenador
  appointmentAvailability: [] // Disponibilidad de citas
}
```

**Operaciones:**

- CRUD de clientes
- Gestión de planes
- Sistema de reservas
- Sistema de citas

---

### 3. **Persistence Layer**

**Responsabilidad:** Persistir datos en localStorage

**Archivo:** `src/utils/storage.js`

**API:**

```javascript
getFromStorage(key, defaultValue);
setToStorage(key, value);
removeFromStorage(key);
clearAllStorage();
```

**Storage Keys:**

```javascript
STORAGE_KEYS = {
  CLIENTS: "expert_planner_clients",
  GYM_AVAILABILITY: "expert_planner_gym_availability",
  GYM_BOOKINGS: "expert_planner_gym_bookings",
  APPOINTMENTS: "expert_planner_appointments",
  APPOINTMENT_AVAILABILITY: "expert_planner_appointment_availability",
  ATHLETE_ID: "expert_planner_athlete_id",
};
```

---

### 4. **Business Logic Layer**

**Responsabilidad:** Lógica de negocio y generación de planes

**Archivos:**

- `src/utils/generator.js` - Generación de planes
- `src/utils/constants.js` - Constantes del dominio

**Funciones principales:**

```javascript
generatePlan(userData); // Genera plan basado en perfil
formatPlanToText(planData, userData); // Formatea a texto
generateAthleticsSession(); // Genera sesión de atletismo
generateGymSession(); // Genera sesión de gimnasio
```

---

## 🔄 Flujo de Datos

### Flujo: Creación de Plan

```
┌──────────────┐
│   Athlete    │ 1. Llena formulario de intake
│  Dashboard   │
└──────┬───────┘
       │
       │ 2. addClientRequest(data)
       ▼
┌──────────────┐
│ MockDatabase │ 3. Guarda en state + localStorage
│   Context    │
└──────┬───────┘
       │
       │ 4. Poll: Espera status COMPLETED
       ▼
┌──────────────┐
│    Coach     │ 5. Ve cliente pendiente
│  Dashboard   │
└──────┬───────┘
       │
       │ 6. handleGenerate(client)
       ▼
┌──────────────┐
│  generator.  │ 7. generatePlan(userData)
│     js       │
└──────┬───────┘
       │
       │ 8. Retorna planObject
       ▼
┌──────────────┐
│ PlanEditor   │ 9. Edita y personaliza
└──────┬───────┘
       │
       │ 10. onSave(planText, planObject)
       ▼
┌──────────────┐
│ MockDatabase │ 11. updateClientPlan()
└──────┬───────┘
       │
       │ 12. Status = COMPLETED
       ▼
┌──────────────┐
│   Athlete    │ 13. Ve plan completo
│  Dashboard   │
└──────────────┘
```

---

## 🎨 Patrones de Diseño Utilizados

### 1. **Context Provider Pattern**

```jsx
<MockDatabaseProvider>
  <ToastProvider>
    <App />
  </ToastProvider>
</MockDatabaseProvider>
```

**Ventajas:**

- ✅ Estado global sin prop drilling
- ✅ Fácil acceso desde cualquier componente
- ✅ Separación de concerns

---

### 2. **Custom Hooks Pattern**

```jsx
const useAthleteId = () => {
  // Encapsula lógica de sesión del atleta
};

const useToast = () => {
  // Encapsula lógica de notificaciones
};
```

**Ventajas:**

- ✅ Reutilización de lógica
- ✅ Separación de lógica de UI
- ✅ Testeable

---

### 3. **Compound Components Pattern**

```jsx
<Card>
  <Card.Header />
  <Card.Body />
  <Card.Footer />
</Card>
```

**Ventajas:**

- ✅ Flexibilidad
- ✅ Composición clara
- ✅ API intuitiva

---

### 4. **Repository Pattern** (Parcial)

```javascript
// storage.js actúa como repositorio
getFromStorage(key, defaultValue);
setToStorage(key, value);
```

**Ventajas:**

- ✅ Abstracción de persistencia
- ✅ Fácil migración a API
- ✅ Testeable

---

## 🔐 Autenticación y Autorización

**Estado actual:** Mock implementation

```javascript
// src/utils/auth.js
useAthleteId(); // Genera y persiste ID único
```

**Flujo:**

1. Usuario selecciona rol (Atleta/Entrenador)
2. Se genera ID único persistente
3. ID se usa para asociar datos

**⚠️ Limitaciones actuales:**

- No hay autenticación real
- No hay sesiones con expiración
- No hay permisos granulares

**🔮 Migración futura:**

- Integrar con Firebase Auth / Auth0
- Implementar JWT
- Roles y permisos RBAC

---

## 📦 Gestión de Estado

### Estado Local vs Global

**Estado Local (useState, useReducer):**

- UI state (modals, tabs, expanded sections)
- Form state
- Componente-specific state

**Estado Global (Context):**

- Datos de clientes
- Planes de entrenamiento
- Reservas y citas
- Disponibilidad

### Sincronización con LocalStorage

```jsx
useEffect(() => {
  setToStorage(STORAGE_KEYS.CLIENTS, clients);
}, [clients]);
```

**Ventajas:**

- ✅ Persistencia automática
- ✅ Sin backend necesario
- ✅ Offline-first

**Limitaciones:**

- ⚠️ Límite de 5-10MB
- ⚠️ Sin sincronización entre dispositivos
- ⚠️ Vulnerable a limpieza de caché

---

## 🚀 Optimizaciones Implementadas

### 1. **Code Splitting**

```javascript
// Uso de dynamic imports
const LazyComponent = lazy(() => import("./Component"));
```

### 2. **Memoization**

```jsx
const MemoizedComponent = React.memo(Component);
```

### 3. **Virtualización** (Pendiente)

Para listas largas de ejercicios/planes

---

## 🧪 Testing Strategy (Recomendado)

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── generator.test.js
│   │   │   └── storage.test.js
│   │   └── hooks/
│   │       └── useAthleteId.test.js
│   ├── integration/
│   │   └── MockDatabase.test.jsx
│   └── e2e/
│       └── athlete-flow.spec.js
```

**Herramientas recomendadas:**

- Vitest (unit tests)
- React Testing Library (component tests)
- Playwright/Cypress (E2E)

---

## 🔮 Roadmap de Arquitectura

### Fase 1: Consolidación (Actual)

- ✅ Estructura básica
- ✅ Persistencia local
- ✅ Componentes principales

### Fase 2: Mejoras de Calidad

- 🔄 Migrar a TypeScript
- 🔄 Implementar testing
- 🔄 Optimizar performance
- 🔄 Refactorizar code smells

### Fase 3: Backend Integration

- ⏳ API REST/GraphQL
- ⏳ Base de datos real
- ⏳ Autenticación robusta
- ⏳ Sincronización multi-dispositivo

### Fase 4: Escalabilidad

- ⏳ Microservicios
- ⏳ Caching estratégico
- ⏳ CDN para assets
- ⏳ Analytics y monitoring

---

## 📚 Tecnologías y Dependencias

### Core

- **React 18** - UI library
- **Vite 4** - Build tool
- **React Router** - Routing (pendiente)

### UI/UX

- **Framer Motion** - Animaciones
- **Lucide React** - Iconos
- **CSS Variables** - Theming

### State & Data

- **Context API** - State management
- **LocalStorage** - Persistencia

### Development

- **ESLint** - Linting
- **Prettier** - Code formatting

---

## 🤝 Contribución a la Arquitectura

Antes de proponer cambios arquitectónicos:

1. Revisar este documento
2. Considerar impacto en escalabilidad
3. Documentar decisiones (ADR - Architecture Decision Records)
4. Discutir en equipo

---

**Última actualización:** 24 de febrero de 2026  
**Versión:** 2.0
