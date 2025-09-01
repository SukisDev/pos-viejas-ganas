'use client';

import LogoutButton from '../../components/LogoutButton';

export default function AdminPage() {
  return (
    <main className="min-h-[100svh] flex items-center justify-center bg-[#1D263B] text-white px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white/5 backdrop-blur p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Panel Admin</h1>
          <LogoutButton />
        </div>
        <p className="text-white/80">Ruta protegida solo para ADMIN.</p>
      </div>
    </main>
  );
}
