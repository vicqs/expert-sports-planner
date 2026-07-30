# 🏋️ Expert Sports Planner

Sistema integral de gestión para entrenadores personales y atletas. Plataforma que facilita la planificación de entrenamientos, gestión de atletas, reservas de gimnasio y seguimiento de progreso.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-4.x-646cff.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características Principales

### 🤝 Sistema de Vinculación Atleta-Entrenador (v3.0)

- **Sin suscripciones automáticas**: Los pagos se realizan manualmente entre atleta y entrenador
- **Búsqueda de entrenadores**: Los atletas pueden buscar entrenadores por nombre, email o código único
- **Sistema de solicitudes**: Los atletas envían solicitudes que los entrenadores pueden aprobar o rechazar
- **Gestión manual de cartera**: Los entrenadores controlan completamente su lista de atletas activos

### 📋 Para Entrenadores

- **Generación automática de planes**: Sistema inteligente de creación de planes de entrenamiento
- **Editor visual de planes**: Interfaz drag-and-drop para personalizar entrenamientos
- **Gestión de solicitudes**: Panel para aprobar/rechazar solicitudes de nuevos atletas
- **Mis Atletas**: Vista completa de atletas activos con opción de remover
- **Configuración de horarios**: Gestión de disponibilidad para gimnasio y citas
- **Calendario de citas**: Sistema de agendamiento para sesiones personalizadas

### 💪 Para Atletas

- **Búsqueda de entrenadores**: Encuentra tu entrenador ideal por nombre o código
- **Seguimiento de progreso**: Marca sesiones completadas y añade notas personales
- **Reservas de gimnasio**: Sistema de reservas por franjas horarias
- **Agenda de citas**: Programa sesiones con tu entrenador
- **Visualización de planes**: Interfaz clara y organizada por semanas

### 🛠️ Panel de Administración CRM

Panel administrativo completo con funcionalidades empresariales:

#### Gestión de Equipamiento

- ✅ CRUD completo de equipamiento de gimnasio
- 📊 Estados: Disponible/Mantenimiento
- 🔍 Búsqueda y filtrado
- 💾 Persistencia en localStorage

#### Base de Datos de Ejercicios

- 📚 400+ ejercicios predefinidos organizados en 4 categorías
- ➕ Agregar ejercicios personalizados
- ✏️ Editar ejercicios propios
- 🗑️ Eliminar con protección de ejercicios del sistema

#### Estadísticas y Análisis

- 📈 Gráficos interactivos de usuarios por rol
- 📊 Análisis de planes activos vs completados
- 🏋️ Estado del equipamiento en tiempo real
- 👥 Gestión de usuarios del sistema

## 🚀 Tecnologías

- **Frontend**: React 18.2 + Vite
- **Routing**: React Router DOM v6
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Estilos**: CSS Variables + CSS Modules
- **Almacenamiento**: localStorage (demo) - Listo para backend real
- **Generación de Planes**: Sistema basado en reglas con IA simulada

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tuusuario/expert-sports-planner.git

# Instalar dependencias
cd expert-sports-planner
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🔑 Credenciales de Prueba

### Super Administrador

```
Email: admin...
Contraseña: ********
```

### Usuarios de Prueba

```
Entrenador: trainer@test.com / Test123!
Atleta: athlete@test.com / Test123!
```

## 📁 Estructura del Proyecto

```
expert-sports-planner/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.jsx          # Panel CRM de administración
│   │   ├── AthleteDashboard.jsx        # Dashboard de atletas
│   │   ├── CoachDashboard.jsx          # Dashboard de entrenadores
│   │   ├── TrainerSearch.jsx           # Búsqueda de entrenadores (NUEVO)
│   │   ├── PlanEditor.jsx              # Editor visual de planes
│   │   ├── GymBookingSystem.jsx        # Sistema de reservas
│   │   ├── AppointmentScheduler.jsx    # Agendador de citas
│   │   └── ui/                         # Componentes reutilizables
│   ├── context/
│   │   ├── AuthContext.jsx             # Autenticación y sesión
│   │   └── MockDatabase.jsx            # Base de datos simulada
│   ├── utils/
│   │   ├── auth.js                     # Funciones de autenticación
│   │   ├── generator.js                # Generador de planes
│   │   └── constants.js                # Ejercicios y configuraciones
│   └── styles/
│       ├── main.css                    # Estilos globales
│       ├── variables.css               # Variables CSS
│       └── animations.css              # Animaciones
├── adminNotes.txt                       # Documentación del sistema
└── README.md
```

## 🎯 Flujo de Usuario

### Para Atletas

