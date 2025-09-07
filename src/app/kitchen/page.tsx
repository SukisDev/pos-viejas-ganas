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
  
  // Estado para modal de comentarios especiales
  const [showCommentsModal, setShowCommentsModal] = React.useState(false);
  const [selectedComment, setSelectedComment] = React.useState<{ text: string; productName: string; orderNumber: number } | null>(null);

  const loadOrders = React.useCallback(async () => {
    setLoading(true); // Mostrar animación de carga
    try {
      const response = await fetch('/api/orders/kitchen', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
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

  // Función para polling automático SIN mostrar loading
  const loadOrdersSilent = React.useCallback(async () => {
    try {
      const response = await fetch('/api/orders/kitchen', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: KitchenOrder[] = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      // En polling silencioso no mostramos errores para no interrumpir
      console.error('Error en polling automático:', err);
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

      // Recargar pedidos inmediatamente sin loading
      await loadOrdersSilent();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setProcessingOrder(null);
    }
  }, [confirmModal, loadOrdersSilent]);

  // Función para mostrar comentarios en modal
  const showComments = React.useCallback((text: string, productName: string, orderNumber: number) => {
    setSelectedComment({ text, productName, orderNumber });
    setShowCommentsModal(true);
  }, []);

  const closeCommentsModal = React.useCallback(() => {
    setShowCommentsModal(false);
    setSelectedComment(null);
  }, []);

  React.useEffect(() => {
    loadOrders(); // Carga inicial CON loading
    
    // Polling automático cada 2 segundos SIN mostrar loading
    const interval = setInterval(() => {
      loadOrdersSilent(); // Actualización silenciosa
    }, 2000);
    return () => clearInterval(interval);
  }, [loadOrders, loadOrdersSilent]);

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
      {/* Header optimizado para tablets y cocina */}
      <header className="bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-8xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] rounded-xl md:rounded-2xl flex items-center justify-center">
                <Image 
                  src="/img/logo_viejas-ganas.png" 
                  alt="Viejas Ganas" 
                  width={24} 
                  height={24} 
                  className="object-contain sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white">🍳 Cocina</h1>
                <p className="text-[#8DFF50] text-xs sm:text-sm md:text-base">{currentUser.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              {/* Contador de pedidos activos */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 border border-white/20">
                <div className="text-center">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#8DFF50]">{orders.length}</div>
                  <div className="text-xs md:text-sm text-gray-400 hidden sm:block">Pedidos</div>
                </div>
              </div>

              {/* Botón actualizar manual - Optimizado para tablets */}
              <button
                onClick={loadOrders}
                disabled={loading}
                className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 bg-white/10 text-white rounded-xl md:rounded-2xl hover:bg-white/20 transition-all font-medium flex items-center gap-1 sm:gap-2 md:gap-3 disabled:opacity-50 text-sm md:text-base ${loading ? 'bg-[var(--brand)]/20 scale-95' : ''}`}
              >
                <svg className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${loading ? 'animate-spin text-[var(--brand)]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className={`hidden sm:inline transition-colors ${loading ? 'text-[var(--brand)]' : ''}`}>{loading ? 'Actualizando...' : 'Actualizar'}</span>
              </button>

              {/* Botón volver - Optimizado para tablets */}
              <Link
                href="/"
                className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 bg-white/10 text-white rounded-xl md:rounded-2xl hover:bg-white/20 transition-all font-medium flex items-center gap-1 sm:gap-2 md:gap-3 text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Volver</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal - Optimizado para tablets */}
      <div className="max-w-8xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
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
          <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 hover:bg-white/15 transition-all shadow-lg flex flex-col min-h-0"
              >
                {/* Header del pedido - Información clave optimizada para tablets */}
                <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#8DFF50]">#{order.number}</div>
                    <div className="bg-orange-500/20 text-orange-400 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold">
                      B{order.beeperId}
                    </div>
                  </div>
                  <div className="text-right text-xs md:text-sm text-gray-400">
                    <div className="font-medium text-sm md:text-base">{new Date(order.createdAt).toLocaleTimeString('es-PA', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}</div>
                    <div className="text-xs md:text-sm hidden sm:block">{order.cashier.username}</div>
                  </div>
                </div>

                {/* Items del pedido - Vista optimizada para tablets */}
                <div className="mb-2 sm:mb-3 md:mb-4">
                  <div className="space-y-1 sm:space-y-2 md:space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="bg-white/5 rounded-lg md:rounded-xl p-2 md:p-3">
                        <div className="flex items-start gap-2 md:gap-3">
                          <span className="bg-[#8DFF50]/20 text-[#8DFF50] px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-lg text-xs md:text-sm font-bold min-w-[28px] md:min-w-[36px] text-center flex-shrink-0">
                            {item.qty}x
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs sm:text-sm md:text-base font-medium leading-tight">
                              {item.product?.name || item.customName}
                            </div>
                            {item.notes && (
                              <button
                                onClick={() => showComments(item.notes || '', item.product?.name || item.customName || '', order.number)}
                                className="text-xs md:text-sm text-yellow-400 mt-0.5 md:mt-1 bg-yellow-500/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-lg leading-tight hover:bg-yellow-500/20 transition-colors cursor-pointer w-full text-left"
                              >
                                📝 {item.notes}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notas especiales del pedido - Optimizado para tablets */}
                {order.notes && (
                  <button
                    onClick={() => showComments(order.notes || '', `Pedido #${order.number}`, order.number)}
                    className="mb-2 sm:mb-3 md:mb-4 p-2 md:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg md:rounded-xl hover:bg-yellow-500/20 transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="text-yellow-400 text-xs md:text-sm font-medium mb-1 md:mb-2 flex items-center gap-1 md:gap-2">
                      ⚠️ Notas especiales:
                    </div>
                    <div className="text-white text-xs md:text-sm font-medium leading-tight">{order.notes}</div>
                  </button>
                )}

                {/* Footer con total y botón de acción - Optimizado para tablets */}
                <div className="mt-auto pt-2 sm:pt-3 md:pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
                    <div className="text-white font-bold text-base sm:text-lg md:text-xl">{fmt(order.total)}</div>
                    <div className="text-xs md:text-sm text-gray-400 hidden sm:block">
                      Total
                    </div>
                  </div>
                  
                  {/* Botón principal de acción */}
                  <button
                    onClick={() => handleMarkReady(order.id, order.number)}
                    disabled={processingOrder === order.id}
                    className="w-full py-2.5 sm:py-3 md:py-4 bg-gradient-to-r from-[#8DFF50] to-[#7DE040] text-[#1D263B] rounded-lg md:rounded-xl hover:from-[#7DE040] hover:to-[#6DD030] transition-all font-bold text-sm sm:text-base md:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {processingOrder === order.id ? (
                      <div className="flex items-center justify-center gap-2 md:gap-3">
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 border-2 border-[#1D263B]/30 border-t-[#1D263B]"></div>
                        <span className="text-xs sm:text-sm md:text-base">Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs sm:text-sm md:text-base">Marcar Listo</span>
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

      {/* Modal de comentarios especiales */}
      {showCommentsModal && selectedComment && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={closeCommentsModal}
        >
          <div 
            className="bg-[#2A3441] rounded-2xl border border-slate-600/30 w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Comentarios Especiales</h3>
                  <p className="text-sm text-slate-300 mt-1">
                    {selectedComment.productName} • Pedido #{selectedComment.orderNumber}
                  </p>
                </div>
                <button
                  onClick={closeCommentsModal}
                  className="w-8 h-8 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Contenido del comentario */}
              <div className="mb-4 sm:mb-6">
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-400 text-lg">📝</span>
                    <span className="text-yellow-400 font-semibold text-sm">Instrucciones para cocina:</span>
                  </div>
                  <p className="text-white text-base leading-relaxed font-medium">
                    {selectedComment.text}
                  </p>
                </div>
              </div>

              {/* Botón */}
              <div className="flex justify-end">
                <button
                  onClick={closeCommentsModal}
                  className="px-6 py-3 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-[var(--ink)] rounded-xl font-bold transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
