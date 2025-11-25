/**
 * ========================================
 * API ROUTE: REPORTES DE COMENTARIOS DEL USUARIO
 * ========================================
 * 
 * GET /api/user/comment-reports
 * - Obtiene los reportes de comentarios creados por el usuario actual
 * - Estados: pending, reviewing, resolved, rejected
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status'); // pending, reviewing, resolved, rejected

    let query = `
      SELECT 
        cr.id,
        cr.reason,
        cr.comments as description,
        cr.status,
        cr.created_at,
        cr.resolved_at,
        cr.resolution_notes,
        cr.action_taken,
        c.id as comment_id,
        c.content as comment_content,
        c.commentable_type,
        c.commentable_id,
        c.deleted_at as comment_deleted,
        resolver.username as resolved_by_username,
        resolver.display_name as resolved_by_display_name,
        CASE 
          WHEN c.commentable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'novels' THEN (SELECT title_romaji FROM app.novels WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = c.commentable_id)
          WHEN c.commentable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = c.commentable_id)
          ELSE 'Comentario'
        END as content_title
      FROM app.comment_reports cr
      INNER JOIN app.comments c ON cr.comment_id = c.id
      LEFT JOIN app.users resolver ON cr.resolved_by = resolver.id
      WHERE cr.reporter_user_id = $1
    `;

    const values: any[] = [currentUser.userId];

    if (status) {
      query += ` AND cr.status = $2`;
      values.push(status);
    }

    query += `
      ORDER BY cr.created_at DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limit);

    const result = await db.query(query, values);

    return NextResponse.json({
      success: true,
      reports: result.rows,
      total: result.rows.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/user/comment-reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes de comentarios' },
      { status: 500 }
    );
  }
}
