/**
 * @fileoverview TopMediaSection - Sección de rankings con filtros de periodo.
 * 
 * Componente que muestra rankings de medios (anime, manga, etc.) con la capacidad
 * de filtrar por diferentes periodos de tiempo: semanal, mensual y desde siempre.
 * Incluye botones flotantes para cambiar entre los diferentes periodos.
 */

'use client';

import { useState, useEffect } from 'react';
import { MediaType, TitleInfo } from '@/lib/types';
import TopMediaList from './top-media-list';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Trophy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'weekly' | 'monthly' | 'all_time';

interface TopMediaSectionProps {
  mediaType: MediaType;
  initialData?: {
    weekly?: TitleInfo[];
    monthly?: TitleInfo[];
    all_time?: TitleInfo[];
  };
}

const PERIOD_CONFIG = {
  weekly: {
    label: 'Top Semanal',
    icon: Calendar,
    description: 'Los más populares esta semana'
  },
  monthly: {
    label: 'Top Mensual',
    icon: TrendingUp,
    description: 'Los más populares este mes'
  },
  all_time: {
    label: 'Top Desde Siempre',
    icon: Trophy,
    description: 'Los más populares de todos los tiempos'
  }
} as const;

export default function TopMediaSection({ mediaType, initialData }: TopMediaSectionProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<Record<Period, TitleInfo[]>>({
    weekly: initialData?.weekly || [],
    monthly: initialData?.monthly || [],
    all_time: initialData?.all_time || []
  });
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // Mapear MediaType a tipo de API
  const getApiType = (type: MediaType): string => {
    const typeMap: Record<MediaType, string> = {
      'Anime': 'anime',
      'Manga': 'manga',
      'Novela': 'novel',
      'Donghua': 'donghua',
      'Manhua': 'manhua',
      'Manhwa': 'manhwa',
      'Fan Comic': 'fan_comic',
    };
    return typeMap[type] || 'anime';
  };

  // Cargar datos para un periodo específico
  const loadPeriodData = async (period: Period) => {
    // Si ya tenemos datos para este periodo, no recargar
    if (data[period].length > 0) return;

    setLoading(true);
    try {
      const apiType = getApiType(mediaType);
      const response = await fetch(`/api/rankings?type=${apiType}&period=${period}&limit=20`);
      const result = await response.json();
      
      if (result.rankings && result.rankings.length > 0) {
        const items: TitleInfo[] = result.rankings.map((item: any) => ({
          id: item.id.toString(),
          slug: item.slug || item.id.toString(),
          title: item.title,
          type: mediaType,
          description: '',
          imageUrl: item.coverImage || 'https://placehold.co/400x600?text=No+Image',
          imageHint: item.title,
          rating: item.averageScore || item.score || 0,
          ranking: item.ranking,
          commentsCount: item.commentsCount || 0,
          listsCount: item.listsCount || 0,
        }));
        
        setData(prev => ({
          ...prev,
          [period]: items
        }));
      }
    } catch (error) {
      console.error(`Error al cargar datos del periodo ${period}:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar periodo seleccionado
  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    setVisibleCount(6); // Reset visible count
    loadPeriodData(period);
  };

  const currentData = data[selectedPeriod];
  const currentConfig = PERIOD_CONFIG[selectedPeriod];
  const Icon = currentConfig.icon;

  return (
    <section>
      {/* Header con título e icono */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold font-headline">{currentConfig.label}</h2>
            <p className="text-sm text-muted-foreground">{currentConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Botones flotantes de filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(PERIOD_CONFIG) as Period[]).map((period) => {
          const config = PERIOD_CONFIG[period];
          const PeriodIcon = config.icon;
          const isSelected = selectedPeriod === period;
          
          return (
            <Button
              key={period}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange(period)}
              className={cn(
                "transition-all duration-200",
                isSelected && "shadow-md"
              )}
            >
              <PeriodIcon className="w-4 h-4 mr-2" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : currentData.length > 0 ? (
        <>
          <TopMediaList items={currentData.slice(0, visibleCount)} />
          
          {/* Botón "Ver más" */}
          {visibleCount < currentData.length && visibleCount < 12 && (
            <div className="flex justify-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setVisibleCount(prev => prev + 6)}
                className="w-12 h-12 rounded-full p-0 text-xl font-semibold"
              >
                +
              </Button>
            </div>
          )}
          
          {/* Botón "Ver ranking completo" */}
          {visibleCount >= 12 && currentData.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button variant="default">
                Ver el ranking completo
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="p-8 bg-muted rounded-lg text-center text-muted-foreground">
          No hay rankings disponibles para este periodo
        </div>
      )}
    </section>
  );
}
