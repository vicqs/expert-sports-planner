# Sistema de Temas - Dark/Light Mode

## Descripción General

La aplicación Expert Sports Planner implementa un sistema completo de temas con soporte para **modo oscuro (dark)** y **modo claro (light)**, siguiendo las mejores prácticas de UX 2026.

## Arquitectura del Sistema

### 1. Hook de Gestión de Temas

**Ubicación**: `src/hooks/useTheme.js`

```javascript
const { theme, isDark, isLight, toggleTheme, setLightTheme, setDarkTheme } =
  useTheme();
```

**Características**:

- ✅ Persistencia automática en `localStorage` con key `expert_planner_theme`
- ✅ Detección de preferencia del sistema via `prefers-color-scheme`
- ✅ Aplica atributo `data-theme` al `document.documentElement`
- ✅ Exportado desde `src/hooks/index.js` para fácil importación

**Estados del tema**:

- `THEMES.DARK`: Modo oscuro (por defecto)
- `THEMES.LIGHT`: Modo claro

### 2. Variables CSS

**Ubicación**: `src/styles/variables.css`

#### Variables Principales por Tema

| Variable CSS         | Dark Mode           | Light Mode          |
| -------------------- | ------------------- | ------------------- |
| `--color-bg`         | #0F172A (slate-900) | #FFFFFF (white)     |
| `--color-bg-subtle`  | #1E293B (slate-800) | #F8FAFC (slate-50)  |
| `--color-surface`    | #1E293B             | #FFFFFF             |
| `--color-text`       | #F1F5F9 (slate-100) | #0F172A (slate-900) |
| `--color-text-muted` | #94A3B8 (slate-400) | #64748B (slate-500) |
| `--color-border`     | #334155 (slate-700) | #E2E8F0 (slate-200) |

#### Transiciones Suaves

El sistema incluye transiciones automáticas para:

- `background-color`
- `color`
- `border-color`
- `box-shadow`

Duración: `var(--transition-normal)` (200ms)

### 3. TopBar Component

**Ubicación**: `src/components/TopBar.jsx`

Componente de navegación superior que incluye:

```jsx
<TopBar onExit={handleExit} userRole={session?.role} />
```

**Elementos**:

1. **Brand**: Logo (Activity icon) + "Expert Planner v2.0"
2. **Role Badge**: Muestra "Atleta" o "Entrenador" con color distintivo
3. **Theme Toggle**: Botón con iconos Sun ☀️ (light) / Moon 🌙 (dark)
4. **Logout Button**: Botón rojo de salida

**Responsive Design**:

- **Desktop** (>768px): Muestra todos los elementos
- **Tablet** (480-768px): Oculta texto del brand, mantiene iconos
- **Mobile** (<480px): Oculta brand text, role badge text, logout text

### 4. Estilos Responsive

**Ubicación**: `src/components/TopBar.css`

**Breakpoints**:

```css
/* Tablet */
@media (max-width: 768px) { ... }

/* Mobile */
@media (max-width: 480px) { ... }
```

**Características UX 2026**:

- ✅ Touch targets mínimos de 44px
- ✅ Backdrop blur (12px) para profundidad visual
- ✅ Focus-visible para accesibilidad de teclado
- ✅ Sticky positioning (z-index: 100)
- ✅ Print styles (oculta header al imprimir)

## Uso en Componentes

### Ejemplo 1: Usando el Hook

```jsx
import { useTheme } from "../hooks";

function MyComponent() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Cambiar a {isDark ? "modo claro" : "modo oscuro"}
    </button>
  );
}
```

### Ejemplo 2: Usando Variables CSS

```css
.my-component {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}

.my-component:hover {
  background: var(--color-surface-hover);
  border-color: var(--color-border-hover);
}
```

### Ejemplo 3: Componente con Inline Styles

```jsx
<div
  style={{
    background: "var(--color-bg)",
    color: "var(--color-text-muted)",
    borderColor: "var(--color-border)",
  }}
>
  Contenido con tema
</div>
```

## Variables CSS Disponibles

### Backgrounds

- `--color-bg`: Fondo principal de la app
- `--color-bg-subtle`: Fondo sutil (alternativo)
- `--color-bg-elevated`: Fondo elevado (cards, modals)
- `--color-bg-primary`: Alias de bg principal
- `--color-bg-secondary`: Alias de bg secundario

### Surfaces

- `--color-surface`: Superficie de componentes
- `--color-surface-hover`: Superficie en hover
- `--color-surface-elevated`: Superficie elevada
- `--color-surface-glass`: Superficie con transparencia (glass effect)

### Texto

- `--color-text`: Texto principal
- `--color-text-primary`: Texto primario (alta legibilidad)
- `--color-text-secondary`: Texto secundario
- `--color-text-muted`: Texto atenuado
- `--color-text-subtle`: Texto muy sutil

### Bordes

- `--color-border`: Borde estándar
- `--color-border-hover`: Borde en hover
- `--color-border-subtle`: Borde sutil

### Sombras

- `--shadow-sm`: Sombra pequeña
- `--shadow-md`: Sombra media
- `--shadow-lg`: Sombra grande
- `--shadow-xl`: Sombra extra grande
- `--shadow-2xl`: Sombra doble extra grande

