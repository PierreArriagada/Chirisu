'use client';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MediaType } from '@/lib/types';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';

const GENRES = ["Acción", "Aventura", "Fantasía", "Ciencia Ficción", "Romance"];

const formSchema = z.object({
  // 1. Información Básica
  title: z.string().min(1, 'El título no puede estar vacío.'),
  title_english: z.string().optional(),
  title_japanese: z.string().optional(),
  mal_id: z.coerce.number().optional(),
  format: z.string().min(1, 'Debes seleccionar un formato.'),

  // 2. Contenido y Descripción
  synopsis: z.string().min(10, 'La sinopsis es muy corta.'),
  background: z.string().optional(),
  episodes: z.coerce.number().optional(),
  chapters: z.coerce.number().optional(),
  volumes: z.coerce.number().optional(),
  duration: z.string().optional(),

  // 3. Estado y Fechas
  status: z.string().min(1, "El estado es requerido."),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  season: z.string().optional(),

  // 4. Clasificación y Géneros
  genres: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Tienes que seleccionar al menos un género.",
  }),
  themes: z.string().optional(),
  demographics: z.string().optional(),
  rating: z.string().optional(), // PG-13, R, etc.
  
  // 5. Producción y Creación
  studios: z.string().optional(),
  producers: z.string().optional(),
  authors: z.string().optional(),
  artists: z.string().optional(),
  serialization: z.string().optional(),
  
  // 6. Multimedia
  trailer_url: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface ContributionFormProps {
    mediaType: "Anime" | "Dougua" | "Manga" | "Novela" | "Fan Comic" | "Manhua" | "Manwha";
}

const mediaFormatOptions: Record<ContributionFormProps['mediaType'], string[]> = {
    "Anime": ["TV", "Movie", "OVA", "ONA", "Special"],
    "Dougua": ["TV", "Movie", "OVA", "ONA", "Special"],
    "Manga": ["Manga", "One-shot"],
    "Manhua": ["Manhua"],
    "Manwha": ["Webtoon"],
    "Novela": ["Web Novel", "Light Novel"],
    "Fan Comic": ["Webtoon", "Fan-made", "Doujinshi"],
};

const statusOptions = ["Finalizado", "En emisión", "Próximamente", "Cancelado", "En pausa"];
const seasonOptions = ["Invierno", "Primavera", "Verano", "Otoño"];
const ratingOptions = ["G - All Ages", "PG - Children", "PG-13 - Teens 13 or older", "R - 17+ (violence & profanity)", "R+ - Mild Nudity", "Rx - Hentai"];


