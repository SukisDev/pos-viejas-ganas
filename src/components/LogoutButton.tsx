'use client';

import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState<boolean>(false);

  async function doLogout() {
    try {
      setLoading(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={doLogout}
      disabled={loading}
      className="rounded-lg bg-white/10 px-3 py-2 text-white hover:bg-white/15 disabled:opacity-60"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      {loading ? 'Saliendo…' : 'Salir'}
    </button>
  );
}