1. **Registro** → Crear cuenta con rol ATHLETE
2. **Buscar Entrenador** → Buscar por nombre, email o código único
3. **Enviar Solicitud** → Solicitar vinculación con el entrenador
4. **Pago Manual** → Realizar pago al entrenador (fuera de la app)
5. **Esperar Aprobación** → El entrenador revisa y acepta
6. **Recibir Planes** → El entrenador crea planes personalizados
7. **Entrenar** → Seguir el plan y marcar progreso

### Para Entrenadores

1. **Registro** → Crear cuenta con rol TRAINER
2. **Recibir Solicitudes** → Ver notificaciones en "Solicitudes (N)"
3. **Verificar Pago** → Confirmar pago manual recibido
4. **Aceptar/Rechazar** → Aprobar o rechazar solicitudes
5. **Ver Atletas** → Gestionar atletas activos en "Mis Atletas (N)"
6. **Crear Planes** → Generar planes personalizados para cada atleta
7. **Gestionar Cartera** → Quitar atletas que dejen de pagar

## 🔐 Seguridad

⚠️ **Este es un sistema de demostración**

### Variables de Entorno

- ✅ Credenciales en `.env.local` (NO subir a Git)
- ✅ Archivo `.env.example` sin credenciales reales
- ✅ Variables configurables en producción (Vercel/Netlify)
- ✅ Contraseñas fuertes obligatorias (min 20 caracteres)

### Para Producción

- ✅ Backend con base de datos real (PostgreSQL/MongoDB)
- ✅ API REST o GraphQL para autenticación
- ✅ Hash de contraseñas con bcrypt/argon2 en servidor
- ✅ Tokens JWT con expiración y refresh tokens
- ✅ HTTPS obligatorio
- ✅ Protección CSRF
- ✅ Rate limiting
- ✅ Validación de entrada en servidor
- ✅ Auditoría de acciones
- ✅ Rotación periódica de secretos

## 💾 Almacenamiento

Actualmente usa **localStorage** para persistencia (demo):

```javascript
- users                    → Usuarios registrados
- currentUser              → Sesión activa
- clients                  → Datos de clientes y planes
- athleteRequests          → Solicitudes atleta-entrenador
- crm_equipment            → Equipamiento de gimnasio
- crm_custom_exercises     → Ejercicios personalizados
- gymAvailability          → Horarios de gimnasio
- gymBookings              → Reservas de gimnasio
- appointments             → Citas programadas
- appointmentAvailability  → Disponibilidad de citas
```

## 🎨 Características de UI/UX

- ✨ Diseño moderno con gradientes y glassmorphism
- 📱 Completamente responsive (móvil, tablet, desktop)
- 🎭 Animaciones suaves con Framer Motion
- 🎨 Sistema de diseño consistente con variables CSS
- 🌓 Preparado para modo oscuro (variables configurables)
- ♿ Consideraciones de accesibilidad
- 🔔 Sistema de notificaciones toast
- 📊 Gráficos interactivos en panel de admin

## 🆕 Changelog v3.0 - Manual Payment Edition

### ⚡ Cambios Mayores

- **Eliminadas suscripciones automáticas** para atletas
- **Nuevo sistema de vinculación** atleta-entrenador
- **Pagos manuales** gestionados fuera de la plataforma
- **Panel de solicitudes** para entrenadores
- **Gestión manual de cartera** de atletas

### ✨ Nuevas Funcionalidades

- Componente `TrainerSearch` para búsqueda de entrenadores
- Sistema completo de solicitudes con estados (PENDING, ACCEPTED, REJECTED, REMOVED)
- Códigos únicos de 8 caracteres para cada entrenador
- Panel "Solicitudes (N)" en dashboard de entrenador
- Panel "Mis Atletas (N)" con opción de remover
- Vista de estado de vinculación para atletas

### 🔄 Componentes Modificados

- `MockDatabase.jsx` - 9 nuevas funciones para gestión de solicitudes
- `AthleteDashboard.jsx` - Eliminado flujo de suscripciones
- `CoachDashboard.jsx` - Agregadas pestañas de solicitudes y atletas

## 📝 Roadmap

- [ ] Backend con Node.js/Express o NestJS
- [ ] Base de datos PostgreSQL con Prisma
- [ ] Autenticación JWT con refresh tokens
- [ ] API REST completa
- [ ] Pasarela de pagos (opcional)
- [ ] Notificaciones push
- [ ] Chat en tiempo real entre atleta y entrenador
- [ ] Exportación de planes a PDF
- [ ] Aplicación móvil con React Native
- [ ] Integración con wearables

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

**Tu Nombre**

- GitHub: [@tuusuario](https://github.com/tuusuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tuperfil)

## 🙏 Agradecimientos

- Iconos por [Lucide Icons](https://lucide.dev/)
- Inspiración de diseño de plataformas fitness modernas
- Comunidad de React y Vite

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!

**Última actualización**: Febrero 24, 2026 - v3.0 Manual Payment Edition
