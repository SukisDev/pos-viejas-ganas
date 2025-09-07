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
      // Simulación temporal para testing final del calendario
      const mockUser: CurrentUser = {
        id: 'mock-admin-id',
        username: 'admin',
        role: 'ADMIN'
      };
      setCurrentUser(mockUser);
      setLoading(false);
      return;
    } catch (err) {
      console.error('Error fetching current user:', err);
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
