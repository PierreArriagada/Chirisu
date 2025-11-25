import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API de Reportes de Contenido
 * 
 * POST /api/content-reports
 * - Body: { userId, reportableType, reportableId, issueType, title, description }
 * - Crea un nuevo reporte y notifica a moderadores/admins
 * 
 * GET /api/content-reports
 * - Query: status, assignedTo (para filtrar)
 * - Obtiene lista de reportes (solo para mod/admin)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reportableType, reportableId, issueType, title, description } = body;

    console.log('📝 Recibiendo reporte de contenido:', { 
      userId, 
      reportableType, 
      reportableId, 
      issueType, 
      title,
      description: description?.substring(0, 50) + '...' 
    });

    // Validación
    if (!userId || !reportableType || !reportableId || !description) {
      console.error('❌ Validación fallida - Campos faltantes:', { userId, reportableType, reportableId, description: !!description });
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(reportableType)) {
      console.error('❌ Tipo de contenido inválido:', reportableType);
      return NextResponse.json(
        { error: 'Tipo de contenido inválido' },
        { status: 400 }
      );
    }

    // Combinar título y descripción en report_reason
    const reportReason = title ? `${title}: ${description}` : description;

    console.log('💾 Insertando en BD:', { userId, reportableType, reportableId, reportReason: reportReason.substring(0, 50) });

    // Crear el reporte (el trigger automáticamente notificará a mods/admins)
    const result = await pool.query(
      `INSERT INTO app.content_reports 
        (reported_by, reportable_type, reportable_id, report_reason, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING id, created_at`,
      [userId, reportableType, reportableId, reportReason]
    );

    const newReport = result.rows[0];

    console.log(`✅ Reporte creado: ID ${newReport.id} por usuario ${userId} para ${reportableType} ${reportableId}`);

    return NextResponse.json({
      success: true,
      report: {
        id: newReport.id.toString(),
        createdAt: newReport.created_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/content-reports:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'pending';
    const type = searchParams.get('type'); // Nuevo: filtro por tipo
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // ⚠️ IMPORTANTE: Obtener usuario actual del token/sesión
    const currentUserIdParam = searchParams.get('currentUserId');
    const isAdminParam = searchParams.get('isAdmin') === 'true';
    
    // TODO: Esto debería venir de getCurrentUser() por seguridad
    // Por ahora usamos los parámetros pero esto es inseguro
    const currentUserId = currentUserIdParam ? parseInt(currentUserIdParam) : null;
    const isAdmin = isAdminParam;

    // Verificar si la tabla existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'app' 
        AND table_name = 'content_reports'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({
        success: true,
        reports: [],
        count: 0,
      });
    }

    let query = `
      SELECT 
        r.id,
        r.reported_by,
        r.reportable_type,
        r.reportable_id,
        r.report_reason,
        r.status,
        r.moderator_notes,
        r.created_at,
        r.resolved_at,
        r.reviewed_by,
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
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (status && status !== 'all') {
      paramCount++;
      query += ` AND r.status = $${paramCount}`;
      params.push(status);
    }

    if (userId) {
      paramCount++;
      query += ` AND r.reported_by = $${paramCount}`;
      params.push(userId);
    }

    // Nuevo: filtro por tipo de contenido reportado
    if (type) {
      paramCount++;
      query += ` AND r.reportable_type = $${paramCount}`;
      params.push(type);
    }

    // 🔒 REGLA DE VISIBILIDAD DE 15 DÍAS
    // - Si el caso está asignado a otro moderador Y no han pasado 15 días → NO visible
    // - Si han pasado más de 15 días sin resolver → visible para todos
    // - Si eres admin → ves TODO
    // - Si el caso está asignado a ti → lo ves
    // - Si el caso no está asignado → todos lo ven
    if (!isAdmin && currentUserId) {
      paramCount++;
      query += ` AND (
        r.assigned_to IS NULL 
        OR r.assigned_to = $${paramCount}
        OR (r.assigned_at < NOW() - INTERVAL '15 days' AND r.status != 'resolved')
      )`;
      params.push(currentUserId);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const reports = result.rows.map(row => ({
      id: row.id.toString(),
      reporterUserId: row.reported_by?.toString() || '',
      reporterUsername: row.reporter_username || 'Usuario desconocido',
      reporterDisplayName: row.reporter_display_name || '',
      reportableType: row.reportable_type,
      reportableId: row.reportable_id.toString(),
      issueType: 'other', // Campo no existe en la tabla
      title: 'Reporte', // Extraer del report_reason si es necesario
      description: row.report_reason,
      status: row.status,
      priority: 'normal', // Campo no existe en la tabla
      assignedToUserId: row.assigned_to?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      moderatorNotes: row.moderator_notes,
      reviewedBy: row.reviewed_by_username,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }));

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/content-reports:', error);
    return NextResponse.json(
      { success: false, error: error.message, reports: [], count: 0 },
      { status: 200 } // Cambiar a 200 para no romper el frontend
    );
  }
}
