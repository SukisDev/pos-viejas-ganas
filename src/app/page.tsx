'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from '../components/LogoutButton';

type Role = 'ADMIN' | 'CASHIER' | 'CHEF';

interface Me {
  id: string;
  username: string;
  role: Role;
}

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!abort && res.ok) {
          const data = (await res.json()) as Me;
          setMe(data);
        }
      } catch {
        /* ignorar */
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const getRoleDisplayName = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'CASHIER': return 'Cajero';
      case 'CHEF': return 'Chef';
      default: return role;
    }
  };

  const getWelcomeMessage = (role: Role) => {
    switch (role) {
      case 'ADMIN': return 'Gestiona el sistema, usuarios y reportes';
      case 'CASHIER': return 'Procesa órdenes y maneja el punto de venta';
      case 'CHEF': return 'Revisa los pedidos y gestiona la cocina';
      default: return 'Bienvenido al sistema';
    }
  };

  return (
    <main className="min-h-[100svh] relative overflow-hidden bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B]">
      {/* Elementos de fondo animados */}
      <div className="absolute inset-0">
        {/* Círculos flotantes con colores de la empresa */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-[#8DFF50]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-80 h-80 bg-[#7DE040]/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-[#8DFF50]/8 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-[#7DE040]/12 rounded-full blur-3xl animate-pulse" style={{animationDelay: '6s'}}></div>
        
        {/* Patrón de cuadrícula */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Q0EzQUYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSI+PC9jaXJjbGU+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] px-4 py-4">
        {loading ? (
          /* Loading State */
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-white/10 backdrop-blur-sm rounded-full shadow-2xl border border-white/20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#8DFF50]/30 border-t-[#8DFF50]"></div>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Cargando...</h1>
            <p className="text-gray-400">Verificando credenciales</p>
          </div>
        ) : !me ? (
          /* Estado sin sesión - Landing Page */
          <div className="w-full max-w-6xl">
            {/* Header con logo */}
            <div className="text-center mb-8 lg:mb-12 animate-fade-in">
              <div className="inline-flex items-center justify-center w-24 h-24 lg:w-32 lg:h-32 mb-6 lg:mb-8 bg-white/10 backdrop-blur-sm rounded-full shadow-2xl border border-white/20">
                <Image 
                  src="/img/logo_viejas-ganas.png" 
                  alt="Viejas Ganas Logo" 
                  width={80}
                  height={80}
                  className="object-contain w-12 h-12 lg:w-20 lg:h-20"
                />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-[#8DFF50] to-[#7DE040] bg-clip-text text-transparent mb-4">
                Viejas Ganas
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-6">Sistema de Punto de Venta</p>
              
              {/* Botón de acceso principal - justo debajo del subtítulo */}
              <div className="mb-8 lg:mb-12">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-3 px-8 lg:px-12 py-3 lg:py-4 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] hover:from-[#7DE040] hover:to-[#6DD030] text-[#1D263B] font-bold text-lg lg:text-xl rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-[#8DFF50]/25"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Acceder al Sistema
                </Link>
              </div>

              <p className="text-sm lg:text-base text-gray-400 max-w-2xl mx-auto px-4 mb-8">
                Bienvenido al sistema de gestión integral para tu restaurante. 
                Aquí podrás administrar pedidos, supervisar la cocina y gestionar tu negocio 
                de forma eficiente y organizada.
              </p>
            </div>

            {/* Características del sistema - más compactas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 px-4">
              <div className="group p-4 lg:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#8DFF50]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#8DFF50]/10 hover:scale-105">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">Punto de Venta</h3>
                <p className="text-sm text-gray-400 text-center">Registra pedidos y procesa transacciones de manera rápida y sencilla.</p>
              </div>

              <div className="group p-4 lg:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#8DFF50]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#8DFF50]/10 hover:scale-105">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">Gestión de Cocina</h3>
                <p className="text-sm text-gray-400 text-center">Visualiza y administra todos los pedidos pendientes desde la cocina.</p>
              </div>

              <div className="group p-4 lg:p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#8DFF50]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#8DFF50]/10 hover:scale-105">
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl flex items-center justify-center mb-3 lg:mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto">
                  <svg className="w-6 h-6 lg:w-7 lg:h-7 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 text-center">Panel Administrativo</h3>
                <p className="text-sm text-gray-400 text-center">Administra usuarios, productos y consulta reportes de tu negocio.</p>
              </div>
            </div>
          </div>
        ) : (
          /* Estado con sesión - Dashboard */
          <div className="w-full max-w-6xl mb-16">
            {/* Header del usuario */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 lg:mb-12 animate-fade-in gap-4 px-4">
              <div className="flex items-center gap-4 lg:gap-6">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-full flex items-center justify-center">
                  <Image 
                    src="/img/logo_viejas-ganas.png" 
                    alt="Viejas Ganas Logo" 
                    width={48}
                    height={48}
                    className="object-contain w-8 h-8 lg:w-12 lg:h-12"
                  />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                    ¡Bienvenido, <span className="text-[#8DFF50]">{me.username}</span>!
                  </h1>
                  <p className="text-gray-400 text-sm lg:text-lg">{getRoleDisplayName(me.role)} • {getWelcomeMessage(me.role)}</p>
                </div>
              </div>
              <div className="self-start lg:self-auto">
                <LogoutButton />
              </div>
            </div>

            {/* Dashboard de acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4">
              {(me.role === 'ADMIN' || me.role === 'CASHIER') && (
                <Link
                  href="/cashier"
                  className="group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-[#8DFF50]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#8DFF50]/20 hover:scale-105"
                >
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Punto de Venta</h3>
                  <p className="text-sm lg:text-base text-gray-400 mb-4 lg:mb-6">Procesa órdenes y maneja transacciones</p>
                  <div className="flex items-center text-[#8DFF50] font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Ir a Caja
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              )}

              {(me.role === 'ADMIN' || me.role === 'CHEF') && (
                <Link
                  href="/kitchen"
                  className="group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-[#8DFF50]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#8DFF50]/20 hover:scale-105"
                >
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Cocina</h3>
                  <p className="text-sm lg:text-base text-gray-400 mb-4 lg:mb-6">Gestiona pedidos y producción</p>
                  <div className="flex items-center text-[#8DFF50] font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Ir a Cocina
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              )}

              {me.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 hover:border-[#8DFF50]/50 transition-all duration-300 hover:shadow-2xl hover:shadow-[#8DFF50]/20 hover:scale-105"
                >
                  <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-7 h-7 lg:w-8 lg:h-8 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">Administración</h3>
                  <p className="text-sm lg:text-base text-gray-400 mb-4 lg:mb-6">Controla usuarios, productos y reportes</p>
                  <div className="flex items-center text-[#8DFF50] font-semibold group-hover:translate-x-2 transition-transform duration-300">
                    Ir a Admin
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </Link>
              )}

              {/* Botón de Documentación - Disponible para todos los usuarios */}
              <Link
                href="/help"
                className="group p-6 lg:p-8 rounded-3xl bg-gradient-to-br from-purple-600/10 to-purple-700/5 border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105"
              >
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-3">📚 Manual de Usuario</h3>
                <p className="text-sm lg:text-base text-gray-400 mb-4 lg:mb-6">Guía completa del sistema y solución de problemas</p>
                <div className="flex items-center text-purple-400 font-semibold group-hover:translate-x-2 transition-transform duration-300">
                  Ver Documentación
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Información adicional */}
            <div className="mt-12 lg:mt-16 text-center px-4">
              <div className="inline-flex items-center gap-3 px-4 lg:px-6 py-2 lg:py-3 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
                <div className="w-3 h-3 bg-[#8DFF50] rounded-full animate-pulse"></div>
                <span className="text-sm lg:text-base text-gray-300">Sistema operativo • Todos los servicios funcionando</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs lg:text-sm mt-8 px-4">
          <p>© 2025 Viejas Ganas. Todos los derechos reservados.</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </main>
  );
}
