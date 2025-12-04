"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, PlayCircle, Plus, ImageIcon, ChevronDown, Grid, List, Tv, FolderOpen, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface Episode {
  id: number;
  anime_id?: number;
  season_id?: number;
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
  created_at?: string;
  updated_at?: string;
}

interface Season {
  id: number;
  seasonable_type: string;
  seasonable_id: number;
  season_number: number;
  title?: string;
  title_english?: string;
  synopsis?: string;
  start_date?: string;
  end_date?: string;
  episode_count: number;
  cover_image_url?: string;
  episodes: Episode[];
}

interface EpisodesDisplayProps {
  animeId: number;
  mediaType?: 'anime' | 'donghua';
  canEdit?: boolean;
}

export default function EpisodesDisplay({ animeId, mediaType = 'anime', canEdit = false }: EpisodesDisplayProps) {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [unassignedEpisodes, setUnassignedEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeSeasonId, setActiveSeasonId] = useState<string>('all');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  
  // Verificar si el usuario puede editar (admin o moderador)
  const canManage = user?.isAdmin || user?.isModerator;
  
  // Dialogs
  const [isAddEpisodeOpen, setIsAddEpisodeOpen] = useState(false);
  const [isAddSeasonOpen, setIsAddSeasonOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [newEpisode, setNewEpisode] = useState({
    episode_number: 1,
    title: '',
    thumbnail_url: '',
    season_id: null as number | null
  });
  
  const [newSeason, setNewSeason] = useState({
    season_number: 1,
    title: '',
    cover_image_url: ''
  });

  useEffect(() => {
    fetchData();
  }, [animeId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Intentar cargar temporadas primero
      const seasonsResponse = await fetch(`/api/anime/${animeId}/seasons`);
      
      if (seasonsResponse.ok) {
        const seasonsData = await seasonsResponse.json();
        if (seasonsData.success) {
          setSeasons(seasonsData.data.seasons || []);
          setUnassignedEpisodes(seasonsData.data.unassignedEpisodes || []);
          
          // Actualizar siguiente número de temporada
          if (seasonsData.data.seasons?.length > 0) {
            const maxSeason = Math.max(...seasonsData.data.seasons.map((s: Season) => s.season_number));
            setNewSeason(prev => ({ ...prev, season_number: maxSeason + 1 }));
          }
          
          // Expandir la primera temporada por defecto
          if (seasonsData.data.seasons?.length > 0) {
            setExpandedSeasons(new Set([seasonsData.data.seasons[0].id]));
          }
        }
      }
      
      // Fallback: cargar episodios sin temporadas (compatibilidad)
      if (seasons.length === 0 && unassignedEpisodes.length === 0) {
        const episodesResponse = await fetch(`/api/anime/${animeId}/episodes`);
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          if (episodesData.success) {
            setUnassignedEpisodes(episodesData.data || []);
          }
        }
      }
      
      // Set next episode number
      const allEpisodes = [...seasons.flatMap(s => s.episodes), ...unassignedEpisodes];
      if (allEpisodes.length > 0) {
        const maxEp = Math.max(...allEpisodes.map(e => e.episode_number));
        setNewEpisode(prev => ({ ...prev, episode_number: maxEp + 1 }));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSeason = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/anime/${animeId}/seasons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSeason)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar temporada');
      }

      await fetchData();
      setNewSeason({
        season_number: newSeason.season_number + 1,
        title: '',
        cover_image_url: ''
      });
      setIsAddSeasonOpen(false);
    } catch (err) {
      console.error('Error adding season:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar temporada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEpisode = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/anime/${animeId}/episodes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEpisode)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar episodio');
      }

      await fetchData();
      setNewEpisode({
        episode_number: newEpisode.episode_number + 1,
        title: '',
        thumbnail_url: '',
        season_id: newEpisode.season_id
      });
      setIsAddEpisodeOpen(false);
    } catch (err) {
      console.error('Error adding episode:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar episodio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeason = async (seasonId: number) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/anime/${animeId}/seasons?seasonId=${seasonId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar temporada');
      }

      await fetchData();
    } catch (err) {
      console.error('Error deleting season:', err);
      alert(err instanceof Error ? err.message : 'Error al eliminar temporada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSeasonExpanded = (seasonId: number) => {
    setExpandedSeasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seasonId)) {
        newSet.delete(seasonId);
      } else {
        newSet.add(seasonId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "d MMM yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const totalEpisodes = seasons.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) + unassignedEpisodes.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchData} className="mt-2">
          Reintentar
        </Button>
      </div>
    );
  }

  const renderEpisodeCard = (episode: Episode) => (
    <div 
      key={episode.id} 
      className="group relative rounded-lg overflow-hidden border bg-card hover:border-primary transition-colors cursor-pointer"
    >
      <div className="relative aspect-video bg-muted">
        {episode.thumbnail_url ? (
          <Image
            src={episode.thumbnail_url}
            alt={episode.title || `Episodio ${episode.episode_number}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-1 left-1 bg-black/70 text-white text-xs font-bold px-1.5 py-0.5 rounded">
          {episode.episode_number}
        </div>
        <div className="absolute top-1 right-1 flex gap-1">
          {episode.is_filler && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Filler</Badge>
          )}
          {episode.is_recap && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">Recap</Badge>
          )}
        </div>
        {episode.duration && (
          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
            {episode.duration}m
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium line-clamp-2 leading-tight">
          {episode.title || episode.title_romaji || `Episodio ${episode.episode_number}`}
        </p>
        {episode.air_date && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {formatDate(episode.air_date)}
          </p>
        )}
      </div>
    </div>
  );

  const renderEpisodeRow = (episode: Episode) => (
    <div 
      key={episode.id} 
      className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
        {episode.episode_number}
      </div>
      <div className="relative w-20 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
        {episode.thumbnail_url ? (
          <Image src={episode.thumbnail_url} alt="" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">
          {episode.title || episode.title_romaji || `Episodio ${episode.episode_number}`}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {episode.air_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(episode.air_date)}
            </span>
          )}
          {episode.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {episode.duration}m
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {episode.is_filler && <Badge variant="destructive" className="text-xs">Filler</Badge>}
        {episode.is_recap && <Badge variant="secondary" className="text-xs">Recap</Badge>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          <span className="font-semibold">
            {seasons.length > 0 ? `${seasons.length} temporada${seasons.length > 1 ? 's' : ''}` : ''} 
            {seasons.length > 0 && totalEpisodes > 0 ? ' • ' : ''}
            {totalEpisodes > 0 ? `${totalEpisodes} episodio${totalEpisodes > 1 ? 's' : ''}` : 'Sin episodios'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle vista */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Botones de agregar */}
          {canManage && (
            <>
              {/* Agregar Temporada */}
              <Dialog open={isAddSeasonOpen} onOpenChange={setIsAddSeasonOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Tv className="h-4 w-4 mr-1" />
                    Temporada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Temporada</DialogTitle>
                    <DialogDescription>
                      Crea una nueva temporada para organizar los episodios.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="season_number">Número de Temporada</Label>
                      <Input
                        id="season_number"
                        type="number"
                        min={1}
                        value={newSeason.season_number}
                        onChange={(e) => setNewSeason(prev => ({ ...prev, season_number: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="season_title">Título (opcional)</Label>
                      <Input
                        id="season_title"
                        placeholder="ej: Arco de la Sociedad de Almas"
                        value={newSeason.title}
                        onChange={(e) => setNewSeason(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="season_cover">URL de Portada (opcional)</Label>
                      <Input
                        id="season_cover"
                        placeholder="https://ejemplo.com/portada.jpg"
                        value={newSeason.cover_image_url}
                        onChange={(e) => setNewSeason(prev => ({ ...prev, cover_image_url: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddSeasonOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddSeason} disabled={isSubmitting}>
                      {isSubmitting ? 'Creando...' : 'Crear Temporada'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Agregar Episodio */}
              <Dialog open={isAddEpisodeOpen} onOpenChange={setIsAddEpisodeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-1" />
                    Episodio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Episodio</DialogTitle>
                    <DialogDescription>
                      Agrega un nuevo episodio a este {mediaType === 'donghua' ? 'donghua' : 'anime'}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {seasons.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="episode_season">Temporada</Label>
                        <select
                          id="episode_season"
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={newEpisode.season_id || ''}
                          onChange={(e) => setNewEpisode(prev => ({ 
                            ...prev, 
                            season_id: e.target.value ? parseInt(e.target.value) : null 
                          }))}
                        >
                          <option value="">Sin temporada asignada</option>
                          {seasons.map(s => (
                            <option key={s.id} value={s.id}>
                              Temporada {s.season_number}{s.title ? `: ${s.title}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="episode_number">Número de Episodio</Label>
                      <Input
                        id="episode_number"
                        type="number"
                        min={1}
                        value={newEpisode.episode_number}
                        onChange={(e) => setNewEpisode(prev => ({ ...prev, episode_number: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Título (opcional)</Label>
                      <Input
                        id="title"
                        placeholder="Título del episodio"
                        value={newEpisode.title}
                        onChange={(e) => setNewEpisode(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_url">URL de Imagen (opcional)</Label>
                      <Input
                        id="thumbnail_url"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={newEpisode.thumbnail_url}
                        onChange={(e) => setNewEpisode(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddEpisodeOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAddEpisode} disabled={isSubmitting}>
                      {isSubmitting ? 'Agregando...' : 'Agregar Episodio'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Contenido */}
      {seasons.length === 0 && unassignedEpisodes.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No hay episodios registrados aún.</p>
          {canManage && (
            <div className="flex justify-center gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => setIsAddSeasonOpen(true)}>
                <Tv className="h-4 w-4 mr-1" />
                Crear Temporada
              </Button>
              <Button size="sm" onClick={() => setIsAddEpisodeOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar Episodio
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Temporadas */}
          {seasons.map((season) => (
            <div key={season.id} className="border rounded-lg overflow-hidden">
              {/* Header de temporada */}
              <div className="flex items-center bg-muted/50">
                <button
                  className="flex-1 flex items-center gap-3 p-4 hover:bg-muted transition-colors text-left"
                  onClick={() => toggleSeasonExpanded(season.id)}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    {season.season_number}
                  </div>
                  {season.cover_image_url && (
                    <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0">
                      <Image src={season.cover_image_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">
                      Temporada {season.season_number}
                      {season.title && `: ${season.title}`}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {season.episodes?.length || 0} episodios
                      {season.start_date && ` • ${formatDate(season.start_date)}`}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    expandedSeasons.has(season.id) && "rotate-180"
                  )} />
                </button>
                
                {/* Botón eliminar temporada - solo admin/mod */}
                {canManage && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar temporada?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará la Temporada {season.season_number}
                          {season.title && ` (${season.title})`} y todos sus episodios asociados.
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSeason(season.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>

              {/* Episodios de la temporada */}
              {expandedSeasons.has(season.id) && (
                <div className="p-4">
                  {season.episodes?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay episodios en esta temporada.
                    </p>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {season.episodes?.map(renderEpisodeCard)}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {season.episodes?.map(renderEpisodeRow)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Episodios sin temporada */}
          {unassignedEpisodes.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 bg-muted/30 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Episodios sin temporada asignada</span>
                <Badge variant="secondary">{unassignedEpisodes.length}</Badge>
              </div>
              <div className="p-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {unassignedEpisodes.map(renderEpisodeCard)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {unassignedEpisodes.map(renderEpisodeRow)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
