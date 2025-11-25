import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * POST /api/content-contributions/[id]/assign
 * Asignar una contribución a un moderador
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la contribución existe y está en estado pending o in_review
    const checkResult = await pool.query(
      `SELECT id, status, assigned_to_user_id, contributable_type
       FROM app.content_contributions
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    const contribution = checkResult.rows[0];

    // Si ya está asignado al mismo usuario, no hacer nada
    if (contribution.assigned_to_user_id === parseInt(userId)) {
      return NextResponse.json({
        success: true,
        message: 'Ya tienes este caso asignado',
        contribution: {
          id: contribution.id,
          assignedToUserId: contribution.assigned_to_user_id,
          status: 'in_review',
        },
      });
    }

    // Asignar y cambiar estado a in_review
    const result = await pool.query(
      `UPDATE app.content_contributions
       SET assigned_to_user_id = $1,
           status = 'in_review',
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, assigned_to_user_id, status`,
      [userId, id]
    );

    // Crear auditoría
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'assign_contribution', 'content_contribution', $2, $3)`,
      [userId, id, JSON.stringify({ assigned_to_user_id: userId })]
    );

    console.log(`✅ Contribución ${id} asignada a usuario ${userId}`);

    return NextResponse.json({
      success: true,
      contribution: {
        id: result.rows[0].id.toString(),
        assignedToUserId: result.rows[0].assigned_to_user_id,
        status: result.rows[0].status,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/content-contributions/[id]/assign:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-contributions/[id]/assign
 * Abandonar/desasignar una contribución
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene el caso asignado
    const checkResult = await pool.query(
      `SELECT id, assigned_to_user_id
       FROM app.content_contributions
       WHERE id = $1 AND assigned_to_user_id = $2 AND deleted_at IS NULL`,
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No tienes este caso asignado o no existe' },
        { status: 404 }
      );
    }

    // Desasignar y volver a pending
    const result = await pool.query(
      `UPDATE app.content_contributions
       SET assigned_to_user_id = NULL,
           status = 'pending',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, status`,
      [id]
    );

    // Crear auditoría
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, old_values)
       VALUES ($1, 'unassign_contribution', 'content_contribution', $2, $3)`,
      [userId, id, JSON.stringify({ assigned_to_user_id: userId })]
    );

    console.log(`✅ Contribución ${id} liberada por usuario ${userId}`);

    return NextResponse.json({
      success: true,
      contribution: {
        id: result.rows[0].id.toString(),
        status: result.rows[0].status,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/content-contributions/[id]/assign:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
