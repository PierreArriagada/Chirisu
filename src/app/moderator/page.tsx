'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ModeratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  // PSQL: Al igual que en la página de admin, la verificación de rol
  // ('admin' o 'moderator') se haría en el backend.
  // `SELECT role FROM users WHERE id = $1;` y se comprobaría si el rol
  // está en la lista de roles permitidos.
  useEffect(() => {
    const allowedRoles = ['admin', 'moderator'];
    if (!user) {
      router.push('/login');
    } else if (!allowedRoles.includes(user.role)) {
      console.warn("Acceso denegado: Se requiere rol de moderador o superior.");
    }
  }, [user, router]);

   const allowedRoles = ['admin', 'moderator'];
  if (!user || !allowedRoles.includes(user.role)) {
    return (
        <main className="container mx-auto p-4 sm:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Necesitas ser moderador para ver esta página.</p>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Panel de Moderador</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Bienvenido, {user.name}. Aquí puedes moderar contenido.</p>
                {/* Aquí irían los componentes de moderación */}
            </CardContent>
        </Card>
    </main>
  );
}
