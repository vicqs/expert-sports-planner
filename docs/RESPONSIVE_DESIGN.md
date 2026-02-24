# Guía de Diseño Responsive

## Descripción General

Expert Sports Planner implementa un diseño **mobile-first responsive** que se adapta a diferentes tamaños de pantalla, desde smartphones hasta monitores de escritorio de gran formato.

## Breakpoints del Sistema

### Definición de Breakpoints

```css
/* Mobile First - Base (< 480px) */
Default styles

/* Small Mobile (≥ 480px) */
@media (min-width: 480px) { ... }

/* Tablet (≥ 768px) */
@media (min-width: 768px) { ... }

/* Desktop (≥ 1024px) */
@media (min-width: 1024px) { ... }

/* Large Desktop (≥ 1440px) */
@media (min-width: 1440px) { ... }
```

### Breakpoints Inversos (Max-Width)

Para componentes específicos usamos max-width:

```css
/* Mobile (< 480px) */
@media (max-width: 480px) { ... }

/* Tablet (< 768px) */
@media (max-width: 768px) { ... }
```

## Componentes Responsive

### 1. TopBar

**Archivo**: `src/components/TopBar.css`

#### Desktop (>768px)

```
[Logo Icon] Expert Planner v2.0  |  [Atleta Badge]  [Theme Toggle]  [Salir Button]
```

#### Tablet (480-768px)

```
[Logo Icon]  |  [Atleta]  [Theme Toggle]  [Salir Button]
```

#### Mobile (<480px)

```
[Logo Icon]  |  [Icon]  [Theme Toggle]  [Icon]
```

**Comportamiento**:

- `.top-bar__brand-text`: Hidden < 768px
- `.top-bar__role-text`: Hidden < 480px
- `.top-bar__logout-text`: Hidden < 480px
- Iconos siempre visibles
- Touch targets: 44px mínimo

### 2. Layout

**Archivo**: `src/components/Layout.jsx`

```css
.main-content {
  padding: 2rem; /* Desktop */
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem; /* Tablet */
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0.75rem; /* Mobile */
  }
}
```

**Max Width**: `1400px` (centrado en pantallas grandes)

### 3. BottomNav

**Archivo**: `src/components/ui/BottomNav.jsx`

- **Posición**: Fixed bottom
- **Altura**: 64px
- **Background**: Backdrop blur para depth
- **Touch Targets**: 48px altura mínima
- **Safe Area**: Padding bottom para notches

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom); /* iPhone safe area */
}
```

### 4. Modal

**Archivo**: `src/components/ui/Modal.css`

#### Desktop

- Width: 90vw
- Max-width: 600px
- Centered

#### Mobile

- Width: 95vw
- Max-height: 90vh
- Scroll interno si overflow

```css
.modal {
  max-width: 600px;
  width: 90vw;
}

@media (max-width: 768px) {
  .modal {
    width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
  }
}
```

### 5. Cards

**Archivo**: `src/components/ui/Card.css`

Grid responsive:

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

### 6. Forms

Inputs y campos de formulario:

```css
.form-input {
  min-height: 44px; /* Touch target WCAG 2.1 */
  font-size: 16px; /* Evita zoom en iOS */
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }

  .form-input {
    width: 100%;
  }
}
```

## Touch Targets (UX 2026)

### Tamaños Mínimos

Según las guías de UX 2026 y WCAG 2.1:

- **Botones**: 44 x 44 px mínimo
- **Links**: 44 x 44 px con padding
- **Inputs**: 44 px de altura
- **Checkboxes/Radio**: 24 x 24 px visible + 44 x 44 px touch area

### Implementación

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 0.75rem 1rem; /* Extra hit area */
}

/* Expandir area de click sin cambiar visual */
.small-icon-button {
  position: relative;
}

.small-icon-button::before {
  content: "";
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
}
```

## Viewport Meta Tag

**Ubicación**: `index.html`

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
/>
```

**Notas**:

- `user-scalable=yes`: Permite zoom (accesibilidad)
- `maximum-scale=5.0`: Límite razonable de zoom
- `width=device-width`: Ancho correcto en móviles

## Font Sizing

### Mobile-First Approach

```css
:root {
  /* Base: Mobile */
  --font-size-xs: 0.75rem; /* 12px */
  --font-size-sm: 0.875rem; /* 14px */
  --font-size-base: 1rem; /* 16px - no zoom iOS */
  --font-size-lg: 1.125rem; /* 18px */
  --font-size-xl: 1.25rem; /* 20px */
  --font-size-2xl: 1.5rem; /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */
}

@media (min-width: 768px) {
  :root {
    /* Desktop: Escalado */
    --font-size-base: 1.125rem; /* 18px */
    --font-size-xl: 1.5rem; /* 24px */
  }
}
```

### iOS Font Zoom Prevention

```css
input,
select,
textarea {
  font-size: 16px; /* Mínimo para evitar auto-zoom en iOS */
}
```

## Grid Systems

### Container

```css
.container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}
```

### Responsive Grid

```css
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr; /* Mobile */
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr); /* Tablet */
    gap: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr); /* Desktop */
    gap: 2rem;
  }
}
```

## Spacing Scale

Espaciado responsive coherente:

```css
:root {
  --spacing-xs: 0.25rem; /* 4px */
  --spacing-sm: 0.5rem; /* 8px */
  --spacing-md: 1rem; /* 16px */
  --spacing-lg: 1.5rem; /* 24px */
  --spacing-xl: 2rem; /* 32px */
  --spacing-2xl: 3rem; /* 48px */
  --spacing-3xl: 4rem; /* 64px */
}

