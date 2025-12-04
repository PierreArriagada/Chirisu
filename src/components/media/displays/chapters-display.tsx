"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { BookOpen, Plus, ChevronDown, Book, Library, FileText, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";

interface Chapter {
  id: number;
  volume_id: number;
  chapter_number: number;
  title?: string;
  pages?: number;
  release_date?: string;
}

interface Volume {
  id: number;
  media_type: string;
  media_id: number;
  volume_number: number;
  title?: string;
  cover_image_url?: string;
  release_date?: string;
  isbn?: string;
  chapter_count: number;
  chapters: Chapter[];
}

interface ChaptersDisplayProps {
  mediaId: number;
  mediaType: 'manga' | 'manhua' | 'manhwa' | 'fan_comics' | 'novels' | 'novel' | 'fan_comic';
  chapters?: number;
  volumes?: number;
  status?: string;
  className?: string;
  canEdit?: boolean;
}

// Labels por tipo de media
const LABELS: Record<string, { volume: string; volumePlural: string; chapter: string; chapterPlural: string; icon: React.ReactNode }> = {
  manga: { volume: 'Tomo', volumePlural: 'Tomos', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <Book className="h-4 w-4" /> },
  manhua: { volume: 'Tomo', volumePlural: 'Tomos', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <Book className="h-4 w-4" /> },
  manhwa: { volume: 'Tomo', volumePlural: 'Tomos', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <Book className="h-4 w-4" /> },
  fan_comics: { volume: 'Volumen', volumePlural: 'Volúmenes', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <FileText className="h-4 w-4" /> },
  fan_comic: { volume: 'Volumen', volumePlural: 'Volúmenes', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <FileText className="h-4 w-4" /> },
  novels: { volume: 'Volumen', volumePlural: 'Volúmenes', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <Library className="h-4 w-4" /> },
  novel: { volume: 'Volumen', volumePlural: 'Volúmenes', chapter: 'Capítulo', chapterPlural: 'Capítulos', icon: <Library className="h-4 w-4" /> },
};

// Normalizar mediaType
const normalizeMediaType = (type: string): string => {
  const mapping: Record<string, string> = {
    'novel': 'novels',
    'fan_comic': 'fan_comics'
  };
  return mapping[type] || type;
};

