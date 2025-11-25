'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ModeratorPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['admin', 'moderator'];
    if (!allowedRoles.includes(user.role || 'user')) {
      console.warn('Acceso denegado');
      router.push('/');
      return;
    }

    router.push('/dashboard/moderator/contributions');
  }, [user, router]);

  return (
    <main className="container mx-auto p-2 sm:p-6">
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </main>
  );
}
