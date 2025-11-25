/**
 * ========================================
 * PÁGINA: Setup 2FA Pendiente
 * ========================================
 * Ruta: /setup-2fa
 * 
 * PROPÓSITO:
 * - Completar configuración de 2FA pendiente
 * - Para usuarios que cerraron la ventana durante registro
 * 
 * FLUJO:
 * 1. Usuario intenta login
 * 2. Sistema detecta 2FA pendiente
 * 3. Redirige a /setup-2fa?pending=true
 * 4. Obtiene datos de 2FA pendiente
 * 5. Muestra QR code + secret manual + recovery code
 * 6. Usuario verifica código
 * 7. Cuenta activada → Redirect a /profile
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2, ShieldCheck, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const verifySchema = z.object({
  code: z
    .string()
    .length(6, { message: 'El código debe tener 6 dígitos' })
    .regex(/^\d+$/, { message: 'Solo números' }),
});

type VerifyFormData = z.infer<typeof verifySchema>;

// ============================================
// TIPOS
// ============================================

interface TwoFactorSetupData {
  qrCode: string;
  secret: string;
  recoveryCode: string | null;
  backupCodes?: string[];
  backupCodesAvailable: boolean;
}

interface PendingSetupData {
  user: {
    id: number;
    username: string;
    email: string;
  };
  twoFactorSetup: TwoFactorSetupData;
  isPending: boolean;
}

// ============================================
// COMPONENTE
// ============================================

function SetupTwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSetup, setIsFetchingSetup] = useState(true);
  const [setupData, setSetupData] = useState<PendingSetupData | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  const isPending = searchParams.get('pending') === 'true';

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  // ============================================
  // EFECTO: OBTENER CONFIGURACIÓN PENDIENTE
  // ============================================

  useEffect(() => {
    async function fetchPendingSetup() {
      if (!isPending) {
        setIsFetchingSetup(false);
        return;
      }

      try {
        const userId = sessionStorage.getItem('pending_2fa_userId');
        if (!userId) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se encontró información de configuración pendiente',
          });
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/get-pending-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: parseInt(userId) }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener configuración');
        }

        setSetupData(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message,
        });
        router.push('/login');
      } finally {
        setIsFetchingSetup(false);
      }
    }

    fetchPendingSetup();
  }, [isPending, router, toast]);

  // ============================================
  // FUNCIONES
  // ============================================

  function copySecret(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!setupData) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(setupData.twoFactorSetup.secret);
      } else {
        // Fallback para navegadores sin soporte
        const textArea = document.createElement('textarea');
        textArea.value = setupData.twoFactorSetup.secret;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedSecret(true);
      toast({ title: '✅ Clave secreta copiada' });
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (error) {
      toast({ 
        title: '❌ Error al copiar',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive'
      });
    }
  }

  function copyRecoveryCode(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!setupData?.twoFactorSetup.recoveryCode) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(setupData.twoFactorSetup.recoveryCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = setupData.twoFactorSetup.recoveryCode;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedRecovery(true);
      toast({ title: '✅ Código de recuperación copiado' });
      setTimeout(() => setCopiedRecovery(false), 2000);
    } catch (error) {
      toast({ 
        title: '❌ Error al copiar',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive'
      });
    }
  }

  function copyBackupCodes(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!setupData?.twoFactorSetup.backupCodes) return;
    
    try {
      const codesText = setupData.twoFactorSetup.backupCodes.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codesText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codesText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedBackupCodes(true);
      toast({ title: '✅ Códigos de respaldo copiados' });
      setTimeout(() => setCopiedBackupCodes(false), 2000);
    } catch (error) {
      toast({ 
        title: '❌ Error al copiar',
        description: 'No se pudo copiar al portapapeles',
        variant: 'destructive'
      });
    }
  }

  async function onSubmit(values: VerifyFormData) {
    if (!setupData) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: setupData.user.id,
          code: values.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      // Limpiar sessionStorage
      sessionStorage.removeItem('pending_2fa_userId');
      sessionStorage.removeItem('pending_2fa_email');

      toast({
        title: '✅ Cuenta activada',
        description: 'Tu configuración de 2FA está completa. Redirigiendo...',
      });

      setTimeout(() => {
        window.location.href = '/profile';
      }, 1000);

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

  // ============================================
  // RENDER: LOADING
  // ============================================

  if (isFetchingSetup) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando configuración...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: SIN DATOS
  // ============================================

  if (!setupData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle>No hay configuración pendiente</CardTitle>
            <CardDescription>
              Si acabas de registrarte, completa el proceso desde la página de registro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Volver al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================
  // RENDER: FORMULARIO DE VERIFICACIÓN
  // ============================================

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle>Completar Configuración de 2FA</CardTitle>
            <CardDescription className="text-center mt-2">
              Hola <strong>{setupData.user.username}</strong>, completa la configuración de autenticación
              de 2 factores para activar tu cuenta.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerta */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Debes completar este proceso para poder acceder a tu cuenta.
              Guarda tus códigos en un lugar seguro.
            </p>
          </div>

          {/* QR Code */}
          <div>
            <h3 className="font-semibold mb-3">1. Escanea el código QR</h3>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <Image
                src={setupData.twoFactorSetup.qrCode}
                alt="QR Code para 2FA"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Usa Google Authenticator, Authy o similar
            </p>

            {/* Opción manual */}
            <div className="mt-4 rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  ¿No puedes escanear? Copia la clave manual:
                </p>
                <Button 
                  type="button"
                  size="sm" 
                  variant="ghost" 
                  onClick={(e) => copySecret(e)} 
                  className="h-7"
                >
                  {copiedSecret ? (
                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="font-mono text-xs break-all bg-background p-2 rounded">
                {setupData.twoFactorSetup.secret}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Copia esta clave y agrégala manualmente en tu app de autenticación
              </p>
            </div>
          </div>

          {/* Recovery Code */}
          {setupData.twoFactorSetup.recoveryCode && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">2. Recovery Code</h3>
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => copyRecoveryCode(e)}
                >
                  {copiedRecovery ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="font-mono text-xs break-all bg-background p-2 rounded">
                {setupData.twoFactorSetup.recoveryCode}
              </p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                ⚠️ Guarda este código. Es necesario para recuperar tu contraseña.
              </p>
            </div>
          )}

          {/* Backup Codes */}
          {setupData.twoFactorSetup.backupCodes && setupData.twoFactorSetup.backupCodes.length > 0 && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">3. Códigos de Respaldo</h3>
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => copyBackupCodes(e)}
                >
                  {copiedBackupCodes ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar todos
                    </>
                  )}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-background p-3 rounded">
                {setupData.twoFactorSetup.backupCodes.map((code, index) => (
                  <p key={index} className="font-mono text-xs">
                    {code}
                  </p>
                ))}
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-2">
                💡 Guarda estos códigos. Cada uno puede usarse una vez si pierdes acceso a tu app de autenticación.
              </p>
            </div>
          )}

          {/* Verificación */}
          <div>
            <h3 className="font-semibold mb-3">4. Verifica el código</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de 6 dígitos</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          {...field}
                          disabled={isLoading}
                          className="text-center text-lg tracking-wider"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormDescription>
                        Ingresa el código que aparece en tu app de autenticación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/login')}
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
                      'Activar Cuenta'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PÁGINA CON SUSPENSE
// ============================================

export default function SetupTwoFactorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SetupTwoFactorContent />
    </Suspense>
  );
}
