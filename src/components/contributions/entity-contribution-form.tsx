'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Esquemas dinámicos según el tipo de entidad
const getSchemaForEntity = (entityType: string) => {
  const baseSchema = {
    name: z.string().min(1, 'El nombre es requerido').optional(),
    name_romaji: z.string().optional(),
    name_native: z.string().optional(),
    image_url: z.string().url('URL inválida').optional().or(z.literal('')),
    description: z.string().optional(),
    bio: z.string().optional(),
    gender: z.string().optional(),
    age: z.string().optional(),
    blood_type: z.string().optional(),
    date_of_birth: z.string().optional(),
    language: z.string().optional(),
    hometown: z.string().optional(),
    primary_occupations: z.string().optional(),
    code: z.string().optional(),
    name_es: z.string().optional(),
    name_en: z.string().optional(),
    name_ja: z.string().optional(),
    description_es: z.string().optional(),
    description_en: z.string().optional(),
  };

  // Campos requeridos por tipo
  if (entityType === 'character') {
    return z.object({
      ...baseSchema,
      name: z.string().min(1, 'El nombre es requerido'),
      description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    });
  } else if (entityType === 'staff' || entityType === 'voice_actor') {
    return z.object({
      ...baseSchema,
      name_romaji: z.string().min(1, 'El nombre romaji es requerido'),
      bio: z.string().min(10, 'La biografía debe tener al menos 10 caracteres'),
    });
  } else if (entityType === 'studio') {
    return z.object({
      ...baseSchema,
      name: z.string().min(1, 'El nombre del estudio es requerido'),
    });
  } else if (entityType === 'genre') {
    return z.object({
      ...baseSchema,
      code: z.string().min(1, 'El código es requerido'),
      name_es: z.string().min(1, 'El nombre en español es requerido'),
      name_en: z.string().min(1, 'El nombre en inglés es requerido'),
    });
  }

  return z.object(baseSchema);
};

type EntityFormData = z.infer<ReturnType<typeof getSchemaForEntity>>;

interface EntityContributionFormProps {
  entityType: 'character' | 'staff' | 'voice_actor' | 'studio' | 'genre';
  entityLabel: string;
}

export function EntityContributionForm({ entityType, entityLabel }: EntityContributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<any>({
    resolver: zodResolver(getSchemaForEntity(entityType)),
    defaultValues: {},
  });

  async function onSubmit(data: any) {
    try {
      const response = await fetch('/api/contributions/submit-entity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          contributionData: data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al enviar la contribución');
      }

      const displayName = data.name || data.name_romaji || data.code || 'este contenido';

      toast({
        title: "¡Contribución enviada!",
        description: `Gracias por tu ayuda. Tu propuesta para añadir "${displayName}" ha sido enviada para revisión.`,
      });

      router.push(`/contribution-center`);
    } catch (error) {
      console.error('Error al enviar contribución:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'No se pudo enviar la contribución',
        variant: "destructive",
      });
    }
  }

  // Renderizar campos según el tipo de entidad
  const renderFields = () => {
    if (entityType === 'character') {
      return (
        <>
          {/* Nombre Principal */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Naruto Uzumaki" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre Romaji */}
          <FormField
            control={form.control}
            name="name_romaji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Romaji</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Naruto Uzumaki" {...field} />
                </FormControl>
                <FormDescription>Nombre en caracteres latinos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre Nativo */}
          <FormField
            control={form.control}
            name="name_native"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Nativo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: うずまき ナルト" {...field} />
                </FormControl>
                <FormDescription>Nombre en japonés, chino, coreano, etc.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Imagen URL */}
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Imagen</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe al personaje..." rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Género */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un género" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Masculino</SelectItem>
                    <SelectItem value="Female">Femenino</SelectItem>
                    <SelectItem value="Other">Otro</SelectItem>
                    <SelectItem value="Unknown">Desconocido</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Edad */}
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Edad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tipo de Sangre */}
          <FormField
            control={form.control}
            name="blood_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Sangre</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="Unknown">Desconocido</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de Nacimiento */}
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    if (entityType === 'staff' || entityType === 'voice_actor') {
      return (
        <>
          {/* Nombre Romaji */}
          <FormField
            control={form.control}
            name="name_romaji"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Romaji *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Hayao Miyazaki" {...field} />
                </FormControl>
                <FormDescription>Nombre en caracteres latinos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nombre Nativo */}
          <FormField
            control={form.control}
            name="name_native"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Nativo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 宮崎 駿" {...field} />
                </FormControl>
                <FormDescription>Nombre en japonés, chino, etc.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Imagen URL */}
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL de Imagen</FormLabel>
                <FormControl>
                  <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Biografía */}
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Biografía *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Escribe la biografía..." rows={5} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {entityType === 'voice_actor' && (
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Idioma</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un idioma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Japanese">Japonés</SelectItem>
                      <SelectItem value="English">Inglés</SelectItem>
                      <SelectItem value="Spanish">Español</SelectItem>
                      <SelectItem value="Chinese">Chino</SelectItem>
                      <SelectItem value="Korean">Coreano</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {entityType === 'staff' && (
            <FormField
              control={form.control}
              name="primary_occupations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ocupaciones</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Director, Productor" {...field} />
                  </FormControl>
                  <FormDescription>Separadas por comas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Género */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Género</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un género" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Male">Masculino</SelectItem>
                    <SelectItem value="Female">Femenino</SelectItem>
                    <SelectItem value="Other">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de Nacimiento */}
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Nacimiento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Lugar de Origen */}
          <FormField
            control={form.control}
            name="hometown"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lugar de Origen</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Tokyo, Japón" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {entityType === 'voice_actor' && (
            <FormField
              control={form.control}
              name="blood_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Sangre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      );
    }

    if (entityType === 'studio') {
      return (
        <>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Estudio *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Studio Ghibli" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    if (entityType === 'genre') {
      return (
        <>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: action" {...field} />
                </FormControl>
                <FormDescription>Identificador único en minúsculas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_es"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre en Español *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Acción" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre en Inglés *</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: Action" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_ja"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre en Japonés</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: アクション" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description_es"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción en Español</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe el género..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción en Inglés</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the genre..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir Nuevo {entityLabel}</CardTitle>
        <CardDescription>
          Completa la información. Tu contribución será revisada por un moderador antes de ser publicada.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderFields()}

            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full">
                Enviar Contribución
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
