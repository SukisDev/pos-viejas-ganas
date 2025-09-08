# 🍽️ Sistema POS Viejas Ganas

Sistema completo de punto de venta (POS) diseñado específicamente para restaurantes. Gestiona menús, órdenes, cocina, usuarios y más con una interfaz moderna y intuitiva.

## ✨ Características Principales

- 🍽️ **Gestión completa de menú y productos**
- 💰 **Sistema de órdenes en tiempo real**
- 👨‍🍳 **Panel de cocina con estados de preparación**
- 👥 **Gestión de usuarios con diferentes roles**
- 📊 **Dashboard con estadísticas y métricas**
- 📧 **Sistema de recuperación de contraseña por email**
- 🔔 **Notificaciones en tiempo real**
- 📱 **Diseño responsive (móvil, tablet, desktop)**

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- PostgreSQL 12+
- npm o yarn

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/SukisDev/pos-viejas-ganas.git
cd pos-viejas-ganas

# Instalar dependencias
npm install

# Configurar base de datos (ver GUIA_ADMINISTRACION.md)
# Configurar archivo .env

# Inicializar base de datos
npx prisma generate
npx prisma migrate dev

# Crear usuario administrador
npm run create-dev-user

# Iniciar servidor de desarrollo
npm run dev
```

## 📚 Documentación Completa

### 👤 **Para Usuarios**
- 📋 [**GUIA_DE_USUARIO.md**](./GUIA_DE_USUARIO.md) - Guía completa de uso del sistema
- ⚡ [**REFERENCIA_RAPIDA.md**](./REFERENCIA_RAPIDA.md) - Comandos y URLs esenciales

### 👨‍💻 **Para Administradores**
- 🔧 [**GUIA_ADMINISTRACION.md**](./GUIA_ADMINISTRACION.md) - Configuración técnica y mantenimiento
- 📧 [**EMAIL_SYSTEM_DOCS.md**](./EMAIL_SYSTEM_DOCS.md) - Sistema de emails y recuperación
- 🔑 [**FORGOT_PASSWORD_IMPROVEMENTS.md**](./FORGOT_PASSWORD_IMPROVEMENTS.md) - Mejoras de seguridad

## 🏗️ Arquitectura del Sistema

### 🎯 **Roles de Usuario**
- **👨‍💼 ADMIN**: Acceso completo al sistema
- **💰 CASHIER**: Toma órdenes y gestiona ventas
- **👨‍🍳 KITCHEN**: Gestiona preparación de órdenes

### 🔄 **Flujo de Trabajo**
1. **Cajero** toma orden → 
2. **Cocina** recibe notificación → 
3. **Cocina** prepara y marca lista → 
4. **Cajero** entrega al cliente

### 🛠️ **Tecnologías**
- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + Cookies HTTP-only
- **Email**: Nodemailer (Gmail/SMTP/Ethereal)
- **Real-time**: Server-Sent Events

## 📱 Pantallas Principales

### 🏠 **Dashboard Admin**
- Estadísticas de ventas en tiempo real
- Métricas de rendimiento
- Gestión de usuarios y productos

### 💰 **Panel de Cajero**
- Menú interactivo con categorías
- Carrito de compras dinámico
- Procesamiento de órdenes

### 👨‍🍳 **Panel de Cocina**
- Lista de órdenes pendientes
- Estados de preparación
- Notificaciones automáticas

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Servidor de desarrollo
npm run build                  # Build para producción
npm run start                  # Servidor de producción

# Base de datos
npx prisma studio             # Interfaz visual de BD
npx prisma migrate dev        # Nuevas migraciones
npx prisma generate           # Regenerar cliente

# Utilidades
npm run create-dev-user       # Crear usuario admin
```

## 🛡️ Seguridad

- 🔐 Autenticación JWT con cookies HTTP-only
- 🔒 Contraseñas hasheadas con bcrypt (12 rounds)
- 🚫 Protección contra ataques comunes
- 📧 Recuperación segura de contraseña
- 👥 Sistema de roles y permisos

## 🌐 Despliegue

El sistema está optimizado para despliegue en:
- **Vercel** (recomendado)
- **Docker**
- **VPS tradicional**

Ver [GUIA_ADMINISTRACION.md](./GUIA_ADMINISTRACION.md) para instrucciones detalladas.

## 📊 Estado del Proyecto

- ✅ Sistema de autenticación completo
- ✅ Gestión de usuarios con roles
- ✅ CRUD completo de productos
- ✅ Sistema de órdenes en tiempo real
- ✅ Panel de cocina funcional
- ✅ Dashboard con estadísticas
- ✅ Sistema de email para recuperación
- ✅ Diseño responsive
- ✅ Documentación completa

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📞 Soporte

- 📖 Revisa la documentación completa
- 🐛 Reporta bugs en GitHub Issues
- 💡 Sugiere mejoras en Discussions

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

---

## 🎯 Próximas Características

- [ ] Sistema de inventario
- [ ] Reportes avanzados
- [ ] Integración con sistemas de pago
- [ ] App móvil nativa
- [ ] API pública
- [ ] Sistema de propinas
- [ ] Múltiples ubicaciones

---

*🍽️ Desarrollado con ❤️ para Viejas Ganas*
*👨‍💻 Por SukisDev - Septiembre 2025*
