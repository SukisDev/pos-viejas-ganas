'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

/* ========= T          <div>
            <label className="block text-sm font-semibold text-white mb-2">Precio ($)</label>
            <input
              type="text"
              placeholder="15.99"
              className="w-full px-4 py-3 border border-slate-600/50 bg-slate-700/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] transition-colors placeholder-slate-400"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>izados ========= */
type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type MenuResponse = {
  categories: Array<{
    name: string;
    items: MenuItem[];
  }>;
};

type CartItem = {
  key: string;
  name: string;
  price: number;
  qty: number;
  productId?: string;
  category?: string;
  notes?: string; // Para comentarios especiales del cliente
};

type ReadyOrder = {
  id: string;
  number: number;
  beeperId: number;
  total: number;
  items: Array<{
    qty: number;
    product: { name: string } | null;
    customName: string | null;
  }>;
};

/* ========= Utilidades Ultra Rápidas ========= */
const fmt = (n: number | string) => `$${Number(n).toFixed(2)}`;

// Orden de categorías principales ordenadas por velocidad de acceso
const ORDER_PRINCIPALES = [
  'Hamburguesas y Sandwiches',
  'Quesadillas',
  'Pollo',
  'Nachos',
  'Special Fries',
  'Sunday Menu',
  'Acompañamientos',
  'Add Ons',
];

// Orden de bebidas optimizado
const ORDER_BEBIDAS = [
  'Bebidas - Cervezas',
  'Bebidas - Tragos',
  'Bebidas - Sodas',
  'Bebidas - Isotónicos',
  'Bebidas - Agua',
  'Bebidas - Jugos y Té',
];

// Iconos ultra optimizados para velocidad
const ICON: Record<string, string> = {
  'Quesadillas': '🌮',
  'Pollo': '🍗',
  'Nachos': '🧀',
  'Hamburguesas y Sandwiches': '🍔',
  'Special Fries': '🍟',
  'Sunday Menu': '🌭',
  'Acompañamientos': '🥗',
  'Add Ons': '➕',
  'Bebidas - Cervezas': '🍺',
  'Bebidas - Tragos': '🍹',
  'Bebidas - Sodas': '🥤',
  'Bebidas - Isotónicos': '🏃‍♂️',
  'Bebidas - Agua': '💧',
  'Bebidas - Jugos y Té': '🧃',
  'Ítem abierto': '✏️',
};

// Función de ordenamiento ultra rápida
const sortByOrder = (name: string, order: string[]) => {
  const i = order.indexOf(name);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

/* ========= Modal Ítem Abierto Optimizado ========= */
function OpenItemModal(props: {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, price: number) => void;
}) {
  const { open, onClose, onAdd } = props;
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setName('');
      setPrice('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#2A3441] rounded-3xl p-8 shadow-2xl border border-slate-600/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">✏️ Ítem Personalizado</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-600/30 hover:bg-slate-600/50 flex items-center justify-center transition-colors text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Nombre del producto</label>
            <input
              type="text"
              placeholder="Ej: Pizza especial, Combo personalizado..."
              className="w-full px-4 py-3 border border-slate-600/50 bg-slate-700/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] transition-colors placeholder-slate-400"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Precio</label>
            <input
              type="text"
              placeholder="15.99"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] transition-colors"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-slate-600/50 text-slate-300 rounded-xl hover:bg-slate-600/30 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (name.trim() && price.trim()) {
                onAdd(name.trim(), parseFloat(price));
                onClose();
              }
            }}
            disabled={!name.trim() || !price.trim()}
            className="flex-1 px-6 py-3 bg-[var(--brand)] text-[var(--ink)] rounded-xl hover:bg-[var(--brand)]/90 transition-all font-bold shadow-lg disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Página Principal Ultra Moderna ========= */
