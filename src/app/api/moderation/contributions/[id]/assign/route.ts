import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/moderation/contributions/[id]/assign
 * Asigna una contribución de nuevo contenido al moderador actual
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = (decoded as any).userId;
    const contributionId = params.id;

    // Verificar que la contribución existe y no está asignada
    const checkQuery = `
      SELECT id, assigned_to_user_id, status
      FROM app.user_contributions
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const checkResult = await pool.query(checkQuery, [contributionId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contribución no encontrada' }, { status: 404 });
    }

    const contribution = checkResult.rows[0];

    // Si ya está asignada a otro usuario, no permitir
    if (contribution.assigned_to_user_id && contribution.assigned_to_user_id !== userId) {
      return NextResponse.json(
        { error: 'Esta contribución ya está asignada a otro moderador' },
        { status: 400 }
      );
    }

    // Asignar al usuario actual y cambiar estado a in_review
    const updateQuery = `
      UPDATE app.user_contributions
      SET assigned_to_user_id = $1,
          assigned_at = NOW(),
          status = 'in_review',
          updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    
    await pool.query(updateQuery, [userId, contributionId]);

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
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded === 'string') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const userId = (decoded as any).userId;
    const contributionId = params.id;

    // Verificar que la contribución existe y está asignada al usuario actual
    const checkQuery = `
      SELECT id, assigned_to_user_id
      FROM app.user_contributions
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const checkResult = await pool.query(checkQuery, [contributionId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Contribución no encontrada' }, { status: 404 });
    }

    const contribution = checkResult.rows[0];

    // Solo permitir liberar si está asignado al usuario actual o si es admin
    const isAdmin = (decoded as any).isAdmin;
    if (contribution.assigned_to_user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: 'No puedes liberar un caso que no está asignado a ti' },
        { status: 403 }
      );
    }

    // Liberar el caso y volver a pending
    const updateQuery = `
      UPDATE app.user_contributions
      SET assigned_to_user_id = NULL,
          assigned_at = NULL,
          status = 'pending',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    
    await pool.query(updateQuery, [contributionId]);

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
