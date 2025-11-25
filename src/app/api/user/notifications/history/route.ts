/**
 * ========================================
 * API ROUTE: HISTORIAL DE NOTIFICACIONES
 * ========================================
 * 
 * GET /api/user/notifications/history
 * - Obtiene todas las notificaciones del usuario (leídas y no leídas)
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllNotifications } from '@/lib/notifications';

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { notifications, total } = await getAllNotifications(
      currentUser.userId,
      limit,
      offset
    );

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('❌ Error en GET /api/user/notifications/history:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial de notificaciones' },
      { status: 500 }
    );
  }
}
