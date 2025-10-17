/**
 * ============================================
 * COMPONENTE: HomePageClient
 * ============================================
 * Componente cliente para la página de inicio (/).
 * 
 * Características:
 * - Carga rankings optimizados desde vistas materializadas
 * - Muestra carruseles para cada tipo de media disponible
 * - Usa API /api/rankings (ultra-rápida con vistas materializadas)
 * - Maneja estados de carga y vacío
 * - Muestra "Sin ranking" cuando no hay datos
 * 
 * Performance:
 * - Carga paralela de todos los tipos de media
 * - Datos pre-calculados (< 10ms por request)
 * - Actualización automática cada 5 horas
 * ============================================
 */

'use client';

import { useState, useEffect } from 'react';
import { MediaType, TitleInfo } from '@/lib/types';
import TopRankingCarousel from '@/components/top-ranking-carousel';
import { Loader2 } from 'lucide-react';

// Tipos de media soportados en la aplicación
const mediaTypes: MediaType[] = ['Anime', 'Manga', 'Novela'];

// ============================================
// Mapeo de MediaType a parámetro de API
// ============================================
// La API acepta: 'anime', 'manga', 'novel'
// Otros tipos (manhua, manwha, fan-comic, dougua) se agregarán después
const getApiType = (mediaType: MediaType): string => {
  const typeMap: Record<string, string> = {
    'Anime': 'anime',
    'Manga': 'manga',
    'Novela': 'novel',
    // TODO: Agregar soporte para estos tipos cuando estén listos
    // 'Manhua': 'manga',     // Por ahora usa manga como fallback
    // 'Manwha': 'manga',     // Por ahora usa manga como fallback
    // 'Fan Comic': 'manga',  // Por ahora usa manga como fallback
    // 'Dougua': 'anime',     // Por ahora usa anime como fallback
  };
  return typeMap[mediaType] || 'anime';
};

export default function HomePageClient() {
  const [rankings, setRankings] = useState<Record<string, TitleInfo[]>>({
    'Anime': [],
    'Manga': [],
    'Novela': [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAllRankings = async () => {
      try {
        setLoading(true);
        
        // ============================================
        // Fetch rankings desde API optimizada
        // Usa vistas materializadas (< 10ms por request)
        // ============================================
        const promises = mediaTypes.map(async (type) => {
          try {
            const apiType = getApiType(type);
            
            // Llamar a API de rankings optimizada (period=daily para homepage)
            const response = await fetch(
              `/api/rankings?type=${apiType}&period=daily&limit=10`
            );
          
            if (!response.ok) {
              console.error(`❌ Error loading ${type} rankings:`, response.status, response.statusText);
              return { type, items: [], error: response.statusText };
            }

            const data = await response.json();
            
            console.log(`✅ ${type} rankings loaded:`, data.count, 'items');
            
            // ============================================
            // Mapear respuesta de API a formato TitleInfo
            // ============================================
            const items: TitleInfo[] = (data.rankings || []).map((item: any, index: number) => ({
              id: item.id.toString(),
              slug: item.slug || item.id.toString(),
              title: item.title || 'Sin título',
              imageUrl: item.coverImage || '/placeholder-cover.jpg',
              imageHint: item.title || 'Imagen de portada',
              type: type,
              description: '',
              rating: item.averageScore || 0,
              ranking: item.ranking || (index + 1),
              commentsCount: 0,
              listsCount: 0,
            }));

            return { type, items, error: null };
          } catch (error: any) {
            console.error(`❌ Exception loading ${type}:`, error);
            return { type, items: [], error: error.message };
          }
        });

        const results = await Promise.all(promises);
        
        // ============================================
        // Construir objeto de rankings y errores
        // ============================================
        const newRankings: Record<string, TitleInfo[]> = {};
        const newErrors: Record<string, string> = {};

        results.forEach(({ type, items, error }) => {
          newRankings[type] = items;
          if (error) {
            newErrors[type] = error;
          }
        });

        setRankings(newRankings);
        setErrors(newErrors);

        console.log('📊 Rankings summary:', {
          Anime: newRankings['Anime']?.length || 0,
          Manga: newRankings['Manga']?.length || 0,
          Novela: newRankings['Novela']?.length || 0,
        });

      } catch (error) {
        console.error('❌ Fatal error loading rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllRankings();
  }, []);

  // ============================================
  // ESTADO: Cargando
  // ============================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando rankings...</p>
      </div>
    );
  }

  // ============================================
  // RENDERIZADO: Carruseles de rankings
  // ============================================
  return (
    <div className="space-y-12">
      {mediaTypes.map(type => {
        const items = rankings[type] || [];
        const path = `/${type.toLowerCase().replace(' ', '-')}`;
        const hasError = errors[type];

        // ============================================
        // CASO 1: Hay items - Mostrar carrusel normal
        // ============================================
        if (items.length > 0) {
          return (
            <TopRankingCarousel
              key={type}
              title={`${type} - Top Ranking`}
              items={items}
              viewMoreLink={path}
            />
          );
        }

        // ============================================
        // CASO 2: No hay items - Mostrar "Sin ranking"
        // ============================================
        return (
          <section key={type} className="w-full">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold font-headline">
                {type} - Top Ranking
              </h2>
            </div>
            <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-muted rounded-lg">
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                Sin ranking disponible
              </p>
              {hasError && (
                <p className="text-sm text-muted-foreground">
                  Error: {hasError}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                Aún no hay suficientes datos para mostrar el ranking de {type}
              </p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
