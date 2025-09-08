# Sistema de Correos para Usuarios Administradores

## Resumen de Implementación

Se ha implementado un sistema de correos exclusivo para usuarios administradores que permite:

1. **Solo administradores pueden tener email** para recuperación de contraseñas
2. **Los administradores pueden cambiar contraseñas** de usuarios normales (chef, caja)
3. **Usuario developer creado** con permisos de admin y email configurado

## Funcionalidades Implementadas

### 1. Base de Datos
- ✅ Campos agregados al modelo User:
  - `email` (String?, unique) - Solo para administradores
  - `resetToken` (String?) - Token de recuperación
  - `resetTokenExp` (DateTime?) - Expiración del token

### 2. API de Usuarios (/api/admin/users)
- ✅ Solo administradores pueden crear/editar usuarios
- ✅ Validación: solo usuarios ADMIN pueden tener email
- ✅ Email se oculta para usuarios no-admin en respuestas
- ✅ Validación de formato de email
- ✅ Verificación de emails únicos

### 3. API de Recuperación (/api/auth/forgot-password)
- ✅ Solo funciona con emails de usuarios ADMIN activos
- ✅ Genera tokens de recuperación con expiración
- ✅ Logs detallados para debugging
- ✅ Mensaje de seguridad consistente

### 4. Frontend (Admin Panel)
- ✅ Campo email solo habilitado cuando rol = ADMIN
- ✅ Campo se deshabilita automáticamente para otros roles
- ✅ Campo se limpia al cambiar rol a no-admin
- ✅ Validación frontend que coincide con backend
- ✅ Mensajes informativos sobre uso del email

### 5. Usuario Developer
- ✅ Usuario: `developer`
- ✅ Password: `dev123456`
- ✅ Email: `gomjean44@gmail.com`
- ✅ Rol: ADMIN
- ✅ Estado: Activo

## Credenciales de Acceso

```
Username: developer
Password: dev123456
Email: gomjean44@gmail.com
Rol: ADMIN
```

## Scripts Disponibles

```bash
# Crear/actualizar usuario developer
npm run create-dev-user

# Probar funcionalidad de emails
node test-email-functionality.mjs

# Sincronizar base de datos (si es necesario)
npx prisma db push --accept-data-loss
```

## Flujo de Uso

### Para Administradores:
1. Pueden crear usuarios con o sin email
2. Solo pueden asignar email a usuarios ADMIN
3. Pueden cambiar contraseñas de cualquier usuario
4. Pueden usar forgot-password con su email

### Para Usuarios Normales (Chef/Caja):
1. No pueden tener email
2. Los admin deben cambiarles la contraseña si la olvidan
3. No pueden usar forgot-password

### Recuperación de Contraseña:
1. Solo disponible para usuarios ADMIN con email
2. Se genera token con expiración de 1 hora
3. Token se muestra en logs para desarrollo
4. En producción se enviará por email (pendiente implementar)

## Seguridad

- ✅ Validación estricta de roles para email
- ✅ Emails únicos en la base de datos
- ✅ Tokens de recuperación con expiración
- ✅ Mensajes de error consistentes para seguridad
- ✅ Solo admins pueden gestionar usuarios

## Estado del Proyecto

- ✅ **Completado**: Sistema de emails para admin
- ✅ **Completado**: Usuario developer configurado  
- ✅ **Completado**: APIs funcionando correctamente
- ✅ **Completado**: Frontend adaptado
- ⏳ **Pendiente**: Servicio de envío de emails real (opcional)

## Notas Técnicas

- Base de datos sincronizada con `prisma db push`
- Cliente de Prisma regenerado con nuevos tipos
- Todas las APIs compilando sin errores
- Frontend reactivo a cambios de rol
- Validaciones tanto frontend como backend
