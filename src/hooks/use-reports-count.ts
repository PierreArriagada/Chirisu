/**
 * Hook para obtener contadores de reportes por tipo de contenido
 * Actualiza automáticamente cada 30 segundos
 */

import { useEffect, useState } from 'react';

export interface ReportsCounts {
  comments: number;
  reviews: number;
  anime: number;
  manga: number;
  novel: number;
  donghua: number;
  manhua: number;
  manhwa: number;
  fanComic: number;
  character: number;
  staff: number;
  voiceActor: number;
  studio: number;
  genre: number;
  users: number;
  total: number;
}

export function useReportsCount() {
  const [counts, setCounts] = useState<ReportsCounts>({
    comments: 0,
    reviews: 0,
    anime: 0,
    manga: 0,
    novel: 0,
    donghua: 0,
    manhua: 0,
    manhwa: 0,
    fanComic: 0,
    character: 0,
    staff: 0,
    voiceActor: 0,
    studio: 0,
    genre: 0,
    users: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    try {
      const response = await fetch('/api/reports/counts');
      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts || counts);
      }
    } catch (error) {
      console.error('Error al cargar contadores de reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { counts, loading, refresh: fetchCounts };
}
