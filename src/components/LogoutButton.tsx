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
      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 text-red-300 hover:from-red-500/30 hover:to-red-600/30 hover:border-red-400/50 hover:text-red-200 disabled:opacity-60 transition-all duration-300 font-bold text-base"
      aria-label="Cerrar sesión"
      title="Cerrar sesión"
    >
      {loading ? (
        <>
          <div className="w-5 h-5 border-2 border-red-300/30 border-t-red-300 rounded-full animate-spin"></div>
          Saliendo...
        </>
      ) : (
        <>
          <span className="text-base">🚪</span>
          Salir
        </>
      )}
    </button>
  );
}
