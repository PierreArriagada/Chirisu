import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * GET /api/user-reports
 * Obtiene lista de reportes de usuarios con sistema de asignación y visibilidad 15 días
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query con sistema de asignación y visibilidad 15 días
    const query = `
      SELECT 
        ur.id,
        ur.reason,
        ur.description,
        ur.status,
        ur.created_at,
        ur.resolved_at,
        ur.resolution_notes,
        ur.action_taken,
        ur.assigned_to,
        ur.assigned_at,
        u_reported.id as reported_user_id,
        u_reported.username as reported_username,
        u_reported.display_name as reported_display_name,
        u_reported.avatar_url as reported_avatar,
        u_reported.level as reported_level,
        u_reporter.id as reporter_id,
        u_reporter.username as reporter_username,
        u_reporter.display_name as reporter_display_name,
        u_reporter.avatar_url as reporter_avatar,
        u_resolver.display_name as resolved_by_display_name,
        u_assigned.id as assigned_to_id,
        u_assigned.username as assigned_to_username,
        u_assigned.display_name as assigned_to_display_name
      FROM app.user_reports ur
      INNER JOIN app.users u_reported ON ur.reported_user_id = u_reported.id
      INNER JOIN app.users u_reporter ON ur.reporter_user_id = u_reporter.id
      LEFT JOIN app.users u_resolver ON ur.resolved_by = u_resolver.id
      LEFT JOIN app.users u_assigned ON ur.assigned_to = u_assigned.id
      WHERE ur.status = $1
        AND (
          $4 = true 
          OR ur.assigned_to IS NULL 
          OR ur.assigned_to = $5
          OR (ur.assigned_at < NOW() - INTERVAL '15 days' AND ur.status != 'resolved')
        )
      ORDER BY ur.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [status, limit, offset, payload.isAdmin, payload.userId]);

    const reports = result.rows.map(row => ({
      id: row.id.toString(),
      reason: row.reason,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes,
      actionTaken: row.action_taken,
      assignedToUserId: row.assigned_to_id?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      reportedUser: {
        id: row.reported_user_id.toString(),
        username: row.reported_username,
        displayName: row.reported_display_name,
        avatarUrl: row.reported_avatar,
        level: row.reported_level,
      },
      reporter: {
        id: row.reporter_id.toString(),
        username: row.reporter_username,
        displayName: row.reporter_display_name,
        avatarUrl: row.reporter_avatar,
      },
      resolvedBy: row.resolved_by_display_name,
    }));

    // Contar total
    const countResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM app.user_reports 
       WHERE status = $1
         AND (
          $2 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $3
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )`,
      [status, payload.isAdmin, payload.userId]
    );

    return NextResponse.json({
      success: true,
      reports,
      total: parseInt(countResult.rows[0]?.total || '0'),
    });
  } catch (error: any) {
    console.error('Error en GET /api/user-reports:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user-reports
 * Resuelve un reporte de usuario
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { reportId, status, actionTaken, resolutionNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'reportId y status son requeridos' },
        { status: 400 }
      );
    }

    await pool.query(
      `UPDATE app.user_reports 
       SET status = $1, resolved_by = $2, resolved_at = NOW(), action_taken = $3, resolution_notes = $4
       WHERE id = $5`,
      [status, payload.userId, actionTaken, resolutionNotes, reportId]
    );

    // Registrar en audit_log
    await pool.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, $2, 'user_report', $3, $4)`,
      [payload.userId, `resolve_user_report_${status}`, reportId, JSON.stringify({ status, actionTaken })]
    );

    return NextResponse.json({
      success: true,
      message: 'Reporte actualizado correctamente',
    });
  } catch (error: any) {
    console.error('Error en PATCH /api/user-reports:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
