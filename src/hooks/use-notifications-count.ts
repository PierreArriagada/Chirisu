/**
 * Hook personalizado para obtener el contador de notificaciones no leídas
 * Actualiza automáticamente cada 30 segundos
 */

import { useEffect, useState } from 'react';

export function useNotificationsCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar contador de notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { unreadCount, loading, refresh: fetchCount };
}
