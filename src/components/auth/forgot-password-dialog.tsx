/**
 * ========================================
 * COMPONENTE: ForgotPasswordDialog
 * ========================================
 * Ubicación: src/components/auth/forgot-password-dialog.tsx
 * 
 * PROPÓSITO:
 * - Diálogo para solicitar recuperación de contraseña
 * - Envía email con token de recuperación
 * 
 * CONEXIONES:
 * - API: POST /api/auth/forgot-password
 * - Usado en: src/app/login/page.tsx
 * 
 * FLUJO:
 * 1. Usuario ingresa email
 * 2. Se envía a API /api/auth/forgot-password
 * 3. API genera token y envía email
 * 4. Muestra mensaje de confirmación
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail } from 'lucide-react';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const formSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// PROPS
// ============================================

interface ForgotPasswordDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
}

// ============================================
// COMPONENTE
// ============================================

export function ForgotPasswordDialog({ children, trigger }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar email');
      }

      setEmailSent(true);
      toast({
        title: '✅ Email enviado',
        description: 'Revisa tu bandeja de entrada para recuperar tu contraseña.',
      });

      // Cerrar diálogo después de 3 segundos
      setTimeout(() => {
        setOpen(false);
        setEmailSent(false);
        form.reset();
      }, 3000);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'No se pudo enviar el email',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="link" className="px-0">
            ¿Olvidaste tu contraseña?
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recuperar Contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
          </DialogDescription>
        </DialogHeader>

        {emailSent ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-2">Email Enviado</h3>
              <p className="text-sm text-muted-foreground">
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu-email@ejemplo.com"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Enlace'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
