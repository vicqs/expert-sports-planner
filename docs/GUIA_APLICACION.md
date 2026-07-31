# Guía de la Aplicación — Expert Sports Planner

Esta guía explica cómo funciona la aplicación completa desde los dos roles principales que la usan: el **Entrenador (Coach/Trainer)** y el **Atleta**. No cubre el rol de Administrador (ver [ADMIN.md](./ADMIN.md) para eso).

> Nota: actualmente la app funciona 100% con datos simulados en el navegador (`localStorage`, vía `MockDatabase`). No hay backend real ni sincronización entre dispositivos — es una decisión de producto deliberada mientras se valida el flujo (ver `docs/API_MIGRATION.md` para el plan de migración futura a un backend real).

## Índice

- [Conceptos generales](#conceptos-generales)
- [Registro, login y roles](#registro-login-y-roles)
- [Punto de vista del Entrenador](#punto-de-vista-del-entrenador)
- [Punto de vista del Atleta](#punto-de-vista-del-atleta)
- [Cómo se conectan Entrenador y Atleta](#cómo-se-conectan-entrenador-y-atleta)
- [Límites del plan (Free / Trial)](#límites-del-plan-free--trial)

---

## Conceptos generales

La aplicación es una plataforma donde **entrenadores** crean y gestionan planes de entrenamiento personalizados para sus **atletas** (clientes), además de coordinar reservas de gimnasio y turnos de citas (appointments) entre ambos.

Hay tres roles de usuario:

- **TRAINER** (Entrenador): crea y administra planes, atletas, horarios de gimnasio y citas.
- **ATHLETE** (Atleta): busca entrenador, recibe y sigue su plan, reserva turnos de gimnasio y citas.
- **ADMIN**: gestiona catálogos globales (ejercicios y equipamiento maestro) y usuarios — no participa en el día a día de entrenador/atleta.

La navegación principal se resuelve en `src/App.jsx` (`App.tsx`), que según el rol autenticado (`isTrainer`, `isAthlete`, `isAdmin`) renderiza `CoachDashboard`, `AthleteDashboard` o `AdminDashboard`.

---

## Registro, login y roles

Al entrar sin sesión, se muestra `AuthPage`, donde el usuario puede:

1. **Iniciar sesión** con email y contraseña.
2. **Registrarse** eligiendo explícitamente su rol: **Entrenador** o **Atleta**.

Al completar el registro, la cuenta queda con un período de prueba (trial) y un plan de suscripción (actualmente solo el plan **FREE** está habilitado; la pantalla de precios/upgrade existe en el código pero está deshabilitada intencionalmente).

---

## Punto de vista del Entrenador

El panel del entrenador (`CoachDashboard`) se organiza en pestañas:

### 1. Planes (pestaña principal)

- **Clientes pendientes**: atletas que el entrenador aceptó pero que todavía no tienen un plan generado. Desde acá el entrenador genera un plan de entrenamiento nuevo (`generatePlan`, en `utils/generator.ts`) a partir de los datos de intake del atleta (objetivo, disponibilidad, nivel, etc.).
- **Planes activos**: atletas con un plan en curso. El entrenador puede:
  - Ver y **editar** el plan visualmente con `PlanEditor` (agregar/quitar ejercicios, ajustar series/repeticiones/pesos por semana y día).
  - Guardar cambios, que quedan disponibles inmediatamente para el atleta.
- **Clientes completados**: atletas cuyo plan terminó su duración (se marca automáticamente al vencer la fecha de fin — `autoCompletePlans`, que corre al montar el dashboard).

### 2. Solicitudes de Atletas

Cuando un atleta busca entrenador y envía una solicitud, aparece acá como pendiente. El entrenador puede:

- **Aceptar**: el atleta pasa a ser su cliente (aparece en "Clientes pendientes" hasta que se le genere un plan).
- **Rechazar**: la solicitud se descarta.

### 3. Mis Atletas

Lista de todos los atletas actualmente vinculados al entrenador, con la opción de **remover** a un atleta (desvincularlo).

### 4. Horarios (Configuración de gimnasio)

`TrainerScheduleConfig`: el entrenador define **franjas horarias de gimnasio disponibles** (hora de inicio/fin y capacidad de cupos por franja), que luego los atletas podrán reservar.

### 5. Citas (Calendario de turnos)

`TrainerAppointmentCalendar`: el entrenador define **horarios disponibles para citas 1 a 1** (por ejemplo, evaluaciones o seguimientos presenciales/virtuales) que los atletas pueden reservar.

### 6. Configuración (sub-pestañas)

- **Biblioteca de ejercicios** (`TrainerExerciseLibrary`): el entrenador arma su propia selección personal de ejercicios a partir de la base maestra (creada por el Admin), organizados por categoría (tren inferior, empuje superior, jalón superior, core). Estos son los ejercicios que luego usa al generar planes.
- **Biblioteca de equipamiento** (`TrainerEquipmentLibrary`): de forma análoga, selecciona qué equipamiento del gimnasio tiene disponible, lo cual condiciona qué ejercicios puede generar automáticamente el sistema.

### Límites de plan

El dashboard calcula en todo momento cuántos atletas totales y planes activos tiene el entrenador y los compara contra los límites de su plan de suscripción (`getUserLimits`), mostrando avisos cuando se acerca o alcanza el límite.

---

## Punto de vista del Atleta

El panel del atleta (`AthleteDashboard`) tiene una pantalla principal ("home") con accesos a distintas vistas:

### 1. Sin entrenador asignado

Si el atleta todavía no tiene entrenador, ve un llamado a la acción para **buscar entrenador** (`TrainerSearch`):

- Puede buscar entrenadores por nombre, código o email.
- Envía una **solicitud** a un entrenador (queda en estado "pendiente" hasta que el entrenador la acepte o rechace).
- Mientras la solicitud está pendiente, el atleta ve ese estado reflejado en su home (no puede enviar otra solicitud a la vez).

### 2. Con entrenador asignado

Una vez aceptado por un entrenador, el atleta ve:

- **Mis planes**: tarjetas (`PlanCard`) con cada plan asignado, mostrando duración, objetivo y progreso. Al tocar una tarjeta se abre `PlanDetail`, con el detalle día por día:
  - Sesiones por día (tipo de sesión, ejercicios, series/repeticiones/pesos).
  - Posibilidad de dejar **notas** en un día específico del plan (para comunicarle algo al entrenador, ej. una molestia o un ajuste).
- **Reservas de gimnasio** (`GymBookingSystem`): ver franjas horarias disponibles definidas por su entrenador y reservar un turno de gimnasio (respetando cupos/capacidad).
- **Citas** (`AppointmentScheduler`): ver horarios disponibles definidos por su entrenador y reservar una cita 1 a 1.

### Navegación

El atleta usa una barra de navegación inferior (`BottomNav`, pensada mobile-first) con secciones como Entrenamientos, Explorar, Progreso y Perfil (algunas de estas secciones son estructurales/reservadas para funcionalidad futura).

---

## Cómo se conectan Entrenador y Atleta

El flujo típico end-to-end es:

1. El atleta se registra y busca un entrenador (`TrainerSearch` → solicitud).
2. El entrenador ve la solicitud en su pestaña "Solicitudes de Atletas" y la **acepta**.
3. El atleta pasa a estar en "Mis Atletas" del entrenador y en "Clientes pendientes" (sin plan todavía).
4. El entrenador **genera un plan** para ese atleta (usando su biblioteca de ejercicios/equipamiento personal).
5. El atleta ve el plan inmediatamente en su dashboard y puede consultarlo día a día, dejar notas, etc.
6. En paralelo, el entrenador configura horarios de gimnasio y de citas; el atleta reserva turnos dentro de esos horarios.
7. Cuando el plan llega a su fecha de fin, pasa automáticamente a "completado" tanto para el entrenador como (implícitamente) deja de listarse como plan activo del atleta.

Toda esta relación (solicitudes, aceptación, atletas vinculados, planes, reservas, citas) vive centralizada en el contexto `MockDatabase` (`src/context/MockDatabase.tsx`), que expone funciones que ambos dashboards consumen (`useMockDatabase()`), y persiste todo en `localStorage` del navegador.

---

## Límites del plan (Free / Trial)

Todas las cuentas nuevas arrancan con un período de prueba y el plan **FREE**. El sistema de suscripciones (`src/utils/auth.ts`, `useAuthStore`) contempla:

- Días de prueba restantes (`trialDaysRemaining`).
- Límites de uso según el plan (cantidad de atletas, planes activos, etc. vía `getUserLimits`/`checkLimits`).
- Control de acceso a funciones premium (`canAccessFeature` / `hasFeatureAccess`) — actualmente la pantalla de upgrade a planes pagos está deshabilitada en la UI, dejando solo el plan FREE operativo.
