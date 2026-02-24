# Guía de Refactorización

Esta guía proporciona un plan estructurado para refactorizar el código existente y eliminar code smells identificados.

---

## 🎯 Prioridades de Refactorización

### Alta Prioridad (Sprint 1-2)

1. ✅ Migrar estilos inline a archivos separados
2. ✅ Implementar PropTypes en todos los componentes
3. ✅ Refactorizar funciones largas
4. ✅ Extraer constantes de magic numbers/strings

### Media Prioridad (Sprint 3-4)

5. ✅ Crear custom hooks reutilizables
6. ✅ Implementar manejo de errores robusto
7. ✅ Optimizar re-renders con memoización
8. ✅ Eliminar código duplicado

### Baja Prioridad (Sprint 5+)

9. ✅ Migrar a TypeScript (opcional)
10. ✅ Implementar i18n
11. ✅ Mejorar accesibilidad
12. ✅ Testing exhaustivo

---

## 📝 Refactorizaciones Específicas

### 1. Migrar Estilos Inline a Archivos CSS

#### Estado Actual

```jsx
// Layout.jsx
<style>{`
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`}</style>
```

#### Refactorización

```jsx
// Layout.jsx
import "./Layout.css";

const Layout = ({ children }) => {
  return <div className="layout">{children}</div>;
};
```

```css
/* Layout.css */
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
```

#### Pasos

1. Crear archivo `ComponentName.css` junto al componente
2. Mover estilos del tag `<style>` al archivo CSS
3. Importar CSS en el componente
4. Remover tag `<style>`
5. Verificar que los estilos se apliquen correctamente

---

### 2. Implementar PropTypes

#### Estado Actual

```jsx
const Button = ({ children, variant, onClick }) => {
  return <button>{children}</button>;
};
```

#### Refactorización

```jsx
import PropTypes from "prop-types";

const Button = ({
  children,
  variant = "primary",
  onClick,
  disabled = false,
}) => {
  return (
    <button
      className={`btn btn-${variant}`}
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
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

Button.defaultProps = {
  variant: "primary",
  disabled: false,
};

export default Button;
```

#### Pasos

1. Instalar: `npm install prop-types`
2. Importar PropTypes en cada componente
3. Definir propTypes para cada prop
4. Definir defaultProps cuando sea apropiado
5. Marcar props required cuando sea necesario

---

### 3. Refactorizar Función Larga: `updateDay`

#### Estado Actual (PlanEditor.jsx)

```jsx
const updateDay = (weekIndex, dayIndex, field, value) => {
  const newPlan = [...plan];
  const day = newPlan[weekIndex].days[dayIndex];

  if (field === "dayType") {
    // 20 líneas de lógica condicional compleja
  } else if (field === "fullSession") {
    day.session = value;
  } else if (field.includes(".")) {
    const [parent, child] = field.split(".");
    day.session[parent] = { ...day.session[parent], [child]: value };
  } else {
    day.session[field] = value;
  }

  setPlan(newPlan);
};
```

#### Refactorización

```jsx
// Extraer funciones auxiliares
const createRestDay = () => ({
  session: null,
  isGym: false,
});

const createGymDay = () => ({
  isGym: true,
  session: {
    title: "SESIÓN DE GIMNASIO",
    exercises: [],
  },
});

const createAthleticsDay = () => ({
  isGym: false,
  session: {
    type: SESSION_TYPES.DRO,
    training: TRAINING_TYPES.CCN,
    warmup: "8'@TRO",
    cooldown: "8'@TRO",
    mainBlock: "",
  },
});

const updateDayType = (day, dayType) => {
  switch (dayType) {
    case "REST":
      return { ...day, ...createRestDay() };
    case "GYM":
      return { ...day, ...createGymDay() };
    case "ATHLETICS":
      return { ...day, ...createAthleticsDay() };
    default:
      return day;
  }
};

const updateNestedField = (day, field, value) => {
  if (field.includes(".")) {
    const [parent, child] = field.split(".");
    return {
      ...day,
      session: {
        ...day.session,
        [parent]: {
          ...day.session[parent],
          [child]: value,
        },
      },
    };
  }

  return {
    ...day,
    session: {
      ...day.session,
      [field]: value,
    },
  };
};

// Función principal simplificada
const updateDay = (weekIndex, dayIndex, field, value) => {
  setPlan((prev) => {
    const newPlan = [...prev];
    let day = newPlan[weekIndex].days[dayIndex];

    if (field === "dayType") {
      day = updateDayType(day, value);
    } else if (field === "fullSession") {
      day = { ...day, session: value };
    } else {
      day = updateNestedField(day, field, value);
    }

    newPlan[weekIndex].days[dayIndex] = day;
    return newPlan;
  });
};
```

#### Pasos

1. Identificar bloques lógicos independientes
2. Extraer cada bloque a función auxiliar
3. Dar nombres descriptivos
4. Usar switch en lugar de if-else largas
5. Aplicar inmutabilidad correctamente
6. Testear cada función por separado

---

### 4. Extraer Constantes

#### Estado Actual

```jsx
// generator.js
const weeks = 4;
for (let d = 0; d < 7; d++) {
  if (dayIndex === 0 || dayIndex === 2) {
    // Lun y Mié
  }
}
```

#### Refactorización

