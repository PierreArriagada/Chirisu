/**
 * ========================================
 * COMPONENTE: TwoFactorVerifyDialog
 * ========================================
 * Ubicación: src/components/auth/two-factor-verify-dialog.tsx
 * 
 * PROPÓSITO:
 * - Verificar código 2FA durante el login
 * - Permite ingresar código de 6 dígitos o código de respaldo
 * 
 * CONEXIONES:
 * - API: POST /api/auth/2fa/verify
 * - Usado en: src/app/login/page.tsx (después de login exitoso con 2FA)
 * 
 * FLUJO:
 * 1. Después de login, si usuario tiene 2FA activo
 * 2. Muestra este diálogo
 * 3. Usuario ingresa código de 6 dígitos (o código de respaldo)
 * 4. Llama a /api/auth/2fa/verify
 * 5. Si válido, genera sesión completa y cierra diálogo
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, ShieldCheck } from 'lucide-react';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const formSchema = z.object({
  code: z
    .string()
    .min(6, { message: 'Ingresa un código válido' })
    .max(9, { message: 'Código demasiado largo' }),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// PROPS
// ============================================

interface TwoFactorVerifyDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  userId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// COMPONENTE
// ============================================

export function TwoFactorVerifyDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
  onCancel,
}: TwoFactorVerifyDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          code: values.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      toast({
        title: '✅ Verificación exitosa',
        description: 'Iniciando sesión...',
      });

      // Cerrar diálogo primero
      if (onOpenChange) {
        onOpenChange(false);
      }

      // Ejecutar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      } else {
        // Por defecto, usar window.location para forzar recarga completa
        setTimeout(() => {
          window.location.href = '/profile';
        }, 500);
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

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex flex-col items-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle>Verificación de 2 Factores</DialogTitle>
            <DialogDescription className="text-center">
              {useBackupCode
                ? 'Ingresa uno de tus códigos de respaldo'
                : 'Ingresa el código de 6 dígitos de tu app de autenticación'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {useBackupCode ? 'Código de Respaldo' : 'Código de Verificación'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder={useBackupCode ? 'XXXX-XXXX' : '123456'}
                      maxLength={useBackupCode ? 9 : 6}
                      {...field}
                      disabled={isLoading}
                      className="text-center text-lg tracking-widest"
                    />
                  </FormControl>
                  <FormDescription>
                    {useBackupCode
                      ? 'Formato: XXXX-XXXX'
                      : '6 dígitos de tu app de autenticación'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Toggle backup code */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  form.reset();
                }}
                className="text-xs"
              >
                {useBackupCode
                  ? '← Usar código de autenticación'
                  : '¿No tienes acceso a tu app? Usa un código de respaldo →'}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