@media (max-width: 768px) {
  :root {
    --spacing-lg: 1rem; /* Reducido en mobile */
    --spacing-xl: 1.5rem;
    --spacing-2xl: 2rem;
  }
}
```

## Safe Areas (iOS Notch)

```css
.fixed-header {
  padding-top: env(safe-area-inset-top);
}

.fixed-footer {
  padding-bottom: env(safe-area-inset-bottom);
}

.full-width-container {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

## Orientation Support

```css
@media (orientation: landscape) and (max-height: 500px) {
  /* Ajustes para landscape en móviles */
  .modal {
    max-height: 80vh;
    overflow-y: auto;
  }

  .top-bar {
    height: 48px; /* Más compacto */
  }
}
```

## Print Styles

```css
@media print {
  .top-bar,
  .bottom-nav,
  .modal-backdrop,
  .no-print {
    display: none !important;
  }

  .main-content {
    padding: 0;
    max-width: 100%;
  }

  .card {
    page-break-inside: avoid;
  }
}
```

## Images & Media

### Responsive Images

```jsx
<img
  src="image.jpg"
  srcSet="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1024w.jpg 1024w
  "
  sizes="
    (max-width: 480px) 100vw,
    (max-width: 768px) 50vw,
    33vw
  "
  alt="Description"
  loading="lazy"
/>
```

### CSS Object Fit

```css
.responsive-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  aspect-ratio: 16/9;
}
```

## Performance Optimizations

### Critical CSS

Estilos críticos inline en `<head>` para above-the-fold content.

### Lazy Loading

```jsx
// Componentes pesados
const HeavyComponent = lazy(() => import("./HeavyComponent"));

<Suspense fallback={<Skeleton />}>
  <HeavyComponent />
</Suspense>;
```

### CSS Containment

```css
.independent-component {
  contain: layout style paint;
}
```

## Testing Checklist

### Device Testing

- [ ] iPhone SE (375px)
- [ ] iPhone 13 Pro (390px)
- [ ] iPhone 13 Pro Max (428px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop 1080p (1920px)
- [ ] Desktop 4K (3840px)

### Orientation Testing

- [ ] Portrait mobile
- [ ] Landscape mobile
- [ ] Portrait tablet
- [ ] Landscape tablet

### Browser Testing

- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Edge Desktop

## Common Patterns

### Stack Layout (Mobile)

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .stack {
    flex-direction: row;
    align-items: center;
  }
}
```

### Responsive Typography

```css
.responsive-heading {
  font-size: clamp(1.5rem, 4vw, 3rem);
  line-height: 1.2;
}
```

`clamp(min, preferred, max)` escala fluidamente.

### Responsive Padding

```css
.responsive-section {
  padding: clamp(1rem, 5vw, 4rem);
}
```

## Accessibility en Responsive

### Focus Management

```css
.focusable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Touch devices: larger hit area */
@media (pointer: coarse) {
  .button {
    min-height: 48px;
    padding: 0.75rem 1.5rem;
  }
}
```

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Mejores Prácticas

### ✅ DO

1. **Mobile-first CSS**: Estilos base para móvil, `@media (min-width)` para desktop
2. **Touch targets ≥ 44px**: Especialmente en interfaces táctiles
3. **Texto ≥ 16px en inputs**: Previene zoom automático en iOS
4. **Probar en dispositivos reales**: No solo emuladores
5. **Safe areas**: Usar `env(safe-area-inset-*)` para notches
6. **Lazy load imágenes**: `loading="lazy"` attribute
7. **Fluid spacing**: Usar `clamp()` para escalado fluido

### ❌ DON'T

1. **No deshabilitar zoom**: `user-scalable=no` es mala práctica
2. **No fixed widths en mobile**: Usar `%`, `vw`, `max-width`
3. **No asumir mouse**: Diseñar para touch-first
4. **No horizontal scroll**: Excepto carousels intencionales
5. **No tiny text**: < 14px es difícil de leer en móvil
6. **No ignorar landscape**: Especialmente en tablets
7. **No olvidar print styles**: Muchos imprimen para offline

## Herramientas de Testing

### Chrome DevTools

```
Cmd/Ctrl + Shift + M: Toggle device toolbar
Cmd/Ctrl + Shift + P: "Show Device Frame"
```

### Responsive Design Mode (Firefox)

```
Cmd/Ctrl + Shift + M
```

### BrowserStack / LambdaTest

Testing en dispositivos reales remotos.

### Lighthouse

Auditoría de performance y UX móvil.

```bash
npm run build
npx lighthouse http://localhost:4173 --view
```

## Referencias

- **Responsive Design**: [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- **Touch Targets**: [WCAG 2.1 SC 2.5.5](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- **Safe Area**: [WebKit env() variables](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
- **Mobile UX**: [Material Design Mobile](https://material.io/design/layout/responsive-layout-grid.html)

---

**Última actualización**: 2025-01-XX
**Versión**: 2.0
**Autor**: Expert Sports Planner Development Team