```jsx
// constants.js (añadir)
export const PLAN_CONFIG = {
  DEFAULT_WEEKS: 4,
  DAYS_PER_WEEK: 7,
};

export const DAY_INDICES = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
};

export const GYM_TRAINING_DAYS = [DAY_INDICES.MONDAY, DAY_INDICES.WEDNESDAY];

export const QUALITY_TRAINING_DAYS = [
  DAY_INDICES.TUESDAY,
  DAY_INDICES.THURSDAY,
];

// generator.js (actualizar)
import { PLAN_CONFIG, DAY_INDICES, GYM_TRAINING_DAYS } from "./constants";

const generatePlan = (userData) => {
  const weeks = PLAN_CONFIG.DEFAULT_WEEKS;

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < PLAN_CONFIG.DAYS_PER_WEEK; d++) {
      if (GYM_TRAINING_DAYS.includes(d)) {
        // Es día de gimnasio
      }
    }
  }
};
```

---

### 5. Crear Custom Hooks Reutilizables

#### useForm Hook

```jsx
// hooks/useForm.js
import { useState, useCallback } from "react";

export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({ submit: error.message });
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit],
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
  };
};
```

#### Uso

```jsx
// IntakeForm.jsx (antes)
const [formData, setFormData] = useState({...});
const handleChange = (e) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

// IntakeForm.jsx (después)
const { values, handleChange, handleSubmit } = useForm(
  { name: '', objective: '', level: 'Intermedio' },
  (data) => addClientRequest(data)
);
```

---

### 6. Implementar Manejo de Errores

#### Estado Actual

```jsx
const handleBook = (slotId) => {
  const result = bookGymSlot(athleteId, selectedDate, slotId);
  if (result.success) {
    alert("Reserva confirmada");
  }
};
```

#### Refactorización

```jsx
import { useToast } from "../ui/Toast";

const GymBookingSystem = () => {
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBook = async (slotId) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await bookGymSlot(athleteId, selectedDate, slotId);

      if (result.success) {
        addToast("Reserva confirmada exitosamente", "success");
      } else {
        throw new Error(result.message || "Error al reservar");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      {/* UI */}
    </div>
  );
};
```

---

### 7. Optimizar con Memoización

#### Estado Actual

```jsx
const CoachDashboard = () => {
  const { getPendingClients } = useMockDatabase();
  const pending = getPendingClients(); // Se ejecuta en cada render

  return <div>{/* ... */}</div>;
};
```

#### Refactorización

```jsx
const CoachDashboard = () => {
  const { clients } = useMockDatabase();

  // Memoizar cálculo
  const pending = useMemo(() => {
    return clients.filter((c) => c.status === "PENDING");
  }, [clients]);

  const completed = useMemo(() => {
    return clients.filter((c) => c.status === "COMPLETED");
  }, [clients]);

  return <div>{/* ... */}</div>;
};
```

---

### 8. Eliminar Código Duplicado

#### Patrón: Componente Tabla

```jsx
// components/shared/DataTable.jsx
const DataTable = ({
  columns,
  data,
  onRowClick,
  emptyMessage = "No hay datos",
}) => {
  return (
    <table className="data-table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length}>{emptyMessage}</td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr key={row.id || idx} onClick={() => onRowClick?.(row)}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

// Uso
<DataTable
  columns={[
    { key: "name", label: "Nombre" },
    {
      key: "status",
      label: "Estado",
      render: (row) => <Badge>{row.status}</Badge>,
    },
  ]}
  data={clients}
  onRowClick={handleClientClick}
  emptyMessage="No hay clientes pendientes"
/>;
```

---

## 🔄 Plan de Migración a TypeScript (Opcional)

### Fase 1: Setup

```bash
npm install -D typescript @types/react @types/react-dom
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### Fase 2: Migración Gradual

1. Renombrar `.jsx` → `.tsx` progresivamente
2. Empezar por archivos utilities y constants
3. Definir interfaces para data models
4. Tipear props de componentes
5. Tipear contextos y hooks

### Ejemplo

```typescript
// types/plan.ts
export interface Session {
  type: SessionType;
  training: TrainingType;
  warmup: string;
  cooldown: string;
  mainBlock: string;
}

export interface Day {
  dayName: string;
  isGym: boolean;
  session: Session | null;
  completed?: boolean;
  note?: string;
}

export interface Week {
  weekNum: number;
  days: Day[];
}

export type Plan = Week[];

// PlanEditor.tsx
interface PlanEditorProps {
  initialPlan: Plan;
  clientData: Client;
  onSave: (planText: string, planObject: Plan) => void;
  onCancel: () => void;
}

const PlanEditor: React.FC<PlanEditorProps> = ({
  initialPlan,
  clientData,
  onSave,
  onCancel,
}) => {
  // ...
};
```

---

## ✅ Checklist de Refactorización

### Por Componente

- [ ] Estilos movidos a archivo CSS separado
- [ ] PropTypes o TypeScript definidos
- [ ] Funciones < 30 líneas
- [ ] Sin magic numbers/strings
- [ ] Manejo de errores implementado
- [ ] Memoización apropiada
- [ ] Tests unitarios creados
- [ ] Accesibilidad verificada
- [ ] Performance optimizada

### Por Archivo

- [ ] Imports organizados (externos, internos, estilos)
- [ ] Sin código comentado
- [ ] Sin console.logs
- [ ] Nombres descriptivos
- [ ] Documentación JSDoc en funciones complejas

---

## 📊 Métricas de Éxito

### Antes

- Componentes promedio: 150 líneas
- Funciones promedio: 40 líneas
- Complejidad ciclomática: 15+
- Test coverage: 0%

### Objetivo

- Componentes promedio: < 80 líneas
- Funciones promedio: < 20 líneas
- Complejidad ciclomática: < 10
- Test coverage: > 70%

---

**Última actualización:** 24 de febrero de 2026
