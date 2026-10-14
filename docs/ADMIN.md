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

1. **Panel General**
   - Métricas globales (usuarios, planes, trials, equipamiento, ejercicios, reservas y citas)
   - Alertas: trials por vencer y vencidos (con extensión rápida), equipamiento, actividad reciente

2. **Gestión de Usuarios**
   - Búsqueda, filtros por rol y plan, orden y paginación
   - Cambio de plan y extensión de trial (individual y en lote)
   - Exportación a CSV y eliminación en cascada

3. **Ejercicios** y 4. **Equipamiento**
   - Catálogos maestros (1022 ejercicios en 8 categorías) con metadatos y filtros de datos faltantes

4. **Análisis**
   - Gráficos, conversión y registros por mes

5. **Configuración del Sistema**
   - Duración del trial, respaldo y restauración
   - Cambio de contraseña del admin (mínimo 10 caracteres)
   - Restablecer datos operativos
   - Registro de actividad con filtro, exportación CSV y limpieza

Detalle completo en [ROL_ADMINISTRADOR.md](./ROL_ADMINISTRADOR.md).

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
