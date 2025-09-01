'use client';

import React from 'react';

/* ========= Tipos ========= */
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
  price: number; // unitario
  qty: number;
  productId?: string;
  category?: string;
};

/* ========= Utiles ========= */
const fmt = (n: number) => `$${n.toFixed(2)}`;

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

const ORDER_BEBIDAS = [
  'Bebidas - Cervezas',
  'Bebidas - Tragos',
  'Bebidas - Sodas',
  'Bebidas - Isotónicos',
  'Bebidas - Agua',
  'Bebidas - Jugos y Té',
];

const ICON: Record<string, string> = {
  Quesadillas: '🌮',
  Pollo: '🍗',
  Nachos: '🧀',
  'Hamburguesas y Sandwiches': '🍔',
  'Special Fries': '🍟',
  'Sunday Menu': '🌭',
  Acompañamientos: '🥗',
  'Add Ons': '➕',
  'Bebidas - Cervezas': '🍺',
  'Bebidas - Tragos': '🍹',
  'Bebidas - Sodas': '🥤',
  'Bebidas - Isotónicos': '🏃‍♂️',
  'Bebidas - Agua': '💧',
  'Bebidas - Jugos y Té': '🧃',
  'Ítem abierto': '✏️',
};

function sortByOrder(name: string, order: string[]) {
  const i = order.indexOf(name);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/* ========= Bottom Sheet para Ítem Abierto ========= */
function OpenItemSheet(props: {
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* overlay */}
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      {/* panel */}
      <div className="relative w-full md:max-w-lg bg-white shadow-2xl rounded-t-2xl md:rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
            Agregar ítem abierto
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
          <input
            placeholder="Nombre del ítem"
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] md:col-span-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Precio"
            inputMode="decimal"
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>

        <div className="mt-3 flex gap-2 justify-end">
          <button
            className="rounded-xl border border-gray-300 px-4 py-2 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="rounded-xl border px-4 py-2 font-semibold"
            style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)', color: '#0a0a0a' }}
            onClick={() => {
              const n = name.trim();
              const v = Number.parseFloat(price.replace(',', '.'));
              if (!n || !Number.isFinite(v) || v <= 0) return;
              onAdd(n, Math.round(v * 100) / 100);
              onClose();
            }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= Página ========= */
export default function CashierPage() {
  // Datos
  const [data, setData] = React.useState<MenuResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // Navegación
  type Step = 'root' | 'group' | 'category';
  const [step, setStep] = React.useState<Step>('root');
  const [group, setGroup] = React.useState<'comida' | 'bebidas' | null>(null);
  const [category, setCategory] = React.useState<string | null>(null);

  // Caja
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);

  // Beepers
  const [beepers, setBeepers] = React.useState<number[]>([]);
  const [beeperId, setBeeperId] = React.useState<number | ''>('');
  const [bErr, setBErr] = React.useState<string | null>(null);

  // Ítem abierto sheet
  const [sheetOpen, setSheetOpen] = React.useState(false);

  // Feedback al agregar
  const [blink, setBlink] = React.useState<string | null>(null);

  /* === Efectos === */
  React.useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/menu', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: MenuResponse = await res.json();
        setData(json);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Error cargando menú');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/beepers?available=true', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: { available: number[] } = await r.json();
        setBeepers(j.available);
      } catch (e) {
        setBErr(e instanceof Error ? e.message : 'Error cargando beepers');
      }
    })();
  }, []);

  /* === Agrupación de la caja === */
  const groupedCart = React.useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const it of cart) {
      const cat = it.category ?? 'Sin categoría';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(it);
    }
    return Array.from(map.entries()).map(([cat, items]) => ({
      cat,
      items,
      sub: items.reduce((a, i) => a + i.price * i.qty, 0),
    }));
  }, [cart]);

  /* === Acciones de caja === */
  const addProduct = (p: MenuItem) => {
    setCart((curr) => {
      const idx = curr.findIndex((it) => it.productId === p.id && it.price === p.price);
      if (idx >= 0) {
        const cp = [...curr];
        cp[idx] = { ...cp[idx], qty: cp[idx].qty + 1 };
        return cp;
      }
      return [
        ...curr,
        { key: `p:${p.id}:${Date.now()}`, name: p.name, price: p.price, qty: 1, productId: p.id, category: p.category },
      ];
    });
    setBlink(p.id);
    navigator.vibrate?.(18);
    setTimeout(() => setBlink(null), 350);
  };

  const addOpenItem = (name: string, value: number) => {
    setCart((c) => [
      ...c,
      { key: `o:${Date.now()}`, name, price: value, qty: 1, category: 'Ítem abierto' },
    ]);
  };

  const inc = (k: string) => setCart((c) => c.map((it) => (it.key === k ? { ...it, qty: it.qty + 1 } : it)));
  const dec = (k: string) => setCart((c) => c.map((it) => (it.key === k ? { ...it, qty: Math.max(1, it.qty - 1) } : it)));
  const rem = (k: string) => setCart((c) => c.filter((it) => it.key !== k));
  const clear = () => setCart([]);

  /* === Returns tempranos === */
  if (loading) {
    return (
      <div className="p-4 grid gap-4 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px] overflow-x-hidden">
        <div className="space-y-3">
          <div className="h-8 w-40 rounded-xl bg-gray-100 animate-pulse" />
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 h-[60vh]" />
      </div>
    );
  }

  if (err || !data) {
    return <div className="p-4 text-red-600">Error: {err ?? 'sin datos'}</div>;
  }

  /* === Derivados (no hooks) === */
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

  /* === UI === */
  return (
    <div className="p-4 grid gap-4 md:grid-cols-[1fr_380px] lg:grid-cols-[1fr_420px] overflow-x-hidden">
      {/* IZQUIERDA */}
      <div className="grid gap-5">
        <div className="flex items-center justify-between rounded-xl bg-white border border-gray-200 px-4 py-3">
          <div className="font-semibold" style={{ color: 'var(--ink)' }}>{crumbs}</div>
          {step !== 'root' && (
            <button
              onClick={goBack}
              className="rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              ← Atrás
            </button>
          )}
        </div>

        {/* Paso 1 */}
        {step === 'root' && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <button
              onClick={() => { setGroup('comida'); setStep('group'); }}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-lg hover:border-[var(--brand)] hover:ring-2 hover:ring-[var(--brand)] transition"
            >
              <div className="text-2xl font-extrabold">Comida</div>
              <div className="text-gray-600 mt-1">Quesadillas, Pollo, Hamburguesas…</div>
              <div
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5"
                style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)' }}
              >
                Explorar
              </div>
            </button>

            <button
              onClick={() => { setGroup('bebidas'); setStep('group'); }}
              className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm hover:shadow-lg hover:border-[var(--brand)] hover:ring-2 hover:ring-[var(--brand)] transition"
            >
              <div className="text-2xl font-extrabold">Bebidas</div>
              <div className="text-gray-600 mt-1">Cervezas, Sodas, Agua, Tragos…</div>
              <div
                className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-1.5"
                style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)' }}
              >
                Explorar
              </div>
            </button>
          </div>
        )}

        {/* Paso 2 */}
        {step === 'group' && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeCats.map((c) => (
              <button
                key={c.name}
                onClick={() => { setCategory(c.name); setStep('category'); }}
                className="px-4 py-5 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[var(--brand)] hover:ring-2 hover:ring-[var(--brand)] transition text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ICON[c.name] ?? '🍽️'}</span>
                  <div className="font-semibold">{c.name}</div>
                </div>
                <div className="text-gray-600 text-sm mt-1">{c.items.length} ítems</div>
              </button>
            ))}
          </div>
        )}

        {/* Paso 3 */}
        {step === 'category' && (
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {currentItems.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className={`text-left rounded-2xl border p-4 min-h-28 bg-white shadow-sm transition hover:shadow-md hover:border-[var(--brand)]
                            ${blink === p.id ? 'ring-2 ring-[var(--brand)]' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-full grid place-items-center text-lg bg-white shadow-sm border-2"
                    style={{ borderColor: 'var(--brand)' }}
                  >
                    {ICON[p.category] ?? '🍽️'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate text-base md:text-lg">{p.name}</div>
                    <div className="mt-0.5 text-gray-800 font-semibold">{fmt(p.price)}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <span
                    className="inline-flex items-center justify-center rounded-lg border px-3 py-1 text-sm"
                    style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)', color: '#0a0a0a' }}
                  >
                    Agregar
                  </span>
                </div>
              </button>
            ))}

            {currentItems.length === 0 && (
              <div className="text-gray-600 text-sm col-span-full p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                No hay productos en <span className="font-medium">{category}</span>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* DERECHA: Caja */}
      <aside className="md:sticky md:top-0 md:h-[calc(100dvh-2rem)] md:self-start overflow-x-hidden">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 grid gap-4 h-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Caja</h2>
            <div
              className="rounded-xl px-3 py-1.5 font-semibold border"
              style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)', color: '#0a0a0a' }}
            >
              {fmt(subtotal)}
            </div>
          </div>

          {/* Beeper */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Beeper a entregar</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              value={beeperId === '' ? '' : String(beeperId)}
              onChange={(e) => setBeeperId(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <option value="">(sin seleccionar)</option>
              {beepers.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            {bErr && <div className="text-xs text-red-600 mt-1">{bErr}</div>}
          </div>

          {/* Botón que abre el sheet (nada inline que mueva layout) */}
          <button
            onClick={() => setSheetOpen(true)}
            className="w-full rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 text-left"
          >
            + Ítem abierto (nombre + precio)
          </button>

          {/* Lista agrupada */}
          <div className="grid gap-3 overflow-auto pr-1" style={{ maxHeight: '45vh' }}>
            {groupedCart.length === 0 ? (
              <div className="text-gray-600 text-sm">Aún no hay productos. Toca “Agregar”.</div>
            ) : (
              groupedCart.map(({ cat, items, sub }) => (
                <div key={cat} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{ICON[cat] ?? '🍽️'}</span> {cat}
                    </div>
                    <div className="text-gray-600 text-sm">{fmt(sub)}</div>
                  </div>
                  <div className="mt-2 space-y-2">
                    {items.map((it) => (
                      <div key={it.key} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
                        <div className="min-w-0">
                          <div className="truncate">{it.name}</div>
                          <div className="text-xs text-gray-500">{fmt(it.price)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => dec(it.key)} aria-label="Restar">–</button>
                          <div className="min-w-6 text-center">{it.qty}</div>
                          <button className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => inc(it.key)} aria-label="Sumar">+</button>
                        </div>
                        <div className="text-right w-16">{fmt(it.price * it.qty)}</div>
                        <button className="px-2 py-1 rounded-lg border border-gray-300 hover:bg-gray-50" onClick={() => rem(it.key)} aria-label="Quitar">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totales y acciones */}
          <div className="mt-auto border-t border-gray-200 pt-3 grid gap-3">
            <div className="flex items-center justify-between">
              <div className="text-gray-600">Total</div>
              <div className="text-xl font-semibold">{fmt(subtotal)}</div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl border px-4 py-3 font-semibold disabled:opacity-50"
                style={{ borderColor: 'var(--brand)', background: 'rgba(141,255,80,.15)', color: '#0a0a0a' }}
                disabled={cart.length === 0 || beeperId === ''}
                onClick={() => alert('Continuará: creación de pedido y envío a cocina.')}
              >
                Cobrar (próximo paso)
              </button>
              <button className="rounded-xl border border-gray-300 hover:bg-gray-50 px-3" onClick={clear} disabled={cart.length === 0}>
                Vaciar
              </button>
            </div>
            {beeperId === '' && (
              <div className="text-xs text-gray-600">
                Selecciona un <b>beeper</b> para continuar.
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sheet de Ítem abierto */}
      <OpenItemSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={addOpenItem}
      />
    </div>
  );
}
