/**
 * ========================================
 * API ROUTE: MARCAR NOTIFICACIÓN COMO LEÍDA
 * ========================================
 * 
 * PATCH /api/user/notifications/[id]
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { markNotificationAsRead } from '@/lib/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: 'ID de notificación inválido' },
        { status: 400 }
      );
    }

    await markNotificationAsRead(notificationId);

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    });

  } catch (error) {
    console.error('❌ Error en PATCH /api/user/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Error al marcar notificación' },
      { status: 500 }
    );
  }
}
