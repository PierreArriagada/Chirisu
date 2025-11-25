/**
 * ========================================
 * COMPONENTE: RecoverPasswordForm
 * ========================================
 * Ubicación: src/components/auth/recover-password-form.tsx
 * 
 * PROPÓSITO:
 * - Recuperar contraseña usando Recovery Code + A2F
 * - NO requiere email (sistema actual)
 * 
 * FLUJO:
 * 1. Usuario ingresa su Recovery Code (64 caracteres)
 * 2. Usuario ingresa código A2F (6 dígitos)
 * 3. Usuario ingresa nueva contraseña
 * 4. Se verifica y actualiza
 * 5. Se genera NUEVO recovery code
 * 
 * CONEXIONES:
 * - API: POST /api/auth/recover-password
 * - Usado en: src/app/recover-password/page.tsx
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
import { Loader2, CheckCircle2, Copy, ShieldCheck } from 'lucide-react';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

// Paso 1: Verificar email
const emailSchema = z.object({
  email: z
    .string()
    .email({ message: 'Email inválido' })
    .min(1, { message: 'Email es requerido' }),
});

// Paso 2: Recuperar contraseña
const formSchema = z
  .object({
    recoveryCode: z
      .string()
      .length(64, { message: 'El recovery code debe tener 64 caracteres' })
      .regex(/^[a-f0-9]+$/i, { message: 'Formato inválido (solo hex)' }),
    twoFactorCode: z
      .string()
      .min(6, { message: 'Mínimo 6 caracteres' })
      .max(9, { message: 'Máximo 9 caracteres' }),
    newPassword: z
      .string()
      .min(8, { message: 'Mínimo 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Incluye al menos una mayúscula' })
      .regex(/[a-z]/, { message: 'Incluye al menos una minúscula' })
      .regex(/[0-9]/, { message: 'Incluye al menos un número' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type EmailData = z.infer<typeof emailSchema>;
type FormData = z.infer<typeof formSchema>;

// ============================================
// COMPONENTE
// ============================================

export function RecoverPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [step, setStep] = useState<'email' | 'recovery' | 'success'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [recoveryCodeHint, setRecoveryCodeHint] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [usedBackupCode, setUsedBackupCode] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState<number | undefined>(undefined);

  // Form para verificar email
  const emailForm = useForm<EmailData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form para recuperar contraseña
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recoveryCode: '',
      twoFactorCode: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // ============================================
  // PASO 1: VERIFICAR EMAIL
  // ============================================

  async function onEmailSubmit(values: EmailData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/recover-password/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar el email');
      }

      // Email verificado, pasar al paso 2
      setEmail(data.email);
      setUsername(data.username);
      setRecoveryCodeHint(data.recoveryCodeHint);
      setStep('recovery');

      toast({
        title: '✅ Email verificado',
        description: 'Ahora ingresa tu recovery code y código 2FA',
      });

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
  // PASO 2: RECUPERAR CONTRASEÑA
  // ============================================

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recoveryCode: values.recoveryCode,
          twoFactorCode: values.twoFactorCode,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al recuperar contraseña');
      }

      setNewRecoveryCode(data.newRecoveryCode);
      setUsedBackupCode(data.usedBackupCode || false);
      setBackupCodesRemaining(data.backupCodesRemaining);
      setStep('success');

      toast({
        title: '✅ Contraseña actualizada',
        description: data.usedBackupCode 
          ? `¡Guarda tu nuevo recovery code! Te quedan ${data.backupCodesRemaining || 0} códigos de respaldo.`
          : '¡Guarda tu nuevo recovery code!',
      });

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

  function copyRecoveryCode() {
    if (!newRecoveryCode) return;
    navigator.clipboard.writeText(newRecoveryCode);
    setCopiedCode(true);
    toast({ title: '✅ Recovery code copiado' });
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleGoToLogin() {
    router.push('/login');
  }

  // ============================================
  // ESTADO DE ÉXITO
  // ============================================

  if (step === 'success' && newRecoveryCode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>¡Contraseña Actualizada!</CardTitle>
          <CardDescription>
            Guarda tu nuevo código de recuperación
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Nuevo Recovery Code */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm">Nuevo Recovery Code</h3>
              <Button size="sm" variant="outline" onClick={copyRecoveryCode}>
                {copiedCode ? (
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
              {newRecoveryCode}
            </p>
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
              ⚠️ IMPORTANTE: Guarda este código en un lugar seguro. Es necesario para recuperar tu contraseña.
            </p>
          </div>

          {/* Alerta si se usó backup code */}
          {usedBackupCode && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                    Código de respaldo utilizado
                  </h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                    {backupCodesRemaining !== undefined && backupCodesRemaining > 0 ? (
                      <>Te quedan <strong>{backupCodesRemaining}</strong> código{backupCodesRemaining !== 1 ? 's' : ''} de respaldo.</>
                    ) : (
                      <>⚠️ <strong>No te quedan códigos de respaldo.</strong> Considera regenerarlos desde tu perfil.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleGoToLogin} className="w-full">
            Ir a Iniciar Sesión
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // FORMULARIO
  // ============================================

  // PASO 1: Verificar Email
  if (step === 'email') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu email para verificar tu cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <FormField
                control={emailForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="tu@email.com"
                        {...field}
                        disabled={isLoading}
                        autoComplete="email"
                        name="recovery-email"
                      />
                    </FormControl>
                    <FormDescription>
                      Ingresa el email con el que te registraste
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoToLogin}
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
                    'Continuar'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // PASO 2: Recuperar Contraseña
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Card de información del usuario */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Recuperando cuenta</p>
              <p className="font-semibold">{email}</p>
              {username && <p className="text-xs text-muted-foreground">@{username}</p>}
            </div>
          </div>
          
          {recoveryCodeHint && (
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground mb-1">
                Hint de tu Recovery Code:
              </p>
              <p className="font-mono text-xs">
                {recoveryCodeHint}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card del formulario */}
      <Card>
        <CardHeader>
          <CardTitle>Recuperar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu recovery code, código 2FA y nueva contraseña
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recoveryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery Code</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="abc123def456..."
                        {...field}
                        disabled={isLoading}
                        className="font-mono text-sm"
                        autoComplete="new-password"
                        data-form-type="other"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription>
                      Código de 64 caracteres que recibiste al registrarte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twoFactorCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código A2F o Código de Respaldo</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="123456 o abc123xyz"
                        maxLength={9}
                        {...field}
                        disabled={isLoading}
                        className="text-center text-lg tracking-wider"
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>
                      Código de 6 dígitos de tu app de autenticación o un código de respaldo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
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
                      Mín 8 caracteres, mayúsculas, minúsculas y números
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('email')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Atrás
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Restablecer'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
