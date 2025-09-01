'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'ADMIN' | 'CASHIER' | 'CHEF';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Si ya hay sesión válida, redirige a /cashier (ADMIN y CASHIER pasan; CHEF será a /kitchen)
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!abort && res.ok) {
          const me = (await res.json()) as { role: Role };
          if (me.role === 'CHEF') router.replace('/kitchen');
          else if (me.role === 'ADMIN' || me.role === 'CASHIER') router.replace('/cashier');
        }
      } catch {
        /* ignorar */
      }
    })();
    return () => {
      abort = true;
    };
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Usamos el rol del response para decidir a dónde ir
        const data = (await res.json()) as { role: Role };
        if (data.role === 'CHEF') {
          router.replace('/kitchen');
        } else if (data.role === 'ADMIN' || data.role === 'CASHIER') {
          router.replace('/cashier');
        } else {
          // fallback seguro
          router.replace('/login');
        }
        return;
      }

      // Manejo de error del backend
      const dataErr: unknown = await res.json().catch(() => ({}));
      const message = (dataErr as { error?: string }).error ?? 'Credenciales inválidas';
      setError(message);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100svh] grid place-items-center bg-[#1D263B] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl p-6 shadow-xl bg-white/5 backdrop-blur text-white"
      >
        <h1 className="text-2xl font-semibold text-[#8DFF50]">Ingresar</h1>

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm">Usuario</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-[#8DFF50]"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white outline-none focus:border-[#8DFF50]"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#8DFF50] px-3 py-2 font-semibold text-[#1D263B] disabled:opacity-60"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
