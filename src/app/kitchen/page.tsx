'use client';

import React from 'react';
import LogoutButton from '../../components/LogoutButton';

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

export default function KitchenPage() {
  const [orders, setOrders] = React.useState<KitchenOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = React.useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders/kitchen', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: KitchenOrder[] = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando pedidos');
    } finally {
      setLoading(false);
    }
  };

  const markReady = async (orderId: string) => {
    setProcessingOrder(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // Recargar pedidos
      await loadOrders();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setProcessingOrder(null);
    }
  };

  React.useEffect(() => {
    loadOrders();
    
    // Recargar cada 30 segundos
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-[100svh] bg-[#1D263B] text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">🍳 Cocina</h1>
            <LogoutButton />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/10 p-6 animate-pulse h-48" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[100svh] bg-[#1D263B] text-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">🍳 Cocina</h1>
            <LogoutButton />
          </div>
          <div className="rounded-2xl bg-red-500/20 border border-red-500/50 p-6 text-center">
            <div className="text-red-400 font-semibold">Error: {error}</div>
            <button 
              onClick={loadOrders}
              className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#1D263B] text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">🍳 Cocina</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={loadOrders}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              🔄 Actualizar
            </button>
            <LogoutButton />
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😴</div>
            <div className="text-xl text-white/80">No hay pedidos en cocina</div>
            <div className="text-white/60 mt-2">Los nuevos pedidos aparecerán aquí automáticamente</div>
          </div>
        ) : (
          <>
            <div className="text-white/80 mb-4">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} en cocina
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold text-[#8DFF50]">#{order.number}</div>
                      <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-lg text-sm font-semibold">
                        Beeper {order.beeperId}
                      </div>
                    </div>
                    <div className="text-right text-sm text-white/60">
                      <div>Por: {order.cashier.name || order.cashier.username}</div>
                      <div>{new Date(order.createdAt).toLocaleTimeString('es-PA', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">
                            {item.qty}x {item.product?.name || item.customName}
                          </div>
                          {item.notes && (
                            <div className="text-sm text-white/60">📝 {item.notes}</div>
                          )}
                        </div>
                        <div className="text-white/80 font-semibold ml-2">
                          {fmt(item.lineTotal)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-sm text-white/60 mb-1">Notas del pedido:</div>
                      <div className="text-white">{order.notes}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <div className="font-bold text-lg">Total: {fmt(order.total)}</div>
                    <button
                      onClick={() => markReady(order.id)}
                      disabled={processingOrder === order.id}
                      className="px-6 py-2 rounded-lg font-semibold bg-[#8DFF50] text-[#1D263B] hover:bg-[#7DE843] disabled:opacity-50 transition"
                    >
                      {processingOrder === order.id ? '⏳ Procesando...' : '✅ Marcar Listo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
