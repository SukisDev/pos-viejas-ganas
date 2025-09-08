# 🚀 Guía de Referencia Rápida - POS Viejas Ganas

## 🔗 **URLs del Sistema**
```
🏠 Inicio:           http://localhost:3000
🔐 Login:            http://localhost:3000/login
👨‍💼 Admin:            http://localhost:3000/admin
💰 Cajero:           http://localhost:3000/cashier
👨‍🍳 Cocina:          http://localhost:3000/kitchen
🔑 Recuperar Pass:   http://localhost:3000/forgot-password
```

## 👥 **Usuarios por Defecto**
```
👨‍💼 Administrador:
   Usuario: developer
   Contraseña: dev123
   Email: gomjean44@gmail.com
```

## ⚡ **Comandos Rápidos**
```bash
# Iniciar aplicación
npm run dev

# Crear usuario admin
npm run create-dev-user

# Ver base de datos
npx prisma studio

# Backup DB
pg_dump pos_viejas_ganas > backup.sql
```

## 🔧 **Variables de Entorno Esenciales**
```env
DATABASE_URL="postgresql://..."
AUTH_JWT_SECRET="secreto-seguro"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EMAIL_SERVICE="gmail"
EMAIL_USER="tu_email@gmail.com"
EMAIL_PASSWORD="app_password"
```

## 📱 **Flujo de Trabajo**

### 💰 **Cajero (Tomar Órdenes)**
1. Login → Cashier
2. Seleccionar productos del menú
3. Ajustar cantidades
4. Procesar orden
5. ✅ Orden enviada a cocina

### 👨‍🍳 **Cocina (Preparar Órdenes)**
1. Login → Kitchen
2. Ver órdenes pendientes
3. "Iniciar Preparación"
4. "Marcar Lista" cuando termine
5. ✅ Notificación a cajero

### 👨‍💼 **Admin (Gestionar Todo)**
1. Login → Admin
2. Dashboard con estadísticas
3. Gestionar usuarios/productos
4. Ver todas las órdenes
5. ✅ Control total del sistema

## 🎯 **Estados de Órdenes**
- 🟡 **PENDING**: Nueva orden, esperando cocina
- 🔵 **PREPARING**: En preparación
- 🟢 **READY**: Lista para entregar
- ✅ **DELIVERED**: Entregada al cliente

## 🛡️ **Roles y Permisos**
- **ADMIN**: Todo (usuarios, productos, órdenes, stats)
- **CASHIER**: Solo tomar órdenes
- **KITCHEN**: Solo ver/gestionar órdenes de cocina

## 📧 **Sistema de Email**
- Solo usuarios **ADMIN** pueden recuperar contraseña por email
- Requiere configuración de Gmail o SMTP
- Ethereal Email para testing (no llegan emails reales)

## 🚨 **Solución Rápida de Problemas**

### ❌ **No puedo hacer login**
- Verificar username/password
- Usuario: `developer`, Pass: `dev123`

### ❌ **Error de base de datos**
- Verificar PostgreSQL corriendo
- Verificar DATABASE_URL en .env

### ❌ **Email no llega**
- Si usas Ethereal: revisar consola del servidor
- Si usas Gmail: verificar App Password

### ❌ **Página no carga**
- Verificar servidor: `npm run dev`
- Puerto 3000 libre
- Verificar URL: http://localhost:3000

## 📞 **Soporte Rápido**
1. 🔍 Revisar logs en consola del servidor
2. 📋 Verificar variables de entorno
3. 🔄 Reiniciar servidor: Ctrl+C → `npm run dev`
4. 🗄️ Verificar base de datos: `npx prisma studio`

---

📖 **Para más detalles ver:**
- `GUIA_DE_USUARIO.md` - Guía completa para usuarios
- `GUIA_ADMINISTRACION.md` - Guía técnica para administradores
- `EMAIL_SYSTEM_DOCS.md` - Documentación del sistema de emails

*⚡ Referencia rápida - Septiembre 2025*
