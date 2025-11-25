'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

interface ContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: string;
  mediaId: string;
}

interface MediaData {
  id: string;
  title?: string;
  synopsis?: string;
  coverImage?: string;
  bannerImage?: string;
  totalEpisodes?: number;
  totalChapters?: number;
  totalVolumes?: number;
  episodeDuration?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  season?: string;
  year?: number;
  studio?: string;
  author?: string;
  illustrator?: string;
  publisher?: string;
  source?: string;
  ageRating?: string;
  trailerUrl?: string;
  officialWebsite?: string;
  genres?: Array<{ id: number; name: string; code?: string }>;
  characters?: Array<{ 
    id: number; 
    name: string; 
    nameRomaji?: string;
    nameNative?: string;
    description?: string;
    imageUrl?: string;
    role: 'main' | 'supporting';
  }>;
  staff?: Array<{ 
    id: number; 
    name: string; 
    role: string; 
    imageUrl?: string;
  }>;
  studios?: Array<{ 
    id: number; 
    name: string;
  }>;
  externalLinks?: Array<{ 
    id: number; 
    platform: string; 
    url: string; 
    label?: string;
  }>;
  [key: string]: any;
}

export function ContributionDialog({
  open,
  onOpenChange,
  mediaType,
  mediaId,
}: ContributionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<MediaData | null>(null);
  const [formData, setFormData] = useState<MediaData | null>(null);
  const [contributionNotes, setContributionNotes] = useState('');
  const [sources, setSources] = useState<string[]>(['']);

  useEffect(() => {
    if (open && mediaType && mediaId) {
      loadMediaData();
    } else if (!open) {
      // Limpiar estado cuando se cierra el diálogo
      setFormData(null);
      setOriginalData(null);
      setContributionNotes('');
      setSources(['']);
      console.log('🧹 Estado limpiado al cerrar el diálogo');
    }
  }, [open, mediaType, mediaId]);

  const loadMediaData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Cargando datos para:', { mediaType, mediaId });
      const response = await fetch(`/api/get-media-for-edit?type=${mediaType}&id=${mediaId}`);
      const data = await response.json();

      console.log('📦 Datos recibidos:', data);

      if (data.success && data.content) {
        console.log('✅ Contenido cargado exitosamente');
        
        // Deduplicar arrays por ID para evitar errores de React
        const deduplicateById = (array: any[]) => {
          const seen = new Set();
          return array.filter(item => {
            if (seen.has(item.id)) {
              console.warn(`⚠️ ID duplicado encontrado y removido: ${item.id}`);
              return false;
            }
            seen.add(item.id);
            return true;
          });
        };
        
        // Asegurar que los arrays existan y estén deduplicados
        const contentWithDefaults = {
          ...data.content,
          characters: deduplicateById(data.content.characters || []),
          staff: deduplicateById(data.content.staff || []),
          studios: deduplicateById(data.content.studios || []),
          externalLinks: deduplicateById(data.content.externalLinks || []),
        };
        
        setOriginalData(contentWithDefaults);
        setFormData({ ...contentWithDefaults });
      } else {
        console.error('❌ Error en respuesta:', data.error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo cargar la información del contenido',
        });
      }
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
      console.error('Error loading media data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al cargar los datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const getChangedFields = () => {
    if (!originalData || !formData) return {};

    const changes: Record<string, { old: any; new: any }> = {};

    Object.keys(formData).forEach((key) => {
      if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;

      const oldValue = originalData[key];
      const newValue = formData[key];

      // Comparar valores (manejar null, undefined, arrays, etc.)
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[key] = {
          old: oldValue,
          new: newValue,
        };
      }
    });

    return changes;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para contribuir',
      });
      return;
    }

    const changes = getChangedFields();

    if (Object.keys(changes).length === 0) {
      toast({
        variant: 'destructive',
        title: 'Sin cambios',
        description: 'No has realizado ningún cambio',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/content-contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          contributableType: mediaType === 'fan-comic' ? 'fan_comic' : mediaType === 'novela' ? 'novel' : mediaType,
          contributableId: mediaId,
          contributionType: 'add_info',
          proposedChanges: changes,
          contributionNotes,
          sources: sources.filter((s) => s.trim() !== ''),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '¡Contribución enviada!',
          description: 'Tu contribución será revisada por un moderador. ¡Gracias!',
        });
        onOpenChange(false);
        setContributionNotes('');
        setSources(['']);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'No se pudo enviar la contribución',
        });
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un problema al enviar la contribución',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addSource = () => {
    setSources([...sources, '']);
  };

  const updateSource = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargando información...</DialogTitle>
            <DialogDescription>
              Obteniendo los datos actuales del contenido...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contribuir Información</DialogTitle>
          <DialogDescription>
            Agrega o corrige información sobre este contenido. Tu contribución será revisada por un moderador antes de ser aplicada.
          </DialogDescription>
        </DialogHeader>

        {formData && (
          <div className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Básica</h3>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="synopsis">Sinopsis</Label>
                <Textarea
                  id="synopsis"
                  value={formData.synopsis || ''}
                  onChange={(e) => handleFieldChange('synopsis', e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">URL de Portada</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage || ''}
                    onChange={(e) => handleFieldChange('coverImage', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerImage">URL de Banner</Label>
                  <Input
                    id="bannerImage"
                    value={formData.bannerImage || ''}
                    onChange={(e) => handleFieldChange('bannerImage', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Información Específica por Tipo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalles</h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(mediaType === 'anime' || mediaType === 'donghua') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="totalEpisodes">Total de Episodios</Label>
                      <Input
                        id="totalEpisodes"
                        type="number"
                        value={formData.totalEpisodes || ''}
                        onChange={(e) => handleFieldChange('totalEpisodes', parseInt(e.target.value) || null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="episodeDuration">Duración (min)</Label>
                      <Input
                        id="episodeDuration"
                        type="number"
                        value={formData.episodeDuration || ''}
                        onChange={(e) => handleFieldChange('episodeDuration', parseInt(e.target.value) || null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="studio">Estudio</Label>
                      <Input
                        id="studio"
                        value={formData.studio || ''}
                        onChange={(e) => handleFieldChange('studio', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {(mediaType === 'manga' || mediaType === 'manhua' || mediaType === 'manhwa' || mediaType === 'fan-comic' || mediaType === 'novel' || mediaType === 'novela') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="totalChapters">Total de Capítulos</Label>
                      <Input
                        id="totalChapters"
                        type="number"
                        value={formData.totalChapters || ''}
                        onChange={(e) => handleFieldChange('totalChapters', parseInt(e.target.value) || null)}
                      />
                    </div>

                    {(mediaType === 'manga' || mediaType === 'manhua' || mediaType === 'manhwa') && (
                      <div className="space-y-2">
                        <Label htmlFor="totalVolumes">Total de Volúmenes</Label>
                        <Input
                          id="totalVolumes"
                          type="number"
                          value={formData.totalVolumes || ''}
                          onChange={(e) => handleFieldChange('totalVolumes', parseInt(e.target.value) || null)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="author">Autor</Label>
                      <Input
                        id="author"
                        value={formData.author || ''}
                        onChange={(e) => handleFieldChange('author', e.target.value)}
                      />
                    </div>

                    {(mediaType === 'manga' || mediaType === 'manhua' || mediaType === 'manhwa' || mediaType === 'fan-comic') && (
                      <div className="space-y-2">
                        <Label htmlFor="illustrator">Ilustrador</Label>
                        <Input
                          id="illustrator"
                          value={formData.illustrator || ''}
                          onChange={(e) => handleFieldChange('illustrator', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="publisher">Editorial</Label>
                      <Input
                        id="publisher"
                        value={formData.publisher || ''}
                        onChange={(e) => handleFieldChange('publisher', e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Input
                    id="status"
                    value={formData.status || ''}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    placeholder="ongoing, completed, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Año</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => handleFieldChange('year', parseInt(e.target.value) || null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ageRating">Clasificación</Label>
                  <Input
                    id="ageRating"
                    value={formData.ageRating || ''}
                    onChange={(e) => handleFieldChange('ageRating', e.target.value)}
                    placeholder="PG-13, R, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trailerUrl">URL del Tráiler</Label>
                  <Input
                    id="trailerUrl"
                    value={formData.trailerUrl || ''}
                    onChange={(e) => handleFieldChange('trailerUrl', e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officialWebsite">Sitio Web Oficial</Label>
                  <Input
                    id="officialWebsite"
                    value={formData.officialWebsite || ''}
                    onChange={(e) => handleFieldChange('officialWebsite', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>

            {/* Personajes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personajes</h3>
              <div className="space-y-3">
                {formData.characters && formData.characters.length > 0 ? (
                  formData.characters.map((character, index) => (
                    <div key={`character-${character.id}-${index}`} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start gap-3">
                        {character.imageUrl && (
                          <img 
                            src={character.imageUrl} 
                            alt={character.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={character.name || ''}
                              onChange={(e) => {
                                const newCharacters = [...(formData.characters || [])];
                                newCharacters[index] = { ...character, name: e.target.value };
                                handleFieldChange('characters', newCharacters);
                              }}
                              placeholder="Nombre del personaje"
                              className="flex-1"
                            />
                            <select
                              value={character.role}
                              onChange={(e) => {
                                const newCharacters = [...(formData.characters || [])];
                                newCharacters[index] = { ...character, role: e.target.value as 'main' | 'supporting' };
                                handleFieldChange('characters', newCharacters);
                              }}
                              className="px-3 py-2 border rounded-md"
                            >
                              <option value="main">Principal</option>
                              <option value="supporting">Secundario</option>
                            </select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newCharacters = formData.characters?.filter((_, i) => i !== index);
                                handleFieldChange('characters', newCharacters);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea
                            value={character.description || ''}
                            onChange={(e) => {
                              const newCharacters = [...(formData.characters || [])];
                              newCharacters[index] = { ...character, description: e.target.value };
                              handleFieldChange('characters', newCharacters);
                            }}
                            placeholder="Descripción del personaje"
                            rows={2}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay personajes agregados aún. Haz clic en el botón para agregar.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      const newCharacters = [
                        ...(formData.characters || []),
                        { 
                          id: Date.now() + Math.random(), // Usar timestamp + random para garantizar unicidad
                          name: '', 
                          role: 'supporting' as const, 
                          description: '' 
                        }
                      ];
                      handleFieldChange('characters', newCharacters);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Personaje
                  </Button>
                </div>
              </div>

            {/* Staff (Personal) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Staff (Equipo de Producción)</h3>
              <div className="space-y-3">
                {formData.staff && formData.staff.length > 0 ? (
                  formData.staff.map((member, index) => (
                    <div key={`staff-${member.id}-${index}`} className="p-3 border rounded-lg">
                      <div className="flex gap-3">
                        {member.imageUrl && (
                          <img 
                            src={member.imageUrl} 
                            alt={member.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={member.name || ''}
                            onChange={(e) => {
                              const newStaff = [...(formData.staff || [])];
                              newStaff[index] = { ...member, name: e.target.value };
                              handleFieldChange('staff', newStaff);
                            }}
                            placeholder="Nombre"
                            className="flex-1"
                          />
                          <Input
                            value={member.role || ''}
                            onChange={(e) => {
                              const newStaff = [...(formData.staff || [])];
                              newStaff[index] = { ...member, role: e.target.value };
                              handleFieldChange('staff', newStaff);
                            }}
                            placeholder="Rol (Director, Autor, etc.)"
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newStaff = formData.staff?.filter((_, i) => i !== index);
                              handleFieldChange('staff', newStaff);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay miembros del staff agregados aún.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      const newStaff = [
                        ...(formData.staff || []),
                        { 
                          id: Date.now() + Math.random(), // Usar timestamp + random para garantizar unicidad
                          name: '', 
                          role: '' 
                        }
                      ];
                      handleFieldChange('staff', newStaff);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Miembro del Staff
                  </Button>
                </div>
              </div>

            {/* Estudios */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estudios</h3>
              <div className="space-y-3">
                {formData.studios && formData.studios.length > 0 ? (
                  formData.studios.map((studio, index) => (
                    <div key={`studio-${studio.id}-${index}`} className="flex gap-2">
                      <Input
                        value={studio.name || ''}
                        onChange={(e) => {
                          const newStudios = [...(formData.studios || [])];
                          newStudios[index] = { ...studio, name: e.target.value };
                          handleFieldChange('studios', newStudios);
                        }}
                        placeholder="Nombre del estudio"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newStudios = formData.studios?.filter((_, i) => i !== index);
                          handleFieldChange('studios', newStudios);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay estudios agregados aún.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      const newStudios = [
                        ...(formData.studios || []),
                        { 
                          id: Date.now() + Math.random(), // Usar timestamp + random para garantizar unicidad
                          name: '' 
                        }
                      ];
                      handleFieldChange('studios', newStudios);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Estudio
                  </Button>
                </div>
              </div>

            {/* Enlaces Externos (Scans, Sitios Oficiales, etc.) */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Enlaces Externos</h3>
              <p className="text-sm text-muted-foreground">
                Agrega enlaces a scans, sitios oficiales, MyAnimeList, AniList, etc.
              </p>
              <div className="space-y-3">
                {formData.externalLinks && formData.externalLinks.length > 0 ? (
                  formData.externalLinks.map((link, index) => (
                    <div key={`link-${link.id}-${index}`} className="p-3 border rounded-lg space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={link.platform || ''}
                          onChange={(e) => {
                            const newLinks = [...(formData.externalLinks || [])];
                            newLinks[index] = { ...link, platform: e.target.value };
                            handleFieldChange('externalLinks', newLinks);
                          }}
                          className="px-3 py-2 border rounded-md"
                        >
                          <option value="">Seleccionar tipo</option>
                          <option value="scan">Scan/Lectura</option>
                          <option value="official">Sitio Oficial</option>
                          <option value="mal">MyAnimeList</option>
                          <option value="anilist">AniList</option>
                          <option value="kitsu">Kitsu</option>
                          <option value="wiki">Wikipedia</option>
                          <option value="twitter">Twitter</option>
                          <option value="youtube">YouTube</option>
                          <option value="other">Otro</option>
                        </select>
                        <Input
                          value={link.label || ''}
                          onChange={(e) => {
                            const newLinks = [...(formData.externalLinks || [])];
                            newLinks[index] = { ...link, label: e.target.value };
                            handleFieldChange('externalLinks', newLinks);
                          }}
                          placeholder="Etiqueta (opcional)"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newLinks = formData.externalLinks?.filter((_, i) => i !== index);
                            handleFieldChange('externalLinks', newLinks);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        value={link.url || ''}
                        onChange={(e) => {
                          const newLinks = [...(formData.externalLinks || [])];
                          newLinks[index] = { ...link, url: e.target.value };
                          handleFieldChange('externalLinks', newLinks);
                        }}
                        placeholder="https://..."
                        className="w-full"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay enlaces externos agregados aún.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      const newLinks = [
                        ...(formData.externalLinks || []),
                        { 
                          id: Date.now() + Math.random(), // Usar timestamp + random para garantizar unicidad
                          platform: '', 
                          url: '', 
                          label: '' 
                        }
                      ];
                      handleFieldChange('externalLinks', newLinks);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Enlace
                  </Button>
                </div>
              </div>

            {/* Notas de Contribución */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Adicional</h3>

              <div className="space-y-2">
                <Label htmlFor="contributionNotes">Notas (explica qué cambiaste y por qué)</Label>
                <Textarea
                  id="contributionNotes"
                  value={contributionNotes}
                  onChange={(e) => setContributionNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej: Actualicé el número de episodios porque la temporada finalizó..."
                />
              </div>

              <div className="space-y-2">
                <Label>Fuentes (opcional - URLs de verificación)</Label>
                {sources.map((source, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={source}
                      onChange={(e) => updateSource(index, e.target.value)}
                      placeholder="https://myanimelist.net/..."
                    />
                    {sources.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSource(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSource}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Fuente
                </Button>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Contribución'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
