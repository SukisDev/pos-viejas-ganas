'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Users, ShoppingCart, ChefHat, Settings, HelpCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function HelpPage() {
  const router = useRouter();
  const { currentUser, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('general');

  // Debug: mostrar el usuario actual en consola
  console.log('Current user in help page:', currentUser);

  // Filtrar secciones según el rol del usuario - más estricto
  const getSectionsForRole = (role: string) => {
    const baseSections = [
      { id: 'general', title: 'Información General', icon: BookOpen },
      { id: 'troubleshooting', title: 'Solución de Problemas', icon: HelpCircle }
    ];

    if (role === 'ADMIN') {
      return [
        ...baseSections,
        { id: 'admin', title: 'Panel Administrador', icon: Settings },
        { id: 'cashier', title: 'Panel Cajero', icon: ShoppingCart },
        { id: 'kitchen', title: 'Panel Cocina', icon: ChefHat },
        { id: 'users', title: 'Gestión de Usuarios', icon: Users }
      ];
    } else if (role === 'CASHIER') {
      return [
        ...baseSections,
        { id: 'cashier', title: 'Panel Cajero', icon: ShoppingCart }
      ];
    } else if (role === 'CHEF') {
      return [
        ...baseSections,
        { id: 'kitchen', title: 'Panel Cocina', icon: ChefHat }
      ];
    }
    
    return baseSections;
  };

  const sections = getSectionsForRole(currentUser?.role || '');

  // Función para verificar si el usuario puede acceder a una sección
  const canAccessSection = (sectionId: string, userRole: string) => {
    const userSections = getSectionsForRole(userRole);
    return userSections.some(section => section.id === sectionId);
  };

  // Componente para secciones restringidas
  const AccessDeniedSection = () => (
    <div className="text-center py-12">
      <div className="text-red-400 text-6xl mb-4">🚫</div>
      <h3 className="text-xl font-semibold text-white mb-2">Acceso Denegado</h3>
      <p className="text-gray-400">No tienes permisos para ver esta sección.</p>
    </div>
  );

  // Si no hay usuario o está cargando, mostrar loading
  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8DFF50]/30 border-t-[#8DFF50] mx-auto mb-4"></div>
          <p>Cargando manual de usuario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B]">
      {/* Header */}
      <div className="bg-gradient-to-r from-black/40 via-black/20 to-black/40 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#8DFF50]/5 via-transparent to-[#8DFF50]/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-white">📚 Manual de Usuario</h1>
            </div>
            <div className="text-sm text-[#8DFF50]">
              Sistema POS Viejas Ganas • Usuario: {currentUser?.username} ({currentUser?.role})
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-4">
              <h3 className="font-semibold text-white mb-4">Secciones</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-[#8DFF50]/20 text-[#8DFF50] border border-[#8DFF50]/30'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {section.title}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
              {activeSection === 'general' && <GeneralSection />}
              {activeSection === 'admin' && (
                canAccessSection('admin', currentUser?.role || '') ? <AdminSection /> : <AccessDeniedSection />
              )}
              {activeSection === 'cashier' && (
                canAccessSection('cashier', currentUser?.role || '') ? <CashierSection /> : <AccessDeniedSection />
              )}
              {activeSection === 'kitchen' && (
                canAccessSection('kitchen', currentUser?.role || '') ? <KitchenSection /> : <AccessDeniedSection />
              )}
              {activeSection === 'users' && (
                canAccessSection('users', currentUser?.role || '') ? <UsersSection /> : <AccessDeniedSection />
              )}
              {activeSection === 'troubleshooting' && <TroubleshootingSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessDeniedSection() {
  return (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-white">🚫 Acceso Denegado</h2>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-lg font-semibold text-red-400 mb-2">Sección Restringida</h3>
        <p className="text-red-200 mb-4">
          Esta sección solo está disponible para usuarios con rol de Administrador.
        </p>
        <p className="text-white/70 text-sm">
          Si necesitas acceso a esta funcionalidad, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

function GeneralSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🍽️ Información General</h2>
      
      <div className="bg-[#8DFF50]/10 border border-[#8DFF50]/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[#8DFF50] mb-2">🎯 ¿Qué es el Sistema POS Viejas Ganas?</h3>
        <p className="text-white/80">
          Es un sistema completo de punto de venta diseñado para restaurantes. Permite gestionar menús, 
          tomar órdenes, manejar la cocina y administrar usuarios de manera eficiente.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">👥 Tipos de Usuario</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <Settings className="w-5 h-5 text-[#8DFF50] mr-2" />
              <h4 className="font-semibold text-white">ADMIN</h4>
            </div>
            <p className="text-sm text-white/70">Acceso completo al sistema, puede gestionar usuarios, productos, órdenes y ver estadísticas.</p>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <ShoppingCart className="w-5 h-5 text-[#8DFF50] mr-2" />
              <h4 className="font-semibold text-white">CASHIER</h4>
            </div>
            <p className="text-sm text-white/70">Puede tomar órdenes de los clientes y procesarlas para envío a cocina.</p>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <ChefHat className="w-5 h-5 text-[#8DFF50] mr-2" />
              <h4 className="font-semibold text-white">CHEF</h4>
            </div>
            <p className="text-sm text-white/70">Puede ver y gestionar las órdenes de cocina, marcar como en preparación o listas.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">🔐 Cómo Iniciar Sesión</h3>
        <div className="space-y-2 text-white/80">
          <p>1. Ve a la página de login</p>
          <p>2. Ingresa tu <strong>username</strong> y <strong>contraseña</strong></p>
          <p>3. Haz clic en &quot;Iniciar Sesión&quot;</p>
          <p>4. Serás redirigido según tu rol de usuario</p>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-400 mb-2">🔑 Credenciales de Acceso</h4>
        <div className="text-yellow-200">
          <p>• Las credenciales de acceso son proporcionadas por el administrador del sistema</p>
          <p>• Si olvidaste tu contraseña, contacta al administrador</p>
          <p>• Los usuarios ADMIN pueden usar la función de recuperación por email</p>
        </div>
      </div>
    </div>
  );
}

function AdminSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">👨‍💼 Panel de Administración</h2>
      
      <div className="bg-white/5 border border-white/20 rounded-lg p-4">
        <p className="text-white/80">
          <strong>URL:</strong> <code className="bg-[#8DFF50]/20 text-[#8DFF50] px-2 py-1 rounded">/admin</code>
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">📊 Dashboard Principal</h3>
        <div className="space-y-2 text-white/80">
          <p>• <strong>Estadísticas del día:</strong> Ventas, órdenes, productos más vendidos</p>
          <p>• <strong>Métricas en tiempo real:</strong> Ingresos totales, órdenes completadas</p>
          <p>• <strong>Gráficos visuales:</strong> Rendimiento del negocio</p>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">👥 Gestión de Usuarios</h3>
        
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">✅ Crear Usuario</h4>
            <div className="space-y-1 text-white/80">
              <p>1. Haz clic en el botón &quot;Crear Usuario&quot;</p>
              <p>2. Completa el formulario con todos los datos</p>
              <p>3. Selecciona el rol apropiado</p>
              <p>4. Guarda los cambios</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">✏️ Editar Usuario</h4>
            <div className="space-y-1 text-white/80">
              <p>1. Encuentra el usuario en la lista</p>
              <p>2. Haz clic en el botón &quot;Editar&quot;</p>
              <p>3. Modifica los campos necesarios</p>
              <p>4. Guarda los cambios</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">🍽️ Gestión de Productos</h3>
        
        <div className="bg-white/5 border border-white/20 rounded-lg p-4">
          <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">➕ Agregar Producto</h4>
          <div className="space-y-1 text-white/80">
            <p>1. Haz clic en &quot;Agregar Producto&quot;</p>
            <p>2. Completa nombre, descripción y precio</p>
            <p>3. Selecciona la categoría</p>
            <p>4. Guarda el producto</p>
          </div>
        </div>
      </div>

      <div className="bg-[#8DFF50]/10 border border-[#8DFF50]/30 rounded-lg p-4">
        <h4 className="font-semibold text-[#8DFF50] mb-2">💡 Consejos</h4>
        <div className="text-white/80 space-y-1">
          <p>• Usa descripciones claras y atractivas</p>
          <p>• Revisa los precios antes de guardar</p>
          <p>• Organiza bien por categorías</p>
        </div>
      </div>
    </div>
  );
}

function CashierSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">💰 Panel de Cajero</h2>
      
      <div className="bg-white/5 border border-white/20 rounded-lg p-4">
        <p className="text-white/80">
          <strong>URL:</strong> <code className="bg-[#8DFF50]/20 text-[#8DFF50] px-2 py-1 rounded">/cashier</code>
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">🛒 Cómo Tomar una Orden</h3>
        
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">1️⃣ Seleccionar Productos</h4>
            <div className="space-y-1 text-white/80">
              <p>• Navega por las categorías del menú</p>
              <p>• Haz clic en los productos para agregarlos</p>
              <p>• Los productos aparecen automáticamente en el carrito</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">2️⃣ Ajustar Cantidades</h4>
            <div className="space-y-1 text-white/80">
              <p>• <strong>Aumentar:</strong> Botón + junto al producto</p>
              <p>• <strong>Disminuir:</strong> Botón - junto al producto</p>
              <p>• <strong>Eliminar:</strong> Reducir cantidad a 0</p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-2 text-[#8DFF50]">3️⃣ Procesar Orden</h4>
            <div className="space-y-1 text-white/80">
              <p>1. Revisa todos los productos</p>
              <p>2. Confirma el total</p>
              <p>3. Haz clic en &quot;Procesar Orden&quot;</p>
              <p>4. La orden se envía automáticamente a cocina</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-400 mb-2">⚡ Funciones Rápidas</h4>
        <div className="text-yellow-200 space-y-1">
          <p>• Total se actualiza automáticamente</p>
          <p>• Botón para limpiar carrito completo</p>
          <p>• Filtros por categoría</p>
        </div>
      </div>
    </div>
  );
}

function KitchenSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">👨‍🍳 Panel de Cocina</h2>
      
      <div className="bg-white/5 border border-white/20 rounded-lg p-4">
        <p className="text-white/80">
          <strong>URL:</strong> <code className="bg-[#8DFF50]/20 text-[#8DFF50] px-2 py-1 rounded">/kitchen</code>
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">🔄 Estados de Órdenes</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">PENDING</h4>
            </div>
            <p className="text-sm text-white/70 mb-2">Orden recién recibida, esperando preparación.</p>
            <button className="px-3 py-1 bg-[#8DFF50] text-[#1D263B] text-sm rounded font-semibold">
              Iniciar Preparación
            </button>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">PREPARING</h4>
            </div>
            <p className="text-sm text-white/70 mb-2">Orden en proceso de preparación.</p>
            <button className="px-3 py-1 bg-[#8DFF50] text-[#1D263B] text-sm rounded font-semibold">
              Marcar Lista
            </button>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">READY</h4>
            </div>
            <p className="text-sm text-white/70">Orden lista para entregar.</p>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <h4 className="font-semibold text-white">DELIVERED</h4>
            </div>
            <p className="text-sm text-white/70">Orden entregada al cliente.</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">⚡ Flujo de Trabajo</h3>
        <div className="space-y-2 text-white/80">
          <p>1. <strong>Nueva orden llega:</strong> Recibes notificación automática</p>
          <p>2. <strong>Iniciar preparación:</strong> Cambia estado a PREPARING</p>
          <p>3. <strong>Terminar preparación:</strong> Marca como READY</p>
          <p>4. <strong>Notificación:</strong> El cajero recibe aviso automático</p>
        </div>
      </div>

      <div className="bg-[#8DFF50]/10 border border-[#8DFF50]/30 rounded-lg p-4">
        <h4 className="font-semibold text-[#8DFF50] mb-2">💡 Consejos para Cocina</h4>
        <div className="text-white/80 space-y-1">
          <p>• Prioriza órdenes más antiguas</p>
          <p>• Marca estados inmediatamente</p>
          <p>• Las pantallas se actualizan automáticamente</p>
        </div>
      </div>
    </div>
  );
}

function UsersSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">👥 Gestión de Usuarios</h2>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-400 mb-2">🔒 Solo para Administradores</h3>
        <p className="text-red-200">
          Esta funcionalidad solo está disponible para usuarios con rol ADMIN.
        </p>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">📝 Campos del Usuario</h3>
        <div className="space-y-4">
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <h4 className="font-semibold mb-2 text-[#8DFF50]">Username</h4>
            <p className="text-sm text-white/70">Debe ser único en el sistema. Se usa para hacer login.</p>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <h4 className="font-semibold mb-2 text-[#8DFF50]">Email</h4>
            <p className="text-sm text-white/70">
              <strong>Obligatorio para ADMIN</strong> (para recuperación de contraseña).
              Opcional para otros roles.
            </p>
          </div>
          
          <div className="border border-white/20 rounded-lg p-4 bg-white/5">
            <h4 className="font-semibold mb-2 text-[#8DFF50]">Rol</h4>
            <div className="text-sm text-white/70 space-y-1">
              <p>• <strong>ADMIN:</strong> Acceso completo</p>
              <p>• <strong>CASHIER:</strong> Solo tomar órdenes</p>
              <p>• <strong>CHEF:</strong> Solo gestión de cocina</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Importante</h4>
        <p className="text-yellow-200">
          Los usuarios eliminados se marcan como inactivos para mantener el historial del sistema.
        </p>
      </div>
    </div>
  );
}

function TroubleshootingSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">🚨 Solución de Problemas</h2>
      
      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">🔐 Problemas de Login</h3>
        
        <div className="space-y-4">
          <div className="border border-red-400/30 rounded-lg p-4 bg-red-500/10">
            <h4 className="font-semibold text-red-400 mb-2">❌ Usuario no encontrado</h4>
            <div className="text-red-200 space-y-1">
              <p>• Verifica que el username esté correcto</p>
              <p>• Es sensible a mayúsculas/minúsculas</p>
              <p>• Contacta al administrador si persiste</p>
            </div>
          </div>
          
          <div className="border border-red-400/30 rounded-lg p-4 bg-red-500/10">
            <h4 className="font-semibold text-red-400 mb-2">❌ Contraseña incorrecta</h4>
            <div className="text-red-200 space-y-1">
              <p>• Verifica la contraseña</p>
              <p>• ADMIN con email puede usar recuperación</p>
              <p>• Otros roles: contacta al administrador</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">📧 Problemas con Email</h3>
        
        <div className="border border-yellow-500/30 rounded-lg p-4 bg-yellow-500/10">
          <h4 className="font-semibold text-yellow-400 mb-2">📬 Email no llega</h4>
          <div className="text-yellow-200 space-y-1">
            <p>• Revisa la carpeta de spam</p>
            <p>• Solo ADMIN pueden recuperar por email</p>
            <p>• El email debe estar configurado</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-white">⚡ Soluciones Rápidas</h3>
        
        <div className="bg-[#8DFF50]/10 border border-[#8DFF50]/30 rounded-lg p-4">
          <h4 className="font-semibold text-[#8DFF50] mb-2">🔧 Pasos Básicos</h4>
          <div className="text-white/80 space-y-1">
            <p>1. Recarga la página (F5)</p>
            <p>2. Cierra y abre el navegador</p>
            <p>3. Verifica conexión a internet</p>
            <p>4. Intenta otro navegador</p>
            <p>5. Contacta al administrador</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/20 rounded-lg p-4">
        <h4 className="font-semibold mb-2 text-white">🆘 Contacto de Soporte</h4>
        <div className="space-y-1 text-white/80">
          <p>• Contacta al administrador del sistema</p>
          <p>• Describe exactamente el problema</p>
          <p>• Incluye mensajes de error</p>
          <p>• Menciona tu rol de usuario</p>
        </div>
      </div>
    </div>
  );
}
