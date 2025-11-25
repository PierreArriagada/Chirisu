/**
 * ========================================
 * PÁGINA: Login con A2F Obligatorio
 * ========================================
 * Ruta: /login
 * 
 * PROPÓSITO:
 * - Inicio de sesión con verificación A2F obligatoria
 * - Soporte para OAuth (Google, GitHub, Discord)
 * - Flujo en 2 pasos para usuarios con A2F
 * 
 * FLUJO:
 * 1. Usuario ingresa email + password
 * 2. POST /api/auth/login
 * 3. Si response.requires2FA = true:
 *    - Mostrar TwoFactorVerifyDialog
 *    - Usuario ingresa código de 6 dígitos
 *    - POST /api/auth/2fa/verify
 * 4. Si verificación exitosa → Redirect a /profile
 * 5. Si requiresSetup2FA = true (usuarios antiguos):
 *    - Forzar configuración de A2F
 * 
 * COMPONENTES:
 * - TwoFactorVerifyDialog (verificar código durante login)
 * - GoogleAuthButton (OAuth con Google)
 * - ForgotPasswordDialog (deshabilitado por ahora)
 * 
 * CONEXIONES:
 * - POST /api/auth/login
 * - POST /api/auth/2fa/verify
 */

'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { TwoFactorVerifyDialog, GoogleAuthButton } from '@/components/auth';

// ============================================
// VALIDACIÓN
// ============================================

const formSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// COMPONENTE
// ============================================

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect si ya está logueado
  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);

  // ============================================
  // PASO 1: Login con Email + Password
  // ============================================

  async function onSubmit(values: FormData) {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      // ============================================
      // CASO 1: Requiere A2F (flujo normal)
      // ============================================
      if (data.requires2FA) {
        setUserId(data.userId);
        setShow2FADialog(true);
        toast({
          title: '✅ Credenciales correctas',
          description: data.message || 'Ingresa tu código A2F',
        });
        return;
      }

      // ============================================
      // CASO 2: Requiere configurar A2F (usuarios antiguos o pendiente)
      // ============================================
      if (data.requiresSetup2FA) {
        // Guardar userId y email en sessionStorage para la página de setup
        sessionStorage.setItem('pending_2fa_userId', data.userId.toString());
        sessionStorage.setItem('pending_2fa_email', data.email);
        
        if (data.hasPendingSetup) {
          // Usuario que dejó el setup a medias
          toast({
            title: '⚠️ Configuración pendiente',
            description: 'Redirigiendo a completar la configuración de 2FA...',
            duration: 3000,
          });
        } else {
          // Usuario antiguo sin 2FA configurado
          toast({
            title: '⚠️ Configuración requerida',
            description: 'Redirigiendo a configurar autenticación de 2 factores...',
            duration: 3000,
          });
        }
        
        // Redirigir automáticamente a la configuración de 2FA
        setTimeout(() => {
          router.push('/setup-2fa?pending=true');
        }, 1500);
        return;
      }

      // ============================================
      // CASO 3: Login exitoso sin A2F (no debería pasar)
      // ============================================
      toast({
        title: '✅ Bienvenido',
        description: 'Has iniciado sesión correctamente',
      });
      router.push('/profile');
      router.refresh();

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
  // PASO 2: Verificación A2F Exitosa
  // ============================================

  function handle2FASuccess() {
    setShow2FADialog(false);
    toast({
      title: '🎉 ¡Bienvenido!',
      description: 'Has iniciado sesión correctamente',
    });
    
    // Redirigir después de un pequeño delay para que se establezca la cookie
    setTimeout(() => {
      router.push('/profile');
      router.refresh();
      // Forzar recarga completa de la página para actualizar el contexto
      window.location.href = '/profile';
    }, 800);
  }

  function handle2FACancel() {
    setShow2FADialog(false);
    setUserId(null);
    toast({
      title: 'Inicio de sesión cancelado',
      description: 'Puedes intentarlo de nuevo',
    });
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <>
      <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Formulario de Login */}
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
                  control={form.control}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
            </Form>

            {/* Separador */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-2">
              <GoogleAuthButton variant="outline" />
              
              {/* GitHub y Discord próximamente */}
              {/* <GitHubAuthButton variant="outline" /> */}
              {/* <DiscordAuthButton variant="outline" /> */}
            </div>

            {/* Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/register">
                  <Button variant="link" className="px-0">
                    Regístrate aquí
                  </Button>
                </Link>
              </p>

              {/* Recuperar contraseña con 2FA */}
              <div>
                <Link href="/recover-password">
                  <Button variant="link" className="text-sm px-0">
                    ¿Olvidaste tu contraseña?
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Diálogo de Verificación A2F */}
      {userId && (
        <TwoFactorVerifyDialog
          open={show2FADialog}
          onOpenChange={setShow2FADialog}
          userId={userId}
          onSuccess={handle2FASuccess}
          onCancel={handle2FACancel}
        />
      )}
    </>
  );
}
