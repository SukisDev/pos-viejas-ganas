# 🍽️ Sistema POS Viejas Ganas

Sistema completo de punto de venta (POS) diseñado específicamente para restaurantes. Gestiona menús, órdenes, cocina, usuarios y más con una interfaz moderna y intuitiva.

## ✨ Características Principales

- 🍽️ **Gestión completa de menú y productos**
- 💰 **Sistema de órdenes en tiempo real**
- 👨‍🍳 **Panel de cocina con estados de preparación**
- 👥 **Gestión de usuarios con diferentes roles (Admin/Cashier/Chef)**
- 📊 **Dashboard con estadísticas y métricas**
- 📧 **Sistema de recuperación de contraseña por email**
- 🔔 **Notificaciones en tiempo real**
- 📱 **Diseño responsive (móvil, tablet, desktop)**
- 📚 **Manual de usuario integrado**
- 🔒 **Sistema de autenticación y autorización robusto**

## 🚀 Tecnologías

- **Frontend:** Next.js 14, React, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT con cookies httpOnly
- **Email:** Nodemailer con SMTP
- **UI/UX:** Diseño moderno con glassmorphism

## 🏗️ Instalación

### Prerequisitos
- Node.js 18+
- PostgreSQL 12+
- npm

### Setup
```bash
# Clonar repositorio
git clone https://github.com/SukisDev/pos-viejas-ganas.git
cd pos-viejas-ganas

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Configurar base de datos
npx prisma generate
npx prisma migrate dev
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

## � Configuración

## � Roles de Usuario

- **👨‍💼 ADMIN**: Acceso completo al sistema, gestión de usuarios, productos y estadísticas
- **💰 CASHIER**: Toma órdenes, gestiona ventas y entrega de órdenes
- **👨‍🍳 CHEF**: Gestiona preparación de órdenes en cocina

## 🔄 Flujo de Trabajo

1. **Cajero** toma orden del cliente
2. **Cocina** recibe notificación automática
3. **Cocina** prepara y marca orden lista
4. **Cajero** entrega al cliente

##  Pantallas Principales

### 🏠 **Dashboard Admin**
- Estadísticas de ventas en tiempo real
- Métricas de rendimiento
- Gestión de usuarios y productos
- Calendario de órdenes con filtros

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
npx prisma db seed            # Sembrar datos iniciales
```

## 🛡️ Seguridad

- 🔐 Autenticación JWT con cookies HTTP-only
- 🔒 Contraseñas hasheadas con bcrypt (12 rounds)
- 🚫 Middleware de protección de rutas
- 📧 Recuperación segura de contraseña
- 👥 Sistema de roles y permisos

## 🌐 Despliegue

El sistema está optimizado para despliegue en:
- **Vercel** (recomendado para Next.js)
- **Netlify**
- **Docker**
- **VPS con PM2**

### Despliegue en Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Variables de entorno en Vercel dashboard
# DATABASE_URL, NEXTAUTH_SECRET, SMTP_*, etc.
```

## � Funcionalidades

- ✅ Sistema de autenticación completo
- ✅ Gestión de usuarios con roles
- ✅ CRUD completo de productos
- ✅ Sistema de órdenes en tiempo real
- ✅ Panel de cocina funcional
- ✅ Dashboard con estadísticas
- ✅ Sistema de email para recuperación
- ✅ Diseño responsive
- ✅ Manual de usuario integrado
- ✅ Calendario de órdenes con filtros

## 🎯 Próximas Funcionalidades

- 📱 Progressive Web App (PWA)
- 🧾 Integración fiscal (SAT México)
- 📊 Business Intelligence avanzado
- 🔔 Notificaciones push
- 💳 Integración con pasarelas de pago
- 📦 Control de inventario

## 📞 Soporte

Para soporte técnico o consultas comerciales:
- 📧 Email: [tu-email@dominio.com]
- 🐛 Reporta bugs en GitHub Issues

## 📄 Licencia

Este proyecto es software propietario. Todos los derechos reservados.

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
