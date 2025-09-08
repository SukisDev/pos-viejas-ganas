# 📋 Guía de Usuario - Sistema POS Viejas Ganas

## 🎯 **Introducción**

El Sistema POS Viejas Ganas es una aplicación completa de punto de venta diseñada para restaurantes. Permite gestionar menús, tomar órdenes, manejar la cocina y administrar usuarios.

---

## 🚀 **Acceso al Sistema**

### URL Principal:
```
http://localhost:3000
```

### Tipos de Usuario:
- **👨‍💼 ADMIN**: Acceso completo al sistema
- **💰 CASHIER**: Solo puede tomar órdenes
- **👨‍🍳 KITCHEN**: Solo puede ver y gestionar órdenes de cocina

---

## 🔐 **Inicio de Sesión**

### 1. **Página de Login**
- Accede a: `http://localhost:3000/login`
- Ingresa tu **username** y **contraseña**
- Click en **"Iniciar Sesión"**

### 2. **Credenciales por Defecto**
```
Usuario: developer
Contraseña: dev123
Rol: ADMIN
```

### 3. **¿Olvidaste tu Contraseña?**
- Click en **"¿Olvidaste tu contraseña?"**
- Ingresa tu email (solo para usuarios ADMIN)
- Recibirás un enlace de recuperación
- Sigue el enlace para restablecer tu contraseña

---

## 👨‍💼 **Panel de Administración**

### Acceso:
```
http://localhost:3000/admin
```

### 📊 **Dashboard Principal**
- **Estadísticas del día**: Ventas, órdenes, productos más vendidos
- **Métricas en tiempo real**: Ingresos totales, órdenes completadas
- **Gráficos visuales**: Rendimiento del negocio

### 👥 **Gestión de Usuarios**

#### **Ver Usuarios**
- Lista completa de todos los usuarios del sistema
- Información: Username, Nombre, Email, Rol, Estado

#### **Crear Usuario**
1. Click en **"Crear Usuario"**
2. Completa el formulario:
   - **Username**: Único en el sistema
   - **Nombre**: Nombre completo del usuario
   - **Email**: Solo para usuarios ADMIN (opcional para otros)
   - **Contraseña**: Mínimo 6 caracteres
   - **Rol**: ADMIN, CASHIER, o KITCHEN
3. Click en **"Crear Usuario"**

#### **Editar Usuario**
1. Click en el botón **"Editar"** del usuario
2. Modifica los campos necesarios
3. Click en **"Guardar Cambios"**

#### **Eliminar Usuario**
1. Click en el botón **"Eliminar"** del usuario
2. Confirma la eliminación
3. El usuario será marcado como inactivo

### 🍽️ **Gestión de Productos**

#### **Ver Productos**
- Lista completa del menú
- Información: Nombre, Descripción, Precio, Categoría, Estado

#### **Crear Producto**
1. Click en **"Agregar Producto"**
2. Completa la información:
   - **Nombre**: Nombre del platillo
   - **Descripción**: Descripción detallada
   - **Precio**: Precio en dólares
   - **Categoría**: APPETIZER, MAIN_COURSE, DESSERT, BEVERAGE
3. Click en **"Crear Producto"**

#### **Editar Producto**
1. Click en **"Editar"** en el producto deseado
2. Modifica la información
3. Click en **"Guardar"**

#### **Eliminar Producto**
1. Click en **"Eliminar"** en el producto
2. Confirma la eliminación

### 📦 **Gestión de Órdenes**

#### **Ver Órdenes**
- Lista de todas las órdenes del sistema
- Filtros por fecha y estado
- Estados: PENDING, PREPARING, READY, DELIVERED

#### **Detalles de Orden**
- Click en cualquier orden para ver:
  - Productos ordenados
  - Cantidades
  - Precio total
  - Estado actual
  - Historial de cambios

---

## 💰 **Panel de Cajero (Cashier)**

### Acceso:
```
http://localhost:3000/cashier
```

### 🛒 **Tomar Órdenes**

#### **Proceso de Orden**
1. **Seleccionar Productos**:
   - Navega por las categorías del menú
   - Click en los productos para agregarlos
   - Ajusta cantidades con los botones + y -

2. **Revisar Orden**:
   - Verifica productos en el carrito
   - Revisa cantidades y precios
   - Total se calcula automáticamente

3. **Finalizar Orden**:
   - Click en **"Procesar Orden"**
   - La orden se envía automáticamente a cocina
   - Se genera un número de orden único

#### **Gestión del Carrito**
- **Agregar producto**: Click en el producto
- **Aumentar cantidad**: Botón "+"
- **Disminuir cantidad**: Botón "-"
- **Eliminar producto**: Reducir cantidad a 0
- **Limpiar carrito**: Botón "Limpiar Carrito"

---

## 👨‍🍳 **Panel de Cocina (Kitchen)**

### Acceso:
```
http://localhost:3000/kitchen
```

### 🍳 **Gestión de Órdenes de Cocina**

