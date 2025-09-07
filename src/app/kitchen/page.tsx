'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

interface OrderItem {
  id: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  customName: string | null;
  notes: string | null;
  product: {
    name: string;
    category: string;
  } | null;
}

interface KitchenOrder {
  id: string;
  number: number;
  businessDate: string;
  status: string;
  beeperId: number;
  total: number;
  createdAt: string;
  notes: string | null;
  cashier: {
    username: string;
    name: string | null;
  };
  items: OrderItem[];
}

const fmt = (n: number | string) => `$${Number(n).toFixed(2)}`;

// Modal de confirmación ultra rápido para cocina - Responsive
const QuickConfirmModal = React.memo(function QuickConfirmModal({ 
  show, 
  orderNumber, 
  onConfirm, 
  onCancel 
}: {
  show: boolean;
  orderNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      
      <div className="relative bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl animate-scale-in max-w-sm sm:max-w-md w-full">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#1D263B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl sm:text-2xl font-bold text-[#1D263B] mb-2">¿Pedido Listo?</h3>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Marcar pedido #{orderNumber} como terminado</p>
          
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] rounded-lg sm:rounded-xl hover:from-[#7DE040] hover:to-[#6DD030] transition-all font-bold shadow-lg text-sm sm:text-base"
            >
              ✅ Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function KitchenPage() {
  const { currentUser } = useAuth();
  
  const [orders, setOrders] = React.useState<KitchenOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = React.useState<string | null>(null);
  const [confirmModal, setConfirmModal] = React.useState<{ show: boolean; orderId?: string; orderNumber?: number }>({ show: false });

  const loadOrders = React.useCallback(async () => {
    try {
      const response = await fetch('/api/orders/kitchen', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: KitchenOrder[] = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkReady = React.useCallback((orderId: string, orderNumber: number) => {
    setConfirmModal({ show: true, orderId, orderNumber });
  }, []);

  const confirmMarkReady = React.useCallback(async () => {
    const { orderId } = confirmModal;
    if (!orderId) return;

    setProcessingOrder(orderId);
    setConfirmModal({ show: false });
    
    try {
      const response = await fetch(`/api/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Recargar pedidos inmediatamente
      await loadOrders();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setProcessingOrder(null);
    }
  }, [confirmModal, loadOrders]);

  React.useEffect(() => {
    loadOrders();
    
    // Polling más frecuente para cocina - cada 10 segundos
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#8DFF50]/30 border-t-[#8DFF50] mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B]">
      {/* Header minimalista optimizado para cocina - Responsive */}
      <header className="bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl flex items-center justify-center">
                <Image 
                  src="/img/logo_viejas-ganas.png" 
                  alt="Viejas Ganas" 
                  width={24} 
                  height={24} 
                  className="object-contain sm:w-7 sm:h-7"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-white">🍳 Cocina</h1>
                <p className="text-[#8DFF50] text-xs sm:text-sm">{currentUser.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Contador de pedidos activos */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-2 sm:px-4 py-2 sm:py-3 border border-white/20">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-[#8DFF50]">{orders.length}</div>
                  <div className="text-xs text-gray-400 hidden sm:block">Pedidos</div>
                </div>
              </div>

              {/* Botón actualizar manual - Responsive */}
              <button
                onClick={loadOrders}
                disabled={loading}
                className="px-2 sm:px-4 py-2 sm:py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium flex items-center gap-1 sm:gap-2 disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{loading ? 'Cargando...' : 'Actualizar'}</span>
              </button>

              {/* Botón volver - Responsive */}
              <Link
                href="/"
                className="px-2 sm:px-4 py-2 sm:py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-medium flex items-center gap-1 sm:gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Volver</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal - Responsive */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64 sm:h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-[#8DFF50]/30 border-t-[#8DFF50] mx-auto mb-4"></div>
              <p className="text-white text-base sm:text-lg">Cargando pedidos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 sm:p-8 text-center max-w-md mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2">Error de conexión</h3>
            <p className="text-red-300 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={loadOrders}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium text-sm sm:text-base"
            >
              🔄 Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3">Todo en orden</h3>
            <p className="text-gray-400 text-base sm:text-lg">No hay pedidos pendientes en cocina</p>
            <p className="text-gray-500 text-sm mt-2">Los nuevos pedidos aparecerán automáticamente</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:bg-white/15 transition-all shadow-lg flex flex-col h-[400px] sm:h-[450px]"
              >
                {/* Header del pedido - Información clave responsive - ALTURA FIJA */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-4xl font-bold text-[#8DFF50]">#{order.number}</div>
                    <div className="bg-orange-500/20 text-orange-400 px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold">
                      B{order.beeperId}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <div className="font-medium">{new Date(order.createdAt).toLocaleTimeString('es-PA', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</div>
                    <div className="text-xs hidden sm:block">{order.cashier.username}</div>
                  </div>
                </div>

                {/* Items del pedido - Vista compacta optimizada responsive - SCROLL DINÁMICO */}
                <div className="flex-1 min-h-0 mb-3 sm:mb-4">
                  <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 space-y-2 sm:space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-white font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                              <span className="bg-[#8DFF50]/20 text-[#8DFF50] px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg text-xs font-bold min-w-[32px] sm:min-w-[40px] text-center flex-shrink-0">
                                {item.qty}x
                              </span>
                              <span className="truncate text-xs sm:text-sm">{item.product?.name || item.customName}</span>
                            </div>
                            {item.notes && (
                              <div className="text-xs text-yellow-400 mt-1 ml-8 sm:ml-12 bg-yellow-500/10 px-1.5 sm:px-2 py-1 rounded-md sm:rounded-lg">
                                📝 {item.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas especiales del pedido - ALTURA FIJA CONDICIONAL */}
                <div className="flex-shrink-0 h-16 sm:h-20 mb-3 sm:mb-4">
                  {order.notes ? (
                    <div className="h-full p-2 sm:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/20">
                      <div className="text-yellow-400 text-xs font-medium mb-1 flex items-center gap-1">
                        ⚠️ Notas especiales:
                      </div>
                      <div className="text-white text-xs sm:text-sm font-medium">{order.notes}</div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500 text-xs">
                      Sin notas especiales
                    </div>
                  )}
                </div>

                {/* Footer con total y botón de acción - ALTURA FIJA EN LA PARTE INFERIOR */}
                <div className="flex-shrink-0 pt-3 sm:pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="text-white font-bold text-lg sm:text-xl">{fmt(order.total)}</div>
                    <div className="text-xs text-gray-400 text-right hidden sm:block">
                      <div>Total del pedido</div>
                    </div>
                  </div>
                  
                  {/* Botón principal de acción - SIEMPRE EN LA MISMA POSICIÓN */}
                  <button
                    onClick={() => handleMarkReady(order.id, order.number)}
                    disabled={processingOrder === order.id}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] rounded-lg sm:rounded-xl hover:from-[#7DE040] hover:to-[#6DD030] transition-all font-bold text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {processingOrder === order.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-[#1D263B]/30 border-t-[#1D263B]"></div>
                        <span className="text-sm sm:text-base">Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm sm:text-base">Marcar Listo</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación rápida */}
      <QuickConfirmModal
        show={confirmModal.show}
        orderNumber={confirmModal.orderNumber || 0}
        onConfirm={confirmMarkReady}
        onCancel={() => setConfirmModal({ show: false })}
      />

      {/* Estilos adicionales para optimización y responsividad */}
      <style jsx global>{`
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-white\/20 {
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        
        /* Webkit scrollbar para Chrome/Safari */
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }

        /* Mejoras específicas para pantallas muy pequeñas */
        @media (max-width: 640px) {
          .truncate-mobile {
            max-width: 150px;
          }
          
          /* Asegurar que los botones sean fáciles de tocar en móvil */
          button {
            min-height: 44px;
          }
          
          /* Reducir padding en pantallas pequeñas pero mantener usabilidad */
          .mobile-compact {
            padding: 0.75rem;
          }
        }

        /* Mejoras para tablets */
        @media (min-width: 641px) and (max-width: 1024px) {
          .tablet-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Mejoras para pantallas grandes */
        @media (min-width: 1025px) {
          .desktop-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        /* Asegurar que el texto sea legible en todas las pantallas */
        @media (max-width: 480px) {
          .responsive-text {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
