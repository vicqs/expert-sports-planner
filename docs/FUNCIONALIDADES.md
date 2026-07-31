# Funcionalidades por Rol — Entrenador y Atleta

Listado exhaustivo de todas las funcionalidades disponibles en la aplicación, separadas por rol. Para una explicación narrativa de cómo se usan y cómo se conectan entre sí, ver [GUIA_APLICACION.md](./GUIA_APLICACION.md). Para el rol Administrador, ver [ADMIN.md](./ADMIN.md).

## Índice

- [Funcionalidades del Entrenador](#funcionalidades-del-entrenador)
- [Funcionalidades del Atleta](#funcionalidades-del-atleta)
- [Funcionalidades compartidas (ambos roles)](#funcionalidades-compartidas-ambos-roles)

---

## Funcionalidades del Entrenador

### Gestión de atletas

- [ ] Ver **solicitudes pendientes** de atletas que quieren vincularse.
- [ ] **Aceptar** una solicitud de atleta (lo convierte en cliente).
- [ ] **Rechazar** una solicitud de atleta.
- [ ] Ver listado de **"Mis Atletas"** (todos los atletas vinculados actualmente).
- [ ] **Remover/desvincular** un atleta de su cartera.
- [ ] Ver **clientes pendientes** (atletas aceptados sin plan generado todavía).
- [ ] Ver **clientes con plan activo**.
- [ ] Ver **clientes completados** (plan finalizado por fecha de vencimiento).

### Gestión de planes de entrenamiento

- [ ] **Generar un plan** de entrenamiento automático para un atleta, en base a sus datos de intake (objetivo, disponibilidad, nivel).
- [ ] **Editar visualmente** un plan generado (`PlanEditor`): agregar, quitar o modificar sesiones por semana/día.
- [ ] Ajustar **series, repeticiones y pesos** de cada ejercicio dentro del plan.
- [ ] **Guardar** los cambios de un plan editado (se reflejan de inmediato para el atleta).
- [ ] Auto-completado automático de planes vencidos al abrir el dashboard (`autoCompletePlans`).

### Biblioteca personal de ejercicios

- [ ] Ver la base maestra de ejercicios (definida por el Admin), organizada por categoría (tren inferior, empuje superior, jalón superior, core).
- [ ] **Seleccionar/agregar** ejercicios de la base maestra a su biblioteca personal.
- [ ] **Quitar** ejercicios de su biblioteca personal.
- [ ] Buscar ejercicios por nombre dentro del selector.
- [ ] Ver estadísticas de su biblioteca (cantidad de ejercicios seleccionados por categoría).

### Biblioteca personal de equipamiento

- [ ] Ver la base maestra de equipamiento del gimnasio (definida por el Admin).
- [ ] **Seleccionar/agregar** equipamiento disponible en su gimnasio.
- [ ] **Quitar** equipamiento de su selección.
- [ ] Filtrar equipamiento por categoría y por estado (seleccionado / no seleccionado).
- [ ] Buscar equipamiento por nombre.
- [ ] El equipamiento seleccionado condiciona qué ejercicios puede generar el sistema automáticamente.

### Horarios de gimnasio

- [ ] **Crear franjas horarias** de disponibilidad de gimnasio (hora inicio, hora fin, capacidad de cupos).
- [ ] **Editar** una franja horaria existente.
- [ ] **Eliminar** una franja horaria.
- [ ] Ver cuántos cupos están **reservados vs. disponibles** por franja.

### Citas (appointments) 1 a 1

- [ ] **Crear horarios disponibles** para citas individuales con atletas.
- [ ] **Editar** un horario de cita disponible.
- [ ] **Eliminar** un horario de cita.
- [ ] Ver el calendario de citas reservadas por sus atletas.

### Límites y suscripción

- [ ] Ver cuántos atletas totales y planes activos tiene, comparado contra el límite de su plan.
- [ ] Recibir avisos cuando se acerca o alcanza el límite de su plan de suscripción.
- [ ] Ver días restantes de período de prueba (trial).

---

## Funcionalidades del Atleta

### Búsqueda y vinculación con entrenador

- [ ] **Buscar entrenadores** por nombre, código o email.
- [ ] **Enviar una solicitud** de vinculación a un entrenador.
- [ ] Ver el **estado de su solicitud** (pendiente) mientras espera respuesta.
- [ ] No puede enviar una segunda solicitud mientras tiene una pendiente.
- [ ] Ver a su **entrenador asignado** una vez aceptado.

### Planes de entrenamiento

- [ ] Ver el listado de **sus planes asignados** (tarjetas con duración, objetivo y progreso).
- [ ] Ver el **detalle día por día** de un plan (sesiones, tipo de sesión, ejercicios, series/repeticiones/pesos).
- [ ] **Dejar notas** en un día específico del plan (para comunicar algo al entrenador, ej. una molestia o ajuste necesario).
- [ ] Ver el progreso general del plan.

### Reservas de gimnasio

- [ ] Ver las **franjas horarias disponibles** definidas por su entrenador.
- [ ] **Reservar un turno** de gimnasio (respetando cupos/capacidad disponible).
- [ ] Ver sus **reservas de gimnasio actuales**.

### Citas (appointments) 1 a 1

- [ ] Ver los **horarios disponibles** definidos por su entrenador para citas individuales.
- [ ] **Reservar una cita** 1 a 1 con su entrenador.

### Navegación y perfil

- [ ] Navegación mobile-first mediante barra inferior (Entrenamientos, Explorar, Progreso, Perfil).
- [ ] Ver información de su período de prueba y plan de suscripción.

---

## Funcionalidades compartidas (ambos roles)

- [ ] **Registro** de cuenta nueva eligiendo explícitamente el rol (Entrenador o Atleta).
- [ ] **Inicio de sesión** con email y contraseña.
- [ ] **Cierre de sesión**.
- [ ] Cambio de **tema** (claro/oscuro) vía `useTheme`.
- [ ] Notificaciones tipo **toast** para confirmar acciones (éxito, error, info).
- [ ] Diálogos de **confirmación** antes de acciones destructivas (ej. remover un atleta).
- [ ] Persistencia de todos los datos en `localStorage` del navegador (sin backend real todavía).
