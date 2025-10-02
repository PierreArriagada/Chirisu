'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // PSQL: En una implementación real, la protección de esta ruta debería hacerse
  // en el backend o middleware. Se verificaría el token de sesión del usuario,
  // se consultaría su rol en la base de datos (`SELECT role FROM users WHERE id = $1;`)
  // y si el rol no es 'admin', se le denegaría el acceso.
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role !== 'admin') {
      // Simulación de protección de rol
      // router.push('/unauthorized'); // O a una página de "acceso denegado"
      console.warn("Acceso denegado: Se requiere rol de administrador.");
    }
  }, [user, router]);

  if (!user || user.role !== 'admin') {
    return (
        <main className="container mx-auto p-4 sm:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Denegado</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Necesitas ser administrador para ver esta página.</p>
                </CardContent>
            </Card>
        </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-8">
        <Card>
            <CardHeader>
                <CardTitle>Panel de Administrador</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Bienvenido, {user.name}. Aquí puedes gestionar toda la aplicación.</p>
                {/* Aquí irían los componentes de administración */}
            </CardContent>
        </Card>
    </main>
  );
}
