# README - Documentación del Proyecto

Esta carpeta contiene toda la documentación técnica del proyecto Expert Sports Planner.

---

## 📚 Índice de Documentos

### Análisis de Código

- **[CODE_SMELLS.md](./CODE_SMELLS.md)**  
  Lista completa de code smells identificados, su impacto y soluciones propuestas.
  - Code smells críticos, importantes y menores
  - Ejemplos de antes/después
  - Prioridades de corrección
  - Métricas de impacto

### Arquitectura

- **[ARCHITECTURE.md](./ARCHITECTURE.md)**  
  Descripción detallada de la arquitectura del sistema.
  - Estructura del proyecto
  - Capas de la aplicación
  - Flujo de datos
  - Patrones de diseño utilizados
  - Stack tecnológico

### Mejores Prácticas

- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)**  
  Guía de mejores prácticas de programación para React y JavaScript.
  - Estructura de componentes
  - Gestión de estado
  - Optimización de performance
  - Código limpio
  - Seguridad y accesibilidad

### Refactorización

- **[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)**  
  Plan estructurado para refactorizar el código existente.
  - Prioridades de refactorización
  - Refactorizaciones específicas con ejemplos
  - Migración a TypeScript
  - Checklist de calidad

### Contribución

- **[CONTRIBUTING.md](./CONTRIBUTING.md)**  
  Guía para contribuir al proyecto.
  - Code of conduct
  - Configuración del entorno
  - Estándares de código
  - Proceso de Pull Request
  - Reportar bugs y sugerir features

### Registro de Mejoras

- **[IMPROVEMENTS_LOG.md](./IMPROVEMENTS_LOG.md)**  
  Historial cronológico de todas las mejoras implementadas.
  - Refactorizaciones completadas
  - Nuevas características
  - Optimizaciones de performance
  - Correcciones de code smells

### Persistencia y API

- **[PERSISTENCE_GUIDE.md](./PERSISTENCE_GUIDE.md)**  
  Guía completa del sistema de persistencia de datos.
  - Arquitectura de persistencia
  - Sistema de sesiones con useSession
  - Servicios de datos (ClientService, GymService, AppointmentService)
  - Control de acceso basado en roles
  - Filtrado de datos por usuario
  - Preparación para migración a API

- **[API_MIGRATION.md](./API_MIGRATION.md)**  
  Guía paso a paso para migrar a API REST.
  - Modelo de datos PostgreSQL
  - Especificación completa de endpoints
  - Ejemplos de implementación (Node.js/Express)
  - Autenticación JWT
  - Middleware de autorización
  - Checklist de migración

- **[PERSISTENCE_UPDATE.md](./PERSISTENCE_UPDATE.md)**  
  Resumen ejecutivo de la actualización de persistencia.
  - Cambios implementados
  - Flujo de datos
  - Datos persistidos
  - Testing y verificación

### Experiencia de Usuario (UX)

- **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)**  
  Mejoras de UX siguiendo mejores prácticas 2026.
  - Sistema de modales modernos (Modal component)
  - Diálogos de confirmación (ConfirmDialog)
  - Hooks personalizados (useModal, useConfirm)
  - Eliminación de alerts/confirms bloqueantes
  - Componentes actualizados
  - Mejores prácticas aplicadas

---

## 🎯 Para Nuevos Desarrolladores

Si eres nuevo en el proyecto, lee en este orden:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Entender la estructura general
2. **[PERSISTENCE_GUIDE.md](./PERSISTENCE_GUIDE.md)** - Comprender el sistema de datos
3. **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Aprender los estándares
4. **[UX_IMPROVEMENTS.md](./UX_IMPROVEMENTS.md)** - Conocer los componentes de UI modernos
5. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Configurar tu entorno
6. **[CODE_SMELLS.md](./CODE_SMELLS.md)** - Conocer áreas de mejora
7. **[REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md)** - Empezar a contribuir

---

## 🔧 Para Mantenedores

