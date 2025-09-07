'use client';

import { useCallback, useEffect, useState } from 'react';

interface CurrentUser {
  id: string;
  username: string;
  role: 'ADMIN' | 'CASHIER' | 'CHEF';
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        // Usuario no autenticado o token inválido - redirigir inmediatamente
        console.log('Usuario no autenticado o sesión inválida, redirigiendo...');
        window.location.href = '/login';
        return;
      }
      const userData: CurrentUser = await response.json();
      setCurrentUser(userData);
    } catch (err) {
      console.error('Error fetching current user:', err);
      // Si hay error de red u otro, también redirigir al login por seguridad
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }, []);

  // Verificación inicial
  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Verificación periódica del estado del usuario (cada 30 segundos)
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchCurrentUser();
    }, 30000); // 30 segundos

    return () => clearInterval(intervalId);
  }, [fetchCurrentUser]);

  // Escuchar cambios en localStorage para verificación forzada de sesión
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'force-session-check') {
        // Forzar verificación inmediata
        fetchCurrentUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchCurrentUser]);

  // Función para forzar verificación de sesión (para usar cuando se desactiva un usuario)
  const broadcastSessionCheck = useCallback(() => {
    localStorage.setItem('force-session-check', Date.now().toString());
  }, []);

  return {
    currentUser,
    loading,
    fetchCurrentUser,
    broadcastSessionCheck
  };
}
