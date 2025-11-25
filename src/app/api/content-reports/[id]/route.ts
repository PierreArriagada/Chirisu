import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para un reporte específico
 * 
 * GET /api/content-reports/[id]
 * - Obtiene detalles de un reporte específico
 * 
 * PATCH /api/content-reports/[id]
 * - Actualiza el estado, prioridad y notas de un reporte
 * 
 * DELETE /api/content-reports/[id]
 * - Elimina (soft delete) un reporte
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await pool.query(
      `SELECT 
        r.id,
        r.reported_by,
        r.reportable_type,
        r.reportable_id,
        r.report_reason,
        r.status,
        r.moderator_notes,
        r.reviewed_by,
        r.resolved_at,
        r.created_at,
        r.assigned_to,
        r.assigned_at,
        u.username as reporter_username,
        u.display_name as reporter_display_name,
        rm.username as reviewed_by_username,
        am.username as assigned_to_username,
        am.display_name as assigned_to_display_name
      FROM app.content_reports r
      LEFT JOIN app.users u ON r.reported_by = u.id
      LEFT JOIN app.users rm ON r.reviewed_by = rm.id
      LEFT JOIN app.users am ON r.assigned_to = am.id
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const report = {
      id: row.id.toString(),
      reporterUserId: row.reported_by?.toString() || '',
      reporterUsername: row.reporter_username || 'Usuario desconocido',
      reporterDisplayName: row.reporter_display_name || '',
      reportableType: row.reportable_type,
      reportableId: row.reportable_id.toString(),
      issueType: 'other',
      title: 'Reporte',
      description: row.report_reason,
      status: row.status,
      priority: 'normal',
      assignedToUserId: row.assigned_to?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      moderatorNotes: row.moderator_notes,
      resolvedByUserId: row.reviewed_by?.toString(),
      resolvedByUsername: row.reviewed_by_username,
      resolvedAt: row.resolved_at,
      createdAt: row.created_at,
    };

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/content-reports/[id]:', error);
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
    const { status, priority, moderatorNotes, resolvedByUserId, assignedToUserId } = body;

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

    // Si se marca como resolved o dismissed, guardar quién lo revisó
    if (status && (status === 'resolved' || status === 'dismissed')) {
      if (resolvedByUserId) {
        paramCount++;
        updates.push(`reviewed_by = $${paramCount}`);
        values.push(resolvedByUserId);
      }
      paramCount++;
      updates.push(`resolved_at = $${paramCount}`);
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
      `UPDATE app.content_reports 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, status`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Reporte ${id} actualizado a estado: ${status || 'sin cambio'}`);

    return NextResponse.json({
      success: true,
      report: {
        id: result.rows[0].id.toString(),
        status: result.rows[0].status,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en PATCH /api/content-reports/[id]:', error);
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
      `UPDATE app.content_reports 
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reporte no encontrado' },
        { status: 404 }
      );
    }

    console.log(`✅ Reporte ${id} eliminado (soft delete)`);

    return NextResponse.json({
      success: true,
      message: 'Reporte eliminado',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/content-reports/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
