import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para una contribución específica
 * 
 * GET /api/content-contributions/[id]
 * - Obtiene detalles de una contribución específica
 * 
 * PATCH /api/content-contributions/[id]
 * - Actualiza el estado, notas, o asignación de una contribución
 * - Cuando se aprueba, el trigger automáticamente aplica los cambios
 * 
 * DELETE /api/content-contributions/[id]
 * - Elimina (soft delete) una contribución
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.contributor_user_id,
        c.contributable_type,
        c.contributable_id,
        c.contribution_type,
        c.proposed_changes,
        c.contribution_notes,
        c.sources,
        c.status,
        c.assigned_to_user_id,
        c.moderator_notes,
        c.reviewed_by_user_id,
        c.reviewed_at,
        c.created_at,
        c.updated_at,
        u.username as contributor_username,
        u.display_name as contributor_display_name,
        am.username as assigned_to_username,
        rm.username as reviewed_by_username
      FROM app.content_contributions c
      LEFT JOIN app.users u ON c.contributor_user_id = u.id
      LEFT JOIN app.users am ON c.assigned_to_user_id = am.id
      LEFT JOIN app.users rm ON c.reviewed_by_user_id = rm.id
      WHERE c.id = $1 AND c.deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const contribution = {
      id: row.id.toString(),
      contributorUserId: row.contributor_user_id.toString(),
      contributorUsername: row.contributor_username,
      contributorDisplayName: row.contributor_display_name,
      contributableType: row.contributable_type,
      contributableId: row.contributable_id.toString(),
      contributionType: row.contribution_type,
      proposedChanges: row.proposed_changes,
      contributionNotes: row.contribution_notes,
      sources: row.sources,
      status: row.status,
      assignedToUserId: row.assigned_to_user_id?.toString(),
      assignedToUsername: row.assigned_to_username,
      moderatorNotes: row.moderator_notes,
      reviewedByUserId: row.reviewed_by_user_id?.toString(),
      reviewedByUsername: row.reviewed_by_username,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({
      success: true,
      contribution,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/content-contributions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, moderatorNotes, reviewedByUserId, assignedToUserId } = body;

    // Construir query de actualización
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);
    }

    if (moderatorNotes !== undefined) {
      paramCount++;
      updates.push(`moderator_notes = $${paramCount}`);
      values.push(moderatorNotes);
    }

    if (assignedToUserId !== undefined) {
      paramCount++;
      updates.push(`assigned_to_user_id = $${paramCount}`);
      values.push(assignedToUserId);
    }

    // Si se marca como approved, rejected o needs_changes, guardar quién lo revisó
    if (status && ['approved', 'rejected', 'needs_changes'].includes(status)) {
      if (reviewedByUserId) {
        paramCount++;
        updates.push(`reviewed_by_user_id = $${paramCount}`);
        values.push(reviewedByUserId);
      }
      paramCount++;
      updates.push(`reviewed_at = $${paramCount}`);
      values.push(new Date());
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay cambios para actualizar' },
        { status: 400 }
      );
    }

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE app.content_contributions 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND deleted_at IS NULL
       RETURNING id, status, updated_at`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    console.log(`✅ Contribución ${id} actualizada a estado: ${status || 'sin cambio'}`);

    // Si se aprobó, el trigger fn_apply_approved_contribution aplicará los cambios automáticamente
    if (status === 'approved') {
      console.log(`✅ Los cambios de la contribución ${id} serán aplicados por el trigger`);
    }

    return NextResponse.json({
      success: true,
      contribution: {
        id: result.rows[0].id.toString(),
        status: result.rows[0].status,
        updatedAt: result.rows[0].updated_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en PATCH /api/content-contributions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `UPDATE app.content_contributions 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    console.log(`✅ Contribución ${id} eliminada (soft delete)`);

    return NextResponse.json({
      success: true,
      message: 'Contribución eliminada',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/content-contributions/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
