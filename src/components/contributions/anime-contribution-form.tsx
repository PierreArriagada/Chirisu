/**
 * ========================================
 * COMPONENTE: FORMULARIO COMPLETO DE CONTRIBUCIÓN DE ANIME
 * ========================================
 * Formulario exhaustivo basado en el esquema de base de datos
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';

// Esquema de validación basado en la BD
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

  // Enlaces externos adicionales
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

export function AnimeContributionForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

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
    },
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
          mediaType: 'anime',
          mediaId: null, // null porque es una creación nueva
          contributionData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '¡Contribución enviada!',
          description: 'Tu anime ha sido enviado para revisión por un moderador.',
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
          <CardTitle className="text-3xl font-bold">Añadir Nuevo Anime</CardTitle>
          <CardDescription className="text-base">
            Completa toda la información del anime. Tu contribución será revisada por un moderador antes de ser publicada.
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
                          <FormLabel>Título Nativo</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 進撃の巨人" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="episode_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episodios</FormLabel>
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
                        <FormLabel>Duración (min)</FormLabel>
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
                          <Input {...field} placeholder="JP" maxLength={10} />
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
