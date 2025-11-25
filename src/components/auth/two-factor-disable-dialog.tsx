/**
 * ========================================
 * COMPONENTE: TwoFactorDisableDialog
 * ========================================
 * Ubicación: src/components/auth/two-factor-disable-dialog.tsx
 * 
 * PROPÓSITO:
 * - Desactivar autenticación de 2 factores
 * - Requiere contraseña para confirmar (seguridad)
 * 
 * CONEXIONES:
 * - API: POST /api/auth/2fa/disable
 * - Usado en: src/app/settings/security/page.tsx
 * 
 * FLUJO:
 * 1. Usuario hace click en "Desactivar 2FA"
 * 2. Muestra diálogo pidiendo contraseña
 * 3. Llama a /api/auth/2fa/disable con password
 * 4. Si válida, desactiva 2FA
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
import { Loader2, ShieldOff, AlertTriangle } from 'lucide-react';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const formSchema = z.object({
  password: z.string().min(1, { message: 'Ingresa tu contraseña' }),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// PROPS
// ============================================

interface TwoFactorDisableDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// ============================================
// COMPONENTE
// ============================================

export function TwoFactorDisableDialog({
  children,
  trigger,
  onSuccess,
}: TwoFactorDisableDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al desactivar 2FA');
      }

      toast({
        title: '✅ 2FA Desactivado',
        description: 'La autenticación de 2 factores ha sido deshabilitada.',
      });

      // Cerrar diálogo y resetear
      setOpen(false);
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="destructive">
            <ShieldOff className="mr-2 h-4 w-4" />
            Desactivar 2FA
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Desactivar 2FA</DialogTitle>
            <DialogDescription className="text-center">
              Esto reducirá la seguridad de tu cuenta. Ingresa tu contraseña para confirmar.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Advertencia */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Una vez desactivado, solo necesitarás tu contraseña para iniciar sesión. Esto hace tu cuenta más vulnerable.
            </p>
          </div>

          {/* Formulario */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña Actual</FormLabel>
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
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desactivando...
                    </>
                  ) : (
                    'Confirmar Desactivación'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
