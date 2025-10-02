'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, Shield, Crown } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Si el usuario ya está logueado, redirigirlo al perfil
  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);

  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Simular Inicio de Sesión</CardTitle>
          <CardDescription>
            Elige un rol para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => login('user')} className="w-full">
            <User className="mr-2" />
            Iniciar como Usuario
          </Button>
           <Button onClick={() => login('moderator')} variant="secondary" className="w-full">
            <Shield className="mr-2" />
            Iniciar como Moderador
          </Button>
           <Button onClick={() => login('admin')} variant="destructive" className="w-full">
            <Crown className="mr-2" />
            Iniciar como Administrador
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
