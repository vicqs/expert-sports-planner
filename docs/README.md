# Documentación de Expert Sports Planner

Índice de la documentación técnica y funcional. Para instalación, scripts y variables de entorno, ver el [README principal](../README.md).

## Documentos

| Documento                                                      | Contenido                                                           |
| -------------------------------------------------------------- | ------------------------------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                           | Estructura del proyecto, capas y flujo de datos                     |
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md)                       | Roles, vinculación entrenador–atleta, permisos y retención de datos |
| [FUNCIONALIDADES.md](./FUNCIONALIDADES.md)                     | Listado de funcionalidades por rol                                  |
| [GUIA_APLICACION.md](./GUIA_APLICACION.md)                     | Guía narrativa de uso para entrenador y atleta                      |
| [ADMIN.md](./ADMIN.md)                                         | Acceso y funciones del super administrador                          |
| [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)                   | Zustand, Context, sesión, UI global y persistencia                  |
| [API_SERVICES.md](./API_SERVICES.md)                           | Capa de datos, errores y mutaciones críticas                        |
| [API_MIGRATION.md](./API_MIGRATION.md)                         | Plan de migración a una API REST                                    |
| [SECURITY.md](./SECURITY.md)                                   | Guardias, roles, acciones destructivas, sesión y riesgos            |
| [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md)                   | Identidad visual, componentes, temas y responsive                   |
| [UX_VERIFICATION_CHECKLIST.md](./UX_VERIFICATION_CHECKLIST.md) | Checklist manual de temas y responsive                              |
| [TESTING.md](./TESTING.md)                                     | Stack de pruebas, casos críticos y comandos                         |
| [CODE_QUALITY.md](./CODE_QUALITY.md)                           | Estándares, deuda técnica y guía de refactorización                 |
| [CONTRIBUTING.md](./CONTRIBUTING.md)                           | Ramas, commits, revisión de PR                                      |
| [CHANGELOG.md](./CHANGELOG.md)                                 | Historial resumido de mejoras                                       |

## Orden de lectura para nuevos desarrolladores

1. [ARCHITECTURE.md](./ARCHITECTURE.md): estructura general
2. [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md): reglas del dominio
3. [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md): sesión y datos
4. [UI_UX_GUIDELINES.md](./UI_UX_GUIDELINES.md): componentes y estilos
5. [CONTRIBUTING.md](./CONTRIBUTING.md): entorno y flujo de trabajo
6. [TESTING.md](./TESTING.md) y [CODE_QUALITY.md](./CODE_QUALITY.md): pruebas y estándares
7. [SECURITY.md](./SECURITY.md): limitaciones de seguridad actuales

## Mantenimiento

Actualizar el documento correspondiente cuando se implemente una feature, cambie la arquitectura o se resuelva deuda técnica. Usar commits como `docs: update STATE_MANAGEMENT with <cambio>` (ver [CONTRIBUTING.md](./CONTRIBUTING.md)).

Regla anti-duplicidad: cada tema vive en **un solo** documento; los demás lo enlazan. Los avances históricos se resumen en [CHANGELOG.md](./CHANGELOG.md), no en documentos nuevos.
