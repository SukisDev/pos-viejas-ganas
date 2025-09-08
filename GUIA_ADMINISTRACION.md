# 🔧 Guía de Administración Técnica - Sistema POS Viejas Ganas

## 🎯 **Para Administradores del Sistema**

Esta guía está dirigida a administradores técnicos que necesitan configurar, mantener y solucionar problemas del sistema.

---

## 🚀 **Instalación y Configuración Inicial**

### **📋 Requisitos del Sistema**
- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn
- Git

### **🔧 Configuración Paso a Paso**

#### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/SukisDev/pos-viejas-ganas.git
cd pos-viejas-ganas
```

#### 2. **Instalar Dependencias**
```bash
npm install
```

#### 3. **Configurar Base de Datos**
```bash
# Crear archivo .env basado en .env.example
cp .env.example .env

# Configurar DATABASE_URL en .env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/pos_viejas_ganas"
```

#### 4. **Inicializar Base de Datos**
```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Opcional: Llenar con datos de ejemplo
npx prisma db seed
```

#### 5. **Crear Usuario Administrador**
```bash
npm run create-dev-user
```

---

## 🗄️ **Gestión de Base de Datos**

### **📊 Esquema de la Base de Datos**

#### **Tabla: users**
```sql
- id: String (UUID)
- username: String (único)
- name: String
- email: String? (opcional, solo para admins)
- passwordHash: String
- role: Enum (ADMIN, CASHIER, KITCHEN)
- isActive: Boolean
- resetToken: String?
- resetTokenExp: DateTime?
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Tabla: categories**
```sql
- id: String (UUID)
- name: String
- description: String?
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Tabla: products**
```sql
- id: String (UUID)
- name: String
- description: String?
- price: Decimal
- categoryId: String
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Tabla: orders**
```sql
- id: String (UUID)
- status: Enum (PENDING, PREPARING, READY, DELIVERED)
- total: Decimal
- createdAt: DateTime
- updatedAt: DateTime
```

#### **Tabla: order_items**
```sql
- id: String (UUID)
- orderId: String
- productId: String
- quantity: Int
- price: Decimal
- createdAt: DateTime
```

### **🔧 Comandos Útiles de Prisma**

#### **Ver Base de Datos**
```bash
npx prisma studio
```

#### **Resetear Base de Datos**
```bash
npx prisma migrate reset
```

#### **Generar Nueva Migración**
```bash
npx prisma migrate dev --name nombre_de_migracion
```

#### **Backup de Base de Datos**
```bash
pg_dump pos_viejas_ganas > backup.sql
```

---

## 🛡️ **Seguridad y Autenticación**

### **🔐 Sistema de Autenticación**

#### **JWT Tokens**
- **Secreto**: Configurado en `AUTH_JWT_SECRET`
- **Duración**: 24 horas por defecto
- **Almacenamiento**: Cookies HTTP-only

#### **Hashing de Contraseñas**
- **Algoritmo**: bcrypt con salt rounds = 12
- **Validación**: Mínimo 6 caracteres

#### **Recuperación de Contraseña**
- **Tokens**: SHA-256 con 32 bytes aleatorios
- **Expiración**: 1 hora
- **Solo para**: Usuarios con rol ADMIN y email configurado

### **🔒 Configuración de Seguridad**

#### **Variables de Entorno Críticas**
```env
# ¡NUNCA compartir estos valores!
AUTH_JWT_SECRET="secreto-super-seguro-256-bits"
DATABASE_URL="postgresql://..."

# Email seguro (usar App Passwords)
EMAIL_PASSWORD="app-password-no-password-normal"
```

#### **Mejores Prácticas**
- Cambiar `AUTH_JWT_SECRET` en producción
- Usar HTTPS en producción
- Configurar CORS apropiadamente
- Implementar rate limiting si es necesario

---

## 📧 **Sistema de Email**

### **🔧 Configuración de Email**

#### **Opción 1: Gmail (Recomendado para Producción)**
```env
EMAIL_SERVICE="gmail"
EMAIL_USER="admin@empresa.com"
EMAIL_PASSWORD="app_password_de_16_caracteres"
EMAIL_FROM="admin@empresa.com"
```

**Pasos para Gmail:**
1. Habilitar verificación en 2 pasos
2. Generar App Password
3. Usar App Password (NO la contraseña normal)

#### **Opción 2: SMTP Personalizado**
```env
SMTP_HOST="smtp.empresa.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="usuario_smtp"
SMTP_PASSWORD="password_smtp"
EMAIL_FROM="noreply@empresa.com"
```

#### **Opción 3: Ethereal (Solo Testing)**
```env
EMAIL_SERVICE="ethereal"
ETHEREAL_USER="usuario_ethereal"
ETHEREAL_PASS="password_ethereal"
EMAIL_FROM="test@ethereal.email"
```

### **📨 Templates de Email**

