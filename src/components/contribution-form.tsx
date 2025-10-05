'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MediaType } from '@/lib/types';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const formSchema = z.object({
  title: z.string().min(1, 'El título no puede estar vacío.'),
  description: z.string().min(10, 'La descripción es muy corta.'),
  type: z.string().min(1, 'Debes seleccionar un tipo.'),
  episodesOrChapters: z.coerce.number().min(0, 'Debe ser un número positivo.'),
  releaseDate: z.string().optional(),
  genres: z.array(z.object({ value: z.string().min(1, "El género no puede estar vacío.") })).min(1, "Debe tener al menos un género."),
  alternativeTitles: z.array(z.object({
      lang: z.string().min(1, "Idioma requerido."),
      title: z.string().min(1, "Título requerido."),
  })).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ContributionFormProps {
    mediaType: "Anime" | "Dougua" | "Manga" | "Novela" | "Fan Comic";
}

const mediaTypeOptions = {
    "Anime": ["TV", "Movie", "OVA", "ONA", "Special"],
    "Dougua": ["TV", "Movie", "OVA", "ONA", "Special"],
    "Manga": ["Manga", "One-shot"],
    "Novela": ["Web Novel", "Light Novel"],
    "Fan Comic": ["Webtoon", "Fan-made"],
};

export default function ContributionForm({ mediaType }: ContributionFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const isAnimated = mediaType === 'Anime' || mediaType === 'Dougua';
    const episodesOrChaptersLabel = isAnimated ? "Episodios" : "Capítulos";

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            type: '',
            episodesOrChapters: 0,
            genres: [{ value: '' }],
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

    function onSubmit(data: FormData) {
        // PSQL: En una implementación real, esto enviaría los datos a una tabla `contributions`
        // con `change_type = 'new_entry'`.
        // `INSERT INTO contributions (user_id, change_type, payload, status) VALUES ($1, 'new_entry', $2, 'pending');`
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
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Título Principal</FormLabel>
                                    <FormControl><Input {...field} placeholder={`Ej: ${mediaType} Asombroso`} /></FormControl>
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
                                    <FormControl><Textarea {...field} rows={6} placeholder="Una breve descripción de la trama..." /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Selecciona el tipo de ${mediaType}`} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mediaTypeOptions[mediaType].map(option => (
                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="episodesOrChapters" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{episodesOrChaptersLabel}</FormLabel>
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
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeGenre(index)} disabled={genreFields.length <= 1}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendGenre({ value: '' })}>
                                Añadir Género
                            </Button>
                             <FormMessage>{form.formState.errors.genres?.root?.message}</FormMessage>
                        </div>
                        
                         <div>
                            <FormLabel>Títulos Alternativos (Opcional)</FormLabel>
                            <div className="space-y-2 mt-2">
                                {altTitleFields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-3 gap-2 items-center">
                                        <FormField control={form.control} name={`alternativeTitles.${index}.lang`} render={({ field }) => (
                                            <FormItem><FormControl><Input {...field} placeholder="Idioma (Ej: English)" /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name={`alternativeTitles.${index}.title`} render={({ field }) => (
                                            <FormItem className="col-span-2"><FormControl><Input {...field} placeholder="Título en ese idioma" /></FormControl><FormMessage /></FormItem>
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