export default function ChaptersDisplay({ 
  mediaId, 
  mediaType, 
  chapters: totalChapters,
  volumes: totalVolumes,
  status,
  className,
  canEdit = false 
}: ChaptersDisplayProps) {
  const { user } = useAuth();
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVolumes, setExpandedVolumes] = useState<Set<number>>(new Set());
  const [useSimpleView, setUseSimpleView] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  
  // Verificar si el usuario puede editar (admin o moderador)
  const canManage = user?.isAdmin || user?.isModerator;
  
  // Dialogs
  const [isAddVolumeOpen, setIsAddVolumeOpen] = useState(false);
  const [isAddChapterOpen, setIsAddChapterOpen] = useState(false);
  const [selectedVolumeId, setSelectedVolumeId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [newVolume, setNewVolume] = useState({
    volume_number: 1,
    title: '',
    cover_image_url: ''
  });
  
  const [newChapter, setNewChapter] = useState({
    chapter_number: 1,
    title: '',
    pages: 0
  });

  const labels = LABELS[mediaType] || LABELS.manga;
  const normalizedType = normalizeMediaType(mediaType);
  const isOngoing = status?.toLowerCase().includes('releasing') || status?.toLowerCase().includes('ongoing');

  useEffect(() => {
    fetchData();
  }, [mediaId, mediaType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/media/${normalizedType}/${mediaId}/volumes`);
      
      if (!response.ok) {
        // Para cualquier error, usar vista simple con datos estáticos
        setVolumes([]);
        setUseSimpleView(true);
        return;
      }

      const result = await response.json();
      
      if (result.success && result.data.volumes?.length > 0) {
        setVolumes(result.data.volumes);
        setUseSimpleView(false);
        
        // Actualizar siguiente número de volumen
        const maxVolume = Math.max(...result.data.volumes.map((v: Volume) => v.volume_number));
        setNewVolume(prev => ({ ...prev, volume_number: maxVolume + 1 }));
        
        // Expandir el primer volumen por defecto
        setExpandedVolumes(new Set([result.data.volumes[0].id]));
      } else {
        setVolumes([]);
        setUseSimpleView(true);
      }
    } catch (err) {
      console.error('Error fetching volumes:', err);
      setVolumes([]);
      setUseSimpleView(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVolume = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/media/${normalizedType}/${mediaId}/volumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVolume)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar volumen');
      }

      await fetchData();
      setNewVolume({
        volume_number: newVolume.volume_number + 1,
        title: '',
        cover_image_url: ''
      });
      setIsAddVolumeOpen(false);
    } catch (err) {
      console.error('Error adding volume:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar volumen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChapter = async () => {
    if (!selectedVolumeId) {
      alert(`Por favor selecciona un ${labels.volume.toLowerCase()}`);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/media/${normalizedType}/${mediaId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volume_id: selectedVolumeId,
          ...newChapter
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al agregar capítulo');
      }

      await fetchData();
      setNewChapter({
        chapter_number: newChapter.chapter_number + 1,
        title: '',
        pages: 0
      });
      setIsAddChapterOpen(false);
    } catch (err) {
      console.error('Error adding chapter:', err);
      alert(err instanceof Error ? err.message : 'Error al agregar capítulo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVolume = async (volumeId: number) => {
    try {
      const response = await fetch(`/api/media/${normalizedType}/${mediaId}/volumes?volumeId=${volumeId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error al eliminar ${labels.volume.toLowerCase()}`);
      }

      // Recargar datos
      await fetchData();
    } catch (err) {
      console.error('Error deleting volume:', err);
      alert(err instanceof Error ? err.message : `Error al eliminar ${labels.volume.toLowerCase()}`);
    }
  };

  const toggleVolumeExpanded = (volumeId: number) => {
    setExpandedVolumes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(volumeId)) {
        newSet.delete(volumeId);
      } else {
        newSet.add(volumeId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Vista simple (cuando no hay volúmenes estructurados)
  if (useSimpleView) {
    const chaptersCount = totalChapters || 0;
    const volumesCount = totalVolumes || 0;
    const initialChaptersToShow = 50;
    const chaptersToDisplay = showAllChapters ? chaptersCount : Math.min(chaptersCount, initialChaptersToShow);
    const hasMoreChapters = chaptersCount > initialChaptersToShow;
    const chapterNumbers = Array.from({ length: chaptersToDisplay }, (_, i) => i + 1);

    return (
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {labels.icon}
            <span className="font-semibold">
              {chaptersCount > 0 
                ? `${chaptersCount} ${chaptersCount === 1 ? labels.chapter : labels.chapterPlural}${isOngoing ? '+' : ''}`
                : `Sin ${labels.chapterPlural.toLowerCase()}`}
              {volumesCount > 0 && ` • ${volumesCount} ${volumesCount === 1 ? labels.volume : labels.volumePlural}`}
            </span>
          </div>
          
          {canManage && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => setIsAddVolumeOpen(true)}>
              <Book className="h-4 w-4 mr-1" />
              Crear {labels.volume}
            </Button>
          )}
        </div>

        {chaptersCount === 0 && volumesCount === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Sin información de capítulos disponible.</p>
            {canManage && (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsAddVolumeOpen(true)}>
                <Book className="h-4 w-4 mr-1" />
                Crear primer {labels.volume.toLowerCase()}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Grid numérico simple */}
            {chaptersCount > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {chapterNumbers.map((num) => (
                    <button
                      key={num}
                      className="min-w-[40px] h-8 px-2 text-xs font-medium rounded border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                      title={`${labels.chapter} ${num}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {hasMoreChapters && (
                  <div className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllChapters(!showAllChapters)}
                      className="gap-1"
                    >
                      {showAllChapters ? (
                        <>Mostrar menos</>
                      ) : (
                        <>Ver todos ({chaptersCount} {labels.chapterPlural.toLowerCase()})</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Grid de volúmenes si no hay capítulos */}
            {chaptersCount === 0 && volumesCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: volumesCount }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    className="min-w-[48px] h-12 px-3 text-sm font-semibold rounded-lg border-2 bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    title={`${labels.volume} ${num}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Dialog para crear volumen */}
        <Dialog open={isAddVolumeOpen} onOpenChange={setIsAddVolumeOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar {labels.volume}</DialogTitle>
              <DialogDescription>
                Crea un nuevo {labels.volume.toLowerCase()} para organizar los capítulos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="volume_number">Número de {labels.volume}</Label>
                <Input
                  id="volume_number"
                  type="number"
                  min={1}
                  value={newVolume.volume_number}
                  onChange={(e) => setNewVolume(prev => ({ ...prev, volume_number: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume_title">Título (opcional)</Label>
                <Input
                  id="volume_title"
                  placeholder="ej: El Comienzo"
                  value={newVolume.title}
                  onChange={(e) => setNewVolume(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="volume_cover">URL de Portada (opcional)</Label>
                <Input
                  id="volume_cover"
                  placeholder="https://ejemplo.com/portada.jpg"
                  value={newVolume.cover_image_url}
                  onChange={(e) => setNewVolume(prev => ({ ...prev, cover_image_url: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddVolumeOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddVolume} disabled={isSubmitting}>
                {isSubmitting ? 'Creando...' : `Crear ${labels.volume}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista jerárquica con volúmenes
  const totalChaptersCount = volumes.reduce((acc, v) => acc + (v.chapters?.length || 0), 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {labels.icon}
          <span className="font-semibold">
            {volumes.length} {volumes.length === 1 ? labels.volume : labels.volumePlural}
            {totalChaptersCount > 0 && ` • ${totalChaptersCount} ${totalChaptersCount === 1 ? labels.chapter : labels.chapterPlural}`}
          </span>
        </div>

        {/* Botones de agregar */}
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={isAddVolumeOpen} onOpenChange={setIsAddVolumeOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <Book className="h-4 w-4 mr-1" />
                  {labels.volume}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar {labels.volume}</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo {labels.volume.toLowerCase()} para organizar los capítulos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="volume_number">Número de {labels.volume}</Label>
                    <Input
                      id="volume_number"
                      type="number"
                      min={1}
                      value={newVolume.volume_number}
                      onChange={(e) => setNewVolume(prev => ({ ...prev, volume_number: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume_title">Título (opcional)</Label>
                    <Input
                      id="volume_title"
                      placeholder="ej: El Comienzo"
                      value={newVolume.title}
                      onChange={(e) => setNewVolume(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="volume_cover">URL de Portada (opcional)</Label>
                    <Input
                      id="volume_cover"
                      placeholder="https://ejemplo.com/portada.jpg"
                      value={newVolume.cover_image_url}
                      onChange={(e) => setNewVolume(prev => ({ ...prev, cover_image_url: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddVolumeOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddVolume} disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : `Crear ${labels.volume}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddChapterOpen} onOpenChange={setIsAddChapterOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8" disabled={volumes.length === 0}>
                  <Plus className="h-4 w-4 mr-1" />
                  {labels.chapter}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar {labels.chapter}</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo capítulo a un {labels.volume.toLowerCase()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter_volume">{labels.volume}</Label>
                    <select
                      id="chapter_volume"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      value={selectedVolumeId || ''}
                      onChange={(e) => setSelectedVolumeId(parseInt(e.target.value) || null)}
                    >
                      <option value="">Seleccionar {labels.volume.toLowerCase()}</option>
                      {volumes.map(v => (
                        <option key={v.id} value={v.id}>
                          {labels.volume} {v.volume_number}{v.title ? `: ${v.title}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter_number">Número de {labels.chapter}</Label>
                    <Input
                      id="chapter_number"
                      type="number"
                      min={1}
                      step={0.1}
                      value={newChapter.chapter_number}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, chapter_number: parseFloat(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter_title">Título (opcional)</Label>
                    <Input
                      id="chapter_title"
                      placeholder="Título del capítulo"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter_pages">Páginas (opcional)</Label>
                    <Input
                      id="chapter_pages"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={newChapter.pages || ''}
                      onChange={(e) => setNewChapter(prev => ({ ...prev, pages: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddChapterOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddChapter} disabled={isSubmitting || !selectedVolumeId}>
                    {isSubmitting ? 'Agregando...' : `Agregar ${labels.chapter}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Volúmenes con capítulos */}
      <div className="space-y-3">
        {volumes.map((volume) => (
          <div key={volume.id} className="border rounded-lg overflow-hidden">
            {/* Header del volumen */}
            <div className="flex items-center bg-muted/50">
              <button
                className="flex-1 flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                onClick={() => toggleVolumeExpanded(volume.id)}
              >
                {volume.cover_image_url ? (
                  <div className="relative w-12 h-16 rounded overflow-hidden flex-shrink-0">
                    <Image src={volume.cover_image_url} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-12 h-16 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center">
                    {volume.volume_number}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">
                    {labels.volume} {volume.volume_number}
                    {volume.title && `: ${volume.title}`}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {volume.chapters?.length || 0} {volume.chapters?.length === 1 ? labels.chapter.toLowerCase() : labels.chapterPlural.toLowerCase()}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expandedVolumes.has(volume.id) && "rotate-180"
                )} />
              </button>
              
              {/* Botón eliminar volumen - solo admin/mod */}
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
                      <AlertDialogTitle>¿Eliminar {labels.volume.toLowerCase()}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará el {labels.volume} {volume.volume_number}
                        {volume.title && ` (${volume.title})`} y todos sus {labels.chapterPlural.toLowerCase()} asociados.
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteVolume(volume.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Capítulos del volumen - Grid numérico */}
            {expandedVolumes.has(volume.id) && (
              <div className="p-3">
                {volume.chapters?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay capítulos en este {labels.volume.toLowerCase()}.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {volume.chapters?.map((chapter) => (
                      <button
                        key={chapter.id}
                        className="min-w-[40px] h-8 px-2 text-xs font-medium rounded border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center justify-center"
                        title={chapter.title || `${labels.chapter} ${chapter.chapter_number}`}
                      >
                        {chapter.chapter_number}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
