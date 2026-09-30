# Expert Sports Planner

Plataforma web de planificación deportiva que conecta a **entrenadores** y **atletas**. Los entrenadores diseñan planes de entrenamiento, gestionan citas y reservas de gimnasio y siguen el progreso de sus atletas; los atletas consultan sus planes, marcan sesiones y reservan horarios. Un panel de administración cubre usuarios, ejercicios, equipamiento y analíticas.

> Estado: aplicación de demostración sin backend. Los datos se guardan en `localStorage` y la autenticación es solo de cliente (ver [docs/SECURITY.md](docs/SECURITY.md)).

## Stack

React 18, TypeScript 5.7, Vite 4, Zustand, Tailwind CSS 3, Framer Motion, Lucide, Vitest + Testing Library, ESLint 9 y Prettier. Despliegue en Vercel.

## Requisitos

- Node.js 24.x (ver `engines` en [package.json](package.json))
- npm y Git

## Puesta en marcha

```bash
git clone <url-del-repositorio>
cd expert-sports-planner
npm install
cp .env.example .env.local   # completar las variables
npm run dev                  # http://localhost:5173
```

## Scripts

| Script                 | Descripción                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Servidor de desarrollo con hot-reload   |
| `npm run build`        | Build de producción                     |
| `npm run preview`      | Sirve localmente la build de producción |
| `npm run lint`         | ESLint sobre todo el proyecto           |
| `npm run format`       | Formatea con Prettier                   |
| `npm run format:check` | Verifica el formato sin modificar       |
| `npm run test`         | Ejecuta las pruebas una vez (Vitest)    |
| `npm run test:watch`   | Pruebas en modo watch                   |

## Variables de entorno

Se definen en `.env.local` (no versionado) a partir de [.env.example](.env.example). Las variables del cliente requieren el prefijo `VITE_`. En producción se configuran en la plataforma de despliegue (Vercel → Settings → Environment Variables).

| Variable                   | Descripción                                         |
| -------------------------- | --------------------------------------------------- |
| `VITE_ADMIN_EMAIL`         | Email del super administrador                       |
| `VITE_ADMIN_PASSWORD_HASH` | Hash SHA-256 de su contraseña (nunca texto plano)   |
| `VITE_ADMIN_NAME`          | Nombre mostrado del super administrador             |
| `VITE_API_BASE_URL`        | URL base de la API (capa de servicios, aún sin uso) |

Las variables `VITE_*` quedan expuestas en el bundle público; ver [docs/SECURITY.md](docs/SECURITY.md).

## Documentación

Toda la documentación técnica y funcional está en [docs/](docs/README.md): arquitectura, lógica de negocio, estado, seguridad, pruebas, contribución y guía de uso.

## Contribuir

Ver [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).
