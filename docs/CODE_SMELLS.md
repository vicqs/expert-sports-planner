# Code Smells Identificados

Este documento detalla los code smells encontrados en el proyecto Expert Sports Planner y sus soluciones recomendadas.

## 📋 Tabla de Contenidos

- [Críticos](#críticos)
- [Importantes](#importantes)
- [Menores](#menores)
- [Recomendaciones](#recomendaciones)

---

## 🔴 Críticos

### 1. **Estilos Inline en Componentes**

**Ubicación:** Múltiples componentes (Layout.jsx, CoachDashboard.jsx, IntakeForm.jsx, etc.)

**Problema:**

```jsx
<style>{`
  .layout {
    min-height: 100vh;
    display: flex;
  }
`}</style>
```

**Impacto:**

- ❌ Rendimiento: Los estilos se recrean en cada render
- ❌ Mantenibilidad: Dificulta la reutilización
- ❌ Bundle size: Aumenta el tamaño del JavaScript

**Solución:**

- ✅ Migrar a archivos CSS/SCSS separados
- ✅ Usar CSS Modules o styled-components
- ✅ Crear un sistema de diseño consistente

**Prioridad:** Alta

---

### 2. **Falta de Validación de Props**

**Ubicación:** Todos los componentes

**Problema:**

```jsx
const PlanEditor = ({ initialPlan, clientData, onSave, onCancel }) => {
  // No hay validación de tipos
};
```

**Impacto:**

- ❌ Errores en runtime difíciles de debugear
- ❌ Falta de documentación implícita
- ❌ Bugs silenciosos

**Solución:**

```jsx
import PropTypes from "prop-types";

PlanEditor.propTypes = {
  initialPlan: PropTypes.arrayOf(PropTypes.object).isRequired,
  clientData: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
```

**Alternativa:** Migrar a TypeScript

**Prioridad:** Alta

---

### 3. **Funciones Excesivamente Largas**

**Ubicación:** PlanEditor.jsx, CoachDashboard.jsx, generator.js

**Problema:**

```jsx
// PlanEditor.jsx tiene funciones de 100+ líneas
const updateDay = (weekIndex, dayIndex, field, value) => {
  // 50+ líneas de lógica condicional
};
```

**Impacto:**

- ❌ Difícil de entender y mantener
- ❌ Alta complejidad ciclomática
- ❌ Difícil de testear

**Solución:**

- ✅ Extraer funciones específicas
- ✅ Aplicar principio de responsabilidad única
- ✅ Crear funciones auxiliares

**Prioridad:** Alta

---

## 🟡 Importantes

### 4. **Magic Numbers y Strings**

**Ubicación:** Múltiples archivos

**Problema:**

```jsx
const weeks = 4; // ¿Por qué 4?
const days = 7; // Magic number
if (dayIndex === 1 || dayIndex === 3) // ¿Qué significan?
```

**Solución:**

```jsx
const PLAN_DURATION_WEEKS = 4;
const DAYS_PER_WEEK = 7;
const QUALITY_TRAINING_DAYS = [1, 3]; // Martes y Jueves

// O mejor aún:
const DAY_INDICES = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  // ...
};
```

**Prioridad:** Media

---

### 5. **Duplicación de Código**

**Ubicación:** Múltiples componentes

**Problema:**

```jsx
// Patrón repetido en varios componentes:
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

// Estilos duplicados:
.dashboard-header { /* mismo estilo en 3 archivos */ }
```

**Solución:**

- ✅ Crear hooks personalizados (useAsync, useForm)
- ✅ Centralizar estilos comunes
- ✅ Crear componentes reutilizables

**Prioridad:** Media

---

### 6. **Dependencias Faltantes en useEffect**

**Ubicación:** Varios componentes

**Problema:**

```jsx
useEffect(() => {
  setAvailableSlots(getGymSchedule(selectedDate));
}, [selectedDate, getGymSchedule]); // getGymSchedule cambia en cada render
```

**Solución:**

```jsx
const getGymSchedule = useCallback((date) => {
  // lógica
}, []); // Memorizar función

// O mejor:
useEffect(() => {
  const slots = getGymSchedule(selectedDate);
  setAvailableSlots(slots);
}, [selectedDate]); // Solo selectedDate como dependencia
```

**Prioridad:** Media

---

### 7. **Falta de Manejo de Errores**

**Ubicación:** Todo el código asíncrono

**Problema:**

```jsx
const handleBook = (slotId) => {
  const result = bookGymSlot(athleteId, selectedDate, slotId);
  // No hay try-catch, no hay manejo de errores de red
};
```

**Solución:**

```jsx
const handleBook = async (slotId) => {
  try {
    setLoading(true);
    const result = await bookGymSlot(athleteId, selectedDate, slotId);
    if (result.success) {
      addToast("Reserva confirmada", "success");
    } else {
      addToast(result.message, "error");
    }
  } catch (error) {
    console.error("Error booking slot:", error);
    addToast("Error al realizar la reserva", "error");
  } finally {
    setLoading(false);
  }
};
```

**Prioridad:** Media

---

### 8. **Acoplamiento Alto con MockDatabase**

**Ubicación:** Todos los componentes que usan el contexto

**Problema:**

```jsx
const { getPendingClients, getCompletedClients, updateClientPlan } =
  useMockDatabase();
```

**Impacto:**

- ❌ Dificulta el testing
- ❌ Dificulta migración a API real
- ❌ Violación de Dependency Inversion Principle

**Solución:**

- ✅ Crear capa de abstracción (Repository Pattern)
- ✅ Usar interfaces consistentes
- ✅ Facilitar mocking en tests

**Prioridad:** Media

---

## 🟢 Menores

### 9. **Nombres de Variables Poco Descriptivos**

**Ubicación:** Varios archivos

**Problema:**

```jsx
const s = day.session; // ¿Qué es 's'?
const c = clients.filter(...); // ¿Qué es 'c'?
const w = 0; // ¿Qué es 'w'?
```

**Solución:**

```jsx
const currentSession = day.session;
const filteredClients = clients.filter(...);
const weekIndex = 0;
```

**Prioridad:** Baja

---

### 10. **Console.log en Producción**

**Ubicación:** Algunos archivos

**Problema:**

```jsx
console.log("Plan saved:", plan); // No debe estar en producción
```

**Solución:**

- ✅ Usar logger configurable
- ✅ Eliminar en build de producción
- ✅ Usar herramientas de debugging profesionales

**Prioridad:** Baja

---

### 11. **Código Comentado**

**Ubicación:** Varios archivos

**Problema:**

```jsx
// const oldFunction = () => {...}  // Código muerto
// return oldImplementation; // Ya no se usa
```

**Solución:**

- ✅ Eliminar código comentado
- ✅ Confiar en git para historial
- ✅ Mantener código limpio

**Prioridad:** Baja

---

### 12. **Falta de Internacionalización (i18n)**

**Ubicación:** Todos los componentes

**Problema:**

```jsx
<h2>Panel de Entrenador</h2>; // Hardcoded en español
alert("Reserva confirmada"); // No traducible
```

**Solución:**

```jsx
import { useTranslation } from "react-i18next";

const { t } = useTranslation();
<h2>{t("coach.dashboard.title")}</h2>;
```

**Prioridad:** Baja (depende de requerimientos)

---

### 13. **Uso de Alert y Confirm Nativos**

**Ubicación:** Varios componentes

**Problema:**

```jsx
alert('Reserva confirmada'); // No personalizable
if (window.confirm('¿Estás seguro?')) // Bloqueante
```

**Solución:**

- ✅ Usar sistema de Toast (ya implementado)
- ✅ Crear componente Modal reutilizable
- ✅ Mejorar UX

**Prioridad:** Baja

---

## 📊 Resumen de Impacto

| Categoría   | Count | Prioridad |
| ----------- | ----- | --------- |
| Críticos    | 3     | 🔴 Alta   |
| Importantes | 5     | 🟡 Media  |
| Menores     | 5     | 🟢 Baja   |

---

## 🎯 Recomendaciones Generales

### Performance

1. ✅ Implementar React.memo en componentes pesados
2. ✅ Usar useMemo/useCallback apropiadamente
3. ✅ Lazy loading de rutas y componentes
4. ✅ Optimizar re-renders innecesarios

### Mantenibilidad

1. ✅ Establecer convenciones de código (ESLint + Prettier)
2. ✅ Documentar funciones complejas con JSDoc
3. ✅ Crear guía de estilo de componentes
4. ✅ Implementar pruebas unitarias

### Escalabilidad

1. ✅ Separar lógica de negocio de componentes UI
2. ✅ Implementar arquitectura clara (features/modules)
3. ✅ Preparar para migración a API real
4. ✅ Considerar state management más robusto (Zustand/Redux)

### Seguridad

1. ✅ Sanitizar inputs del usuario
2. ✅ Validar datos antes de guardar en localStorage
3. ✅ Implementar límites de almacenamiento
4. ✅ Proteger rutas y datos sensibles

---

## 📚 Lecturas Recomendadas

- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Refactoring Guru](https://refactoring.guru/)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

---

**Última actualización:** 24 de febrero de 2026  
**Revisado por:** Sistema de Análisis Automático
