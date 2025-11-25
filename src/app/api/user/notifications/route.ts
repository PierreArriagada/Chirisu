/**
 * ========================================
 * API ROUTE: NOTIFICACIONES DE USUARIO
 * ========================================
 * 
 * GET /api/user/notifications
 * - Obtiene las notificaciones del usuario actual
 * 
 * PATCH /api/user/notifications/[id]
 * - Marca una notificación como leída
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUnreadNotifications } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');

    const notifications = await getUnreadNotifications(currentUser.userId, limit);

    return NextResponse.json({
      success: true,
      notifications,
      total: notifications.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/user/notifications:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}
