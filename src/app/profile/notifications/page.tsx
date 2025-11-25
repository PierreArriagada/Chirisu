/**
 * ========================================
 * PÁGINA: HISTORIAL DE NOTIFICACIONES
 * ========================================
 * Muestra todas las notificaciones del usuario (leídas y no leídas)
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NotificationsHistory } from '@/components/user';

export default async function NotificationsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-headline">Notificaciones</h1>
        <p className="text-muted-foreground mt-2">
          Historial completo de tus notificaciones
        </p>
      </div>

      <NotificationsHistory userId={currentUser.userId} />
    </div>
  );
}
