'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Plus, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AddRelationDialog } from '@/components/shared';
import Link from 'next/link';

interface MediaData {
  id: number;
  title_romaji?: string;
  title_native?: string;
  title_english?: string;
  title_spanish?: string;
  synopsis?: string;
  synopsis_spanish?: string;
  cover_image_url?: string;
  banner_image_url?: string;
  episode_count?: number;
  duration?: number;
  season?: string;
  year?: number;
  volumes?: number;
  chapters?: number;
  status_id?: number;
  [key: string]: any;
}

const TYPE_LABELS: Record<string, string> = {
  anime: 'Anime',
  manga: 'Manga',
  novels: 'Novela',
  donghua: 'Donghua',
  manhua: 'Manhua',
  manhwa: 'Manhwa',
  fan_comic: 'Fan Comic',
};

export default function EditMediaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const type = params.type as string;
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<MediaData | null>(null);
  const [addRelationOpen, setAddRelationOpen] = useState(false);
  const [relatedData, setRelatedData] = useState({
    genres: [],
    tags: [],
    studios: [],
    staff: [],
    characters: [],
    relations: [], // Relaciones con otros media
  });

  useEffect(() => {
    loadMedia();
  }, [type, id]);

  const loadMedia = async () => {
    try {
      const response = await fetch(`/api/admin/media/${type}/${id}`);
      if (!response.ok) throw new Error('Error al cargar');
      
      const result = await response.json();
      setData(result.media);
      
      // Cargar datos relacionados (géneros, tags, studios, staff, personajes)
      if (result.media) {
        await loadRelatedData();
      }
    } catch (error) {
      console.error('Error al cargar media:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      // Cargar géneros, tags, studios, staff, personajes asociados
      const response = await fetch(`/api/admin/media/${type}/${id}/related`);
      if (response.ok) {
        const result = await response.json();
        setRelatedData(result);
      }
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
    }
  };

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/media/${type}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Error al guardar');

      const result = await response.json();
      
      toast({
        title: 'Éxito',
        description: 'Cambios guardados correctamente',
      });

      // Recargar datos
      await loadMedia();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelation = async (relationId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta relación?')) return;

    try {
      const response = await fetch(
        `/api/admin/media/${type}/${id}/relations?relation_id=${relationId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Relación eliminada correctamente',
      });

      // Recargar datos relacionados
      await loadRelatedData();
    } catch (error) {
      console.error('Error al eliminar relación:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la relación',
        variant: 'destructive',
      });
    }
  };

  const updateField = (field: string, value: any) => {
    setData(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró el contenido</p>
        <Link href="/dashboard/admin/search">
          <Button variant="outline" className="mt-4">
            Volver a búsqueda
          </Button>
        </Link>
      </div>
    );
  }

  const isAnimeType = ['anime', 'donghua'].includes(type);
  const isMangaType = ['manga', 'manhua', 'manhwa', 'novels', 'fan_comic'].includes(type);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/search">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            Editar {TYPE_LABELS[type] || type}
          </h1>
          <p className="text-muted-foreground mt-1">
            ID: {id} - {data.title_romaji || data.title_english || 'Sin título'}
          </p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="basic">Básico</TabsTrigger>
        <TabsTrigger value="genres">Géneros & Tags</TabsTrigger>
        <TabsTrigger value="studios">Studios & Staff</TabsTrigger>
        <TabsTrigger value="characters">Personajes</TabsTrigger>
        <TabsTrigger value="relations">Relaciones</TabsTrigger>
        <TabsTrigger value="advanced">Avanzado</TabsTrigger>
      </TabsList>        {/* TAB: Información Básica */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Edita la información principal del {TYPE_LABELS[type]?.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Títulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_romaji">Título Romaji</Label>
              <Input
                id="title_romaji"
                value={data.title_romaji || ''}
                onChange={(e) => updateField('title_romaji', e.target.value)}
                placeholder="Título en romaji"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_native">Título Nativo</Label>
              <Input
                id="title_native"
                value={data.title_native || ''}
                onChange={(e) => updateField('title_native', e.target.value)}
                placeholder="Título en idioma original"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_english">Título en Inglés</Label>
              <Input
                id="title_english"
                value={data.title_english || ''}
                onChange={(e) => updateField('title_english', e.target.value)}
                placeholder="Título en inglés"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title_spanish">Título en Español</Label>
              <Input
                id="title_spanish"
                value={data.title_spanish || ''}
                onChange={(e) => updateField('title_spanish', e.target.value)}
                placeholder="Título en español"
              />
            </div>
          </div>

          {/* Sinopsis */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="synopsis">Sinopsis (Inglés/Original)</Label>
              <Textarea
                id="synopsis"
                value={data.synopsis || ''}
                onChange={(e) => updateField('synopsis', e.target.value)}
                placeholder="Sinopsis en inglés"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="synopsis_spanish">Sinopsis en Español</Label>
              <Textarea
                id="synopsis_spanish"
                value={data.synopsis_spanish || ''}
                onChange={(e) => updateField('synopsis_spanish', e.target.value)}
                placeholder="Sinopsis en español"
                rows={6}
              />
            </div>
          </div>

          {/* Imágenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">URL de Portada</Label>
              <Input
                id="cover_image_url"
                value={data.cover_image_url || ''}
                onChange={(e) => updateField('cover_image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_image_url">URL de Banner</Label>
              <Input
                id="banner_image_url"
                value={data.banner_image_url || ''}
                onChange={(e) => updateField('banner_image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Campos específicos por tipo */}
          {isAnimeType && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="episode_count">Episodios</Label>
                <Input
                  id="episode_count"
                  type="number"
                  value={data.episode_count || ''}
                  onChange={(e) => updateField('episode_count', parseInt(e.target.value) || null)}
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={data.duration || ''}
                  onChange={(e) => updateField('duration', parseInt(e.target.value) || null)}
                  placeholder="24"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="season">Temporada</Label>
                <Input
                  id="season"
                  value={data.season || ''}
                  onChange={(e) => updateField('season', e.target.value)}
                  placeholder="Spring 2024"
                />
              </div>
            </div>
          )}

          {isMangaType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="volumes">Volúmenes</Label>
                <Input
                  id="volumes"
                  type="number"
                  value={data.volumes || ''}
                  onChange={(e) => updateField('volumes', parseInt(e.target.value) || null)}
                  placeholder="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapters">Capítulos</Label>
                <Input
                  id="chapters"
                  type="number"
                  value={data.chapters || ''}
                  onChange={(e) => updateField('chapters', parseInt(e.target.value) || null)}
                  placeholder="120"
                />
              </div>
            </div>
          )}

          {/* Año */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={data.year || ''}
                onChange={(e) => updateField('year', parseInt(e.target.value) || null)}
                placeholder="2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_id">Estado</Label>
              <select
                id="status_id"
                value={data.status_id || 1}
                onChange={(e) => updateField('status_id', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value={1}>En emisión / Publicación</option>
                <option value={2}>Finalizado</option>
                <option value={3}>Próximamente</option>
                <option value={4}>Cancelado</option>
              </select>
            </div>
          </div>

          {/* Botones de Guardar/Cancelar para este tab */}
          <div className="flex gap-4 pt-6 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Información Básica
                </>
              )}
            </Button>

            <Link href="/dashboard/admin/search">
              <Button variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Géneros & Tags */}
        <TabsContent value="genres">
          <Card>
            <CardHeader>
              <CardTitle>Géneros y Etiquetas</CardTitle>
              <CardDescription>
                Gestiona los géneros y tags asociados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Géneros Actuales</Label>
                  <div className="flex flex-wrap gap-2 mt-2 p-4 border rounded-lg min-h-[60px]">
                    {relatedData.genres.length > 0 ? (
                      relatedData.genres.map((genre: any) => (
                        <Badge key={genre.id} variant="secondary" className="gap-1">
                          {genre.name_es || genre.name_en}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => {/* Remove genre */}} />
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay géneros asignados</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Gestiona géneros desde: <Link href="/dashboard/admin/genres" className="underline">Panel de Géneros</Link>
                  </p>
                </div>

                <div>
                  <Label>Tags Actuales</Label>
                  <div className="flex flex-wrap gap-2 mt-2 p-4 border rounded-lg min-h-[60px]">
                    {relatedData.tags.length > 0 ? (
                      relatedData.tags.map((tag: any) => (
                        <Badge key={tag.id} variant="outline" className="gap-1">
                          {tag.name}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => {/* Remove tag */}} />
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay tags asignados</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Los tags se gestionan mediante contribuciones de la comunidad
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Studios & Staff */}
        <TabsContent value="studios">
          <Card>
            <CardHeader>
              <CardTitle>Estudios y Personal</CardTitle>
              <CardDescription>
                Gestiona los estudios de animación y el staff de producción
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Estudios de Animación</Label>
                  <div className="space-y-2 mt-2">
                    {relatedData.studios.length > 0 ? (
                      relatedData.studios.map((studio: any) => (
                        <div key={studio.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{studio.name}</p>
                            <p className="text-sm text-muted-foreground">Estudio de animación</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 border rounded-lg">No hay estudios asignados</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Estudio
                  </Button>
                </div>

                <div>
                  <Label>Personal (Staff)</Label>
                  <div className="space-y-2 mt-2">
                    {relatedData.staff.length > 0 ? (
                      relatedData.staff.map((person: any) => (
                        <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{person.name_romaji || person.name || person.name_native}</p>
                            <p className="text-sm text-muted-foreground">{person.role}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground p-4 border rounded-lg">No hay staff asignado</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Personal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Personajes */}
        <TabsContent value="characters">
          <Card>
            <CardHeader>
              <CardTitle>Personajes y Actores de Voz</CardTitle>
              <CardDescription>
                Gestiona los personajes y sus actores de voz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedData.characters.length > 0 ? (
                relatedData.characters.map((char: any) => (
                  <div key={char.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{char.name_romaji || char.name || char.name_native}</h3>
                        <p className="text-sm text-muted-foreground">{char.name_native || ''}</p>
                      </div>
                      <Badge variant={char.role === 'main' ? 'default' : 'secondary'}>
                        {char.role === 'main' ? 'Principal' : 'Secundario'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Actores de Voz</Label>
                      {char.voice_actors && char.voice_actors.length > 0 ? (
                        <div className="space-y-2">
                          {char.voice_actors.map((va: any) => (
                            <div key={va.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="text-sm font-medium">{va.name_romaji || va.name_native}</p>
                                <p className="text-xs text-muted-foreground">
                                  {va.language === 'ja' ? 'Japonés' : va.language === 'en' ? 'Inglés' : va.language === 'es' ? 'Español' : va.language}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin actores de voz asignados</p>
                      )}
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar Actor
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No hay personajes registrados</p>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Personaje
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Relaciones */}
        <TabsContent value="relations">
          <Card>
            <CardHeader>
              <CardTitle>Relaciones con Otros Media</CardTitle>
              <CardDescription>
                Gestiona las relaciones entre este contenido y otros (adaptaciones, secuelas, precuelas, spin-offs)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {relatedData.relations && relatedData.relations.length > 0 ? (
                <div className="space-y-3">
                  {relatedData.relations.map((relation: any) => (
                    <div key={relation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                          <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {relation.relation_type === 'sequel' && '📺 Secuela'}
                              {relation.relation_type === 'prequel' && '⏮️ Precuela'}
                              {relation.relation_type === 'adaptation' && '📖 Adaptación'}
                              {relation.relation_type === 'source' && '📚 Material Fuente'}
                              {relation.relation_type === 'side_story' && '📝 Historia Paralela'}
                              {relation.relation_type === 'spin_off' && '🔄 Spin-off'}
                              {relation.relation_type === 'alternative' && '🔁 Versión Alternativa'}
                              {relation.relation_type === 'special' && '⭐ Especial'}
                              {relation.relation_type === 'ova' && '💿 OVA'}
                              {relation.relation_type === 'ona' && '🌐 ONA'}
                              {relation.relation_type === 'movie' && '🎬 Película'}
                              {relation.relation_type === 'summary' && '📋 Resumen'}
                              {relation.relation_type === 'full_story' && '📖 Historia Completa'}
                              {relation.relation_type === 'parent_story' && '🏠 Historia Principal'}
                              {relation.relation_type === 'character' && '👥 Personajes Compartidos'}
                              {relation.relation_type === 'other' && '🔗 Otra Relación'}
                            </Badge>
                            <Badge variant="secondary">
                              {relation.target_type === 'anime' && '🎬 Anime'}
                              {relation.target_type === 'manga' && '📚 Manga'}
                              {relation.target_type === 'novels' && '📖 Novela'}
                              {relation.target_type === 'donghua' && '🎨 Donghua'}
                              {relation.target_type === 'manhua' && '🖼️ Manhua'}
                              {relation.target_type === 'manhwa' && '📱 Manhwa'}
                              {relation.target_type === 'fan_comic' && '✏️ Fan Comic'}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-lg">
                            {relation.target_title_romaji || relation.target_title_spanish || 'Sin título'}
                          </h4>
                          {relation.target_synopsis && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {relation.target_synopsis}
                            </p>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteRelation(relation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <p className="text-muted-foreground mb-4">No hay relaciones registradas</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Las relaciones te permiten conectar este contenido con adaptaciones, secuelas, precuelas, etc.
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setAddRelationOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Relación
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Tipos: Secuela, Precuela, Adaptación, OVA, ONA, Película, Especial, Spin-off, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Avanzado */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Opciones avanzadas y metadatos adicionales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source">Fuente Original</Label>
                  <Input
                    id="source"
                    value={data.source || ''}
                    onChange={(e) => updateField('source', e.target.value)}
                    placeholder="Manga, Novela Ligera, Original, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rating">Clasificación</Label>
                    <select
                      id="rating"
                      value={data.rating || 'PG-13'}
                      onChange={(e) => updateField('rating', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="G">G - Todas las edades</option>
                      <option value="PG">PG - Guía parental</option>
                      <option value="PG-13">PG-13 - Mayores de 13</option>
                      <option value="R">R - Restringido</option>
                      <option value="R+">R+ - Violencia/Lenguaje</option>
                      <option value="Rx">Rx - Adultos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="popularity_rank">Ranking de Popularidad</Label>
                    <Input
                      id="popularity_rank"
                      type="number"
                      value={data.popularity_rank || ''}
                      onChange={(e) => updateField('popularity_rank', parseInt(e.target.value) || null)}
                      placeholder="Posición en ranking"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4 border rounded-lg">
                  <input
                    type="checkbox"
                    id="is_approved"
                    checked={data.is_approved || false}
                    onChange={(e) => updateField('is_approved', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_approved" className="cursor-pointer">
                    Contenido aprobado y visible públicamente
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para agregar relaciones */}
      <AddRelationDialog
        open={addRelationOpen}
        onOpenChange={setAddRelationOpen}
        sourceType={type}
        sourceId={parseInt(id)}
        onRelationAdded={loadRelatedData}
      />
    </div>
  );
}