### Tareas Frecuentes

**Revisar Code Smells:**

```bash
# Ver lista de smells
cat docs/CODE_SMELLS.md
```

**Actualizar Documentación:**

```bash
# Después de cambios arquitectónicos importantes
vim docs/ARCHITECTURE.md
```

**Onboarding de Nuevos Contribuidores:**

```bash
# Compartir link de CONTRIBUTING
echo "Lee docs/CONTRIBUTING.md"
```

---

## 📊 Estado de la Docu | Última Actualización | Estado | Completitud |

| ---------------------- | -------------------- | ----------- | ----------- |
| CODE_SMELLS.md | 2026-02-24 | ✅ Completo | 100% |
| ARCHITECTURE.md | 2026-02-24 | ✅ Completo | 100% |
| BEST_PRACTICES.md | 2026-02-24 | ✅ Completo | 100% |
| REFACTORING_GUIDE.md | 2026-02-24 | ✅ Completo | 100% |
| CONTRIBUTING.md | 2026-02-24 | ✅ Completo | 100% |
| IMPROVEMENTS_LOG.md | 2026-02-24 | ✅ Completo | 100% |
| PERSISTENCE_GUIDE.md | 2026-02-24 | ✅ Completo | 100% |
| API_MIGRATION.md | 2026-02-24 | ✅ Completo | 100% |
| PERSISTENCE_UPDATE.md | 2026-02-24 | ✅ Completo | 100% |
| UX_IMPROVEMENTS.mdd | 2026-02-24 | ✅ Completo | 100% |
| REFACTORING_GUIDE.md | 2026-02-24 | ✅ Completo | 100% |
| CONTRIBUTING.md | 2026-02-24 | ✅ Completo | 100% |

---

## 🔄 Actualización de Documentación

La documentación debe actualizarse cuando:

- ✅ Se implementan nuevas features
- ✅ Se cambia la arquitectura
- ✅ Se añaden nuevas mejores prácticas
- ✅ Se identifican nuevos code smells
- ✅ Se completan refactorizaciones

### Proceso de Actualización

1. Editar el documento correspondiente
2. Actualizar fecha de "Última actualización"
3. Commit con mensaje descriptivo:
   ```bash
   git commit -m "docs: update ARCHITECTURE with new state management"
   ```

---

## 📝 Templates

### Añadir Nuevo Code Smell

````markdown
### X. **Nombre del Code Smell**

**Ubicación:** Archivo.jsx, línea X

**Problema:**

```javascript
// Código problemático
```
````

**Impacto:**

- ❌ Impacto 1
- ❌ Impacto 2

**Solución:**

```javascript
// Código mejorado
```

**Prioridad:** Alta/Media/Baja

````

### Documentar Nuevo Patrón

```markdown
### Patrón: Nombre del Patrón

**Cuándo usar:**
- Caso de uso 1
- Caso de uso 2

**Ejemplo:**
```javascript
// Código de ejemplo
````

**Ventajas:**

- ✅ Ventaja 1
- ✅ Ventaja 2

**Desventajas:**

- ⚠️ Limitación 1

```

---

## 🤝 Contribuir a la Documentación

La documentación es tan importante como el código. Si encuentras:
- Typos o errores
- Información desactualizada
- Falta de claridad
- Ejemplos incorrectos

Por favor:
1. Abre un issue describiendo el problema
2. O mejor aún, crea un PR con la corrección

Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

---

## 📞 Contacto

Para preguntas sobre la documentación:
- Abrir issue en GitHub
- Usar etiqueta `documentation`
- Mencionar @maintainers si es urgente

---

## 📚 Recursos Externos

### Referencias Generales
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Documentation](https://react.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

### Mejores Prácticas
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [Web.dev](https://web.dev/)

### Herramientas
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier](https://prettier.io/docs/en/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

**Mantenido por:** Equipo de Desarrollo
**Última revisión:** 24 de febrero de 2026
```
