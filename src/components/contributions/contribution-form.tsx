/**
 * ========================================
 * COMPONENTE: FORMULARIO DE CONTRIBUCIÓN PARA MANGA/MANHWA/MANHUA/NOVELA/FAN COMIC
 * ========================================
 * Formulario completo basado en el esquema de base de datos
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
import { CharacterSelector } from './character-selector';
import { StaffSelector } from './staff-selector';
import { ScanlationGroupSearch } from './scanlation-group-search';
import { Loader2, Plus, Trash2 } from 'lucide-react';

// Roles para autores/artistas de manga/novela
const WRITTEN_STAFF_ROLES = [
  'Story',
  'Art', 
  'Story & Art',
  'Original Creator',
  'Character Design',
  'Assistant',
  'Editor',
];

// Esquema para enlaces externos
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

// Esquema de validación principal
const contributionSchema = z.object({
  // Títulos
  title_romaji: z.string().min(1, 'El título es requerido'),
  title_english: z.string().optional(),
  title_spanish: z.string().optional(),
  title_native: z.string().optional(),

  // IDs externos
  mal_id: z.string().optional(),
  anilist_id: z.string().optional(),

  // Sinopsis
  synopsis: z.string().min(20, 'La sinopsis debe tener al menos 20 caracteres'),

  // Contenido
  chapters: z.string().optional(),
  volumes: z.string().optional(),

  // Fechas
  start_date: z.string().optional(),
  end_date: z.string().optional(),

  // URLs de imágenes
  cover_image_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),
  banner_image_url: z.string().url('Debe ser una URL válida').optional().or(z.literal('')),

  // Estado
  status: z.string().min(1, 'El estado es requerido'),

  // Formato/Tipo
  format: z.string().min(1, 'El formato es requerido'),

  // País de origen
  country_of_origin: z.string().optional(),

  // Serialización/Editorial
  serialization: z.string().optional(),

  // NSFW
  is_nsfw: z.boolean().default(false),

  // Géneros (IDs)
  genre_ids: z.array(z.number()).min(1, 'Selecciona al menos un género'),

  // Enlaces externos separados
  official_sites: z.array(externalLinkSchema).optional(),
  reading_platforms: z.array(externalLinkSchema).optional(),
  fan_translations: z.array(fanTranslationSchema).optional(),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface Genre {
  id: number;
  code: string;
  nameEs: string;
  nameEn: string;
}

interface ContributionFormProps {
  mediaType: 'Manga' | 'Manhwa' | 'Manhua' | 'Novela' | 'Fan Comic';
}

// Opciones según tipo de media
const FORMAT_OPTIONS: Record<string, string[]> = {
  'Manga': ['Manga', 'One-shot', 'Doujinshi'],
  'Manhwa': ['Webtoon', 'Manhwa'],
  'Manhua': ['Manhua', 'Webtoon'],
  'Novela': ['Light Novel', 'Web Novel', 'Novel'],
  'Fan Comic': ['Webtoon', 'Fan-made', 'Doujinshi'],
};

const STATUS_OPTIONS = [
  { value: 'finished', label: 'Finalizado' },
  { value: 'ongoing', label: 'En publicación' },
  { value: 'not_yet_released', label: 'Aún no publicado' },
  { value: 'on_hiatus', label: 'En pausa' },
  { value: 'discontinued', label: 'Descontinuado' },
];

// Configuración por país
const COUNTRY_CONFIG: Record<string, { code: string; nativeLabel: string; nativePlaceholder: string }> = {
  'Manga': { code: 'JP', nativeLabel: 'Título en Japonés', nativePlaceholder: '日本語タイトル' },
  'Manhwa': { code: 'KR', nativeLabel: 'Título en Coreano', nativePlaceholder: '한국어 제목' },
  'Manhua': { code: 'CN', nativeLabel: 'Título en Chino', nativePlaceholder: '中文标题' },
  'Novela': { code: 'JP', nativeLabel: 'Título Original', nativePlaceholder: 'Título en idioma original' },
  'Fan Comic': { code: '', nativeLabel: 'Título Original', nativePlaceholder: 'Título en idioma original' },
};

export default function ContributionForm({ mediaType }: ContributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(true);

  // Estados para selectores complejos
  const [selectedStaff, setSelectedStaff] = useState<any[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<any[]>([]);

  // Configuración según el tipo de media
  const config = COUNTRY_CONFIG[mediaType] || COUNTRY_CONFIG['Manga'];
  const formatOptions = FORMAT_OPTIONS[mediaType] || FORMAT_OPTIONS['Manga'];

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      is_nsfw: false,
      genre_ids: [],
      status: 'ongoing',
      country_of_origin: config.code,
      official_sites: [],
      reading_platforms: [],
      fan_translations: [],
    },
  });

  // Field arrays para enlaces
  const { fields: officialSitesFields, append: appendOfficialSite, remove: removeOfficialSite } = useFieldArray({
    control: form.control,
    name: 'official_sites',
  });

  const { fields: readingFields, append: appendReading, remove: removeReading } = useFieldArray({
    control: form.control,
    name: 'reading_platforms',
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

  const onSubmit = async (data: ContributionFormData) => {
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
      // Mapear el tipo de media al formato de la BD
      const mediaTypeMap: Record<string, string> = {
        'Manga': 'manga',
        'Manhwa': 'manhwa',
        'Manhua': 'manhua',
        'Novela': 'novel',
        'Fan Comic': 'fan_comic',
      };

      // Preparar datos de contribución
      const contributionData = {
        ...data,
        staff: selectedStaff,
        characters: selectedCharacters,
        chapters: data.chapters ? parseInt(data.chapters) : null,
        volumes: data.volumes ? parseInt(data.volumes) : null,
        mal_id: data.mal_id ? parseInt(data.mal_id) : null,
        anilist_id: data.anilist_id ? parseInt(data.anilist_id) : null,
      };

      // Enviar contribución
      const response = await fetch('/api/user/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionType: 'full',
          mediaType: mediaTypeMap[mediaType] || mediaType.toLowerCase(),
          mediaId: null,
          contributionData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: '¡Contribución enviada!',
          description: `Tu ${mediaType.toLowerCase()} ha sido enviado para revisión por un moderador.`,
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
          <CardTitle className="text-3xl font-bold">Añadir Nuevo {mediaType}</CardTitle>
          <CardDescription className="text-base">
            Completa toda la información del {mediaType.toLowerCase()}. Tu contribución será revisada por un moderador antes de ser publicada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

              {/* ========== SECCIÓN 1: INFORMACIÓN BÁSICA ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">📝 Información Básica</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title_romaji"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título Principal (Romaji) *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Solo Leveling" />
                        </FormControl>
                        <FormDescription>
                          Título en caracteres latinos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title_english"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título en Inglés</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="English title" />
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
                            <Input {...field} placeholder="Título traducido" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title_native"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.nativeLabel}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={config.nativePlaceholder} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="format"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formato *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona formato" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {formatOptions.map((format) => (
                                <SelectItem key={format} value={format}>
                                  {format}
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
                      name="country_of_origin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País de Origen</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={config.code} maxLength={10} />
                          </FormControl>
                          <FormDescription>
                            Código de país (JP, KR, CN, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </Card>

              {/* ========== SECCIÓN 2: SINOPSIS ========== */}
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
                          placeholder="Escribe una sinopsis detallada..."
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

              {/* ========== SECCIÓN 3: CONTENIDO Y ESTADO ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">📊 Contenido y Estado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="chapters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capítulos</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Ej: 200" />
                        </FormControl>
                        <FormDescription>
                          Total de capítulos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="volumes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volúmenes</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Ej: 15" />
                        </FormControl>
                        <FormDescription>
                          Total de volúmenes
                        </FormDescription>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    name="serialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serialización / Editorial</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ej: Weekly Shonen Jump, Kakao, etc." />
                        </FormControl>
                        <FormDescription>
                          Revista o plataforma donde se publica
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              {/* ========== SECCIÓN 4: GÉNEROS ========== */}
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

              {/* ========== SECCIÓN 5: STAFF (AUTORES/ARTISTAS) ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">✍️ Autores y Artistas</h3>
                <StaffSelector
                  selectedStaff={selectedStaff}
                  onChange={setSelectedStaff}
                  roles={WRITTEN_STAFF_ROLES}
                />
              </Card>

              {/* ========== SECCIÓN 6: PERSONAJES ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">👥 Personajes</h3>
                <CharacterSelector
                  selectedCharacters={selectedCharacters}
                  onChange={setSelectedCharacters}
                />
              </Card>

              {/* ========== SECCIÓN 7: IMÁGENES ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🖼️ Imágenes</h3>
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
                          URL de la imagen de portada
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
                </div>
              </Card>

              {/* ========== SECCIÓN 8: IDs EXTERNOS ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🔗 IDs Externos (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
              </Card>

              {/* ========== SECCIÓN 9: ENLACES EXTERNOS ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">🌐 Enlaces Externos</h3>
                
                {/* Sitios Oficiales */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">🏠 Sitios Oficiales</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendOfficialSite({ site_name: '', url: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  {officialSitesFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay sitios oficiales agregados</p>
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
                                  <Input {...field} placeholder="Nombre del sitio" />
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

                {/* Plataformas de Lectura */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">📚 Plataformas de Lectura</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendReading({ site_name: '', url: '' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <FormDescription className="mb-2">
                    Plataformas oficiales: Webtoon, Tapas, MangaPlus, etc.
                  </FormDescription>
                  {readingFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay plataformas agregadas</p>
                  ) : (
                    <div className="space-y-2">
                      {readingFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start">
                          <FormField
                            control={form.control}
                            name={`reading_platforms.${index}.site_name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input {...field} placeholder="Nombre de plataforma" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`reading_platforms.${index}.url`}
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
                            onClick={() => removeReading(index)}
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
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">📖 Fan Translations / Scanlations</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendFanTrans({ site_name: '', url: '', status: 'active' })}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <FormDescription className="mb-2">
                    Sitios de traducciones no oficiales. Busca grupos existentes o agrega nuevos.
                  </FormDescription>
                  {fanTransFields.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay traducciones agregadas</p>
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
                                  <FormLabel className="text-xs">Grupo de Scanlation</FormLabel>
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
                                  <FormLabel className="text-xs">URL del proyecto</FormLabel>
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

              {/* ========== SECCIÓN 10: OTROS METADATOS ========== */}
              <Card className="p-6 bg-muted/20">
                <h3 className="text-xl font-semibold mb-4">⚙️ Otros Metadatos</h3>
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
                          Marca si el contenido es para adultos
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </Card>

              {/* ========== BOTÓN DE ENVÍO ========== */}
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
