/**
 * ========================================
 * COMPONENTE: ResetPasswordForm
 * ========================================
 * Ubicación: src/components/auth/reset-password-form.tsx
 * 
 * PROPÓSITO:
 * - Formulario para restablecer contraseña con token
 * - Valida token y actualiza contraseña
 * 
 * CONEXIONES:
 * - API: POST /api/auth/reset-password
 * - Usado en: src/app/reset-password/page.tsx
 * 
 * FLUJO:
 * 1. Recibe token de URL params
 * 2. Usuario ingresa nueva contraseña
 * 3. Se envía a API /api/auth/reset-password
 * 4. Redirect a /login si exitoso
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Debe incluir al menos una mayúscula' })
      .regex(/[a-z]/, { message: 'Debe incluir al menos una minúscula' })
      .regex(/[0-9]/, { message: 'Debe incluir al menos un número' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof formSchema>;

// ============================================
// PROPS
// ============================================

interface ResetPasswordFormProps {
  token: string;
}

// ============================================
// COMPONENTE
// ============================================

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setTokenError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          setTokenError(data.error);
          return;
        }
        throw new Error(data.error || 'Error al restablecer contraseña');
      }

      setIsSuccess(true);
      toast({
        title: '✅ Contraseña actualizada',
        description: 'Tu contraseña ha sido restablecida exitosamente.',
      });

      // Redirect a login después de 2 segundos
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo restablecer la contraseña',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Estado de error del token
  if (tokenError) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle>Token Inválido</CardTitle>
          <CardDescription>{tokenError}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Volver al Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Estado de éxito
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>¡Listo!</CardTitle>
          <CardDescription>
            Tu contraseña ha sido actualizada. Redirigiendo al login...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Formulario normal
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Restablecer Contraseña</CardTitle>
        <CardDescription>
          Ingresa tu nueva contraseña. Debe cumplir con los requisitos de seguridad.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 8 caracteres, con mayúsculas, minúsculas y números
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Restablecer Contraseña'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
