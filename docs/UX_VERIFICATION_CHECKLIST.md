# Checklist de Verificación UX - Temas y Responsive

## 🎨 Sistema de Temas

### Funcionalidad Básica

- [ ] Al cargar la app por primera vez, el tema coincide con la preferencia del sistema
- [ ] Click en el botón de tema (☀️/🌙) cambia inmediatamente el tema
- [ ] El icono del botón cambia correctamente (☀️ en dark, 🌙 en light)
- [ ] Al recargar la página (F5), el tema seleccionado persiste
- [ ] Al cerrar y volver a abrir el navegador, el tema persiste

### Transiciones Visuales

- [ ] El cambio de tema es suave (no hay flash brusco)
- [ ] Los colores cambian de forma sincronizada en todos los componentes
- [ ] Las transiciones duran ~200ms (se siente fluido)
- [ ] No hay parpadeo en texto o bordes durante la transición

### Dark Mode

- [ ] Background principal es oscuro (#0F172A - slate-900)
- [ ] Texto es claro y legible (#F1F5F9 - slate-100)
- [ ] Cards/surfaces tienen contraste visible con el fondo
- [ ] Bordes son visibles pero no demasiado prominentes
- [ ] Sombras son visibles y dan profundidad
- [ ] Colores primarios (azul, verde, rojo) se ven bien
- [ ] TopBar tiene backdrop blur visible
- [ ] Modal backdrop es oscuro semi-transparente

### Light Mode

- [ ] Background principal es blanco (#FFFFFF)
- [ ] Texto es oscuro y legible (#0F172A - slate-900)
- [ ] Cards/surfaces tienen sutiles sombras
- [ ] Bordes son claramente visibles (#E2E8F0)
- [ ] Colores primarios mantienen buen contraste
- [ ] TopBar backdrop blur es visible sobre contenido
- [ ] Modal backdrop es oscuro semi-transparente (contraste)

### Consistencia entre Componentes

En **ambos temas**, verificar que se vean bien:

- [ ] TopBar (header superior)
- [ ] BottomNav (navegación inferior)
- [ ] Modal (diálogos)
- [ ] ConfirmDialog
- [ ] Toast notifications
- [ ] Buttons (primarios, secundarios, danger)
- [ ] Cards (PlanCard, etc.)
- [ ] Forms (inputs, selects, textareas)
- [ ] RoleSelector (pantalla inicial)
- [ ] CoachDashboard
- [ ] AthleteDashboard
- [ ] IntakeForm
- [ ] PlanEditor
- [ ] GymBookingSystem
- [ ] AppointmentScheduler

---

## 📱 Diseño Responsive

### Desktop (> 768px)

#### TopBar

- [ ] Logo visible con icono + texto "Expert Planner v2.0"
- [ ] Role badge muestra texto completo ("Atleta" o "Entrenador")
- [ ] Theme toggle button visible con hover effect
- [ ] Logout button muestra icono + texto "Salir"
- [ ] Todos los elementos están alineados horizontalmente
- [ ] Backdrop blur es visible (efecto glass)

#### Layout

- [ ] Main content tiene padding de 2rem
- [ ] Max-width de 1400px se aplica (contenido centrado en pantallas grandes)
- [ ] No hay scroll horizontal innecesario

#### Componentes

- [ ] Cards se muestran en grid de 2-3 columnas
- [ ] Forms tienen campos en filas horizontales cuando apropiado
- [ ] Modals están centrados y no ocupan toda la pantalla

### Tablet (480px - 768px)

#### TopBar

- [ ] Logo muestra solo el icono (sin texto)
- [ ] Role badge muestra texto ("Atleta" o "Entrenador")
- [ ] Theme toggle button visible
- [ ] Logout button muestra icono + texto "Salir"

#### Layout

- [ ] Main content tiene padding de 1rem
- [ ] Contenido se ajusta al ancho disponible

#### Componentes

- [ ] Cards en grid de 2 columnas o 1 columna según espacio
- [ ] Forms empiezan a apilar campos verticalmente
- [ ] Modals ocupan más espacio (~95vw)

### Mobile (< 480px)

#### TopBar

- [ ] Logo muestra solo el icono
- [ ] Role badge muestra solo el icono (sin texto)
- [ ] Theme toggle button visible (solo icono)
- [ ] Logout button muestra solo el icono (sin texto)
- [ ] Todos los botones tienen touch targets ≥ 44px
- [ ] Spacing entre botones permite tocar sin error

#### Layout

- [ ] Main content tiene padding de 0.75rem
- [ ] Contenido usa todo el ancho disponible
- [ ] No hay overflow horizontal en ninguna parte

#### Componentes

- [ ] Cards en una sola columna (stack vertical)
- [ ] Forms tienen todos los campos apilados verticalmente
- [ ] Inputs tienen altura mínima de 44px
- [ ] Modals ocupan casi toda la pantalla (~95vw)
- [ ] BottomNav tiene botones grandes y fáciles de tocar

### Touch Interactions (Móvil/Tablet)

- [ ] Todos los botones son fáciles de tocar (≥ 44px)
- [ ] No hay elementos demasiado pequeños o cercanos
- [ ] Hover effects NO interfieren (solo en desktop con mouse)
- [ ] Tap feedback es inmediato (no hay delay)
- [ ] Scroll es suave y sin rebotes extraños
- [ ] Zoom de página está permitido (accesibilidad)

### Orientación

#### Portrait (vertical)

- [ ] Todo el contenido es visible
- [ ] TopBar y BottomNav funcionan correctamente
- [ ] Modals se pueden cerrar fácilmente

#### Landscape (horizontal)

En móviles pequeños (<500px altura):

- [ ] TopBar es más compacto (altura reducida)
- [ ] Modals tienen scroll si es necesario
- [ ] Contenido no se corta

---

## ⌨️ Accesibilidad

### Navegación por Teclado

- [ ] Tab permite navegar por todos los elementos interactivos
- [ ] Orden de tabulación es lógico (top-to-bottom, left-to-right)
- [ ] Focus-visible muestra claramente qué elemento está seleccionado
- [ ] Enter/Space activa botones
- [ ] Escape cierra modals
- [ ] Theme toggle funciona con Enter/Space

### Focus States

- [ ] TopBar: botones muestran outline azul al hacer focus
- [ ] Forms: inputs muestran border azul al hacer focus
- [ ] Buttons: outline visible con keyboard navigation
- [ ] Links: outline visible y distinguible
- [ ] Modal: focus trap funciona (no se puede tabular fuera)

### Contraste de Colores

En **ambos temas**:

- [ ] Texto principal tiene contraste ≥ 4.5:1 con fondo
- [ ] Texto secundario tiene contraste ≥ 3:1 con fondo
- [ ] Botones primarios tienen contraste suficiente
- [ ] Links son distinguibles del texto normal
- [ ] Estados de error son claramente visibles

### Screen Readers

- [ ] Theme toggle button tiene aria-label descriptivo
- [ ] Logout button tiene aria-label si solo muestra icono
- [ ] Modals tienen aria-labelledby y aria-describedby
- [ ] Form inputs tienen labels asociados
- [ ] Errores de validación son anunciados

---

## 🖨️ Print Styles

- [ ] Al hacer Print Preview, TopBar no se muestra
- [ ] BottomNav no se muestra
- [ ] Modals no se muestran
- [ ] El contenido principal se imprime correctamente
- [ ] No hay elementos que rompan el layout impreso
- [ ] Cards no se parten en medio de una página (page-break-inside: avoid)

---

## 🚀 Performance

### Velocidad de Carga

- [ ] La página carga en < 3 segundos (3G)
- [ ] El tema se aplica sin flash visible (FOUC)
- [ ] Las imágenes cargan progresivamente (lazy loading)

### Interactividad

- [ ] El toggle de tema responde < 100ms
- [ ] Las transiciones no causan lag
- [ ] El scroll es fluido (60fps)
- [ ] No hay re-renders innecesarios al cambiar tema

### Memoria

- [ ] No hay memory leaks al cambiar tema repetidamente
- [ ] LocalStorage no crece indefinidamente
- [ ] Event listeners se limpian al desmontar componentes

---

## 🌐 Compatibilidad Cross-Browser

### Chrome/Edge

- [ ] Tema funciona correctamente
- [ ] Backdrop blur se ve bien
- [ ] Transiciones son suaves

### Firefox

- [ ] Tema funciona correctamente
- [ ] Backdrop blur se ve bien (puede tener ligeras diferencias)
- [ ] Transiciones son suaves

### Safari (macOS/iOS)

- [ ] Tema funciona correctamente
- [ ] Backdrop blur se ve bien (-webkit-backdrop-filter)
- [ ] Safe areas funcionan en iPhone con notch
- [ ] Input de 16px previene auto-zoom en iOS

---

## 📋 Checklist de Componentes Críticos

### TopBar

- [ ] Sticky position funciona (se queda arriba al hacer scroll)
- [ ] Backdrop blur visible sobre contenido
- [ ] Z-index correcto (no es tapado por otros elementos)
- [ ] Role badge muestra el rol correcto del usuario
- [ ] Logout button ejecuta la acción de salir

### Layout

- [ ] TopBar se renderiza correctamente
- [ ] Main content tiene el padding correcto en cada breakpoint
- [ ] Max-width funciona en pantallas grandes
- [ ] BottomNav (si está presente) no se superpone con contenido

### RoleSelector (pantalla inicial)

- [ ] Cards de selección se ven bien en ambos temas
- [ ] Responsive en móvil (una columna)
- [ ] Iconos y texto son legibles

### CoachDashboard / AthleteDashboard

- [ ] Cards de planes se ven bien
- [ ] Estadísticas son legibles
- [ ] Botones de acción funcionan
- [ ] Exit button del dashboard NO se muestra (ahora está en TopBar)

### Modal / ConfirmDialog

- [ ] Backdrop oscurece el fondo
- [ ] Modal está centrado
- [ ] Botones de acción son claros
- [ ] Close button (X) funciona
- [ ] Escape key cierra el modal

### Toast Notifications

- [ ] Aparecen en posición correcta
- [ ] Son legibles en ambos temas
- [ ] Se auto-cierran después de 3-5 segundos
- [ ] Animación de entrada/salida es suave

---

## 🐛 Casos Edge a Verificar

### Tema

- [ ] Cambiar tema rápidamente 10 veces seguidas no causa errores
- [ ] Cambiar tema con un modal abierto funciona correctamente
- [ ] Cambiar tema mientras se muestra un toast funciona
- [ ] Cambiar tema con múltiples tabs abiertos no causa conflictos

### Responsive

- [ ] Resize de ventana desde mobile a desktop y viceversa funciona
- [ ] Rotar dispositivo (portrait ↔ landscape) ajusta correctamente
- [ ] Zoom del navegador (Ctrl/Cmd +/-) no rompe el layout
- [ ] Tamaños de ventana inusuales (muy estrechos o muy anchos) funcionan

### Forms

- [ ] Focus en input con zoom en iOS no causa problemas
- [ ] Validación de formulario se ve bien en ambos temas
- [ ] Placeholder text tiene contraste suficiente
- [ ] Disabled fields se distinguen visualmente

### Navigation

- [ ] Cambiar de tab en BottomNav funciona suavemente
- [ ] Navegar atrás con browser back button mantiene el tema
- [ ] Refresh de página mantiene el estado de navegación

---

## ✅ Criterios de Éxito

Para considerar la implementación **exitosa**, todos estos deben cumplirse:

1. **Temas**:
   - ✅ Dos temas completos (dark y light)
   - ✅ Toggle funcional en TopBar
   - ✅ Persistencia en localStorage
   - ✅ Transiciones suaves

2. **Responsive**:
   - ✅ Funciona en mobile, tablet y desktop
   - ✅ TopBar responsive con 3 breakpoints
   - ✅ Touch targets ≥ 44px en móvil
   - ✅ Sin scroll horizontal en ningún dispositivo

3. **UX 2026**:
   - ✅ Exit button en TopBar (no en dashboards)
   - ✅ Backdrop blur en header
   - ✅ Glass morphism moderno
   - ✅ Animaciones suaves

4. **Accesibilidad**:
   - ✅ Navegación por teclado completa
   - ✅ Focus-visible en todos los elementos
   - ✅ Contraste WCAG AA (4.5:1)
   - ✅ ARIA labels donde necesario

5. **Performance**:
   - ✅ Build < 500 kB total
   - ✅ Toggle de tema < 100ms
   - ✅ Sin FOUC visible
   - ✅ 60fps en animaciones

---

## 📸 Capturas de Pantalla Recomendadas

Para documentación visual:

1. Desktop Dark Mode - TopBar + Dashboard
2. Desktop Light Mode - TopBar + Dashboard
3. Mobile Dark Mode - TopBar + BottomNav
4. Mobile Light Mode - TopBar + BottomNav
5. Tablet Landscape - Responsive layout
6. Theme Toggle Animation (GIF)
7. Modal en ambos temas
8. Focus states (keyboard navigation)

---

**Última actualización**: 2025-01-XX  
**Versión**: 2.0  
**Propósito**: Verificación de calidad UX antes de producción
