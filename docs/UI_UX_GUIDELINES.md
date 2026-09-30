# Guía de UI/UX — Expert Sports Planner

Guía de referencia para mantener consistencia visual y de interacción. Se basa en la configuración actual de estilos ([tailwind.config.js](../tailwind.config.js), [src/styles/variables.css](../src/styles/variables.css), [src/styles/main.css](../src/styles/main.css)) y en los componentes de [src/components/ui](../src/components/ui).

---

## Índice

1. [Identidad Visual](#1-identidad-visual)
2. [Paleta de Colores y Tipografía](#2-paleta-de-colores-y-tipografía)
3. [Sistema de Avatares](#3-sistema-de-avatares)
4. [Estados y Feedback](#4-estados-y-feedback)
5. [Componentes Reutilizables](#5-componentes-reutilizables)
6. [Accesibilidad, Temas y Responsive](#6-accesibilidad-temas-y-responsive)
7. [Discrepancias detectadas](#7-discrepancias-detectadas-código-vs-guía)

---

## 1. Identidad Visual

### 1.1 Logotipo

El logotipo es **minimalista** y se basa en un **pulso de electrocardiograma (ECG)** con las letras **ESP** integradas, utilizando el **azul principal de la marca**.

Principios de uso:

- Mantener el trazo simple, sin rellenos ni efectos complejos.
- Usar el azul principal de la marca sobre fondos neutros (claro u oscuro).
- No deformar, rotar ni recolorear el logotipo con colores fuera de la paleta.
- Respetar un área de respeto mínima alrededor del símbolo equivalente a la altura de la letra "E".

### 1.2 Implementación actual del símbolo de marca

El símbolo de pulso está implementado como SVG inline en `BrandPulseIcon` dentro de [TopBar.tsx](../src/components/TopBar.tsx):

- Trazo: `M2 12h4l3-9l6 18l3-9h4` (misma silueta que el icono `Activity` de `lucide-react`), `strokeWidth=2.5`, extremos redondeados.
- Color: `currentColor`, asignado en [TopBar.css](../src/components/TopBar.css) con `var(--color-primary)` más un `drop-shadow` con `--color-primary-glow`.
- Animación: el trazo se dibuja al cargar y en `hover`/`focus-visible` (`brandPulseDraw`).
- El mismo trazo se reutiliza como barra de progreso en [PulseLoader](../src/components/ui/PulseLoader.tsx).

Regla: cualquier nueva representación de la marca (favicon, splash, iconos PWA, emails) debe derivar de este pulso ECG.

---

## 2. Paleta de Colores y Tipografía

Todos los colores se definen como variables CSS en [variables.css](../src/styles/variables.css) y se exponen a Tailwind en [tailwind.config.js](../tailwind.config.js) (`primary`, `accent`, `success`, `warning`, `error`, `info`). **No usar valores hexadecimales directos en componentes**; consumir siempre la variable o la clase de Tailwind.

### 2.1 Colores de marca

| Token CSS                  | Valor                                       | Clase Tailwind               | Uso                                                   |
| -------------------------- | ------------------------------------------- | ---------------------------- | ----------------------------------------------------- |
| `--color-primary`          | `#6d5df6` (claro) / `#8b7cff` (oscuro)      | `text-primary`, `bg-primary` | Color primario; acciones principales, foco, selección |
| `--color-primary-hover`    | `#5647e0` / `#a396ff`                       | `bg-primary-hover`           | Estado hover del primario                             |
| `--color-primary-purple`   | `#6d5df6`                                   | `bg-primary-purple`          | Inicio del gradiente de marca                         |
| `--color-primary-blue`     | `#3b82f6`                                   | `bg-primary-blue`            | Fin del gradiente de marca; azul secundario           |
| `--color-primary-gradient` | `linear-gradient(135deg, #6d5df6, #3b82f6)` | `.bg-gradient-primary`       | Fondos destacados                                     |
| `--color-accent-lime`      | `#a3e635`                                   | `bg-accent` / `accent-lime`  | Acento neón (CTA secundarios, botón `accent`)         |
| `--color-accent-cyan`      | `#22d3ee`                                   | `accent-cyan`                | Acento complementario                                 |

### 2.2 Colores de feedback

| Token             | Valor     | Uso                                       |
| ----------------- | --------- | ----------------------------------------- |
| `--color-success` | `#10b981` | Confirmaciones, acciones completadas      |
| `--color-warning` | `#f59e0b` | Advertencias, validaciones no bloqueantes |
| `--color-error`   | `#ef4444` | Errores y acciones destructivas           |
| `--color-info`    | `#3b82f6` | Mensajes informativos                     |

Cada uno tiene una variante de fondo `--color-*-bg` (10 % de opacidad).

### 2.3 Colores de superficie y texto (por tema)

El tema se controla con `data-theme="light" | "dark"` (hook `useTheme`). Los valores clave:

| Token                      | Claro     | Oscuro    |
| -------------------------- | --------- | --------- |
| `--color-bg`               | `#ffffff` | `#0b0d12` |
| `--color-surface`          | `#ffffff` | `#151821` |
| `--color-surface-elevated` | `#f1f5f9` | `#242836` |
| `--color-text`             | `#0f172a` | `#e7e9ee` |
| `--color-text-muted`       | `#64748b` | `#9aa3b2` |
| `--color-border`           | `#e2e8f0` | `#242836` |

### 2.4 Tipografía

Fuentes cargadas desde Google Fonts en [index.html](../index.html) y configuradas en Tailwind (`fontFamily`):

| Rol                | Fuente                       | Variable CSS     | Clase Tailwind | Uso                                                               |
| ------------------ | ---------------------------- | ---------------- | -------------- | ----------------------------------------------------------------- |
| Interfaz           | **Inter** (400–800)          | `--font-sans`    | `font-sans`    | Texto general, formularios, botones                               |
| Display / métricas | **Sora** (600–800)           | `--font-display` | `font-display` | Títulos destacados, números grandes (series, repeticiones, pesos) |
| Monoespaciada      | **JetBrains Mono** (400–500) | `--font-mono`    | `font-mono`    | Datos técnicos, builder de atletismo                              |

Escala de tamaños (`variables.css`): `--text-xs` 12 px, `--text-sm` 14 px, `--text-base` 16 px, `--text-lg` 18 px, `--text-xl` 20 px, `--text-2xl` 24 px, `--text-3xl` 32 px, `--text-4xl` 40 px. Interlineado: `--leading-tight` 1.25, `--leading-normal` 1.5, `--leading-relaxed` 1.6.

### 2.5 Espaciado, radios y elevación

- Espaciado: `--space-1` (4 px) a `--space-16` (64 px).
- Radios: `--radius-sm` 8 px, `md` 12 px, `lg` 16 px, `xl` 24 px, `2xl` 32 px, `full` 9999 px.
- Sombras: `--shadow-sm` a `--shadow-2xl`, más `--shadow-glow` para énfasis de marca.
- Z-index: escala `--z-dropdown` (1000) a `--z-tooltip` (1600).

> Nota: Tailwind opera con `preflight` desactivado; los estilos base provienen de `main.css`/`variables.css`.

---

## 3. Sistema de Avatares

### 3.1 Flujo de foto de perfil

La aplicación **no admite subida de imágenes** de perfil. La identidad visual del usuario se representa con un **avatar predefinido estilo Netflix** (cuadrícula de personajes coloridos). No existen assets de imagen: cada avatar es un **emoji sobre un fondo con gradiente único**.

Flujo (rol Atleta, pestaña "Perfil" en [AthleteTabs.tsx](../src/components/athlete/AthleteTabs.tsx)):

1. El usuario pulsa el avatar circular (`aria-label="Elegir avatar"`), que tiene un indicador de edición.
2. Se abre `AvatarSelector` (estado `avatarPickerOpen`).
3. Al elegir un avatar se ejecuta `handleSelectAvatar(avatarId)`, que llama a `updateProfile({ avatarId })`.
4. Éxito: toast `"Avatar actualizado"`. Error: toast de error con el mensaje devuelto.
5. El modal se cierra automáticamente tras la selección.

Persistencia: el valor se guarda en el campo opcional `avatarId?: string | null` de `User` ([types/index.ts](../src/types/index.ts)) mediante `updateUserProfile` ([auth.ts](../src/utils/auth.ts)), de modo que sólo se almacena el identificador, no la imagen.

Si `avatarId` es `null`/desconocido, `getAvatarById` devuelve `null` y el componente muestra el fallback (inicial/icono por defecto).

### 3.2 Componente `AvatarSelector`

Archivo: [src/components/ui/AvatarSelector.tsx](../src/components/ui/AvatarSelector.tsx).

API exportada:

| Export                     | Descripción                          |
| -------------------------- | ------------------------------------ |
| `AvatarSelector` (default) | Modal con la cuadrícula de selección |
| `AVATAR_OPTIONS`           | Catálogo (`id`, `emoji`, `gradient`) |
| `AvatarId`                 | Tipo unión de los ids disponibles    |
| `getAvatarById(id?)`       | Devuelve la opción o `null`          |

Props de `AvatarSelector`:

| Prop         | Tipo                        | Descripción                                    |
| ------------ | --------------------------- | ---------------------------------------------- |
| `isOpen`     | `boolean`                   | Controla la visibilidad                        |
| `onClose`    | `() => void`                | Cierre del modal                               |
| `selectedId` | `string \| null` (opcional) | Avatar activo                                  |
| `onSelect`   | `(id: string) => void`      | Callback al elegir; el selector se cierra solo |

Catálogo actual (16): `fox`, `owl`, `koala`, `dragon`, `unicorn`, `lion`, `octopus`, `panda`, `tiger`, `frog`, `monkey`, `alien`, `robot`, `ghost`, `shark`, `wolf`.

Detalles de implementación:

- Se apoya en el componente base `Modal` (título "Elige tu avatar", tamaño `md`).
- Cuadrícula de 4 columnas (3 columnas en pantallas ≤ 400 px).
- Cada opción es un `motion.button` con `aspect-ratio: 1`, `border-radius: var(--radius-lg)`, animación `whileHover` (escala 1.06) y `whileTap` (0.95).
- Estado activo: `aria-pressed`, borde blanco, contorno con `--color-primary` y una insignia de verificación (`Check`).
- Accesibilidad: cada botón tiene `aria-label="Elegir avatar {id}"`.

Uso recomendado:

```tsx
import { AvatarSelector, getAvatarById } from "@/components/ui";

const avatar = getAvatarById(currentUser?.avatarId);

<div style={{ background: avatar?.gradient }}>{avatar?.emoji}</div>

<AvatarSelector
  isOpen={open}
  onClose={() => setOpen(false)}
  selectedId={currentUser?.avatarId}
  onSelect={async (id) => updateProfile({ avatarId: id })}
/>
```

Para añadir un avatar: agregar una entrada a `AVATAR_OPTIONS` con un `id` único y estable (nunca renombrar ids existentes, ya que están persistidos), un emoji y un gradiente `linear-gradient(135deg, …)` con contraste suficiente.

---

## 4. Estados y Feedback

### 4.1 Acciones destructivas

Reglas:

1. Toda acción destructiva o irreversible **debe** pasar por un modal de confirmación (`ConfirmDialog`); no usar `window.confirm()`.
2. El botón de confirmación usa la variante **roja** (`variant="danger"` → `btn-danger`, color `--color-error`).
3. El diálogo muestra el icono de peligro (`XCircle` en `--color-error`), un mensaje que explique claramente la consecuencia y dos botones explícitos: "Cancelar" (`secondary`) y la acción con verbo específico (p. ej. "Eliminar mi cuenta").
4. Para acciones críticas e irreversibles se exige **confirmación escrita** mediante `children` + `confirmDisabled`.
5. Durante la operación se usa `isLoading`, que bloquea cierre por backdrop/Escape y cambia el texto a "Procesando...".
6. Las filas de acción destructiva en listas de ajustes usan la clase `perfil-security-danger` con el icono `Trash2`.

Ejemplo de referencia — **eliminar cuenta** ([AthleteTabs.tsx](../src/components/athlete/AthleteTabs.tsx)):

```tsx
<ConfirmDialog
  isOpen={deleteDialogOpen}
  onClose={() => {
    setDeleteDialogOpen(false);
    setDeleteConfirmText("");
  }}
  onConfirm={handleDeleteAccount}
  title="Eliminar cuenta"
  message="Esta acción es permanente y no se puede deshacer. Se eliminará tu cuenta y perderás el acceso a tus planes, reservas y citas."
  variant="danger"
  confirmText="Eliminar mi cuenta"
  isLoading={deleting}
  confirmDisabled={deleteConfirmText.trim().toUpperCase() !== "ELIMINAR"}
>
  {/* input: el usuario escribe ELIMINAR para habilitar el botón */}
</ConfirmDialog>
```

Acciones menos graves (p. ej. quitar una semana en `PlanEditor`) pueden resolverse con toast informativo, pero las que afecten datos de otra persona o sean irrecuperables requieren el diálogo.

### 4.2 Notificaciones

Existen dos canales distintos que no deben confundirse:

**a) Recordatorios (preferencias de notificación del usuario).** Están **restringidos a dos categorías: sesiones y citas**. Se controlan con interruptores (`role="switch"`, clase `perfil-switch`) en Perfil y se guardan en `NotificationPrefs`:

| Clave                  | Descripción                                | Valor por defecto |
| ---------------------- | ------------------------------------------ | ----------------- |
| `sessionReminders`     | Recordatorios de sesiones de entrenamiento | `true`            |
| `appointmentReminders` | Recordatorios de citas                     | `true`            |

No se deben añadir nuevas categorías de notificación (marketing, social, etc.) sin una decisión de producto explícita.

**b) Toasts (feedback inmediato de UI).** Se disparan con `useToast().addToast(message, type, duration)`:

| Tipo      | Color             | Uso                                                                  |
| --------- | ----------------- | -------------------------------------------------------------------- |
| `success` | `--color-success` | Acción completada ("Plan guardado correctamente")                    |
| `error`   | `--color-error`   | Fallo de la operación (mostrar `result.error` o un mensaje genérico) |
| `warning` | `--color-warning` | Validación no bloqueante ("Selecciona fecha y hora…")                |
| `info`    | `--color-primary` | Información neutra ("Solicitud rechazada")                           |

Directrices:

- Duración por defecto: 3000 ms (incluye barra de progreso); `0` = persistente.
- Mensajes en español, cortos, en tiempo pasado para éxitos ("Avatar actualizado") y accionables para errores.
- Posición: esquina inferior derecha en escritorio; ancho completo sobre el safe-area inferior en móvil (≤ 640 px).
- El cierre manual usa `aria-label="Cerrar notificación"`.

### 4.3 Estados de carga y vacío

- Carga de pantalla/ruta: `PulseLoader` (trazo ECG que se dibuja; `fullScreen={false}` para uso inline).
- Carga de contenido: `Skeleton` (`text`, `title`, `circle`, `rectangle`).
- Carga en botones: `loading` en `Button` (muestra spinner y deshabilita).
- Progreso: `ProgressRing`.

---

## 5. Componentes Reutilizables

Todos se exportan desde [src/components/ui/index.ts](../src/components/ui/index.ts). Importar siempre desde el barrel:

```tsx
import { Button, Card, Modal, ConfirmDialog, useToast } from "@/components/ui";
```

| Componente                             | Archivo              | Descripción y props principales                                                                                                                                                                                                                                           |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                               | `Button.tsx`         | `variant`: `primary` \| `secondary` \| `accent` \| `ghost` \| `danger` \| `icon`; `size`: `sm` \| `md` \| `lg`; `loading`; `leftIcon`; `rightIcon`. Extiende `ButtonHTMLAttributes`. Incluye `tap-ripple`                                                                 |
| `Card`                                 | `Card.tsx`           | `glass` (glassmorfismo), `hover` (elevación), `gradient` (`purple-blue` \| `radial`). Extiende `div`                                                                                                                                                                      |
| `Modal`                                | `Modal.tsx`          | `isOpen`, `onClose`, `title`, `footer`, `size` (`sm`/`md`/`lg`/`xl`), `variant` (`default`/`confirm`/`success`/`warning`/`error`), `closeOnBackdrop`, `closeOnEscape`, `showCloseButton`. Gestiona foco, Escape, bloqueo de scroll y ARIA (`role="dialog"`, `aria-modal`) |
| `ConfirmDialog`                        | `ConfirmDialog.tsx`  | Sustituto de `window.confirm()`. `title`, `message`, `confirmText`, `cancelText`, `variant` (`warning`/`danger`/`info`/`success`), `isLoading`, `confirmDisabled`, `children`                                                                                             |
| `Toast` / `ToastProvider` / `useToast` | `Toast.tsx`          | Feedback efímero. `ToastProvider` debe envolver la app; `useToast()` devuelve `{ addToast, removeToast }`                                                                                                                                                                 |
| `AvatarSelector`                       | `AvatarSelector.tsx` | Selector de avatar (ver [sección 3](#3-sistema-de-avatares))                                                                                                                                                                                                              |
| `PlanCard`                             | `PlanCard.tsx`       | Tarjeta de plan de entrenamiento                                                                                                                                                                                                                                          |
| `ProgressRing`                         | `ProgressRing.tsx`   | Anillo de progreso: `progress` (0–100), `size`, `stroke`, `label`, `showPercent`                                                                                                                                                                                          |
| `PulseLoader`                          | `PulseLoader.tsx`    | Indicador de carga ECG: `label`, `fullScreen`, `className`                                                                                                                                                                                                                |
| `Skeleton`                             | `Skeleton.tsx`       | Placeholder: `variant`, `width`, `height`, `count`                                                                                                                                                                                                                        |
| `BottomNav`                            | `BottomNav.tsx`      | Navegación inferior para móvil                                                                                                                                                                                                                                            |

### 5.1 Inputs y formularios

No existe un componente `Input` dedicado. Los campos (`input`, `select`, `textarea`) reciben estilo global desde [main.css](../src/styles/main.css) (bordes, foco, placeholder y aspecto de `select`). Reglas:

- Usar elementos nativos dentro de un `<label>` para asociar etiqueta y control.
- No sobrescribir colores de foco; el anillo proviene de `--color-primary`.
- Validar y mostrar errores con toasts (`error`/`warning`) o texto `--color-error` junto al campo.
- Para formularios con estado usar los hooks de [src/hooks](../src/hooks) (`useForm`, `useDebounce`, etc.).

### 5.2 Reglas de consumo

1. Reutilizar antes de crear: si un componente base cubre el caso, no duplicar estilos.
2. Elegir la variante de `Button` por jerarquía: una sola acción `primary` por vista; `secondary` para cancelar; `danger` sólo en acciones destructivas; `ghost` para acciones terciarias (p. ej. cerrar sesión).
3. Iconografía exclusivamente con `lucide-react`, tamaños 16–20 px en línea y 48 px en diálogos.
4. Animaciones con `framer-motion` y respetando `prefers-reduced-motion`.
5. Modales: usar `Modal`/`ConfirmDialog`; nunca `alert()` ni `confirm()`.
6. Estilos: variables CSS o clases Tailwind; evitar valores fijos de color/espaciado.

---

## 6. Accesibilidad, Temas y Responsive

### 6.1 Accesibilidad

- Objetivos táctiles mínimos de 44 px (`--touch-target-min`), 48 px cómodo, 56 px grande (`--touch-target-large`).
- Anillo de foco global mediante `*:focus-visible` en `main.css`.
- `prefers-reduced-motion` desactiva animaciones no esenciales.
- El tono primario se aclara en modo oscuro para mantener contraste AA.
- Elementos interactivos personalizados deben llevar `aria-label`, `aria-pressed`/`aria-checked` según corresponda.

### 6.2 Sistema de temas (claro / oscuro)

| Aspecto           | Implementación                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook              | `useTheme` ([useTheme.ts](../src/hooks/useTheme.ts)): devuelve `theme`, `isDark`, `isLight`, `toggleTheme`, `setLightTheme`, `setDarkTheme` |
| Selección inicial | 1) valor guardado en `localStorage["expert_planner_theme"]` (`"light"`/`"dark"`); 2) `prefers-color-scheme: dark`; 3) **claro** por defecto |
| Aplicación        | `document.documentElement[data-theme]` en un `useEffect`, que además persiste la clave                                                      |
| Variables         | Bloques `[data-theme="light"]` y `[data-theme="dark"]` en [variables.css](../src/styles/variables.css); valores en §2.3                     |
| Navegador         | `color-scheme: light dark` (CSS) y `<meta name="color-scheme">` en [index.html](../index.html) para controles nativos                       |
| Interruptor       | Botón sol/luna en `TopBar`                                                                                                                  |

Reglas:

1. Consumir siempre `var(--color-*)` o clases Tailwind; nunca hex directos (salvo colores semánticos de identidad, p. ej. el badge por tipo de sesión).
2. Probar cada pantalla en ambos temas y verificar contraste.
3. No duplicar la lógica de tema: usar el hook.
4. Cada instancia de `useTheme` mantiene su propio estado; al haber un único botón en `TopBar` no hay conflicto, pero un segundo consumidor no se sincroniza sin recarga.

Pendientes (ideas de roadmap): tema "auto" dinámico, alto contraste, selector de acento.

### 6.3 Diseño responsive

Enfoque mobile-first. Viewport definido en [index.html](../index.html): `width=device-width, initial-scale=1.0, viewport-fit=cover` (no se bloquea el zoom).

| Breakpoint | Uso                                                                          |
| ---------- | ---------------------------------------------------------------------------- |
| `≥ 768px`  | Escalado a tablet/escritorio (`main.css`)                                    |
| `≤ 768px`  | `TopBar` oculta el texto de marca; ajustes de layout y `trainer-library.css` |
| `≤ 640px`  | Toasts a ancho completo                                                      |
| `≤ 480px`  | `TopBar` oculta también texto del rol y de "Salir" (solo iconos)             |
| `≤ 400px`  | Selector de avatar a 3 columnas                                              |

Reglas:

- Inputs con `font-size` de 16 px para evitar el zoom automático de iOS.
- Sin scroll horizontal ni anchos fijos en móvil (usar `%`, `max-width`, `minmax()`).
- `BottomNav` es la navegación principal en móvil; los modales tienen scroll interno.
- Botones y áreas táctiles ≥ 44 px (ver auditoría de tap targets en el repositorio).
- Verificación manual: usar [UX_VERIFICATION_CHECKLIST.md](./UX_VERIFICATION_CHECKLIST.md) (temas y responsive) y los dispositivos de referencia iPhone SE (375 px), iPad (768 px) y escritorio 1080p.

---

## 7. Discrepancias detectadas (código vs. guía)

Puntos donde la implementación actual difiere de la identidad descrita y que conviene alinear:

| Tema            | Guía de marca            | Estado actual en el código                                                                                                                                                                                                               |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color principal | Azul                     | `--color-primary` es **violeta** (`#6d5df6`); el azul (`#3b82f6`) es `--color-primary-blue`. `theme-color` en [index.html](../index.html) es `#6D5DF6` y en [manifest.json](../public/manifest.json) `#8B5CF6` (inconsistentes entre sí) |
| Logotipo        | Pulso ECG con letras ESP | `BrandPulseIcon` dibuja sólo el pulso (sin letras ESP) y el nombre se muestra como texto "Expert Sport Planner"                                                                                                                          |
| Nombre          | Expert Sports Planner    | El `TopBar` muestra "Expert Sport Planner" (sin "s")                                                                                                                                                                                     |
| Iconos/favicon  | Derivados del logotipo   | Favicon `vite.svg` y `icons: []` en el manifest PWA                                                                                                                                                                                      |
| Eliminar cuenta | Confirmación escrita     | La comparación ignora mayúsculas (`trim().toUpperCase()`), por lo que "eliminar" también es válido                                                                                                                                       |

Recomendación: decidir si el azul de marca pasa a ser `--color-primary` (o si se mantiene el gradiente violeta→azul) y actualizar `variables.css`, `PulseLoader`, `theme-color` y el manifest de forma coordinada.