### Colores Semánticos (invariables entre temas)

- `--color-primary`: #3B82F6 (blue-500)
- `--color-success`: #10B981 (emerald-500)
- `--color-warning`: #F59E0B (amber-500)
- `--color-danger`: #EF4444 (red-500)
- `--color-info`: #0EA5E9 (sky-500)

## Integración en Layout

**Ubicación**: `src/components/Layout.jsx`

El componente `Layout` integra el `TopBar`:

```jsx
<Layout onExit={session ? handleExit : null} userRole={session?.role}>
  {children}
</Layout>
```

**Props**:

- `onExit`: Función de logout (muestra TopBar solo si existe)
- `userRole`: "athlete" | "coach" (para badge de rol)
- `children`: Contenido de la página

## Persistencia

El tema seleccionado se guarda en `localStorage`:

```javascript
localStorage.setItem("expert_planner_theme", "dark"); // o 'light'
```

**Comportamiento al cargar**:

1. Lee `localStorage`
2. Si no existe, usa preferencia del sistema (`prefers-color-scheme`)
3. Por defecto: modo oscuro

## Accesibilidad

### Focus Management

```css
.theme-toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Color Scheme Meta

```css
:root {
  color-scheme: light dark;
}
```

Esto permite que el navegador ajuste elementos nativos (scrollbars, form controls) al tema.

### ARIA Labels

```jsx
<button
  aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
  className="theme-toggle"
>
  {isDark ? <Sun size={20} /> : <Moon size={20} />}
</button>
```

## Mejores Prácticas

### ✅ DO

1. **Usar variables CSS** para todos los colores temáticos
2. **Probar ambos temas** al desarrollar nuevos componentes
3. **Mantener coherencia** en uso de variables (ej: usar `--color-surface` para backgrounds de cards)
4. **Respetar semántica** de colores (success=verde, danger=rojo)
5. **Verificar contraste** en ambos temas para legibilidad

### ❌ DON'T

1. **No hardcodear colores** excepto para casos muy específicos (badges semánticos)
2. **No asumir** que el usuario está en dark mode
3. **No ignorar** la preferencia del sistema en primera carga
4. **No olvidar** las transiciones para cambios suaves
5. **No duplicar** lógica de tema (usar el hook centralizado)

## Casos Especiales

### Badges de Tipo de Sesión

Estos mantienen colores hardcoded porque son **semánticos**:

```jsx
// PlanDetail.jsx
<span className="session-type-badge gym">Gimnasio</span>
// background: rgba(139, 92, 246, 0.1); color: #8b5cf6; (morado siempre)

<span className="session-type-badge athletics">Atletismo</span>
// background: rgba(16, 185, 129, 0.1); color: #10b981; (verde siempre)
```

**Razón**: El color es parte de la identidad del tipo de sesión, no del tema visual.

### Modal Backdrop

```css
.modal-backdrop {
  background: rgba(0, 0, 0, 0.6); /* dark mode */
}

@media (prefers-color-scheme: light) {
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.8); /* más oscuro en light para contraste */
  }
}
```

## Testing

### Manual Testing Checklist

- [ ] Toggle funciona correctamente
- [ ] Tema persiste al recargar página
- [ ] Todos los componentes se ven bien en ambos temas
- [ ] Transiciones son suaves (200ms)
- [ ] No hay flash de contenido sin estilo (FOUC)
- [ ] Preferencia del sistema se respeta en primera visita
- [ ] Focus visible funciona en ambos temas
- [ ] Responsive breakpoints funcionan correctamente

### Componentes a Verificar

1. ✅ TopBar
2. ✅ Modal
3. ✅ ConfirmDialog
4. ✅ Toast
5. ✅ Button
6. ✅ Card
7. ✅ PlanCard
8. ✅ BottomNav
9. ✅ Forms (IntakeForm, PlanEditor, etc.)
10. ✅ Dashboards (Coach, Athlete)

## Troubleshooting

### Problema: El tema no persiste

**Solución**: Verificar que `localStorage` esté habilitado en el navegador

### Problema: Flash de tema incorrecto al cargar

**Solución**: El hook aplica el tema en `useEffect`, lo cual es correcto. Si persiste, considerar SSR inline script.

### Problema: Componente no respeta tema

**Solución**: Verificar que use variables CSS (`var(--color-*)`) en lugar de colores hardcoded

### Problema: Transiciones demasiado lentas/rápidas

**Solución**: Ajustar `--transition-normal` en `variables.css`

## Roadmap Futuro

- [ ] Agregar tema "auto" que siga el sistema dinámicamente
- [ ] Soporte para temas personalizados (custom color schemes)
- [ ] Animación de transición más elaborada (fade + scale)
- [ ] Selector de acento de color (múltiples `--color-primary`)
- [ ] Modo de alto contraste para accesibilidad
- [ ] Tema sepia para lectura prolongada

## Referencias

- **CSS Variables**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **prefers-color-scheme**: [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- **WCAG 2.1 Contrast**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **UX Best Practices 2026**: Touch targets 44px+, Backdrop blur, Focus-visible

---

**Última actualización**: 2025-01-XX
**Versión**: 2.0
**Autor**: Expert Sports Planner Development Team
