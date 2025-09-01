'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LogoutButton from '../components/LogoutButton';

type Role = 'ADMIN' | 'CASHIER' | 'CHEF';

interface Me {
  id: string;
  username: string;
  role: Role;
}

export default function HomePage() {
  const [me, setMe] = useState<Me | null>(null);

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
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  return (
    <main className="min-h-[100svh] flex items-center justify-center bg-[#1D263B] text-white px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white/5 backdrop-blur p-6 shadow-xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Viejas Ganas POS <span className="text-[#8DFF50]">/</span> Bienvenido
          </h1>
          {me && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/70">{me.username}</span>
              <LogoutButton />
            </div>
          )}
        </header>

        {!me ? (
          <section className="space-y-4">
            <p className="text-white/80">Inicia sesión para acceder a tu área de trabajo.</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-[#8DFF50] px-4 py-2 font-semibold text-[#1D263B]"
            >
              Iniciar sesión
            </Link>
          </section>
        ) : (
          <section className="space-y-4">
            <p>
              Hola <span className="font-semibold text-[#8DFF50]">{me.username}</span> — Rol:{' '}
              <span className="font-semibold">{me.role}</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(me.role === 'ADMIN' || me.role === 'CASHIER') && (
                <Link
                  href="/cashier"
                  className="rounded-lg bg-white/10 px-4 py-3 hover:bg-white/15"
                >
                  Ir a Caja
                </Link>
              )}

              {(me.role === 'ADMIN' || me.role === 'CHEF') && (
                <Link
                  href="/kitchen"
                  className="rounded-lg bg-white/10 px-4 py-3 hover:bg-white/15"
                >
                  Ir a Cocina
                </Link>
              )}

              {me.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-white/10 px-4 py-3 hover:bg-white/15"
                >
                  Ir a Admin
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