export default function CashierPage() {
  const { currentUser } = useAuth();

  // Estados principales ultra optimizados
  const [data, setData] = React.useState<MenuResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [cart, setCart] = React.useState<CartItem[]>([]);

  // Estados de beepers ultra optimizados
  const [beepers, setBeepers] = React.useState<number[]>([]);
  const [beeperId, setBeeperId] = React.useState<string>('');
  const [bErr] = React.useState<string | null>(null);
  const [showBeeperModal, setShowBeeperModal] = React.useState(false);
  const [showReadyOrdersModal, setShowReadyOrdersModal] = React.useState(false);

  // Navegación ultra rápida
  type Step = 'root' | 'group' | 'category';
  const [step, setStep] = React.useState<Step>('root');
  const [group, setGroup] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<string | null>(null);

  // Estados de pedidos listos con polling ultra rápido
  const [readyOrders, setReadyOrders] = React.useState<ReadyOrder[]>([]);
  const [deliveringOrder, setDeliveringOrder] = React.useState<string | null>(null);

  // Estados de orden
  const [isCreatingOrder, setIsCreatingOrder] = React.useState(false);
  const [orderSuccess, setOrderSuccess] = React.useState<{ number: number; beeperId: number } | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Estados para modal de comentarios especiales
  const [showNotesModal, setShowNotesModal] = React.useState(false);
  const [editingNotesItem, setEditingNotesItem] = React.useState<CartItem | null>(null);
  const [notesText, setNotesText] = React.useState('');

  // Carga inicial ultra rápida
  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [menuRes, beepersRes] = await Promise.all([
          fetch('/api/menu', { cache: 'no-store' }),
          fetch('/api/beepers', { cache: 'no-store' })
        ]);

        if (!menuRes.ok) throw new Error(`Menu: ${menuRes.status}`);
        
        const menuData: MenuResponse = await menuRes.json();
        setData(menuData);

        if (beepersRes.ok) {
          const beepersData: Array<{ id: number; status: string }> = await beepersRes.json();
          setBeepers(beepersData.map(b => b.id));
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        setErr(error instanceof Error ? error.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Carga de pedidos listos con polling ultra rápido
  const loadReadyOrders = React.useCallback(async () => {
    try {
      const response = await fetch('/api/orders/ready', { cache: 'no-store' });
      if (response.ok) {
        const orders: ReadyOrder[] = await response.json();
        setReadyOrders(orders);
      }
    } catch (error) {
      console.error('Error cargando pedidos listos:', error);
    }
  }, []);

  React.useEffect(() => {
    loadReadyOrders();
    // Optimización: Polling ultra-rápido para máxima velocidad empresarial
    const interval = setInterval(loadReadyOrders, 3000); // 3 segundos para sistema súper rápido
    return () => clearInterval(interval);
  }, [loadReadyOrders]);

  // Función para refrescar datos manualmente
  const refreshData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, beepersRes] = await Promise.all([
        fetch('/api/menu', { cache: 'no-store' }),
        fetch('/api/beepers', { cache: 'no-store' })
      ]);

      if (!menuRes.ok) throw new Error(`Menu: ${menuRes.status}`);
      
      const menuData: MenuResponse = await menuRes.json();
      setData(menuData);

      if (beepersRes.ok) {
        const beepersData: Array<{ id: number; status: string }> = await beepersRes.json();
        setBeepers(beepersData.map(b => b.id));
      }
      
      // También refrescar pedidos listos
      await loadReadyOrders();
    } catch (error) {
      console.error('Error actualizando datos:', error);
      setErr(error instanceof Error ? error.message : 'Error actualizando');
    } finally {
      setLoading(false);
    }
  }, [loadReadyOrders]);

  // Funciones para manejar comentarios especiales
  const openNotesModal = React.useCallback((item: CartItem) => {
    setEditingNotesItem(item);
    setNotesText(item.notes || '');
    setShowNotesModal(true);
  }, []);

  const saveNotes = React.useCallback(() => {
    if (!editingNotesItem) return;
    
    setCart(cart.map(cartItem => 
      cartItem.key === editingNotesItem.key 
        ? { ...cartItem, notes: notesText.trim() || undefined }
        : cartItem
    ));
    
    setShowNotesModal(false);
    setEditingNotesItem(null);
    setNotesText('');
  }, [cart, editingNotesItem, notesText]);

  const cancelNotes = React.useCallback(() => {
    setShowNotesModal(false);
    setEditingNotesItem(null);
    setNotesText('');
  }, []);

  // Funciones del carrito ultra optimizadas
  const addToCart = React.useCallback((item: MenuItem) => {
    const key = `${item.id}-${Date.now()}`;
    setCart(prev => [...prev, {
      key,
      name: item.name,
      price: item.price,
      qty: 1,
      productId: item.id,
      category: item.category,
    }]);
  }, []);

  const addOpenItem = React.useCallback((name: string, price: number) => {
    const key = `open-${Date.now()}`;
    setCart(prev => [...prev, {
      key,
      name,
      price,
      qty: 1,
      category: 'Ítem abierto',
    }]);
  }, []);

  const incrementItem = React.useCallback((key: string) => {
    setCart(prev => prev.map(item => 
      item.key === key ? { ...item, qty: item.qty + 1 } : item
    ));
  }, []);

  const decrementItem = React.useCallback((key: string) => {
    setCart(prev => prev.map(item => 
      item.key === key && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
    ));
  }, []);

  const removeItem = React.useCallback((key: string) => {
    setCart(prev => prev.filter(item => item.key !== key));
  }, []);

  const clearCart = React.useCallback(() => {
    setCart([]);
  }, []);

  // Crear orden con comentarios especiales
  const createOrder = React.useCallback(async () => {
    if (cart.length === 0 || beeperId === '') return;
    
    setIsCreatingOrder(true);
    try {
      // Preparar items para el API incluyendo comentarios especiales
      const items = cart.map(item => ({
        productId: item.productId || undefined,
        customName: item.productId ? undefined : item.name,
        qty: item.qty,
        unitPrice: item.productId ? undefined : item.price,
        notes: item.notes || undefined // Incluir comentarios especiales
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          beeperId: Number(beeperId),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setOrderSuccess({ number: result.number, beeperId: Number(beeperId) });
      setCart([]);
      setBeeperId('');
      
      // Recargar pedidos listos y beepers
      await Promise.all([
        loadReadyOrders(),
        (async () => {
          const beeperResponse = await fetch('/api/beepers', { cache: 'no-store' });
          if (beeperResponse.ok) {
            const beepers: Array<{ id: number; status: string }> = await beeperResponse.json();
            setBeepers(beepers.map(b => b.id));
          }
        })()
      ]);
      
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert(error instanceof Error ? error.message : 'Error creando pedido');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [cart, beeperId, loadReadyOrders]);

  // Cálculo de subtotal ultra rápido
  const subtotal = React.useMemo(() => 
    cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    [cart]
  );

  // Agrupación del carrito ultra optimizada
  const groupedCart = React.useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    
    cart.forEach(item => {
      const category = item.category || 'Sin categoría';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(item);
    });

    return Array.from(groups.entries()).map(([cat, items]) => ({
      cat,
      items,
      sub: items.reduce((sum, item) => sum + (item.price * item.qty), 0)
    }));
  }, [cart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)] mx-auto"></div>
          <div className="text-white font-medium">Cargando Punto de Venta...</div>
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B] flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 max-w-md text-center">
          <div className="text-red-400 text-lg font-semibold">Error: {err ?? 'sin datos'}</div>
        </div>
      </div>
    );
  }

  /* === Derivados ultra optimizados === */
  const catComida = data.categories
    .filter((c) => !c.name.startsWith('Bebidas'))
    .sort((a, b) => sortByOrder(a.name, ORDER_PRINCIPALES) - sortByOrder(b.name, ORDER_PRINCIPALES));

  const catBebidas = data.categories
    .filter((c) => c.name.startsWith('Bebidas'))
    .sort((a, b) => sortByOrder(a.name, ORDER_BEBIDAS) - sortByOrder(b.name, ORDER_BEBIDAS));

  const activeCats = group === 'comida' ? catComida : group === 'bebidas' ? catBebidas : [];

  const currentItems: MenuItem[] = category
    ? (data.categories.find((x) => x.name === category)?.items ?? [])
    : [];

  const goBack = () => {
    if (step === 'category') { setStep('group'); setCategory(null); return; }
    if (step === 'group') { setStep('root'); setGroup(null); return; }
  };

  const crumbs = [
    'Caja',
    ...(group ? [group === 'comida' ? 'Comida' : 'Bebidas'] : []),
    ...(category ? [category] : []),
  ].join(' / ');

  /* === UI Ultra Hermosa === */
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-[#1D263B] via-[#2A3441] to-[#1D263B]"
      style={{
        "--shimmer-1": "0%",
        "--shimmer-2": "100%"
      } as React.CSSProperties}
    >
      {/* Header Principal como en Cocina */}
      <div className="bg-[#2A3441] border-b border-slate-600/30">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Logo y título */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--brand)] rounded-2xl flex items-center justify-center">
                <span className="text-lg sm:text-xl">🏪</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Punto de Venta</h1>
                <p className="text-xs sm:text-sm text-slate-300">
                  {currentUser?.username || 'dev'} • Procesa órdenes y maneja transacciones
                </p>
              </div>
            </div>
            
            {/* Controles derecha */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Indicador de cuenta activa */}
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-700/50 rounded-xl border border-slate-600/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  {currentUser?.role === 'ADMIN' ? '👑 Admin' : currentUser?.role === 'CASHIER' ? '💰 Caja' : '👤 Usuario'}
                </span>
              </div>
              
              {readyOrders.length > 0 && (
                <button
                  onClick={() => setShowReadyOrdersModal(true)}
                  className="relative px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                    <span className="text-base sm:text-lg">🚨</span>
                    <span className="text-xs sm:text-sm font-bold">
                      {readyOrders.length} LISTO{readyOrders.length !== 1 ? 'S' : ''}
                    </span>
                  </span>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                </button>
              )}
              
              <button 
                onClick={refreshData}
                disabled={loading}
                className="px-3 sm:px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 disabled:opacity-50 text-slate-300 rounded-xl font-medium transition-all flex items-center gap-1 sm:gap-2"
              >
                <span className={loading ? "animate-spin" : ""}>🔄</span>
                <span className="hidden sm:inline">{loading ? "..." : "Actualizar"}</span>
              </button>
              
              <Link 
                href="/"
                className="px-3 sm:px-4 py-2 bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 rounded-xl font-medium transition-all flex items-center gap-1 sm:gap-2"
              >
                <span>←</span>
                <span className="hidden sm:inline">Volver</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-6 grid gap-4 sm:gap-6 xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_450px] max-w-8xl mx-auto">
        
        {/* IZQUIERDA - Área Principal */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Header Elegante */}
          <div className="bg-[#2A3441] rounded-3xl shadow-lg border border-slate-600/30 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-white">
                  {crumbs}
                </div>
                {step !== 'root' && (
                  <button
                    onClick={goBack}
                    className="px-4 py-2 bg-slate-600/30 hover:bg-[var(--brand)] hover:text-[var(--ink)] rounded-xl transition-all text-slate-300 font-medium"
                  >
                    ← Volver
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {readyOrders.length > 0 && (
                  <button
                    onClick={() => setShowReadyOrdersModal(true)}
                    className="relative px-4 py-2 bg-[var(--brand)] text-[var(--ink)] rounded-xl font-semibold shadow-lg hover:bg-[var(--brand)]/90 transition-all"
                  >
                    📦 Listos ({readyOrders.length})
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="bg-[#2A3441] rounded-3xl shadow-lg border border-slate-600/30 p-8 min-h-[500px]">
            
            {/* Vista Root - Selección Comida/Bebidas */}
            {step === 'root' && (
              <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                <button
                  onClick={() => { setStep('group'); setGroup('comida'); }}
                  className="group relative bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 hover:border-[var(--brand)]/50 rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4">🍔</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Comida</h3>
                  <p className="text-sm sm:text-base text-slate-300">Quesadillas, Pollo, Hamburguesas...</p>
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--brand)] rounded-xl flex items-center justify-center text-[var(--ink)] font-bold text-base sm:text-lg group-hover:scale-110 transition-transform">
                      →
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { setStep('group'); setGroup('bebidas'); }}
                  className="group relative bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 hover:border-[var(--brand)]/50 rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 transform hover:scale-105"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-2xl sm:text-3xl mb-4">🥤</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Bebidas</h3>
                  <p className="text-sm sm:text-base text-slate-300">Cervezas, Sodas, Agua, Tragos...</p>
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--brand)] rounded-xl flex items-center justify-center text-[var(--ink)] font-bold text-base sm:text-lg group-hover:scale-110 transition-transform">
                      →
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Vista Group - Categorías */}
            {step === 'group' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {activeCats.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => { setStep('category'); setCategory(cat.name); }}
                      className="group bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 hover:border-[var(--brand)]/50 rounded-2xl p-4 sm:p-6 text-left transition-all duration-200 transform hover:scale-105"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--brand)] rounded-xl flex items-center justify-center text-lg sm:text-xl">{ICON[cat.name] || '📦'}</div>
                        <div>
                          <h3 className="font-bold text-white text-base sm:text-lg">{cat.name}</h3>
                          <p className="text-slate-300 text-sm">{cat.items.length} productos</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setSheetOpen(true)}
                  className="w-full bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-[var(--ink)] rounded-2xl p-4 font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  ✏️ Ítem Personalizado
                </button>
              </div>
            )}

            {/* Vista Category - Productos */}
            {step === 'category' && (
              <div className="space-y-6">
                {currentItems.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-slate-400">
                    No hay productos en esta categoría
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {currentItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="group bg-slate-600/20 hover:bg-slate-600/30 border border-slate-500/30 hover:border-[var(--brand)]/50 rounded-2xl p-4 sm:p-6 text-left transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--brand)] rounded-xl flex items-center justify-center text-lg sm:text-xl">{ICON[item.category] || '🍽️'}</div>
                          <div className="text-right">
                            <div className="text-xl sm:text-2xl font-bold text-white">{fmt(item.price)}</div>
                          </div>
                        </div>
                        <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">{item.name}</h3>
                        <div className="w-full bg-[var(--brand)] text-[var(--ink)] rounded-xl py-2 px-4 font-semibold text-center group-hover:bg-[var(--brand)]/90 transition-all">
                          + Agregar
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* DERECHA - Carrito Hermoso */}
        <aside className="space-y-4 sm:space-y-6 xl:order-last">
          <div className="bg-[#2A3441] rounded-3xl shadow-xl border border-slate-600/30 p-4 sm:p-6 lg:p-8 h-full flex flex-col">
            
            {/* Header del Carrito */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                🛒 <span>Carrito</span>
              </h2>
              <div className="bg-[var(--brand)] text-[var(--ink)] rounded-2xl px-4 py-2 font-bold text-lg shadow-lg">
                {fmt(subtotal)}
              </div>
            </div>

            {/* Productos en el Carrito */}
            <div className="flex-1 space-y-4 mb-8 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-4xl mb-4">🛒</div>
                  <div className="text-lg">Aún no hay productos</div>
                  <div className="text-sm">Selecciona productos para agregar</div>
                </div>
              ) : (
                groupedCart.map(({ cat, items, sub }) => (
                  <div key={cat} className="bg-slate-600/20 border border-slate-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-xl">{ICON[cat] ?? '🍽️'}</span> 
                        <span>{cat}</span>
                      </div>
                      <div className="text-slate-300 font-semibold bg-slate-700/50 px-3 py-1 rounded-lg">
                        {fmt(sub)}
                      </div>
                    </div>
                    
                    {items.map((item) => (
                      <div key={item.key} className="bg-slate-700/30 rounded-xl p-4 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-sm text-slate-300">{fmt(item.price)} c/u</div>
                            {item.notes && (
                              <div className="text-sm bg-[var(--brand)]/20 text-[var(--brand)] rounded-lg px-3 py-1 mt-2 border border-[var(--brand)]/30">
                                💬 {item.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-600/30 rounded-lg p-1">
                              <button
                                onClick={() => decrementItem(item.key)}
                                className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 transition-colors flex items-center justify-center border border-slate-600/50 text-slate-300"
                              >
                                −
                              </button>
                              <div className="w-8 text-center font-semibold text-white">{item.qty}</div>
                              <button
                                onClick={() => incrementItem(item.key)}
                                className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-green-500/20 hover:text-green-400 transition-colors flex items-center justify-center border border-slate-600/50 text-slate-300"
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="w-20 text-right font-bold text-white">
                              {fmt(item.price * item.qty)}
                            </div>
                            
                            <button
                              onClick={() => removeItem(item.key)}
                              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => openNotesModal(item)}
                          className="w-full text-sm bg-[var(--brand)]/10 hover:bg-[var(--brand)]/20 text-[var(--brand)] rounded-lg p-2 transition-colors font-medium border border-[var(--brand)]/30"
                        >
                          {item.notes ? '✏️ Editar comentario' : '💬 Agregar comentario especial'}
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Selector de Beeper */}
            <div className="space-y-4 border-t border-slate-600/30 pt-6">
              <div>
                <label className="block text-sm font-bold text-white mb-3">🔔 Beeper a entregar</label>
                <button
                  onClick={() => setShowBeeperModal(true)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-600/50 bg-slate-700/30 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] transition-colors text-left text-white"
                >
                  {beeperId ? `Beeper #${beeperId}` : '(seleccionar beeper)'}
                </button>
                {bErr && (
                  <div className="text-sm text-red-400 bg-red-500/20 p-2 rounded-lg mt-2 border border-red-500/30">{bErr}</div>
                )}
              </div>

              {/* Total y Botones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xl">
                  <span className="font-bold text-white">💰 Total</span>
                  <span className="font-bold text-white text-2xl">{fmt(subtotal)}</span>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={createOrder}
                    disabled={cart.length === 0 || beeperId === '' || isCreatingOrder}
                    className="flex-1 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-[var(--ink)] rounded-2xl py-4 px-6 font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                  >
                    {isCreatingOrder ? '⏳ Creando...' : '🚀 Crear Pedido'}
                  </button>
                  
                  <button
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 rounded-2xl px-4 py-4 transition-colors disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
                
                {beeperId === '' && cart.length > 0 && (
                  <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-lg">
                    ⚠️ <b>Selecciona un beeper</b> para continuar con el pedido
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal de Ítem Abierto */}
      <OpenItemModal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={addOpenItem}
      />
      
      {/* Modal de Éxito */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOrderSuccess(null)} />
          <div className="relative bg-[#2A3441] border border-slate-600/30 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="text-6xl mb-6">🎉</div>
            <div className="text-2xl font-bold text-white mb-2">¡Pedido Creado!</div>
            <div className="text-slate-300 mb-6">
              <div className="text-lg">Pedido #{orderSuccess.number}</div>
              <div>Beeper #{orderSuccess.beeperId}</div>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-[var(--ink)] rounded-2xl px-8 py-3 font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
            >
              ✨ Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Pedidos Listos - Simplificado y Eficiente */}
      {showReadyOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowReadyOrdersModal(false)} />
          
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-[#2A3441] rounded-3xl shadow-2xl border border-red-500/50 overflow-hidden">
            {/* Header Elegante */}
            <div className="bg-red-600 text-white px-6 sm:px-8 py-4 sm:py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">🔔</span>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold">
                      Pedidos Listos para Entregar
                    </h3>
                    <p className="text-sm sm:text-base text-red-100">
                      {readyOrders.length} pedido{readyOrders.length !== 1 ? 's' : ''} esperando entrega
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReadyOrdersModal(false)}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <span className="text-lg sm:text-xl font-bold">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto max-h-[65vh]">
              {readyOrders.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-400">
                  <div className="text-4xl sm:text-6xl mb-4">😴</div>
                  <p className="text-lg sm:text-xl">Todo tranquilo por ahora...</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-600/20 border border-slate-500/30 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all"
                    >
                      {/* Header del pedido con precio y beeper destacados */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg">
                            #{order.number}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">
                              Pedido #{order.number}
                            </div>
                            {/* BEEPER DESTACADO */}
                            <div className="text-base font-black text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-lg inline-flex items-center gap-1 border border-yellow-400/40">
                              📡 BEEPER #{order.beeperId}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {/* PRECIO MUY DESTACADO */}
                          <div className="text-2xl sm:text-3xl font-black text-green-400 bg-green-400/20 px-4 py-2 rounded-xl border border-green-400/40 shadow-lg">
                            {fmt(order.total)}
                          </div>
                          <div className="text-xs text-green-300 mt-1 font-semibold">TOTAL A COBRAR</div>
                        </div>
                      </div>
                      
                      {/* Lista de productos simple */}
                      <div className="bg-slate-700/30 rounded-xl p-3 sm:p-4 mb-4">
                        <div className="text-sm font-bold text-slate-300 mb-2">
                          🍽️ Productos:
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-slate-300">
                              <span>{item.qty}x {item.product?.name || item.customName}</span>
                              <span className="text-green-400">✓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Botón de entrega elegante */}
                      <button
                        onClick={async () => {
                          setDeliveringOrder(order.id);
                          try {
                            const response = await fetch(`/api/orders/${order.id}/deliver`, {
                              method: 'POST',
                            });
                            if (response.ok) {
                              setReadyOrders(prev => prev.filter(o => o.id !== order.id));
                            }
                          } catch (error) {
                            console.error('Error entregando pedido:', error);
                          } finally {
                            setDeliveringOrder(null);
                          }
                        }}
                        disabled={deliveringOrder === order.id}
                        className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-3 sm:py-4 px-4 font-bold text-base sm:text-lg transition-all hover:shadow-lg disabled:opacity-50"
                      >
                        <span className="flex items-center justify-center gap-2">
                          {deliveringOrder === order.id ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              Entregando...
                            </>
                          ) : (
                            <>
                              <span>✅</span>
                              Marcar como Entregado
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Beepers - Optimizado para Tablets */}
      {showBeeperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBeeperModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#2A3441] rounded-3xl shadow-2xl border border-slate-600/30 overflow-hidden">
            <div className="bg-[var(--brand)] text-[var(--ink)] px-8 py-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">🔔 Seleccionar Beeper</h3>
                <button
                  onClick={() => setShowBeeperModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-4 gap-4">
                {beepers.map((id) => (
                  <button
                    key={id}
                    onClick={() => {
                      setBeeperId(id.toString());
                      setShowBeeperModal(false);
                    }}
                    className={`
                      aspect-square rounded-2xl border-2 transition-all font-bold text-lg hover:scale-105 transform
                      ${beeperId === id.toString() 
                        ? 'bg-[var(--brand)] text-[var(--ink)] border-[var(--brand)] shadow-lg' 
                        : 'bg-slate-600/30 text-white border-slate-500/50 hover:border-[var(--brand)]'
                      }
                    `}
                  >
                    #{id}
                  </button>
                ))}
              </div>
              
              {beepers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <div className="text-4xl mb-2">🔔</div>
                  <p>No hay beepers disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Comentarios Especiales */}
      {showNotesModal && editingNotesItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#2A3441] rounded-2xl border border-slate-600/30 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Comentarios Especiales</h3>
                  <p className="text-sm text-slate-300 mt-1">{editingNotesItem.name}</p>
                </div>
                <button
                  onClick={cancelNotes}
                  className="w-8 h-8 rounded-lg bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 transition-colors flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Input de comentarios */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  💬 Instrucciones para cocina:
                </label>
                <textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Ej: Sin cebolla, extra queso, término medio, sin sal..."
                  className="w-full h-28 sm:h-32 px-3 sm:px-4 py-2 sm:py-3 border border-slate-600/50 bg-slate-700/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-[var(--brand)] transition-colors placeholder-slate-400 resize-none text-sm sm:text-base"
                  maxLength={200}
                />
                <div className="text-right text-xs text-slate-400 mt-2">
                  {notesText.length}/200 caracteres
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={cancelNotes}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 rounded-xl font-medium transition-colors text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveNotes}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-[var(--brand)] hover:bg-[var(--brand)]/90 text-[var(--ink)] rounded-xl font-bold transition-colors text-sm sm:text-base"
                >
                  {editingNotesItem.notes ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
