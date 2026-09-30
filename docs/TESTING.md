# Estrategia de Pruebas — Expert Sports Planner

## Índice

1. [Stack de pruebas](#1-stack-de-pruebas)
2. [Casos de uso críticos (obligatorios)](#2-casos-de-uso-críticos-obligatorios)
3. [Comandos de ejecución](#3-comandos-de-ejecución)
4. [Convenciones](#4-convenciones)

---

## 1. Stack de pruebas

### 1.1 Estado actual (verificado en el repositorio)

| Capa                        | Herramienta                   | Configuración                                                                                 |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Runner unitario/integración | **Vitest** 4                  | `test` dentro de [vite.config.js](../vite.config.js): `environment: "jsdom"`, `globals: true` |
| Entorno DOM                 | **jsdom**                     | Mismo bloque                                                                                  |
| Componentes                 | **@testing-library/react** 16 | Instalado                                                                                     |
| Matchers DOM                | **@testing-library/jest-dom** | Importado en [src/setupTests.ts](../src/setupTests.ts)                                        |
| Alias                       | `@` → `src/`                  | Compartido con Vite                                                                           |
| E2E                         | **No configurado**            | No hay Cypress ni Playwright                                                                  |
| CI/CD                       | **No configurado**            | No existe `.github/`; el despliegue es Vercel (`vercel.json`)                                 |

> El proyecto **no usa Jest**: Vitest expone una API compatible (`describe`, `it`, `expect`, `vi`). Hoy solo existe una suite: [src/utils/auth.test.ts](../src/utils/auth.test.ts) (registro, login y duplicados).

### 1.2 Stack objetivo

| Capa                   | Herramienta                                                          | Estado           |
| ---------------------- | -------------------------------------------------------------------- | ---------------- |
| Unitario y componentes | Vitest + React Testing Library                                       | Existente        |
| Simulación de usuario  | `@testing-library/user-event`                                        | **Por instalar** |
| E2E                    | **Playwright** (recomendado; funciona con Vite y es multi-navegador) | **Por instalar** |
| Cobertura              | `@vitest/coverage-v8`                                                | **Por instalar** |

Instalación sugerida:

```bash
npm i -D @testing-library/user-event @vitest/coverage-v8
npm i -D @playwright/test && npx playwright install --with-deps chromium
```

### 1.3 Pirámide

| Nivel      | Qué prueba                                              | Herramienta               |
| ---------- | ------------------------------------------------------- | ------------------------- |
| Unitario   | Funciones puras (`utils/auth.ts`, `storage.ts`, stores) | Vitest                    |
| Componente | UI por rol, modales, formularios                        | Vitest + RTL + user-event |
| E2E        | Flujos completos con navegador real                     | Playwright                |

---

## 2. Casos de uso críticos (obligatorios)

Estas pruebas **deben existir y pasar** antes de cada merge a la rama principal.

### 2.1 Convenciones comunes

- La app lee la sesión de `localStorage` (`currentUser`, `users`) al iniciar; los tests deben sembrar esas claves **antes** de renderizar y limpiar con `localStorage.clear()` en `beforeEach`.
- Renderizar con los proveedores reales: `AuthProvider > MockDatabaseProvider > ToastProvider`.
- Consultar por rol accesible (`getByRole`, `getByLabelText`), no por clases CSS.
- El hook `useAuth()` lanza error fuera de `AuthProvider`; nunca renderizar componentes sin él.
- El store de Zustand es un singleton: reiniciarlo entre tests con `useAuthStore.setState({ currentUser: null })`.

Utilidad sugerida (`src/test-utils.tsx`):

```tsx
import { render } from "@testing-library/react";
import { AuthProvider } from "@/context/AuthContext";
import { MockDatabaseProvider } from "@/context/MockDatabase";
import { ToastProvider } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/useAuthStore";

export const renderWithProviders = (ui: React.ReactElement, user: unknown) => {
  localStorage.setItem("currentUser", JSON.stringify(user));
  useAuthStore.setState({ currentUser: user as never });
  return render(
    <AuthProvider>
      <MockDatabaseProvider>
        <ToastProvider>{ui}</ToastProvider>
      </MockDatabaseProvider>
    </AuthProvider>,
  );
};
```

### 2.2 CT-01 — Un `ATHLETE` no puede editar lesiones (UI)

| Campo        | Valor                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Tipo         | Componente (Vitest + RTL)                                                                                          |
| Objetivo     | `PerfilTab` (en [AthleteTabs.tsx](../src/components/athlete/AthleteTabs.tsx)) muestra las lesiones en solo lectura |
| Precondición | Usuario `role: "ATHLETE"` con `injuries` (p. ej. una lesión de rodilla)                                            |

Verificar:

1. Se visualiza el encabezado "Lesiones" y cada lesión registrada.
2. Sin lesiones, aparece "Sin lesiones registradas."
3. No existen controles de edición dentro de esa sección: ningún `textbox`, ni botones "Editar", "Agregar" o "Eliminar" lesión.
4. `setAthleteInjuries` **no** es invocado (espía con `vi.spyOn` sobre el módulo `utils/auth`).
5. El modal "Datos Básicos y Lesiones" no existe en el árbol del atleta.

```tsx
it("ATHLETE ve las lesiones en solo lectura", () => {
  renderWithProviders(<PerfilTab />, athleteWithInjuries);
  expect(screen.getByText(/lesiones/i)).toBeInTheDocument();
  expect(screen.getByText(/rodilla/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /(editar|agregar).*lesi/i }),
  ).toBeNull();
  expect(
    screen.queryByRole("dialog", { name: /datos básicos y lesiones/i }),
  ).toBeNull();
});
```

Complemento a nivel de enrutamiento (`App`): con sesión `ATHLETE`, `CoachDashboard` no se monta.

### 2.3 CT-02 — Un `TRAINER` sí puede editar lesiones

| Campo        | Valor                                                                                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tipo         | Componente / integración                                                                                                                                          |
| Objetivo     | `CoachDashboard` → "Mis Atletas" → modal "Datos Básicos y Lesiones" permite agregar, editar y guardar                                                             |
| Precondición | Usuario `TRAINER` en sesión; atleta vinculado existente en `users` (la función `setAthleteInjuries` lanza "Atleta no encontrado" si el atleta no está en `users`) |

Verificar:

1. El entrenador abre el modal del atleta.
2. Puede agregar una lesión y completar sus campos.
3. Al guardar se invoca `setAthleteInjuries(athleteId, injuries)` con el contenido correcto.
4. Persiste: `getAllUsers().find(id).injuries` contiene la lesión.
5. Se muestra el toast de éxito y el modal se cierra.
6. Regla de validación del formulario: los campos son opcionales, pero el guardado se bloquea si una lesión tiene datos inconsistentes (ver `validationErrors` en `CoachDashboard.tsx`).

Prueba cruzada de integración: tras guardar como `TRAINER`, cambiar la sesión al atleta y comprobar que `PerfilTab` muestra la lesión (solo lectura).

> **Brecha conocida:** `setAthleteInjuries` no valida el rol del llamador (ver [SECURITY.md](./SECURITY.md)). Cuando exista validación, añadir un test unitario que verifique que un `ATHLETE` recibe error.

### 2.4 CT-03 — "Eliminar Cuenta" no se envía sin la validación correcta

| Campo    | Valor                                                                                                  |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Tipo     | Componente (+ E2E)                                                                                     |
| Objetivo | El botón "Eliminar mi cuenta" solo se habilita al escribir `ELIMINAR`                                  |
| Regla    | `deleteConfirmText.trim().toUpperCase() === "ELIMINAR"` (insensible a mayúsculas y espacios laterales) |

Tabla de casos:

| Entrada             | Botón         | Resultado                                 |
| ------------------- | ------------- | ----------------------------------------- |
| `""` (vacío)        | Deshabilitado | No se llama a `deleteMyAccount`           |
| `"eliminar cuenta"` | Deshabilitado | Igual                                     |
| `"ELIMINA"`         | Deshabilitado | Igual                                     |
| `"ELIMINAR"`        | Habilitado    | Permite confirmar                         |
| `"  eliminar  "`    | Habilitado    | Permite confirmar (comportamiento actual) |

Verificar además:

1. Clic en el botón deshabilitado **no** invoca `deleteMyAccount` ni `deleteAccount`; `users` y `currentUser` siguen intactos.
2. Con texto válido y confirmación: `deleteMyAccount` se llama una vez, `currentUser` queda `null` y se vuelve a `AuthPage`.
3. Durante `deleting`, el botón muestra "Procesando..." y Cancelar está deshabilitado; `Escape` no cierra el diálogo.
4. Al cancelar y reabrir, el campo está vacío y el botón deshabilitado de nuevo.
5. Error (p. ej. cuenta super admin): toast de error y la cuenta sigue existiendo.

```tsx
it("no permite eliminar sin escribir ELIMINAR", async () => {
  const user = userEvent.setup();
  const deleteSpy = vi.spyOn(useAuthStore.getState(), "deleteMyAccount");
  renderWithProviders(<PerfilTab onExit={vi.fn()} />, athlete);

  await user.click(screen.getByText(/eliminar cuenta/i));
  const confirmBtn = screen.getByRole("button", {
    name: /eliminar mi cuenta/i,
  });
  expect(confirmBtn).toBeDisabled();

  await user.type(screen.getByPlaceholderText("ELIMINAR"), "eliminar cuent");
  expect(confirmBtn).toBeDisabled();

  await user.clear(screen.getByPlaceholderText("ELIMINAR"));
  await user.type(screen.getByPlaceholderText("ELIMINAR"), "ELIMINAR");
  expect(confirmBtn).toBeEnabled();
  expect(deleteSpy).not.toHaveBeenCalled();
});
```

### 2.5 E2E (Playwright) — escenarios espejo

| ID     | Escenario                                                                                                                             |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| E2E-01 | Login como atleta → Perfil → sección Lesiones sin botones de edición                                                                  |
| E2E-02 | Login como entrenador → Mis Atletas → editar lesiones → recargar → el dato persiste                                                   |
| E2E-03 | Atleta → Eliminar cuenta: botón bloqueado → escribir `ELIMINAR` → confirmar → vuelve al login y el usuario ya no puede iniciar sesión |

Configuración mínima (`playwright.config.ts`):

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:4173", trace: "on-first-retry" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
```

Como la app usa `localStorage`, sembrar el estado con `page.addInitScript` o `page.evaluate` antes de navegar. No hay backend que simular.

### 2.6 Matriz de trazabilidad

| Requisito                      | Unit/Componente | E2E    |
| ------------------------------ | --------------- | ------ |
| ATHLETE no edita lesiones      | CT-01           | E2E-01 |
| TRAINER edita lesiones         | CT-02           | E2E-02 |
| Eliminar cuenta con validación | CT-03           | E2E-03 |

Las verificaciones manuales de temas y responsive están en [UX_VERIFICATION_CHECKLIST.md](./UX_VERIFICATION_CHECKLIST.md).

---

## 3. Comandos de ejecución

### 3.1 Local

| Comando                                 | Acción                             | Disponible hoy |
| --------------------------------------- | ---------------------------------- | -------------- |
| `npm test`                              | `vitest run`: ejecuta todo una vez | Sí             |
| `npm run test:watch`                    | `vitest`: modo watch               | Sí             |
| `npx vitest run src/utils/auth.test.ts` | Un archivo                         | Sí             |
| `npx vitest run -t "ELIMINAR"`          | Filtrar por nombre                 | Sí             |
| `npm run lint`                          | ESLint                             | Sí             |
| `npm run format:check`                  | Prettier en modo verificación      | Sí             |
| `npm run test:coverage`                 | `vitest run --coverage`            | Por añadir     |
| `npm run test:e2e`                      | `playwright test`                  | Por añadir     |

Scripts a añadir en `package.json`:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 3.2 CI/CD

No hay pipeline definido. Propuesta con GitHub Actions (`.github/workflows/ci.yml`), alineada con Node 24 (`engines`) y `npm ci` (`vercel.json`):

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

Reglas recomendadas:

- Proteger `main`: exigir que `test` y `e2e` pasen.
- Vercel solo debe desplegar producción desde commits con el pipeline en verde.
- Los casos CT-01 a CT-03 y E2E-01 a E2E-03 son bloqueantes.

---

## 4. Convenciones

| Tema               | Regla                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| Ubicación          | Tests junto al código (`*.test.ts(x)`); E2E en `e2e/`                                                    |
| Nombres            | `describe` por módulo; `it` en español, describiendo el comportamiento                                   |
| Aislamiento        | `localStorage.clear()` y reinicio del store en `beforeEach`                                              |
| Selectores         | Por rol/etiqueta accesible; evitar clases CSS                                                            |
| Fechas             | Usar `vi.useFakeTimers()` / `vi.setSystemTime()`: los datos mock usan fechas relativas a "hoy"           |
| Mocks de datos     | `MockDatabaseProvider` siembra usuarios y planes en cada montaje; tenerlo en cuenta al verificar `users` |
| Red                | No hay backend; no hace falta mockear `fetch` (`dataServices.ts` no se consume)                          |
| Cobertura sugerida | ≥ 80 % en `utils/auth.ts` y `store/`; los CT-01 a CT-03 son obligatorios                                 |
