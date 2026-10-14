# Historial de Cambios (resumen)

Resumen consolidado de los documentos de avance anteriores (`IMPROVEMENTS_LOG`, `UX_IMPROVEMENTS`, `UX_IMPROVEMENTS_REVIEW_3`, `IMPLEMENTATION_SUMMARY`, `PERSISTENCE_UPDATE`), conservados en el historial de Git. Es un registro histórico; el estado vigente está en los documentos temáticos enlazados en [README.md](./README.md).

## Panel de administración: catálogo, seguridad y gestión

- Catálogo de ejercicios ampliado a 1022 en 8 categorías (nuevas: cuerpo completo, pliométrico, cardio, movilidad) con metadatos en español y filtro de datos faltantes.
- Contraseñas con PBKDF2-SHA256 y sal, con migración automática de hashes SHA-256; validación de email; `assertAdmin` valida la sesión; `quickAdminLogin` solo en localhost.
- Cambio de contraseña del admin desde Configuración (`envPasswordHash` preserva el cambio).
- Usuarios: acciones en lote (plan y trial) y exportación CSV. Panel General: tarjeta de trials vencidos.
- Configuración: bitácora con filtro, CSV y límite de 1000 entradas; restablecer datos operativos.
- Nuevas pruebas en `auth.admin.test.ts`.
- Admin: eliminación atómica y en lote de usuarios, búsqueda global (Ctrl+K), tarjeta Salud de datos, importar/exportar equipamiento, búsqueda de usuarios sin tildes, bloqueo de cambio del propio plan y validación estricta de `crm_equipment`.
- Admin: suspender cuentas, clave temporal, edición de nombre/email, cierre por inactividad configurable, aviso de respaldo antiguo, límite de errores por vista y carga diferida de vistas; corrección de fecha local en equipamiento (UTC podía adelantar el día).
- Admin: acciones en lote de equipamiento (estado y mantenimiento), historial de mantenimientos por equipo, mover ejercicios filtrados a otra categoría y comparativa de altas mes actual vs anterior en Estadísticas.
- Admin: crear usuarios con clave temporal copiable, deshacer eliminación de equipos/ejercicios, vista previa al importar, búsqueda con debounce, CSV unificado (`admin/utils/csv.ts`) y exportación CSV de equipos y ejercicios, nombre del actor y paginación en la bitácora, tipado de `EquipmentManager`/`ExerciseDatabase`.
- Entrenador: citas y disponibilidad por entrenador, rechazo de horarios que se cruzan, validación de que el atleta pertenece al entrenador al editar datos básicos y lesiones, y fechas locales (no UTC) en agenda.

## 2026-09 — Suite de documentación técnica

- Nuevos: `BUSINESS_LOGIC`, `UI_UX_GUIDELINES`, `CONTRIBUTING`, `API_SERVICES`, `STATE_MANAGEMENT`, `SECURITY`, `TESTING`, `CODE_QUALITY`.
- Consolidados: temas y responsive pasan a `UI_UX_GUIDELINES`; `BEST_PRACTICES`, `CODE_SMELLS` y `REFACTORING_GUIDE` pasan a `CODE_QUALITY`; `PERSISTENCE_GUIDE`/`PERSISTENCE_UPDATE` se cubren con `STATE_MANAGEMENT`, `API_SERVICES` y `API_MIGRATION`.

## 2026-02 — Revisión UX #3 y sistema de temas

- Sistema de temas claro/oscuro con `useTheme` y variables CSS; `TopBar` con selector de tema.
- Diseño mobile-first, objetivos táctiles ≥ 44 px, foco visible y `prefers-reduced-motion`.
- Mejoras en `TopBar`, dashboards, `IntakeForm`, `PlanDetail`, `BottomNav`, `PlanCard` y `RoleSelector`; eliminación de botones "Salir" duplicados.

## 2026-02 — Reemplazo de diálogos nativos

- `Modal`, `ConfirmDialog` y `ToastProvider`/`useToast` sustituyen a `alert()` y `window.confirm()`.
- Hooks `useModal` y `useConfirm`.
- Componentes actualizados: reservas de gimnasio, agenda del entrenador, visor de planes, citas y `CoachDashboard`.

## 2026-02 — Infraestructura y persistencia (Sprints 1-2)

- Utilidades de almacenamiento (`storage`), constantes y hooks reutilizables (`useForm`, `useDebounce`, `useLocalStorage`, `useAsync`, `useMediaQuery`).
- Primera documentación de arquitectura, buenas prácticas y code smells.

## 2024-01 — Sesiones persistentes y capa de servicios

- Sesión persistente tras recargar y control de acceso por rol.
- Capa de servicios (`ClientService`, `GymService`, `AppointmentService`) preparada para migrar a API; actualmente en modo mock y sin consumo por los componentes (ver [API_SERVICES.md](./API_SERVICES.md)).
