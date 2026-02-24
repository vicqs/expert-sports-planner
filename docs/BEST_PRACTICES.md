# Mejores Prácticas de Programación

Este documento establece las mejores prácticas aplicadas y recomendadas para el proyecto Expert Sports Planner.

---

## 📋 Tabla de Contenidos

1. [Estructura de Componentes](#estructura-de-componentes)
2. [Gestión de Estado](#gestión-de-estado)
3. [Performance](#performance)
4. [Código Limpio](#código-limpio)
5. [Seguridad](#seguridad)
6. [Accesibilidad](#accesibilidad)
7. [Testing](#testing)

---

## 🧩 Estructura de Componentes

### ✅ DO: Componentes Pequeños y Enfocados

```jsx
// ✅ BIEN: Componente con una responsabilidad clara
const UserAvatar = ({ user, size = "md" }) => {
  return (
    <div className={`avatar avatar-${size}`}>
      <img src={user.avatar} alt={user.name} />
    </div>
  );
};

// ❌ MAL: Componente con múltiples responsabilidades
const UserSection = ({ user }) => {
  // Renderiza avatar, stats, settings, notifications...
  // 200+ líneas de código
};
```

### ✅ DO: Separar Lógica de Presentación

```jsx
// ✅ BIEN: Custom hook para lógica
const usePlanEditor = (initialPlan) => {
  const [plan, setPlan] = useState(initialPlan);

  const updateDay = useCallback((weekIndex, dayIndex, updates) => {
    setPlan((prev) => {
      // lógica de actualización
    });
  }, []);

  return { plan, updateDay };
};

// Componente solo presenta
const PlanEditor = ({ initialPlan }) => {
  const { plan, updateDay } = usePlanEditor(initialPlan);

  return <div>{/* UI */}</div>;
};
```

### ✅ DO: PropTypes o TypeScript

```jsx
import PropTypes from "prop-types";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "ghost"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

export default Button;
```

### ✅ DO: Composición sobre Configuración

```jsx
// ✅ BIEN: Composición flexible
<Card>
  <Card.Header>
    <h3>Título</h3>
  </Card.Header>
  <Card.Body>
    <p>Contenido</p>
  </Card.Body>
</Card>

// ❌ MAL: Props booleanas para todo
<Card
  hasHeader
  hasFooter
  headerAlign="left"
  footerAlign="right"
  // 20 props más...
/>
```

---

## 🔄 Gestión de Estado

### ✅ DO: Estado Local Primero

```jsx
// ✅ BIEN: Estado local si solo lo usa este componente
const [isOpen, setIsOpen] = useState(false);

// ❌ MAL: Estado global innecesario
const { modalState, setModalState } = useGlobalState();
```

### ✅ DO: Derivar Estado cuando sea Posible

```jsx
// ✅ BIEN: Estado derivado
const completedCount = sessions.filter((s) => s.completed).length;
const progress = (completedCount / sessions.length) * 100;

// ❌ MAL: Estado redundante
const [completedCount, setCompletedCount] = useState(0);
const [progress, setProgress] = useState(0);
// Ahora tienes que mantener sincronizados 3 estados
```

### ✅ DO: Inmutabilidad

```jsx
// ✅ BIEN: Actualización inmutable
setPlan((prev) => ({
  ...prev,
  weeks: prev.weeks.map((week, i) =>
    i === weekIndex ? { ...week, days: updatedDays } : week,
  ),
}));

// ❌ MAL: Mutación directa
plan.weeks[weekIndex].days = updatedDays;
setPlan(plan); // React no detecta el cambio
```

### ✅ DO: Normalizar Estado Complejo

```jsx
// ✅ BIEN: Estado normalizado
const state = {
  clients: {
    byId: {
      'id1': { id: 'id1', name: 'Juan' },
      'id2': { id: 'id2', name: 'María' }
    },
    allIds: ['id1', 'id2']
  },
  plans: {
    byClientId: {
      'id1': ['plan1', 'plan2']
    }
  }
};

// ❌ MAL: Estado anidado profundo
const state = {
  clients: [
    {
      id: 'id1',
      name: 'Juan',
      plans: [
        { id: 'plan1', weeks: [...] }
      ]
    }
  ]
};
```

---

## ⚡ Performance

### ✅ DO: Memoización Estratégica

```jsx
// ✅ BIEN: Memoizar cálculos costosos
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ BIEN: Memoizar callbacks pasados como props
const handleSave = useCallback(
  (plan) => {
    savePlan(plan);
  },
  [savePlan],
);

// ❌ MAL: Memoizar todo innecesariamente
const sum = useMemo(() => a + b, [a, b]); // Overhead innecesario
```

### ✅ DO: React.memo para Componentes Pesados

```jsx
// ✅ BIEN: Prevenir re-renders innecesarios
const PlanCard = React.memo(({ plan, onClick }) => {
  return <div onClick={() => onClick(plan.id)}>{/* Render complejo */}</div>;
});

// Comparación personalizada si es necesario
const areEqual = (prevProps, nextProps) => {
  return prevProps.plan.id === nextProps.plan.id;
};

const PlanCard = React.memo(PlanCardComponent, areEqual);
```

### ✅ DO: Lazy Loading

```jsx
import { lazy, Suspense } from "react";

const PlanEditor = lazy(() => import("./components/PlanEditor"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PlanEditor />
    </Suspense>
  );
}
```

### ✅ DO: Virtualización para Listas Largas

```jsx
import { FixedSizeList } from "react-window";

const ExerciseList = ({ exercises }) => {
  const Row = ({ index, style }) => (
    <div style={style}>{exercises[index].name}</div>
  );

  return (
    <FixedSizeList height={500} itemCount={exercises.length} itemSize={50}>
      {Row}
    </FixedSizeList>
  );
};
```

---

## 🧹 Código Limpio

### ✅ DO: Nombres Descriptivos

```jsx
// ✅ BIEN
const filteredActiveClients = clients.filter((c) => c.status === "ACTIVE");
const calculateTotalVolume = (exercises) => {
  /* ... */
};

// ❌ MAL
const fc = clients.filter((c) => c.s === "A");
const calc = (e) => {
  /* ... */
};
```

### ✅ DO: Funciones Pequeñas (< 30 líneas)

```jsx
// ✅ BIEN: Funciones específicas y pequeñas
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const saveUser = async (user) => {
  if (!validateEmail(user.email)) {
    throw new Error("Invalid email");
  }
  return await api.post("/users", user);
};

// ❌ MAL: Función monolítica
const handleUserSubmit = async (data) => {
  // 100+ líneas de validación, transformación, API calls...
};
```

### ✅ DO: Principio de Responsabilidad Única

```jsx
// ✅ BIEN: Cada función hace una cosa
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

const sortByDate = (items) => {
  return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
};

// ❌ MAL: Función hace muchas cosas
const processItems = (items) => {
  // Formatea fechas
  // Ordena items
  // Filtra items
  // Agrupa por categoría
  // ...
};
```

### ✅ DO: Constantes en Lugar de Magic Numbers/Strings

```jsx
// ✅ BIEN
const PLAN_DURATION_WEEKS = 4;
const SESSION_TYPES = {
  STRENGTH: "STRENGTH",
  CARDIO: "CARDIO",
  REST: "REST",
};

const generatePlan = (weeks = PLAN_DURATION_WEEKS) => {
  // ...
};

// ❌ MAL
const generatePlan = (weeks = 4) => {
  // ¿Por qué 4?
  if (type === "STR") {
    // ¿Qué es 'STR'?
    // ...
  }
};
```

### ✅ DO: Early Returns

```jsx
// ✅ BIEN: Early returns reducen anidamiento
const processUser = (user) => {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.email) return null;

  return formatUser(user);
};

// ❌ MAL: Anidamiento profundo
const processUser = (user) => {
  if (user) {
    if (user.isActive) {
      if (user.email) {
        return formatUser(user);
      }
    }
  }
  return null;
};
```

### ✅ DO: Desestructuración

```jsx
// ✅ BIEN
const UserCard = ({ user }) => {
  const { name, email, avatar } = user;

  return (
    <div>
      <img src={avatar} alt={name} />
      <h3>{name}</h3>
      <p>{email}</p>
    </div>
  );
};

// ❌ MAL
const UserCard = ({ user }) => {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
};
```

---

## 🔒 Seguridad

### ✅ DO: Sanitizar Inputs

```jsx
import DOMPurify from "dompurify";

// ✅ BIEN: Sanitizar contenido HTML
const SafeContent = ({ htmlContent }) => {
  const clean = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};

// ❌ MAL: XSS vulnerable
const UnsafeContent = ({ htmlContent }) => {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};
```

### ✅ DO: Validar Datos antes de Persistir

```jsx
// ✅ BIEN
const saveClient = (clientData) => {
  // Validar
  if (!clientData.name || clientData.name.length > 100) {
    throw new Error("Invalid name");
  }

  // Sanitizar
  const sanitized = {
    ...clientData,
    name: clientData.name.trim(),
    email: clientData.email.toLowerCase().trim(),
  };

  // Guardar
  setToStorage(STORAGE_KEYS.CLIENTS, sanitized);
};
```

### ✅ DO: Límites de Almacenamiento

```jsx
// ✅ BIEN: Controlar tamaño de localStorage
const setToStorage = (key, value) => {
  try {
    const serialized = JSON.stringify(value);

    // Verificar límite (ejemplo: 5MB)
    if (serialized.length > 5 * 1024 * 1024) {
      throw new Error("Data too large for localStorage");
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error("Storage error:", error);
    return false;
  }
};
```

---

## ♿ Accesibilidad

### ✅ DO: Semántica HTML

```jsx
// ✅ BIEN: Elementos semánticos
<button onClick={handleClick}>Click me</button>
<nav>
  <ul>
    <li><a href="/home">Home</a></li>
  </ul>
</nav>

// ❌ MAL: Divs para todo
<div onClick={handleClick}>Click me</div>
<div className="nav">
  <div className="link">Home</div>
</div>
```

### ✅ DO: ARIA Labels

```jsx
// ✅ BIEN
<button
  aria-label="Cerrar modal"
  onClick={onClose}
>
  <X size={24} />
</button>

<input
  type="text"
  aria-describedby="email-hint"
/>
<small id="email-hint">
  Ingresa un email válido
</small>
```

### ✅ DO: Navegación por Teclado

```jsx
// ✅ BIEN: Soporte de teclado
const Modal = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // ...
};
```

---

## 🧪 Testing

### ✅ DO: Tests Legibles

```jsx
// ✅ BIEN: Tests descriptivos
describe("PlanGenerator", () => {
  describe("when generating a 4-week plan", () => {
    it("should create exactly 4 weeks", () => {
      const plan = generatePlan({ weeks: 4 });
      expect(plan).toHaveLength(4);
    });

    it("should include 7 days per week", () => {
      const plan = generatePlan({ weeks: 4 });
      plan.forEach((week) => {
        expect(week.days).toHaveLength(7);
      });
    });
  });
});
```

### ✅ DO: Aislar Tests

```jsx
// ✅ BIEN: Cada test es independiente
beforeEach(() => {
  // Setup limpio para cada test
  localStorage.clear();
});

afterEach(() => {
  // Cleanup después de cada test
  jest.clearAllMocks();
});

test("should save client", () => {
  const client = { name: "Test" };
  saveClient(client);

  const saved = getFromStorage(STORAGE_KEYS.CLIENTS);
  expect(saved).toContainEqual(client);
});
```

### ✅ DO: Mock Apropiado

```jsx
// ✅ BIEN: Mock de dependencias externas
jest.mock("../utils/storage", () => ({
  getFromStorage: jest.fn(),
  setToStorage: jest.fn(),
}));

test("should use storage", () => {
  const mockData = [{ id: 1, name: "Test" }];
  getFromStorage.mockReturnValue(mockData);

  const { result } = renderHook(() => useClients());

  expect(result.current.clients).toEqual(mockData);
});
```

---

## 📚 Recursos

- [React Documentation](https://react.dev/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Web.dev Best Practices](https://web.dev/learn)
- [a11y Project](https://www.a11yproject.com/)

---

**Última actualización:** 24 de febrero de 2026
