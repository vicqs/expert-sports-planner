# Rol Atleta — Documentación Funcional Completa

Describe en detalle todo lo que puede hacer el **Atleta (ATHLETE)**, cómo funciona cada pantalla y las reglas que aplican. Para el entrenador ver [ROL_ENTRENADOR.md](./ROL_ENTRENADOR.md) y para el administrador [ROL_ADMINISTRADOR.md](./ROL_ADMINISTRADOR.md).

## Índice

1. [Visión general](#1-visión-general)
2. [Registro y acceso](#2-registro-y-acceso)
3. [Navegación](#3-navegación)
4. [Entrenamientos (inicio)](#4-entrenamientos-inicio)
5. [Búsqueda y vinculación con un entrenador](#5-búsqueda-y-vinculación-con-un-entrenador)
6. [Detalle de un plan](#6-detalle-de-un-plan)
7. [Modo de ejecución de sesión de gimnasio](#7-modo-de-ejecución-de-sesión-de-gimnasio)
8. [Notas para el entrenador](#8-notas-para-el-entrenador)
9. [Finalizar un plan](#9-finalizar-un-plan)
10. [Explorar: reservas de gimnasio](#10-explorar-reservas-de-gimnasio)
11. [Explorar: citas 1 a 1](#11-explorar-citas-1-a-1)
12. [Progreso](#12-progreso)
13. [Perfil y cuenta](#13-perfil-y-cuenta)
14. [Información que el atleta solo puede leer](#14-información-que-el-atleta-solo-puede-leer)
15. [Reglas y validaciones](#15-reglas-y-validaciones)
16. [Datos persistidos](#16-datos-persistidos)
17. [Limitaciones actuales](#17-limitaciones-actuales)

---

## 1. Visión general

El atleta **recibe y sigue** planes creados por su entrenador. Puede:

- Buscar un entrenador y solicitar vincularse.
- Consultar sus planes día por día, ejecutar sesiones de gimnasio, marcar avance y dejar notas.
- Reservar cupos de **gimnasio** y agendar **citas 1 a 1**.
- Ver su **progreso** y administrar su **perfil**.

El atleta **no crea ni modifica planes**: solo interactúa con lo que el entrenador define.

---

## 2. Registro y acceso

### Registro

En la pantalla de autenticación se elige el tipo de cuenta **Atleta** ("Recibe y sigue tu plan").

| Campo                | Regla                                             |
| -------------------- | ------------------------------------------------- |
| Nombre completo      | Obligatorio y único                               |
| Email                | Obligatorio, formato válido y único               |
| Contraseña           | Mínimo 6 caracteres                               |
| Confirmar contraseña | Debe coincidir (_"Las contraseñas no coinciden"_) |

Incluye botón para mostrar/ocultar las contraseñas y la leyenda de 14 días de prueba sin tarjeta. La cuenta inicia con plan **FREE** y estado **TRIAL**.

### Inicio de sesión

Email y contraseña. Si son incorrectos: _"Email o contraseña incorrectos"_. Los errores se muestran en una tarjeta roja.

### Requisito para pedir entrenador

Para enviar una solicitud el atleta debe tener **email y contraseña** registrados; de lo contrario recibe _"Debes completar tu registro con email y contraseña antes de enviar solicitudes"_.

---

## 3. Navegación

Cuatro secciones:

| Sección        | Icono   | Contenido                                      |
| -------------- | ------- | ---------------------------------------------- |
| Entrenamientos | Casa    | Estado con el entrenador y lista de planes     |
| Explorar       | Brújula | Buscar entrenador o acceder a reservas y citas |
| Progreso       | Gráfico | Estadísticas y cumplimiento semanal            |
| Perfil         | Usuario | Datos personales y cuenta                      |

- **Móvil:** barra de navegación inferior (estilo app). Se oculta en vistas inmersivas (por ejemplo el modo de ejecución de sesión).
- **Escritorio (≥ 768 px):** pestañas en el encabezado.
- Encabezado con **avatar** (con gradiente personalizado) y saludo _"Hola, {nombre}"_ con la frase _"Vamos a entrenar hoy"_.

---

## 4. Entrenamientos (inicio)

La pantalla cambia según el estado del atleta.

### 4.1 Sin entrenador y sin solicitud

Tarjeta **"Busca un Entrenador"** que explica que sin entrenador no hay planes, y que el pago se realiza directamente con el entrenador. Botón **Buscar Entrenador**.

### 4.2 Solicitud pendiente

Tarjeta **"Solicitud Pendiente"** con ícono de reloj animado, nombre del entrenador al que se envió y fecha (_"Enviada el dd/mm/aaaa"_). Explica que el entrenador la revisará.

### 4.3 Con entrenador

- Tarjeta **"Tu Entrenador"** con su nombre.
- Sección **Mis Planes** con una tarjeta por plan:
  - Título _"Plan para {objetivo}"_, duración en semanas, objetivo.
  - **Barra de progreso** y porcentaje.
  - Insignia de estado (Activo / Completado) y próxima sesión.
  - Botón **Ver Plan**.
- Si el entrenador todavía no creó planes: _"Tu entrenador aún no ha creado planes para ti."_

---

## 5. Búsqueda y vinculación con un entrenador

Pantalla **Buscar Entrenador**.

- **Buscador** por nombre, email o código (sin distinguir mayúsculas), con botón para limpiar. Mientras carga se ven esqueletos de tarjetas.
- Cada resultado muestra avatar, nombre, email y **código único** del entrenador (8 caracteres).
- Sin resultados: _"No se encontraron entrenadores"_ con la sugerencia de pedir el código exacto al entrenador.
- Botón **Enviar Solicitud** → estado _Enviando…_ → _Solicitud enviada_ y la pantalla pasa a "Solicitud Pendiente".

### Estados especiales

- **Ya vinculado:** muestra al entrenador asignado y un botón para volver al inicio.
- **Solicitud pendiente:** muestra a quién se envió y la fecha; no permite enviar otra.

### Reglas

- Una sola solicitud pendiente a la vez.
- No se puede solicitar a un entrenador con el que ya se está vinculado.
- El entrenador decide aceptar o rechazar.

---

## 6. Detalle de un plan

Al tocar una tarjeta se abre el **detalle del plan**.

### Encabezado

- Botón **Volver**, nombre del plan y estado (Activo, Completado o Pendiente).
- Etiquetas: objetivo, número de semanas y porcentaje completado.
- Fechas de inicio y fin; para planes activos próximos a vencer, la cantidad de **días restantes**.
- Botones **Finalizar Plan** (si está activo) y **Modo Gym**.

### Modo Gym

Activa una pantalla de **alto contraste**, sin gradientes y con tipografía grande, pensada para usar en el gimnasio. Antes de activarlo se pide confirmación. Un banner lo indica mientras está activo.

### Pestaña **Hoy**

- Navegación por **día anterior / siguiente** y selector de fecha (desde la fecha de inicio del plan).
- Tarjeta del día con el nombre del día y estado de completado.
- **Día de descanso:** mensaje de recuperación y posibilidad de marcarlo como visto.
- **Sesión de gimnasio:** lista de ejercicios con series × repeticiones y acceso al **Modo de ejecución**.
- **Sesión de atletismo:** descripción del entrenamiento (calentamiento, bloque principal, afloje) y botón para **marcar como completada**.
- Botón para **agregar nota** (ver [sección 8](#8-notas-para-el-entrenador)).

### Pestaña **Calendario**

Vista por semanas con una celda por día: nombre, fecha, tipo de sesión (descanso, gimnasio o atletismo), estado de completado. Tocar un día salta a su detalle en _Hoy_.

### Pestaña **Ejercicios**

Catálogo de todos los ejercicios del plan agrupados por nombre, con cuántas sesiones los incluyen y las variantes de series × repeticiones. Permite consultar el detalle de cada ejercicio.

---

## 7. Modo de ejecución de sesión de gimnasio

Vista a pantalla completa para entrenar paso a paso.

Por cada ejercicio:

- **Fase** (calentamiento, trabajo efectivo o enfriamiento) como etiqueta.
- **Nombre** del ejercicio; si tiene información adicional, se puede expandir para ver:
  - **GIF** demostrativo.
  - **Músculos objetivo** y **equipamiento**.
  - **Instrucciones** paso a paso.
- **Lista de series**: cada fila muestra el número de serie, las repeticiones y el peso (si el entrenador lo definió). Se toca para **marcarla como hecha**.
- **Barra de avance** por ejercicio y distintivo de **completado** cuando se hicieron todas las series.
- Botón para **agregar una nota** del ejercicio.

El progreso de series se guarda, y el avance general del plan se recalcula con las sesiones completadas.

---

## 8. Notas para el entrenador

- Se pueden dejar notas por **día** del plan y por **ejercicio** en el modo de ejecución.
- Se escriben en una hoja deslizable (textarea) con ejemplo: _"Molestia en la rodilla derecha, bajé el peso en sentadilla…"_.
- Guardar con contenido: _"Nota guardada — tu entrenador la verá"_.
- Guardar vacío elimina la nota: _"Nota eliminada"_.

---

## 9. Finalizar un plan

Un plan activo puede **finalizarse manualmente** con **Finalizar Plan** y confirmación (_"¿Estás seguro de que quieres marcar este plan como completado?"_). Pasa a estado **Completado** y se cierra el detalle.

Además, el sistema completa automáticamente los planes vencidos (con un margen de gracia de 2 días tras la fecha de fin).

---

## 10. Explorar: reservas de gimnasio

Disponible solo con entrenador asignado.

### Elegir horario

- Navegación por día (no permite días anteriores a hoy) y selector de fecha.
- Cada franja muestra **horario**, **ocupación** (`reservados/cupos`) con barra de color (verde, amarillo o rojo según el llenado).
- Botón de estado: **Reservar**, **Reservado** (ya tienes cupo), **Lleno** o _Reservando…_.
- Sin franjas: _"No hay horarios disponibles para esta fecha."_

### Reglas

- **Una reserva por día**: _"Ya tienes una reserva para este día."_
- Sin cupo: _"Cupos agotados."_

### Mis reservas activas

Lista con fecha, estado **Confirmada** y botón **Cancelar**.

### Cancelar

Diálogo con **motivo obligatorio** a elegir entre: _Imprevisto personal_, _Problema de salud_, _Cambio de horario_, _Ya no lo necesito_ u _Otro_ (este último abre un texto libre de hasta 200 caracteres). Al confirmar, la reserva queda **Cancelada** y el cupo se libera.

---

## 11. Explorar: citas 1 a 1

Flujo guiado de tres pasos.

1. **Tipo de cita:**

   | Tipo               | Duración |
   | ------------------ | -------- |
   | Evaluación Inicial | 60 min   |
   | Seguimiento        | 30 min   |
   | Control de Peso    | 15 min   |
   | Ajuste de Plan     | 45 min   |

2. **Fecha y hora:** fecha (desde hoy) y hora obligatorias, más **notas para el entrenador** (opcional).
3. **Confirmación:** resumen y botón **Confirmar**; aparece una animación **"¡Cita confirmada!"**.

### Mis citas programadas

Lista con tipo, **estado** (programada, confirmada o cancelada), fecha, hora y duración. Sin citas: _"No tienes citas próximas."_

### Cancelar una cita

Mismo diálogo de motivo que las reservas (chips + "Otro"). El entrenador ve el cambio.

---

## 12. Progreso

Sin entrenador se muestra un estado vacío. Con entrenador:

| Indicador            | Cálculo                                                       |
| -------------------- | ------------------------------------------------------------- |
| Planes activos       | Cantidad de planes en curso                                   |
| Sesiones completadas | Sesiones marcadas como hechas                                 |
| Sesiones restantes   | Total de sesiones menos completadas                           |
| Racha actual         | Sesiones completadas consecutivas hasta la primera incompleta |
| Días restantes       | Días hasta la fecha de fin del plan (mínimo 0)                |
| Progreso promedio    | Promedio del porcentaje de avance de los planes, con barra    |

Además, el gráfico **Cumplimiento semanal** muestra una barra por semana con el porcentaje de sesiones completadas (con información al pasar el cursor, por ejemplo _Semana 2: 3/4 sesiones_).

---

## 13. Perfil y cuenta

### Cabecera

Avatar, nombre y email.

### Datos de contacto (editable)

- **Email:** formato válido (_"Ingresa un correo válido (ej. nombre@dominio.com)"_); no puede repetir el de otro usuario.
- **Teléfono:** formato Costa Rica `+506 1234-5678`; se autoformatea al escribir y limita a 8 dígitos (_"Ingresa un teléfono válido de Costa Rica (+506 1234-5678)"_).
- Guardar habilitado solo si ambos son válidos.

### Contacto de emergencia (editable)

Nombre y teléfono (mismo formato); ambos deben estar completos y ser válidos.

### Notas médicas (editable)

Texto libre para condiciones relevantes.

### Notificaciones

Interruptores para **recordatorios de sesiones** y **recordatorios de citas**.

### Avatar

Selector con 16 opciones (emoji con gradiente: zorro, búho, koala, dragón, unicornio, león, pulpo, panda, tigre, rana, mono, alienígena, robot, fantasma, tiburón y lobo). Se refleja al instante en el encabezado.

### Seguridad: cambiar contraseña

Contraseña actual, nueva (mínimo 6 caracteres) y confirmación. Si la actual no coincide: _"La contraseña actual no es correcta"_. Toast _Contraseña actualizada_.

### Privacidad

- **Descargar mis datos:** genera un archivo JSON con sus datos (perfil, planes, citas y reservas).
- **Eliminar mi cuenta:** acción irreversible que exige **escribir el nombre completo** para habilitar la confirmación.

### Apariencia y sesión

- **Tema** claro/oscuro.
- **Cerrar sesión.**

---

## 14. Información que el atleta solo puede leer

En el perfil se muestran, pero **solo el entrenador** puede modificarlos:

- **Entrenador** asignado y **empresa** del entrenador (nombre, teléfono y dirección, leídos en vivo).
- **Datos básicos:** fecha de nacimiento, peso, altura y deporte (etiqueta "Solo tu entrenador edita"; si no existen, se informa que aún no fueron registrados).
- **Lesiones** registradas por el entrenador.

---

## 15. Reglas y validaciones

| Concepto              | Regla                                       |
| --------------------- | ------------------------------------------- |
| Contraseña            | Mínimo 6 caracteres                         |
| Email                 | Formato válido y único                      |
| Teléfono              | Formato `+506 XXXX-XXXX`                    |
| Solicitudes           | Una pendiente a la vez                      |
| Reserva de gimnasio   | Una por día y dentro del cupo               |
| Motivo de cancelación | Obligatorio (máx. 200 caracteres en "Otro") |
| Cita                  | Fecha no anterior a hoy, hora obligatoria   |
| Planes                | Completado automático con 2 días de gracia  |

---

## 16. Datos persistidos

| Clave en `localStorage`      | Contenido                       |
| ---------------------------- | ------------------------------- |
| `users` / `currentUser`      | Cuenta y perfil                 |
| `clients`                    | Planes y progreso del atleta    |
| `athleteRequests`            | Solicitudes a entrenadores      |
| Reservas de gimnasio y citas | Reservas, citas y cancelaciones |

---

## 17. Limitaciones actuales

- Sin backend: datos solo en el navegador del atleta.
- No hay notificaciones push reales; las preferencias son configuración guardada.
- Los pagos se acuerdan directamente con el entrenador (no hay cobro en la app).
