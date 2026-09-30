# Calidad de Código — Expert Sports Planner

Estándares vigentes, deuda técnica verificada y guía de refactorización. Sustituye a los antiguos `BEST_PRACTICES`, `CODE_SMELLS` y `REFACTORING_GUIDE`, que describían una base en JSX con PropTypes (hoy el proyecto es TypeScript). Para el flujo de trabajo (ramas, commits, PR) ver [CONTRIBUTING.md](./CONTRIBUTING.md).

## Índice

1. [Herramientas de calidad](#1-herramientas-de-calidad)
2. [Estándares](#2-estándares)
3. [Deuda técnica verificada](#3-deuda-técnica-verificada)
4. [Guía de refactorización](#4-guía-de-refactorización)
5. [Smells ya resueltos](#5-smells-ya-resueltos)

---

## 1. Herramientas de calidad

| Herramienta            | Configuración                                                                                                                | Comando                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| TypeScript 5.7         | [tsconfig.json](../tsconfig.json): `strict: true`, **`noImplicitAny: false`**, `allowJs: true`                               | `npx tsc --noEmit`                        |
| ESLint 9 (flat config) | [eslint.config.js](../eslint.config.js): `js` + `typescript-eslint` + `react` + `react-hooks` + `react-refresh` + `prettier` | `npm run lint`                            |
| Prettier 3             | `.prettierrc`                                                                                                                | `npm run format` / `npm run format:check` |
| Vitest                 | ver [TESTING.md](./TESTING.md)                                                                                               | `npm test`                                |

---

## 2. Estándares

### 2.1 Componentes

- Componentes funcionales con hooks, tipados con TypeScript (no PropTypes).
- Un componente = una responsabilidad. Extraer subcomponentes y hooks cuando un archivo supere ~300 líneas.
- Reutilizar los componentes de `src/components/ui` (ver [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md)); no duplicar modales, botones ni tarjetas.
- Importar desde el barrel `@/components/ui`; usar el alias `@` para rutas de `src/`.

### 2.2 Estado

- Sesión y vista previa: Zustand; dominio y toasts: Context; UI efímera: `useState`. Detalle y reglas en [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md).
- Suscribirse con selectores mínimos (`useAuthStore((s) => s.currentUser)`).
- Mutaciones de usuario solo mediante las acciones del store.

### 2.3 Hooks y rendimiento

- Declarar todas las dependencias de `useEffect`/`useMemo`/`useCallback` (la regla `react-hooks/exhaustive-deps` está activa).
- Memoizar solo con evidencia de problema (`useMemo`, `React.memo`); priorizar `lazy` + `Suspense` para pantallas pesadas (ya usado con `AdminDashboard`).
- Hooks reutilizables en `src/hooks`: `useModal`, `useConfirm`, `useForm`, `useDebounce`, `useLocalStorage`, `useMediaQuery`, `useTheme`.

### 2.4 Estilos

- Variables CSS o clases Tailwind; sin hex directos (ver UI/UX §2).
- Preferir archivos CSS de módulo/feature (`src/styles`, `src/admin/styles`) frente a `<style>` inline.

### 2.5 Manejo de errores

- Las acciones de datos devuelven `{ success, error? }`; el componente decide el feedback (toast).
- `try/catch` alrededor de `JSON.parse` y acceso a `localStorage` (ya centralizado en `utils/storage.ts`).
- Nunca `alert()`/`window.confirm()`: usar `useToast`, `ConfirmDialog` o `useConfirm`.

### 2.6 Constantes y nombres

- Constantes compartidas en `utils/constants.ts` y `utils/auth.ts` (`ROLES`, `SUBSCRIPTION_*`, `PLAN_LIMITS`, `STORAGE_KEYS`); no usar números o cadenas mágicas.
- Nombres descriptivos en inglés para código, textos de UI en español; sin código comentado (Git conserva el historial).

### 2.7 Seguridad y datos

- No registrar credenciales ni datos personales en consola.
- Lo relativo a sesión, roles y eliminación de cuenta está en [SECURITY.md](./SECURITY.md).

---

## 3. Deuda técnica verificada

Mediciones sobre `src/` (30-sep-2026).

| #   | Hallazgo                                  | Medición                                                                                                                                                                                | Prioridad | Acción recomendada                                                                                                                 |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Componentes gigantes                      | `CoachDashboard.tsx` 2274 líneas, `PlanDetail.tsx` 1756, `AthleteTabs.tsx` 1520, `PlanEditor.tsx` 1430, `AthleticsBuilder.tsx` 1252, `MockDatabase.tsx` 949, `GymSessionEditor.tsx` 851 | Alta      | Dividir por pestañas/secciones y extraer hooks de dominio                                                                          |
| 2   | Estilos inline con `<style>{...}</style>` | 24 componentes                                                                                                                                                                          | Alta      | Mover a archivos CSS; se recrean en cada render                                                                                    |
| 3   | Tipado débil                              | ~122 usos de `: any` / `<any>`; `noImplicitAny: false`; `allowJs: true`                                                                                                                 | Alta      | Activar `noImplicitAny` de forma gradual; tipar `MockDatabase` (`any[]`) con los tipos de `types/index.ts`                         |
| 4   | Contexto monolítico                       | `MockDatabaseProvider` agrupa clientes, gimnasio, citas y solicitudes                                                                                                                   | Media     | Dividir por dominio o migrar a stores Zustand                                                                                      |
| 5   | Acoplamiento a `MockDatabase`             | Los componentes consumen `useMockDatabase()` directamente                                                                                                                               | Media     | Capa de repositorio/servicio para migrar a API (ver [API_SERVICES.md](./API_SERVICES.md) y [API_MIGRATION.md](./API_MIGRATION.md)) |
| 6   | `console.log` en producción               | 3 en `utils/auth.ts` (inicialización del super admin)                                                                                                                                   | Baja      | Eliminar o proteger con `import.meta.env.DEV`                                                                                      |
| 7   | Código sin adoptar                        | `useAsync` y `services/dataServices.ts` no se consumen                                                                                                                                  | Baja      | Adoptarlos o eliminarlos                                                                                                           |
| 8   | Sin i18n                                  | Textos en español incrustados                                                                                                                                                           | Baja      | Solo si hay requisito multi-idioma                                                                                                 |
| 9   | Pruebas insuficientes                     | Una sola suite (`auth.test.ts`)                                                                                                                                                         | Alta      | Implementar los casos de [TESTING.md](./TESTING.md)                                                                                |

---

## 4. Guía de refactorización

Orden sugerido (de menor a mayor riesgo), validando con `npm run lint`, `npm test` y `npm run build` tras cada paso:

1. **Red de seguridad:** implementar los casos críticos CT-01 a CT-03 antes de tocar los dashboards grandes.
2. **Eliminar ruido:** quitar `console.log` y código muerto.
3. **Extraer estilos:** mover `<style>` a CSS por componente (mecánico, bajo riesgo).
4. **Dividir componentes:** separar `CoachDashboard`/`AthleteTabs` por pestaña; los estados locales de modales pasan a `useModal`/`useConfirm`.
5. **Tipar el dominio:** reemplazar `any` en `MockDatabase` y `auth.ts` por `User`, `Client`, `Plan`, etc.; luego activar `noImplicitAny` por carpetas.
6. **Desacoplar datos:** introducir un servicio/repositorio sobre `MockDatabase` para facilitar la migración a API.

Para cada refactor:

- Mantener el comportamiento (sin cambios funcionales en el mismo PR).
- Commits pequeños con Conventional Commits.
- Comprobar ambos temas y breakpoints si se tocan estilos.

### 4.1 Checklist por componente

- [ ] Tipado explícito de props y estado, sin `any` nuevo.
- [ ] Sin `<style>` inline nuevo.
- [ ] Dependencias de hooks completas.
- [ ] Feedback con toast/`ConfirmDialog`, no nativos.
- [ ] Sin valores mágicos ni colores fijos.
- [ ] Accesible: etiquetas, `aria-*`, foco visible, objetivos táctiles ≥ 44 px.
- [ ] Probado para cada rol afectado.

---

## 5. Smells ya resueltos

Señalados en documentos anteriores y verificados como corregidos:

| Smell                                                            | Estado                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `alert()` / `window.confirm()` nativos                           | No hay usos; se emplean `ConfirmDialog`, `useConfirm` y `useToast` |
| Validación de props con PropTypes                                | Sustituida por TypeScript                                          |
| Hooks reutilizables (`useForm`, `useModal`, `useDebounce`, etc.) | Existen en `src/hooks`                                             |
| Constantes de almacenamiento                                     | Centralizadas en `STORAGE_KEYS`                                    |
| Estado global                                                    | Zustand para sesión y vista previa                                 |
