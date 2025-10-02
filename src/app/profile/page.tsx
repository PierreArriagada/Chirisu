'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();

  // Proteger la ruta: si no hay usuario, redirigir al login
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // PSQL: En una implementación real, en lugar de usar el contexto, podrías obtener el ID
  // del usuario de la sesión y hacer una petición a la base de datos:
  // `SELECT name, email, image_url, role FROM users WHERE id = $1;`
  // Esto aseguraría que los datos siempre están actualizados.

  if (!user) {
    // Muestra un loader o nada mientras se redirige
    return <p className="text-center p-8">Redirigiendo...</p>;
  }

  return (
    <main className="container mx-auto p-4 sm:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-3xl">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="secondary" className="capitalize">{user.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h4 className="font-semibold mb-4">Información Adicional</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>ID de Usuario:</strong> {user.id}</p>
            <p><strong>Fecha de registro:</strong> 24 de Mayo, 2024 (simulado)</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button>
            Modificar mi información
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
