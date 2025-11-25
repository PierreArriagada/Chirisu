/**
 * ========================================
 * COMPONENTE: RegisterForm
 * ========================================
 * Ubicación: src/components/auth/register-form.tsx
 * 
 * PROPÓSITO:
 * - Formulario de registro con A2F OBLIGATORIO
 * - Proceso en 2 pasos:
 *   1. Crear cuenta → Generar A2F
 *   2. Verificar A2F → Activar cuenta
 * 
 * CONEXIONES:
 * - API: POST /api/auth/register
 * - API: POST /api/auth/verify-registration
 * - Usado en: src/app/register/page.tsx o src/app/login/page.tsx
 * 
 * FLUJO:
 * 1. Usuario ingresa username, email, password
 * 2. Se crea cuenta → Recibe QR code + backup codes + recovery code
 * 3. Usuario escanea QR con Google Authenticator
 * 4. Usuario ingresa código de 6 dígitos
 * 5. Cuenta se activa → Redirect a /profile
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
import Image from 'next/image';

// ============================================
// ESQUEMA DE VALIDACIÓN
// ============================================

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Mínimo 3 caracteres' })
      .max(20, { message: 'Máximo 20 caracteres' })
      .regex(/^[a-zA-Z0-9_]+$/, { message: 'Solo letras, números y guión bajo' }),
    email: z.string().email({ message: 'Email inválido' }),
    password: z
      .string()
      .min(8, { message: 'Mínimo 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Incluye al menos una mayúscula' })
      .regex(/[a-z]/, { message: 'Incluye al menos una minúscula' })
      .regex(/[0-9]/, { message: 'Incluye al menos un número' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

const verifySchema = z.object({
  code: z
    .string()
    .length(6, { message: 'El código debe tener 6 dígitos' })
    .regex(/^\d+$/, { message: 'Solo números' }),
});

type RegisterFormData = z.infer<typeof registerSchema>;
type VerifyFormData = z.infer<typeof verifySchema>;

// ============================================
// TIPOS
// ============================================

interface TwoFactorSetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
  recoveryCode: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
}

// ============================================
// COMPONENTE
// ============================================

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [step, setStep] = useState<'register' | 'setup-2fa' | 'verify-2fa'>('register');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorSetupData | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Forms
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const verifyForm = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  // ============================================
  // PASO 1: Registrar Usuario
  // ============================================

  async function onRegister(values: RegisterFormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      // Guardar datos
      setUserData(data.user);
      setTwoFactorData(data.twoFactorSetup);

      // Pasar a configuración de A2F
      setStep('setup-2fa');

      toast({
        title: '✅ Cuenta creada',
        description: 'Ahora debes configurar tu autenticación de 2 factores',
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
  // PASO 2: Verificar A2F y Activar Cuenta
  // ============================================

  async function onVerify(values: VerifyFormData) {
    if (!userData) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: userData.id,
          code: values.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Código inválido');
      }

      // Verificar si la cuenta ya estaba activada
      if (data.alreadyActivated) {
        toast({
          title: '✅ Cuenta ya activada',
          description: 'Tu cuenta ya estaba activa. Redirigiendo...',
        });
      } else {
        toast({
          title: '🎉 ¡Bienvenido!',
          description: 'Tu cuenta ha sido activada exitosamente. Redirigiendo...',
        });
      }

      // Esperar a que se establezca la cookie y luego redirigir con recarga completa
      setTimeout(() => {
        // Usar window.location para forzar recarga completa y actualizar AuthContext
        window.location.href = '/profile';
      }, 2000); // 2 segundos para asegurar que la cookie se establezca
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
  // FUNCIONES AUXILIARES
  // ============================================

  function copyBackupCodes() {
    if (!twoFactorData) return;
    
    try {
      const codesText = twoFactorData.backupCodes.join('\n');
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
      setCopiedCodes(true);
      toast({ title: '✅ Códigos copiados' });
      setTimeout(() => setCopiedCodes(false), 2000);
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
    if (!twoFactorData) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(twoFactorData.recoveryCode);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = twoFactorData.recoveryCode;
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

  function copySecret(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!twoFactorData) return;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(twoFactorData.secret);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = twoFactorData.secret;
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

  // ============================================
  // RENDER
  // ============================================

  // PASO 1: Formulario de registro
  if (step === 'register') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Crear Cuenta</CardTitle>
          <CardDescription>
            Completa el registro. El A2F es obligatorio para mayor seguridad.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...registerForm}>
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario123" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
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
                control={registerForm.control}
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
                    Creando cuenta...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // PASO 2: Configurar A2F (mostrar QR y códigos)
  if (step === 'setup-2fa' && twoFactorData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Configurar Autenticación de 2 Factores</CardTitle>
            <CardDescription className="text-center">
              Esta configuración es OBLIGATORIA. Guarda tus códigos de forma segura.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* QR Code */}
          <div>
            <h3 className="font-semibold mb-3">1. Escanea el código QR</h3>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <Image
                src={twoFactorData.qrCode}
                alt="QR Code para 2FA"
                width={200}
                height={200}
                className="rounded"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Usa Google Authenticator, Authy o similar
            </p>

            {/* Opción manual para móviles o cuando no se puede escanear */}
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
                {twoFactorData.secret}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Copia esta clave y agrégala manualmente en tu app de autenticación
              </p>
            </div>
          </div>

          {/* Backup Codes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">2. Guarda tus códigos de respaldo</h3>
              <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                {copiedCodes ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {twoFactorData.backupCodes.map((code, index) => (
                  <div key={index} className="bg-background px-2 py-1 rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cada código solo puede usarse una vez
            </p>
          </div>

          {/* Recovery Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">3. Código de Recuperación</h3>
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
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-4">
              <p className="font-mono text-sm break-all">{twoFactorData.recoveryCode}</p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                ⚠️ Usa este código para recuperar tu contraseña sin email
              </p>
            </div>
          </div>

          <Button
            onClick={() => setStep('verify-2fa')}
            className="w-full"
            size="lg"
          >
            Continuar a Verificación
          </Button>
        </CardContent>
      </Card>
    );
  }

  // PASO 3: Verificar código y activar cuenta
  if (step === 'verify-2fa') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Verificar Código</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu app de autenticación
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...verifyForm}>
            <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-4">
              <FormField
                control={verifyForm.control}
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
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-center">
                      El código cambia cada 30 segundos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('setup-2fa')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Volver
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
        </CardContent>
      </Card>
    );
  }

  return null;
}
