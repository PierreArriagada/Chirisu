import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * ============================================
 * API ENDPOINT: GET /api/moderation/reported-reviews
 * ============================================
 * 
 * Obtiene las reviews reportadas para moderación
 * Solo accesible por administradores y moderadores
 * 
 * Query Params:
 * - status: 'pending' | 'resolved' | 'dismissed' (default: 'pending')
 * - limit: número de resultados (default: 20)
 * - offset: para paginación (default: 0)
 */

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin o moderador
    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta sección' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query para obtener reviews reportadas con sistema de asignación y visibilidad 15 días
    const query = `
      SELECT 
        rr.id as report_id,
        rr.reason,
        rr.comments as description,
        rr.status,
        rr.created_at as reported_at,
        rr.resolved_at,
        rr.resolution_notes as resolution_note,
        rr.assigned_to,
        rr.assigned_at,
        -- Datos de la review
        r.id as review_id,
        r.overall_score as rating,
        r.content,
        r.created_at as review_created_at,
        r.helpful_votes as likes_count,
        r.reviewable_type,
        r.reviewable_id,
        -- Usuario que hizo la review
        u_author.id as author_id,
        u_author.username as author_username,
        u_author.display_name as author_display_name,
        u_author.avatar_url as author_avatar,
        -- Usuario que reportó
        u_reporter.id as reporter_id,
        u_reporter.username as reporter_username,
        u_reporter.display_name as reporter_display_name,
        -- Moderador que resolvió (si aplica)
        u_mod.username as moderator_username,
        u_mod.display_name as moderator_display_name,
        -- Usuario asignado
        u_assigned.id as assigned_to_id,
        u_assigned.username as assigned_to_username,
        u_assigned.display_name as assigned_to_display_name,
        -- Información del medio
        COALESCE(
          a.title,
          m.title,
          n.title,
          d.title,
          mh.title,
          mw.title,
          fc.title
        ) as media_title,
        COALESCE(
          a.slug,
          m.slug,
          n.slug,
          d.slug,
          mh.slug,
          mw.slug,
          fc.slug
        ) as media_slug
      FROM app.review_reports rr
      INNER JOIN app.reviews r ON rr.review_id = r.id
      INNER JOIN app.users u_author ON rr.reported_user_id = u_author.id
      INNER JOIN app.users u_reporter ON rr.reporter_user_id = u_reporter.id
      LEFT JOIN app.users u_mod ON rr.resolved_by = u_mod.id
      LEFT JOIN app.users u_assigned ON rr.assigned_to = u_assigned.id
      -- Joins para obtener título del medio
      LEFT JOIN app.anime a ON r.reviewable_type = 'anime' AND r.reviewable_id = a.id
      LEFT JOIN app.manga m ON r.reviewable_type = 'manga' AND r.reviewable_id = m.id
      LEFT JOIN app.novels n ON r.reviewable_type = 'novel' AND r.reviewable_id = n.id
      LEFT JOIN app.donghua d ON r.reviewable_type = 'donghua' AND r.reviewable_id = d.id
      LEFT JOIN app.manhua mh ON r.reviewable_type = 'manhua' AND r.reviewable_id = mh.id
      LEFT JOIN app.manhwa mw ON r.reviewable_type = 'manhwa' AND r.reviewable_id = mw.id
      LEFT JOIN app.fan_comic fc ON r.reviewable_type = 'fan_comic' AND r.reviewable_id = fc.id
      WHERE rr.status = $1
        AND (
          $4 = true 
          OR rr.assigned_to IS NULL 
          OR rr.assigned_to = $5
          OR (rr.assigned_at < NOW() - INTERVAL '15 days' AND rr.status != 'resolved')
        )
      ORDER BY rr.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [status, limit, offset, currentUser.isAdmin, currentUser.id]);

    // Obtener conteo total con misma lógica de visibilidad
    const countResult = await pool.query(
      `SELECT COUNT(*) as total 
       FROM app.review_reports 
       WHERE status = $1
         AND (
          $2 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $3
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )`,
      [status, currentUser.isAdmin, currentUser.id]
    );

    const reports = result.rows.map(row => ({
      reportId: row.report_id,
      reason: row.reason,
      description: row.description,
      status: row.status,
      reportedAt: row.reported_at,
      resolvedAt: row.resolved_at,
      resolutionNote: row.resolution_note,
      assignedToUserId: row.assigned_to_id?.toString(),
      assignedToUsername: row.assigned_to_username,
      assignedToDisplayName: row.assigned_to_display_name,
      assignedAt: row.assigned_at,
      review: {
        id: row.review_id,
        rating: row.rating,
        content: row.content,
        createdAt: row.review_created_at,
        likesCount: row.likes_count,
        reviewableType: row.reviewable_type,
        reviewableId: row.reviewable_id,
        author: {
          id: row.author_id,
          username: row.author_username,
          displayName: row.author_display_name,
          avatarUrl: row.author_avatar,
        },
        media: {
          title: row.media_title,
          slug: row.media_slug,
          type: row.reviewable_type,
        }
      },
      reporter: {
        id: row.reporter_id,
        username: row.reporter_username,
        displayName: row.reporter_display_name,
      },
      moderator: row.moderator_username ? {
        username: row.moderator_username,
        displayName: row.moderator_display_name,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      reports,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error en GET /api/moderation/reported-reviews:', error);
    return NextResponse.json(
      { error: 'Error al obtener reviews reportadas' },
      { status: 500 }
    );
  }
}

/**
 * ============================================
 * API ENDPOINT: PATCH /api/moderation/reported-reviews
 * ============================================
 * 
 * Resuelve o desestima un reporte de review
 */

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    if (!currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No tienes permisos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reportId, action, resolutionNote } = body;

    // Validaciones
    if (!reportId || !action) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    if (!['resolve', 'dismiss', 'delete_review'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (action === 'delete_review') {
        // Eliminar la review (soft delete) y resolver el reporte
        await client.query(
          `UPDATE app.reviews 
           SET deleted_at = NOW() 
           WHERE id = (SELECT review_id FROM app.review_reports WHERE id = $1)`,
          [reportId]
        );

        await client.query(
          `UPDATE app.review_reports 
           SET status = 'resolved', 
               resolved_at = NOW(), 
               resolved_by = $1,
               resolution_notes = $2
           WHERE id = $3`,
          [currentUser.userId, resolutionNote || 'Review eliminada por violar las normas', reportId]
        );

        // Registrar en audit_log
        await client.query(
          `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
           VALUES ($1, 'resolve_review_report_delete', 'review_report', $2, $3)`,
          [currentUser.userId, reportId, JSON.stringify({ action: 'delete_review' })]
        );
      } else if (action === 'resolve') {
        // Marcar como resuelto sin eliminar
        await client.query(
          `UPDATE app.review_reports 
           SET status = 'resolved', 
               resolved_at = NOW(), 
               resolved_by = $1,
               resolution_notes = $2
           WHERE id = $3`,
          [currentUser.userId, resolutionNote || 'Reporte resuelto', reportId]
        );

        // Registrar en audit_log
        await client.query(
          `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
           VALUES ($1, 'resolve_review_report', 'review_report', $2, $3)`,
          [currentUser.userId, reportId, JSON.stringify({ status: 'resolved' })]
        );
      } else if (action === 'dismiss') {
        // Desestimar reporte
        await client.query(
          `UPDATE app.review_reports 
           SET status = 'rejected', 
               resolved_at = NOW(), 
               resolved_by = $1,
               resolution_notes = $2
           WHERE id = $3`,
          [currentUser.userId, resolutionNote || 'Reporte desestimado - no viola normas', reportId]
        );

        // Registrar en audit_log
        await client.query(
          `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
           VALUES ($1, 'dismiss_review_report', 'review_report', $2, $3)`,
          [currentUser.userId, reportId, JSON.stringify({ status: 'rejected' })]
        );
      }

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Reporte actualizado correctamente',
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error en PATCH /api/moderation/reported-reviews:', error);
    return NextResponse.json(
      { error: 'Error al actualizar reporte' },
      { status: 500 }
    );
  }
}
