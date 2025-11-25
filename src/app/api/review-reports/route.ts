import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * GET /api/review-reports
 * Obtiene la lista de reportes de reviews con filtros de visibilidad
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

    let query = `
      SELECT 
        rr.id,
        rr.review_id,
        rr.reporter_user_id,
        rr.reported_user_id,
        rr.reason,
        rr.comments,
        rr.status,
        rr.created_at,
        rr.resolved_at,
        rr.resolved_by,
        rr.resolution_notes,
        rr.action_taken,
        rr.assigned_to,
        rr.assigned_at,
        u_reporter.username as reporter_username,
        u_reporter.display_name as reporter_display_name,
        u_reported.username as reported_username,
        u_reported.display_name as reported_display_name,
        u_assigned.username as assigned_to_username,
        u_assigned.display_name as assigned_to_display_name
      FROM app.review_reports rr
      LEFT JOIN app.users u_reporter ON rr.reporter_user_id = u_reporter.id
      LEFT JOIN app.users u_reported ON rr.reported_user_id = u_reported.id
      LEFT JOIN app.users u_assigned ON rr.assigned_to = u_assigned.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtro por status
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND rr.status = $${paramCount}`;
      params.push(status);
    }

    // 🔒 REGLA DE VISIBILIDAD DE 15 DÍAS
    if (!payload.isAdmin) {
      query += ` AND (
        rr.assigned_to IS NULL 
        OR rr.assigned_to = $${paramCount + 1}
        OR (rr.assigned_at < NOW() - INTERVAL '15 days' AND rr.status != 'resolved')
      )`;
      params.push(payload.userId);
      paramCount++;
    }

    query += ` ORDER BY rr.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const reports = result.rows.map(row => ({
      id: row.id.toString(),
      reviewId: row.review_id.toString(),
      reporterUserId: row.reporter_user_id.toString(),
      reporterUsername: row.reporter_username,
      reporterDisplayName: row.reporter_display_name,
      reportedUserId: row.reported_user_id.toString(),
      reportedUsername: row.reported_username,
      reportedDisplayName: row.reported_display_name,
      reason: row.reason,
      comments: row.comments,
      status: row.status,
      assignedToUserId: row.assigned_to?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      resolvedBy: row.resolved_by?.toString(),
      resolutionNotes: row.resolution_notes,
      actionTaken: row.action_taken,
    }));

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/review-reports:', error);
    return NextResponse.json(
      { success: false, error: error.message, reports: [], count: 0 },
      { status: 200 }
    );
  }
}
