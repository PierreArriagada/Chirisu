import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/moderation/contributions/[id]/assign
 * Asigna una contribución de nuevo contenido al moderador actual
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: contributionId } = await params;

    // Verificar que la contribución existe y no está asignada
    const checkResult = await db.query(
      `SELECT id, assigned_to, status
       FROM app.user_contributions
       WHERE id = $1`,
      [contributionId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contribución no encontrada' }, { status: 404 });
    }

    const contribution = checkResult.rows[0];

    // Si ya está asignada a otro usuario, no permitir
    if (contribution.assigned_to && contribution.assigned_to !== currentUser.userId) {
      return NextResponse.json(
        { error: 'Esta contribución ya está asignada a otro moderador' },
        { status: 400 }
      );
    }

    // Asignar al usuario actual y cambiar estado a in_review
    await db.query(
      `UPDATE app.user_contributions
       SET assigned_to = $1,
           assigned_at = NOW(),
           status = 'in_review'
       WHERE id = $2`,
      [currentUser.userId, contributionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Caso asignado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en POST /api/moderation/contributions/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al asignar caso' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/moderation/contributions/[id]/assign
 * Libera una contribución de nuevo contenido (desasignarla)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: contributionId } = await params;

    // Verificar que la contribución existe
    const checkResult = await db.query(
      `SELECT id, assigned_to FROM app.user_contributions WHERE id = $1`,
      [contributionId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contribución no encontrada' }, { status: 404 });
    }

    const contribution = checkResult.rows[0];

    // Verificar roles del usuario
    const roleCheck = await db.query(
      `SELECT r.name FROM app.user_roles ur
       INNER JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name = 'admin'`,
      [currentUser.userId]
    );
    const isAdmin = roleCheck.rows.length > 0;

    // Solo permitir liberar si está asignado al usuario actual o si es admin
    if (contribution.assigned_to !== currentUser.userId && !isAdmin) {
      return NextResponse.json(
        { error: 'No puedes liberar un caso que no está asignado a ti' },
        { status: 403 }
      );
    }

    // Liberar el caso y volver a pending
    await db.query(
      `UPDATE app.user_contributions
       SET assigned_to = NULL,
           assigned_at = NULL,
           status = 'pending'
       WHERE id = $1`,
      [contributionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Caso liberado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/moderation/contributions/[id]/assign:', error);
    return NextResponse.json(
      { error: 'Error al liberar caso' },
      { status: 500 }
    );
  }
}