#### **Ver Órdenes Pendientes**
- Lista de órdenes en estado PENDING y PREPARING
- Información por orden:
  - Número de orden
  - Productos y cantidades
  - Tiempo transcurrido
  - Estado actual

#### **Procesar Órdenes**
1. **Comenzar Preparación**:
   - Click en **"Iniciar Preparación"**
   - Orden cambia a estado PREPARING

2. **Marcar como Lista**:
   - Click en **"Marcar Lista"**
   - Orden cambia a estado READY
   - Notifica al mesero/cajero

#### **Estados de Órdenes**
- 🟡 **PENDING**: Recién recibida, esperando preparación
- 🔵 **PREPARING**: En proceso de preparación
- 🟢 **READY**: Lista para entregar
- ✅ **DELIVERED**: Entregada al cliente

---

## 🔔 **Sistema de Notificaciones en Tiempo Real**

### **Beepers/Notifications**
- **Cocina recibe**: Notificación cuando llega nueva orden
- **Cajero recibe**: Notificación cuando orden está lista
- **Sonido automático**: Alertas sonoras para nuevas notificaciones
- **Actualización automática**: Las pantallas se actualizan en tiempo real

---

## 📱 **Características Especiales**

### **🔄 Actualizaciones en Tiempo Real**
- Las órdenes se actualizan automáticamente
- No necesitas refrescar la página
- Sincronización entre todas las pantallas

### **📊 Dashboard Dinámico**
- Estadísticas que se actualizan en vivo
- Gráficos interactivos
- Métricas de rendimiento en tiempo real

### **🛡️ Seguridad**
- Autenticación por roles
- Sesiones seguras
- Recuperación de contraseña por email
- Logs de actividad del sistema

### **📱 Diseño Responsive**
- Funciona en computadoras, tablets y móviles
- Interfaz adaptativa según el dispositivo
- Optimizado para pantallas táctiles

---

## ⚙️ **Configuración Avanzada**

### **🔧 Variables de Entorno**
El sistema se configura a través del archivo `.env`:

```env
# Base de Datos
DATABASE_URL="tu_url_de_base_de_datos"

# Autenticación
AUTH_JWT_SECRET="tu_secreto_jwt"
AUTH_COOKIE_NAME="vg_session"

# Aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email (para recuperación de contraseña)
EMAIL_SERVICE="gmail"  # o "ethereal" para testing
EMAIL_USER="tu_email@gmail.com"
EMAIL_PASSWORD="tu_app_password"
EMAIL_FROM="tu_email@gmail.com"
```

### **🛠️ Scripts Útiles**

#### **Crear Usuario Desarrollador**
```bash
npm run create-dev-user
```

#### **Iniciar Aplicación**
```bash
npm run dev        # Desarrollo
npm run build      # Construcción para producción
npm run start      # Servidor de producción
```

---

## 🚨 **Solución de Problemas**

### **🔐 Problemas de Login**
- **Usuario no encontrado**: Verifica el username exacto
- **Contraseña incorrecta**: Usa la recuperación de contraseña
- **Sesión expirada**: Vuelve a iniciar sesión

### **📧 Problemas de Email**
- **Email no llega**: Verifica configuración en `.env`
- **Solo admins**: Solo usuarios ADMIN pueden recuperar contraseña por email
- **Testing**: Con Ethereal, revisa la consola del servidor para ver el preview

### **🍽️ Problemas con Órdenes**
- **Orden no aparece**: Verifica que el usuario tenga los permisos correctos
- **No se actualiza**: Las pantallas se actualizan automáticamente, espera unos segundos

### **👥 Problemas de Permisos**
- **Acceso denegado**: Verifica que tu rol tenga permisos para esa sección
- **No puedes crear usuarios**: Solo los ADMIN pueden gestionar usuarios

---

## 📞 **Soporte**

### **🐛 Reportar Problemas**
- Revisa los logs del servidor en la consola
- Anota el mensaje de error exacto
- Incluye los pasos para reproducir el problema

### **💡 Sugerencias de Mejora**
- Documenta la funcionalidad sugerida
- Explica el caso de uso
- Considera el impacto en otros usuarios

---

## 📚 **Recursos Adicionales**

### **📖 Documentación Técnica**
- `EMAIL_SYSTEM_DOCS.md`: Documentación del sistema de emails
- `FORGOT_PASSWORD_IMPROVEMENTS.md`: Mejoras de recuperación de contraseña
- `README.md`: Información general del proyecto

### **🎓 Videos Tutoriales**
*[Aquí podrías agregar enlaces a videos explicativos si los creas]*

### **🤝 Comunidad**
*[Aquí podrías agregar enlaces a Discord, Slack, etc. si tienes]*

---

## 🎉 **¡Listo para Usar!**

Con esta guía tienes todo lo necesario para usar eficientemente el Sistema POS Viejas Ganas. 

**¿Necesitas ayuda adicional?** Contacta al administrador del sistema.

---

*📝 Documento actualizado: Septiembre 2025*
*🔄 Versión: 1.0*
*👨‍💻 Sistema desarrollado para Viejas Ganas*
