/**
 * ========================================
 * COMPONENTE: TwoFactorSetupDialog
 * ========================================
 * Ubicación: src/components/auth/two-factor-setup-dialog.tsx
 * 
 * PROPÓSITO:
 * - Configurar autenticación de 2 factores (2FA)
 * - Mostrar QR code para Google Authenticator
 * - Proporcionar códigos de respaldo
 * 
 * CONEXIONES:
 * - API: POST /api/auth/2fa/setup (genera QR y backup codes)
 * - API: POST /api/auth/2fa/enable (activa 2FA)
 * - Usado en: src/app/settings/security/page.tsx
 * 
 * FLUJO:
 * 1. Usuario hace click en "Configurar 2FA"
 * 2. Llama a /api/auth/2fa/setup → recibe QR y backup codes
 * 3. Muestra QR code para escanear con Google Authenticator
 * 4. Usuario ingresa código de 6 dígitos para verificar
 * 5. Llama a /api/auth/2fa/enable
 * 6. 2FA activado - muestra códigos de respaldo para guardar
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const formSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'El código debe tener 6 dígitos' })
    .regex(/^\d+$/, { message: 'Solo números' }),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// TIPOS
// ============================================

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

// ============================================
// PROPS
// ============================================

interface TwoFactorSetupDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// ============================================
// COMPONENTE
// ============================================

export function TwoFactorSetupDialog({
  children,
  trigger,
  onSuccess,
}: TwoFactorSetupDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [isLoading, setIsLoading] = useState(false);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  });

  // Llamar a API para generar QR y backup codes
  async function handleSetup() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar código QR');
      }

      setSetupData(data);
      setStep('verify');
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

  // Verificar código y activar 2FA
  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: values.code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      setStep('complete');
      toast({
        title: '✅ 2FA Activado',
        description: 'La autenticación de 2 factores está ahora habilitada.',
      });

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

  // Copiar códigos de respaldo
  function copyBackupCodes() {
    if (!setupData) return;

    const codesText = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopiedCodes(true);

    toast({
      title: '✅ Códigos copiados',
      description: 'Guárdalos en un lugar seguro',
    });

    setTimeout(() => setCopiedCodes(false), 2000);
  }

  // Cerrar y resetear
  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setStep('setup');
      setSetupData(null);
      setCopiedCodes(false);
      form.reset();
    }, 200);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Configurar 2FA
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        {/* PASO 1: Introducción */}
        {step === 'setup' && (
          <>
            <DialogHeader>
              <DialogTitle>Configurar Autenticación de 2 Factores</DialogTitle>
              <DialogDescription>
                Agrega una capa extra de seguridad a tu cuenta requiriendo un código de verificación
                cada vez que inicies sesión.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-semibold mb-2">¿Qué necesitas?</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Una app de autenticación (Google Authenticator, Authy, etc.)</li>
                  <li>• Tu teléfono móvil</li>
                </ul>
              </div>

              <Button onClick={handleSetup} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Comenzar Configuración'
                )}
              </Button>
            </div>
          </>
        )}

        {/* PASO 2: Escanear QR y verificar */}
        {step === 'verify' && setupData && (
          <>
            <DialogHeader>
              <DialogTitle>Escanea el Código QR</DialogTitle>
              <DialogDescription>
                Usa tu app de autenticación para escanear el código e ingresa el código de 6 dígitos generado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <Image
                  src={setupData.qrCode}
                  alt="QR Code para 2FA"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>

              {/* Secret manual (por si no puede escanear) */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">¿No puedes escanear?</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {setupData.secret}
                </code>
              </div>

              {/* Formulario de verificación */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de Verificación</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            {...field}
                            disabled={isLoading}
                            className="text-center text-lg tracking-widest"
                          />
                        </FormControl>
                        <FormDescription>
                          Ingresa el código de 6 dígitos de tu app
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
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
                        'Verificar y Activar'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}

        {/* PASO 3: Mostrar códigos de respaldo */}
        {step === 'complete' && setupData && (
          <>
            <DialogHeader>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <DialogTitle>¡2FA Activado!</DialogTitle>
                <DialogDescription className="text-center">
                  Guarda estos códigos de respaldo en un lugar seguro
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Códigos de Respaldo</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyBackupCodes}
                    disabled={copiedCodes}
                  >
                    {copiedCodes ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Usa estos códigos si pierdes acceso a tu app de autenticación
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {setupData.backupCodes.map((code, index) => (
                    <div key={index} className="bg-background px-2 py-1 rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  ⚠️ Cada código solo puede usarse una vez. Guárdalos en un lugar seguro y privado.
                </p>
              </div>

              <Button onClick={handleClose} className="w-full">
                Entendido, Cerrar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
