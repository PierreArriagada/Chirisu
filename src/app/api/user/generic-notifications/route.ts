/**
 * API para notificaciones genéricas de usuario
 * GET - Obtener notificaciones no leídas
 * POST - Marcar notificaciones como leídas
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// GET - Obtener notificaciones genéricas no leídas
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeRead = searchParams.get('includeRead') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    let query = `
      SELECT 
        id,
        type,
        title,
        message,
        data,
        read_at as "readAt",
        created_at as "createdAt"
      FROM app.user_notifications
      WHERE user_id = $1
    `;
    
    if (!includeRead) {
      query += ` AND read_at IS NULL`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;

    const result = await pool.query(query, [session.userId, limit, offset]);

    // Contar total no leídas
    const countResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM app.user_notifications 
      WHERE user_id = $1 AND read_at IS NULL
    `, [session.userId]);

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error en GET /api/user/generic-notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Marcar notificaciones como leídas
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationIds, markAll } = body;

    if (markAll) {
      // Marcar todas como leídas
      await pool.query(`
        UPDATE app.user_notifications
        SET read_at = NOW()
        WHERE user_id = $1 AND read_at IS NULL
      `, [session.userId]);

      return NextResponse.json({ message: 'Todas las notificaciones marcadas como leídas' });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds requerido' }, { status: 400 });
    }

    // Marcar específicas como leídas
    await pool.query(`
      UPDATE app.user_notifications
      SET read_at = NOW()
      WHERE id = ANY($1::int[]) AND user_id = $2 AND read_at IS NULL
    `, [notificationIds, session.userId]);

    return NextResponse.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error en POST /api/user/generic-notifications:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
