# Credenciales del Super Administrador

## Acceso al Panel de Administración

El sistema incluye un super usuario administrador creado automáticamente al iniciar la aplicación.

### Credenciales

**⚠️ IMPORTANTE:** Las credenciales de acceso se encuentran en el archivo `adminNotes.txt` (no incluido en el repositorio por seguridad).

**Email:** `admin....`  
**Contraseña:** Ver `adminNotes.txt` en la raíz del proyecto

### Características

- **Rol:** ADMIN
- **Acceso:** Ilimitado e indefinido
- **Sin límites:** No aplican restricciones de planes, atletas o features
- **Plan:** GYM con todos los recursos activados

### Panel de Administración

El administrador tiene acceso a:

1. **Resumen General**
   - Total de usuarios registrados
   - Cantidad de entrenadores
   - Cantidad de atletas
   - Total de clientes
   - Total de planes creados
   - Trials activos

2. **Gestión de Usuarios**
   - Lista completa de usuarios
   - Ver detalles de cada usuario
   - Ver rol, plan y estado de suscripción
   - Fecha de registro

3. **Configuración del Sistema**
   - Opciones de configuración (próximamente)

### Inicialización

El super administrador se crea automáticamente cuando:

- La aplicación se inicia por primera vez
- No existe un usuario con email `...`

Si necesitas recrear el super admin:

1. Abre las DevTools del navegador (F12)
2. Ve a la pestaña "Application" > "Local Storage"
3. Elimina la clave "users"
4. Recarga la página

### Seguridad

⚠️ **IMPORTANTE:** Estas son credenciales de demostración para desarrollo local.

En producción:

- Cambiar estas credenciales inmediatamente
- Implementar hash de contraseñas seguro (bcrypt)
- Usar autenticación real con backend
- Implementar 2FA para administradores
- Registro de auditoría para acciones de admin
