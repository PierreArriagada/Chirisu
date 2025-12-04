/**
 * ========================================
 * COMPONENTE: FORMULARIO COMPLETO DE CONTRIBUCIÓN DE ANIME
 * ========================================
 * Formulario exhaustivo basado en el esquema de base de datos
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { StudioSelector } from './studio-selector';
import { StaffSelector } from './staff-selector';
import { CharacterSelector } from './character-selector';
import { ScanlationGroupSearch } from './scanlation-group-search';
import { Loader2, Plus, Trash2 } from 'lucide-react';

// Esquema de validación basado en la BD
const episodeSchema = z.object({
  episode_number: z.string().min(1, 'Número requerido'),
  title: z.string().optional(),
  title_romaji: z.string().optional(),
  title_japanese: z.string().optional(),
  synopsis: z.string().optional(),
  air_date: z.string().optional(),
  duration: z.string().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_filler: z.boolean().default(false),
  is_recap: z.boolean().default(false),
});

const externalLinkSchema = z.object({
  site_name: z.string().min(1, 'Nombre requerido'),
  url: z.string().url('URL inválida'),
});

// Esquema para traducciones de fans con estado y grupo
const fanTranslationSchema = z.object({
  site_name: z.string().min(1, 'Nombre requerido'),
  url: z.string().url('URL inválida'),
  status: z.enum(['active', 'hiatus', 'completed', 'dropped', 'licensed']).default('active'),
  group_id: z.number().optional(), // ID del grupo si existe en BD
});

// Estados disponibles para traducciones de fans
const FAN_TRANSLATION_STATUS_OPTIONS = [
  { value: 'active', label: 'Traduciendo' },
  { value: 'hiatus', label: 'En Pausa' },
  { value: 'completed', label: 'Completado' },
  { value: 'dropped', label: 'Abandonado' },
  { value: 'licensed', label: 'Licenciado' },
];

const animeContributionSchema = z.object({
  // Títulos
  title_romaji: z.string().min(1, 'El título en romaji es requerido'),
  title_english: z.string().optional(),
  title_spanish: z.string().optional(),
  title_native: z.string().optional(),

  // IDs externos
  mal_id: z.string().optional(),
  anilist_id: z.string().optional(),
  kitsu_id: z.string().optional(),

  // Sinopsis y descripción
  synopsis: z.string().min(20, 'La sinopsis debe tener al menos 20 caracteres'),

  // Episodios y duración
  episode_count: z.string().optional(),
  duration: z.string().optional(), // en minutos

  // Episodios individuales
  episodes: z.array(episodeSchema).optional(),

  // Fechas
  start_date: z.string().optional(),
  end_date: z.string().optional(),

  // URLs de imágenes
  cover_image_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  banner_image_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  trailer_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),

  // Estado
  status: z.string().min(1, 'El estado es requerido'),

  // Temporada
  season: z.string().optional(),
  season_year: z.string().optional(),

  // Fuente
  source: z.string().optional(),

  // Tipo
  type: z.enum(['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music']),

  // País de origen
  country_of_origin: z.string().optional(),

  // NSFW
  is_nsfw: z.boolean().default(false),

  // Géneros (IDs)
  genre_ids: z.array(z.number()).min(1, 'Selecciona al menos un género'),

  // Enlaces externos separados por tipo
  official_sites: z.array(externalLinkSchema).optional(),
  streaming_platforms: z.array(externalLinkSchema).optional(),
  fan_translations: z.array(fanTranslationSchema).optional(),

  // Enlaces externos adicionales (legacy)
  external_links: z.array(z.object({
    site_name: z.string(),
    url: z.string().url(),
  })).optional(),
});

type AnimeContributionFormData = z.infer<typeof animeContributionSchema>;

interface Genre {
  id: number;
  code: string;
  nameEs: string;
  nameEn: string;
}

const ANIME_TYPES = ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'];
const ANIME_SOURCES = ['Manga', 'Light Novel', 'Visual Novel', 'Video Game', 'Original', 'Novel', 'Web Novel', 'Other'];
const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
const STATUS_OPTIONS = [
  { value: 'finished', label: 'Finalizado' },
  { value: 'ongoing', label: 'En emisión' },
  { value: 'not_yet_aired', label: 'Aún no estrenado' },
  { value: 'on_hiatus', label: 'En pausa' },
  { value: 'discontinued', label: 'Descontinuado' },
];

interface AnimeContributionFormProps {
  mediaType?: 'anime' | 'donghua';
}

export function AnimeContributionForm({ mediaType = 'anime' }: AnimeContributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  // Etiquetas según el tipo de media
  const isAnime = mediaType === 'anime';
  const mediaLabel = isAnime ? 'Anime' : 'Donghua';
  const nativeLabel = isAnime ? 'Título en Japonés' : 'Título en Chino';
  const nativePlaceholder = isAnime ? '日本語タイトル' : '中文标题';
  const countryDefault = isAnime ? 'JP' : 'CN';
  const vaLabel = isAnime ? 'japonés' : 'chino';

  // Estados para selectores complejos
  const [selectedStudios, setSelectedStudios] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<any[]>([]);

  const form = useForm<AnimeContributionFormData>({
    resolver: zodResolver(animeContributionSchema),
    defaultValues: {
      type: 'TV',
      is_nsfw: false,
      genre_ids: [],
      status: 'not_yet_aired',
      episodes: [],
      official_sites: [],
      streaming_platforms: [],
      fan_translations: [],
    },
  });

  // Field arrays para episodios y enlaces
  const { fields: episodeFields, append: appendEpisode, remove: removeEpisode } = useFieldArray({
    control: form.control,
    name: 'episodes',
  });

  const { fields: officialSitesFields, append: appendOfficialSite, remove: removeOfficialSite } = useFieldArray({
    control: form.control,
    name: 'official_sites',
  });

  const { fields: streamingFields, append: appendStreaming, remove: removeStreaming } = useFieldArray({
    control: form.control,
    name: 'streaming_platforms',
  });

  const { fields: fanTransFields, append: appendFanTrans, remove: removeFanTrans } = useFieldArray({
    control: form.control,
    name: 'fan_translations',
  });

  // Cargar géneros
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres');
        const data = await response.json();
        if (data.success) {
          setGenres(data.genres);
        }
      } catch (error) {
        console.error('Error al cargar géneros:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los géneros',
          variant: 'destructive',
        });
      } finally {
        setLoadingGenres(false);
      }
    };

    fetchGenres();
  }, [toast]);

  const onSubmit = async (data: AnimeContributionFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para enviar una contribución',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos de contribución
      const contributionData = {
        ...data,
        studios: selectedStudios,
        staff: selectedStaff,
        characters: selectedCharacters,
        episode_count: data.episode_count ? parseInt(data.episode_count) : null,
        duration: data.duration ? parseInt(data.duration) : null,
        season_year: data.season_year ? parseInt(data.season_year) : null,
        mal_id: data.mal_id ? parseInt(data.mal_id) : null,
        anilist_id: data.anilist_id ? parseInt(data.anilist_id) : null,
        kitsu_id: data.kitsu_id ? parseInt(data.kitsu_id) : null,
      };

      // Enviar contribución
      const response = await fetch('/api/user/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionType: 'full',
          mediaType: mediaType,
          mediaId: null, // null porque es una creación nueva
          contributionData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '¡Contribución enviada!',
          description: `Tu ${mediaLabel.toLowerCase()} ha sido enviado para revisión por un moderador.`,
        });
        router.push('/contribution-center');
      } else {
        throw new Error(result.error || 'Error al enviar contribución');
      }
    } catch (error: any) {
      console.error('Error al enviar contribución:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la contribución',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso Denegado</CardTitle>
          <CardDescription>Debes iniciar sesión para contribuir</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Añadir Nuevo {mediaLabel}</CardTitle>
          <CardDescription className="text-base">
            Completa toda la información del {mediaLabel.toLowerCase()}. Tu contribución será revisada por un moderador antes de ser publicada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">📝 Información Básica</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title_romaji"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título (Romaji) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Shingeki no Kyojin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="title_english"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título en Inglés</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Attack on Titan" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title_spanish"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título en Español</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Ataque a los Titanes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title_native"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{nativeLabel}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={nativePlaceholder} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ANIME_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fuente</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona la fuente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ANIME_SOURCES.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Card>

              {/* SECCIÓN 2: SINOPSIS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">📖 Sinopsis</h3>
                <FormField
                  control={form.control}
                  name="synopsis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sinopsis *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={8}
                          placeholder="Escribe una sinopsis detallada del anime..."
                        />
                      </FormControl>
                      <FormDescription>
                        Mínimo 20 caracteres. Describe la trama principal sin spoilers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Card>

              {/* SECCIÓN 3: EPISODIOS Y FECHAS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">📅 Episodios y Fechas</h3>
                
                {/* Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="episode_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total de Episodios</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración por episodio (min)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="24" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Fin</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="season"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temporada</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona temporada" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEASONS.map((season) => (
                              <SelectItem key={season} value={season}>
                                {season}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="season_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Año</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="2024" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Episodios Individuales */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium">📺 Episodios Individuales (Opcional)</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendEpisode({
                        episode_number: String(episodeFields.length + 1),
                        title: '',
                        title_romaji: '',
                        title_japanese: '',
                        synopsis: '',
                        air_date: '',
                        duration: '',
                        thumbnail_url: '',
                        is_filler: false,
                        is_recap: false,
                      })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Episodio
                    </Button>
                  </div>
                  
                  {episodeFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No has agregado episodios individuales. Puedes agregar cada episodio con su información detallada.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {episodeFields.map((field, index) => (
                        <Card key={field.id} className="p-4 bg-background/50">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">Episodio {index + 1}</h5>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEpisode(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.episode_number`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número *</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" placeholder="1" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.title`}
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Título (Español)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Título del episodio" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.air_date`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Fecha de emisión</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.title_romaji`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título Romaji</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Título en romaji" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.title_japanese`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Título {isAnime ? 'Japonés' : 'Chino'}</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder={nativePlaceholder} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.duration`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Duración (min)</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="number" placeholder="24" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.synopsis`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sinopsis del episodio</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} rows={2} placeholder="Breve descripción del episodio..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.thumbnail_url`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>URL Thumbnail</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="https://..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="flex gap-6 mt-3">
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.is_filler`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer">Es Filler</FormLabel>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`episodes.${index}.is_recap`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="cursor-pointer">Es Recap</FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* SECCIÓN 4: GÉNEROS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🎭 Géneros</h3>
                {loadingGenres ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="genre_ids"
                    render={() => (
                      <FormItem>
                        <FormDescription>Selecciona al menos un género *</FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                          {genres.map((genre) => (
                            <FormField
                              key={genre.id}
                              control={form.control}
                              name="genre_ids"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(genre.id)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...field.value, genre.id]
                                          : field.value?.filter((id) => id !== genre.id);
                                        field.onChange(newValue);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {genre.nameEs}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </Card>

              {/* SECCIÓN 5: ESTUDIOS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🏢 Estudios de Animación</h3>
                <StudioSelector
                  selectedStudios={selectedStudios}
                  onChange={setSelectedStudios}
                />
              </Card>

              {/* SECCIÓN 6: STAFF */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">👥 Staff</h3>
                <StaffSelector
                  selectedStaff={selectedStaff}
                  onChange={setSelectedStaff}
                />
              </Card>

              {/* SECCIÓN 7: PERSONAJES */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🎭 Personajes</h3>
                <CharacterSelector
                  selectedCharacters={selectedCharacters}
                  onChange={setSelectedCharacters}
                />
              </Card>

              {/* SECCIÓN 8: IMÁGENES Y MULTIMEDIA */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🖼️ Imágenes y Multimedia</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cover_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL de la Portada</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen de portada del anime
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="banner_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Banner</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://..." />
                        </FormControl>
                        <FormDescription>
                          URL de la imagen del banner (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trailer_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Tráiler</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.youtube.com/watch?v=..." />
                        </FormControl>
                        <FormDescription>
                          URL del tráiler en YouTube (opcional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* SECCIÓN 9: IDS EXTERNOS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🔗 IDs Externos (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="mal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MyAnimeList ID</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="anilist_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AniList ID</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kitsu_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kitsu ID</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="12345" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* SECCIÓN 10: OTROS METADATOS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">⚙️ Otros Metadatos</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="country_of_origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>País de Origen</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={countryDefault} maxLength={10} />
                        </FormControl>
                        <FormDescription>
                          Código de país (ej: JP para Japón, CN para China)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_nsfw"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Contenido NSFW</FormLabel>
                          <FormDescription>
                            Marca si el anime contiene contenido para adultos
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* SECCIÓN 11: ENLACES EXTERNOS */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🌐 Enlaces Externos</h3>
                
                {/* Sitios Oficiales */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium">🏠 Sitios Oficiales</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOfficialSite({ site_name: '', url: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Sitio
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Página oficial del anime, sitio del estudio, etc.
                  </p>
                  
                  {officialSitesFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No hay sitios oficiales agregados</p>
                  ) : (
                    <div className="space-y-2">
                      {officialSitesFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`official_sites.${index}.site_name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Nombre (ej: Sitio Oficial)" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`official_sites.${index}.url`}
                            render={({ field }) => (
                              <FormItem className="flex-[2]">
                                <FormControl>
                                  <Input {...field} placeholder="https://..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOfficialSite(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Plataformas de Streaming */}
                <div className="mb-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium">📺 Plataformas de Streaming</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendStreaming({ site_name: '', url: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Plataforma
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Crunchyroll, Netflix, Funimation, etc.
                  </p>
                  
                  {streamingFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No hay plataformas agregadas</p>
                  ) : (
                    <div className="space-y-2">
                      {streamingFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`streaming_platforms.${index}.site_name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Nombre (ej: Crunchyroll)" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`streaming_platforms.${index}.url`}
                            render={({ field }) => (
                              <FormItem className="flex-[2]">
                                <FormControl>
                                  <Input {...field} placeholder="https://..." />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStreaming(index)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fan Translations */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-medium">📖 Fan Translations / Fansubs</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFanTrans({ site_name: '', url: '', status: 'active' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Sitio
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sitios de fansubs o traducciones no oficiales. Busca grupos existentes o agrega nuevos.
                  </p>
                  
                  {fanTransFields.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">No hay fan translations agregadas</p>
                  ) : (
                    <div className="space-y-3">
                      {fanTransFields.map((field, index) => (
                        <div key={field.id} className="p-3 bg-muted/30 rounded-lg space-y-3">
                          <div className="flex gap-2 items-start">
                            {/* Campo de búsqueda de grupo */}
                            <FormField
                              control={form.control}
                              name={`fan_translations.${index}.site_name`}
                              render={({ field: nameField }) => (
                                <FormItem className="flex-1 min-w-[200px]">
                                  <FormLabel className="text-xs">Grupo de Fansub</FormLabel>
                                  <FormControl>
                                    <ScanlationGroupSearch
                                      value={nameField.value}
                                      onChange={(name, groupId) => {
                                        nameField.onChange(name);
                                        // Actualizar el group_id si existe
                                        if (groupId) {
                                          form.setValue(`fan_translations.${index}.group_id`, groupId);
                                        }
                                      }}
                                      placeholder="Buscar grupo..."
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeFanTrans(index)}
                              className="text-destructive mt-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
                            <FormField
                              control={form.control}
                              name={`fan_translations.${index}.url`}
                              render={({ field }) => (
                                <FormItem className="flex-[2] min-w-[200px]">
                                  <FormLabel className="text-xs">URL del fansub</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="https://..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`fan_translations.${index}.status`}
                              render={({ field }) => (
                                <FormItem className="w-[140px]">
                                  <FormLabel className="text-xs">Estado</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value || 'active'}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Estado" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {FAN_TRANSLATION_STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>

              {/* BOTÓN DE ENVÍO */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/contribution-center')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar para Revisión'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
