/**
 * ========================================
 * API ROUTE: ASIGNAR CONTRIBUCIÓN A MODERADOR
 * ========================================
 * 
 * POST /api/contributions/[id]/assign
 * - Asigna una contribución al moderador actual
 * 
 * DELETE /api/contributions/[id]/assign
 * - Libera la asignación de la contribución
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si la contribución existe y no está asignada
    const contribCheck = await db.query(
      `SELECT id, assigned_to, status 
       FROM app.user_contributions 
       WHERE id = $1`,
      [id]
    );

    if (contribCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    const contrib = contribCheck.rows[0];

    // Si ya está asignada a otro moderador
    if (contrib.assigned_to && contrib.assigned_to !== currentUser.userId) {
      const assignedUser = await db.query(
        `SELECT username, display_name FROM app.users WHERE id = $1`,
        [contrib.assigned_to]
      );

      return NextResponse.json(
        { 
          error: 'Este caso ya está asignado a otro moderador',
          assignedTo: assignedUser.rows[0]
        },
        { status: 409 }
      );
    }

    // Si ya está aprobada o rechazada
    if (contrib.status === 'approved' || contrib.status === 'rejected') {
      return NextResponse.json(
        { error: 'Esta contribución ya fue procesada' },
        { status: 400 }
      );
    }

    // Asignar la contribución al moderador actual y cambiar estado a in_review
    await db.query(
      `UPDATE app.user_contributions 
       SET assigned_to = $1, 
           assigned_at = CURRENT_TIMESTAMP,
           status = 'in_review'
       WHERE id = $2`,
      [currentUser.userId, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Contribución asignada exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/contributions/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al asignar la contribución' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const { id } = await params;

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Verificar si la contribución existe
    const contribCheck = await db.query(
      `SELECT id, assigned_to, status FROM app.user_contributions WHERE id = $1`,
      [id]
    );

    if (contribCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    const contrib = contribCheck.rows[0];

    // Solo el admin o el moderador asignado pueden liberar el caso
    if (!currentUser.isAdmin && contrib.assigned_to !== currentUser.userId) {
      return NextResponse.json(
        { error: 'No puedes liberar este caso' },
        { status: 403 }
      );
    }

    // Liberar la asignación y volver a pending
    await db.query(
      `UPDATE app.user_contributions 
       SET assigned_to = NULL, 
           assigned_at = NULL,
           status = 'pending'
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Contribución liberada exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/contributions/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al liberar la contribución' },
      { status: 500 }
    );
  }
}