Los templates están en `src/lib/email.ts`:
- **HTML**: Design responsive con CSS inline
- **Texto**: Versión texto plano para compatibilidad
- **Branding**: Logo y colores de Viejas Ganas

---

## 🚀 **Despliegue en Producción**

### **📦 Build de Producción**
```bash
# Construir aplicación
npm run build

# Iniciar servidor de producción
npm run start
```

### **🌐 Variables de Entorno para Producción**
```env
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://tu-dominio.com"
DATABASE_URL="postgresql://usuario:password@servidor:5432/bd"
AUTH_JWT_SECRET="secreto-super-seguro-para-produccion"
```

### **🔧 Configuración del Servidor**

#### **Nginx (Proxy Reverso)**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### **PM2 (Process Manager)**
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start npm --name "pos-viejas-ganas" -- start

# Configurar auto-inicio
pm2 startup
pm2 save
```

---

## 📊 **Monitoreo y Logs**

### **🔍 Logs del Sistema**

#### **Logs de la Aplicación**
- **Ubicación**: Consola del servidor
- **Niveles**: Info, Error, Debug
- **Formato**: Timestamp + Mensaje

#### **Logs de Base de Datos**
```bash
# Ver logs de PostgreSQL
tail -f /var/log/postgresql/postgresql.log
```

#### **Logs de Email**
- Envíos exitosos y errores se registran en consola
- Para Ethereal: URLs de preview en logs

### **📈 Métricas Importantes**

#### **Rendimiento**
- Tiempo de respuesta de APIs
- Uso de memoria de Node.js
- Conexiones a base de datos

#### **Negocio**
- Órdenes por hora/día
- Productos más vendidos
- Usuarios activos

---

## 🚨 **Solución de Problemas**

### **🐛 Problemas Comunes**

#### **Error de Conexión a Base de Datos**
```bash
# Verificar que PostgreSQL esté corriendo
systemctl status postgresql

# Verificar conexión
psql -h localhost -U usuario -d pos_viejas_ganas

# Regenerar cliente Prisma
npx prisma generate
```

#### **Error de Autenticación**
```bash
# Verificar JWT_SECRET
echo $AUTH_JWT_SECRET

# Limpiar cookies del navegador
# Reiniciar sesión
```

#### **Error de Email**
```bash
# Verificar configuración
node -e "console.log(process.env.EMAIL_SERVICE)"

# Probar conexión SMTP manualmente
telnet smtp.gmail.com 587
```

### **📋 Checklist de Diagnóstico**

#### **✅ Servidor No Inicia**
- [ ] Node.js instalado correctamente
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas
- [ ] Puerto 3000 disponible

#### **✅ Base de Datos No Conecta**
- [ ] PostgreSQL corriendo
- [ ] DATABASE_URL correcto
- [ ] Usuario tiene permisos
- [ ] Base de datos existe

#### **✅ Email No Funciona**
- [ ] Variables de email configuradas
- [ ] App Password correcto (Gmail)
- [ ] Puerto SMTP abierto
- [ ] Usuario existe y tiene email

---

## 🔄 **Mantenimiento Regular**

### **📅 Tareas Diarias**
- Verificar logs de errores
- Monitorear uso de recursos
- Backup automático de base de datos

### **📅 Tareas Semanales**
- Limpiar logs antiguos
- Actualizar dependencias de seguridad
- Verificar métricas de rendimiento

### **📅 Tareas Mensuales**
- Backup completo del sistema
- Revisar configuración de seguridad
- Actualizar documentación

---

## 📚 **Scripts de Administración**

### **🛠️ Scripts Personalizados**

#### **Backup Automatizado**
```bash
#!/bin/bash
# backup-db.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump pos_viejas_ganas > "backup_$DATE.sql"
echo "Backup creado: backup_$DATE.sql"
```

#### **Limpiar Órdenes Antiguas**
```bash
# Crear script SQL para limpiar órdenes > 30 días
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders WHERE created_at < NOW() - INTERVAL '30 days'
);
DELETE FROM orders WHERE created_at < NOW() - INTERVAL '30 days';
```

#### **Verificar Salud del Sistema**
```bash
#!/bin/bash
# health-check.sh
curl -f http://localhost:3000/api/health || exit 1
psql -c "SELECT 1" pos_viejas_ganas || exit 1
echo "Sistema saludable"
```

---

## 📞 **Contacto y Soporte**

### **🚨 En Caso de Emergencia**
1. Verificar estado del servidor
2. Revisar logs de error
3. Contactar al desarrollador
4. Implementar plan de contingencia

### **📧 Reportar Problemas**
- Incluir logs completos
- Describir pasos para reproducir
- Especificar entorno (dev/prod)
- Adjuntar configuración (sin secretos)

---

*📝 Documento técnico actualizado: Septiembre 2025*
*🔧 Para administradores del sistema POS Viejas Ganas*
*👨‍💻 Desarrollado por SukisDev*
