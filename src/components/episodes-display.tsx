"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, PlayCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Episode {
  id: number;
  anime_id: number;
  episode_number: number;
  title?: string;
  title_romaji?: string;
  title_japanese?: string;
  synopsis?: string;
  air_date?: string;
  duration?: number;
  thumbnail_url?: string;
  video_url?: string;
  is_filler: boolean;
  is_recap: boolean;
  created_at: string;
  updated_at: string;
}

interface EpisodesDisplayProps {
  animeId: number;
}

export default function EpisodesDisplay({ animeId }: EpisodesDisplayProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

  useEffect(() => {
    async function fetchEpisodes() {
      try {
        setLoading(true);
        const response = await fetch(`/api/anime/${animeId}/episodes`);
        
        if (!response.ok) {
          throw new Error('Error al cargar episodios');
        }

        const result = await response.json();
        
        if (result.success) {
          setEpisodes(result.data);
        } else {
          throw new Error(result.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar episodios');
        console.error('Error fetching episodes:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEpisodes();
  }, [animeId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return format(new Date(dateString), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Episodios
          </CardTitle>
          <CardDescription>Cargando episodios...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Episodios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Episodios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hay episodios registrados aún.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Episodios
        </CardTitle>
        <CardDescription>
          {episodes.length} episodio{episodes.length !== 1 ? 's' : ''} disponible{episodes.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {episodes.map((episode, index) => (
            <div key={episode.id}>
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => setExpandedEpisode(expandedEpisode === episode.id ? null : episode.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Número de episodio */}
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold">
                    {episode.episode_number}
                  </div>

                  {/* Información del episodio */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base line-clamp-1">
                          {episode.title || episode.title_romaji || `Episodio ${episode.episode_number}`}
                        </h4>
                        {episode.title_japanese && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {episode.title_japanese}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {episode.is_filler && (
                          <Badge variant="outline" className="text-xs">
                            Filler
                          </Badge>
                        )}
                        {episode.is_recap && (
                          <Badge variant="secondary" className="text-xs">
                            Recap
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Metadatos */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {episode.air_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(episode.air_date)}</span>
                        </div>
                      )}
                      {episode.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{episode.duration} min</span>
                        </div>
                      )}
                    </div>

                    {/* Sinopsis expandible */}
                    {expandedEpisode === episode.id && episode.synopsis && (
                      <div className="pt-2">
                        <Separator className="mb-2" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {episode.synopsis}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {index < episodes.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
