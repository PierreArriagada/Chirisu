'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getMediaPageData, getMediaBySlug } from '@/lib/db';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MediaType, TitleInfo, AnimeDetails } from '@/lib/types';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío.'),
  description: z.string().min(10, 'La descripción es muy corta.'),
  type: z.nativeEnum(['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Manga', 'Webtoon', 'Web Novel']),
  episodes: z.coerce.number().min(0),
  releaseDate: z.string(),
  genres: z.array(z.object({ value: z.string() })).min(1, "Debe tener al menos un género."),
  alternativeTitles: z.array(z.object({
      lang: z.string().min(1, "Idioma requerido."),
      title: z.string().min(1, "Título requerido."),
  })),
});

type FormData = z.infer<typeof formSchema>;

export default function EditContributionPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { user } = useAuth();
    
    const mediaType = params.mediaType as string;
    const slug = params.slug as string;

    const [mediaData, setMediaData] = useState<NonNullable<ReturnType<typeof getMediaPageData>> | null>(null);

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            genres: [],
            alternativeTitles: [],
        }
    });

    const { fields: genreFields, append: appendGenre, remove: removeGenre } = useFieldArray({
        control: form.control,
        name: "genres"
    });

     const { fields: altTitleFields, append: appendAltTitle, remove: removeAltTitle } = useFieldArray({
        control: form.control,
        name: "alternativeTitles"
    });

    useEffect(() => {
        if (slug) {
            const data = getMediaPageData(slug, mediaType as MediaType);
            if (data) {
                setMediaData(data);
                form.reset({
                    title: data.titleInfo.title,
                    description: data.titleInfo.description,
                    type: data.details.type as any,
                    episodes: data.details.episodes,
                    releaseDate: data.details.releaseDate,
                    genres: data.details.genres.map(g => ({ value: g })),
                    alternativeTitles: data.details.alternativeTitles.map(at => ({ lang: at.lang, title: at.title })),
                });
            } else {
                notFound();
            }
        }
    }, [slug, mediaType, form]);


    function onSubmit(data: FormData) {
        // PSQL: En una implementación real, esto enviaría los datos a una tabla `contributions` en la base de datos.
        // `INSERT INTO contributions (user_id, media_id, change_type, payload, status) VALUES ($1, $2, 'edit', $3, 'pending');`
        // El `payload` sería un JSON con los datos del formulario.
        console.log("Datos del formulario enviados para revisión:", data);

        toast({
            title: "¡Contribución enviada!",
            description: "Gracias por tu ayuda. Tu edición ha sido enviada para revisión por los moderadores.",
        });
        router.push(`/${mediaType}/${slug}`);
    }
    
    if (!mediaData) {
        return <div>Cargando...</div>; // O un componente de esqueleto
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editar "{mediaData.titleInfo.title}"</CardTitle>
                <CardDescription>
                    Corrige o completa la información. Tu contribución será revisada por un moderador.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título Principal</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sinopsis</FormLabel>
                                    <FormControl><Textarea {...field} rows={6} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="episodes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Episodios</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="releaseDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Estreno</FormLabel>
                                    <FormControl><Input {...field} placeholder="YYYY-MM-DD" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div>
                            <FormLabel>Géneros</FormLabel>
                            <div className="space-y-2 mt-2">
                                {genreFields.map((field, index) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <FormField
                                            control={form.control}
                                            name={`genres.${index}.value`}
                                            render={({ field }) => (
                                                <FormItem className='flex-grow'>
                                                    <FormControl><Input {...field} placeholder="Ej: Acción" /></FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeGenre(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendGenre({ value: '' })}>
                                Añadir Género
                            </Button>
                            <FormMessage>{form.formState.errors.genres?.message}</FormMessage>
                        </div>
                        
                         <div>
                            <FormLabel>Títulos Alternativos</FormLabel>
                            <div className="space-y-2 mt-2">
                                {altTitleFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-3 gap-2 items-center">
                                        <FormField control={form.control} name={`alternativeTitles.${index}.lang`} render={({ field }) => (
                                            <FormItem><FormControl><Input {...field} placeholder="Idioma (Ej: English)" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`alternativeTitles.${index}.title`} render={({ field }) => (
                                            <FormItem className="col-span-2"><FormControl><Input {...field} placeholder="Título" /></FormControl></FormItem>
                                        )} />
                                         <Button type="button" variant="ghost" size="icon" onClick={() => removeAltTitle(index)} className="col-start-4">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendAltTitle({ lang: '', title: '' })}>
                                Añadir Título Alternativo
                            </Button>
                        </div>
                        
                        <CardFooter className="p-0 pt-6">
                             <Button type="submit">Enviar para Revisión</Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