export default function ContributionForm({ mediaType }: ContributionFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const isAnimated = mediaType === 'Anime' || mediaType === 'Dougua';
    const isWritten = !isAnimated;

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            synopsis: '',
            genres: [],
        }
    });

    function onSubmit(data: FormData) {
        console.log("Nueva contribución enviada para revisión:", { mediaType, ...data });
        toast({
            title: "¡Contribución enviada!",
            description: `Gracias por tu ayuda. Tu propuesta para añadir "${data.title}" ha sido enviada para revisión.`,
        });
        router.push(`/contribution-center`);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Añadir Nuevo {mediaType}</CardTitle>
                <CardDescription>
                    Completa la información. Tu contribución será revisada por un moderador antes de ser publicada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* --- BASIC INFORMATION --- */}
                        <Card className='p-6 bg-muted/20'>
                             <h3 className="text-lg font-semibold mb-4">Información Básica</h3>
                             <div className="space-y-4">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Título Principal</FormLabel><FormControl><Input {...field} placeholder={`Ej: ${mediaType} Asombroso`} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <FormField control={form.control} name="title_english" render={({ field }) => (
                                        <FormItem><FormLabel>Título en Inglés (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="title_japanese" render={({ field }) => (
                                        <FormItem><FormLabel>Título en Japonés (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="format" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Formato</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder={`Selecciona el formato de ${mediaType}`} /></SelectTrigger></FormControl>
                                                <SelectContent>{mediaFormatOptions[mediaType].map(option => (<SelectItem key={option} value={option}>{option}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="mal_id" render={({ field }) => (
                                        <FormItem><FormLabel>MyAnimeList ID (Opcional)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                             </div>
                        </Card>
                        
                        {/* --- CONTENT & DESCRIPTION --- */}
                        <Card className='p-6 bg-muted/20'>
                            <h3 className="text-lg font-semibold mb-4">Contenido y Descripción</h3>
                            <div className="space-y-4">
                                <FormField control={form.control} name="synopsis" render={({ field }) => (
                                    <FormItem><FormLabel>Sinopsis</FormLabel><FormControl><Textarea {...field} rows={6} placeholder="Una breve descripción de la trama..." /></FormControl><FormMessage /></FormItem>
                                )}/>
                                {isAnimated ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="episodes" render={({ field }) => (
                                            <FormItem><FormLabel>Episodios</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="duration" render={({ field }) => (
                                            <FormItem><FormLabel>Duración (por ep.)</FormLabel><FormControl><Input {...field} placeholder="Ej: 24 min" /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="chapters" render={({ field }) => (
                                            <FormItem><FormLabel>Capítulos</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={form.control} name="volumes" render={({ field }) => (
                                            <FormItem><FormLabel>Volúmenes</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* --- STATUS & DATES --- */}
                        <Card className='p-6 bg-muted/20'>
                            <h3 className="text-lg font-semibold mb-4">Estado y Fechas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField control={form.control} name="status" render={({ field }) => (
                                    <FormItem><FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona estado" /></SelectTrigger></FormControl>
                                        <SelectContent>{statusOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="start_date" render={({ field }) => (
                                    <FormItem><FormLabel>Fecha de Inicio</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="end_date" render={({ field }) => (
                                    <FormItem><FormLabel>Fecha de Fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                {isAnimated && <FormField control={form.control} name="season" render={({ field }) => (
                                    <FormItem><FormLabel>Temporada de Estreno</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona temporada" /></SelectTrigger></FormControl>
                                        <SelectContent>{seasonOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>}
                            </div>
                        </Card>
                        
                         {/* --- CLASSIFICATION & GENRES --- */}
                        <Card className='p-6 bg-muted/20'>
                            <h3 className="text-lg font-semibold mb-4">Clasificación y Géneros</h3>
                            <div className="space-y-4">
                               <FormField
                                  control={form.control}
                                  name="genres"
                                  render={() => (
                                    <FormItem>
                                      <div className="mb-4">
                                        <FormLabel className="text-base">Géneros</FormLabel>
                                        <FormDescription>Selecciona al menos un género.</FormDescription>
                                      </div>
                                      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                                        {GENRES.map((item) => (
                                          <FormField
                                            key={item}
                                            control={form.control}
                                            name="genres"
                                            render={({ field }) => {
                                              return (
                                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                                  <FormControl>
                                                    <Checkbox
                                                      checked={field.value?.includes(item)}
                                                      onCheckedChange={(checked) => {
                                                        return checked
                                                          ? field.onChange([...field.value, item])
                                                          : field.onChange(field.value?.filter((value) => value !== item));
                                                      }}
                                                    />
                                                  </FormControl>
                                                  <FormLabel className="font-normal">{item}</FormLabel>
                                                </FormItem>
                                              );
                                            }}
                                          />
                                        ))}
                                      </div>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField control={form.control} name="rating" render={({ field }) => (
                                    <FormItem><FormLabel>Clasificación por Edad</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona clasificación" /></SelectTrigger></FormControl>
                                        <SelectContent>{ratingOptions.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </Card>

                        {/* --- PRODUCTION --- */}
                        <Card className='p-6 bg-muted/20'>
                            <h3 className="text-lg font-semibold mb-4">Producción y Creación</h3>
                            {isAnimated ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="studios" render={({ field }) => (
                                        <FormItem><FormLabel>Estudios</FormLabel><FormControl><Input {...field} placeholder="Ej: A-1 Pictures" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="producers" render={({ field }) => (
                                        <FormItem><FormLabel>Productores</FormLabel><FormControl><Input {...field} placeholder="Ej: Aniplex" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="authors" render={({ field }) => (
                                        <FormItem><FormLabel>Autores</FormLabel><FormControl><Input {...field} placeholder="Ej: Kentaro Miura" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="serialization" render={({ field }) => (
                                        <FormItem><FormLabel>Publicado en</FormLabel><FormControl><Input {...field} placeholder="Ej: Weekly Shonen Jump" /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            )}
                        </Card>
                         {/* --- MEDIA --- */}
                        {isAnimated && <Card className='p-6 bg-muted/20'>
                             <h3 className="text-lg font-semibold mb-4">Multimedia</h3>
                             <div className="space-y-4">
                                <FormField control={form.control} name="trailer_url" render={({ field }) => (
                                    <FormItem><FormLabel>URL del Tráiler (YouTube)</FormLabel><FormControl><Input {...field} placeholder="https://www.youtube.com/watch?v=..." /></FormControl><FormMessage /></FormItem>
                                )}/>
                             </div>
                        </Card>}
                        
                        <CardFooter className="p-0 pt-6">
                             <Button type="submit">Enviar para Revisión</Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
