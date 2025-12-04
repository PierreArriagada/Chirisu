/**
 * ========================================
 * API ROUTE: REPORTES DE REVIEWS DEL USUARIO
 * ========================================
 * 
 * GET /api/user/review-reports
 * - Obtiene los reportes de reviews creados por el usuario actual
 * - Estados: pending, resolved, rejected
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
    const status = searchParams.get('status'); // pending, resolved, rejected

    let query = `
      SELECT 
        rr.id,
        rr.reason,
        rr.comments as description,
        rr.status,
        rr.created_at,
        rr.resolved_at,
        rr.resolution_notes,
        rr.action_taken,
        r.id as review_id,
        r.content as review_content,
        r.overall_score as rating,
        r.reviewable_type,
        r.reviewable_id,
        r.deleted_at as review_deleted,
        reported_user.username as review_author_username,
        reported_user.display_name as review_author_display_name,
        resolver.username as resolved_by_username,
        resolver.display_name as resolved_by_display_name,
        COALESCE(
          (SELECT title_romaji FROM app.anime WHERE id = r.reviewable_id AND r.reviewable_type = 'anime'),
          (SELECT title_romaji FROM app.manga WHERE id = r.reviewable_id AND r.reviewable_type = 'manga'),
          (SELECT title_romaji FROM app.novels WHERE id = r.reviewable_id AND r.reviewable_type = 'novel'),
          (SELECT title_romaji FROM app.donghua WHERE id = r.reviewable_id AND r.reviewable_type = 'donghua'),
          (SELECT title_romaji FROM app.manhua WHERE id = r.reviewable_id AND r.reviewable_type = 'manhua'),
          (SELECT title_romaji FROM app.manhwa WHERE id = r.reviewable_id AND r.reviewable_type = 'manhwa'),
          (SELECT title FROM app.fan_comics WHERE id = r.reviewable_id AND r.reviewable_type = 'fan_comic'),
          'Review'
        ) as content_title
      FROM app.review_reports rr
      INNER JOIN app.reviews r ON rr.review_id = r.id
      LEFT JOIN app.users reported_user ON rr.reported_user_id = reported_user.id
      LEFT JOIN app.users resolver ON rr.resolved_by = resolver.id
      WHERE rr.reporter_user_id = $1
    `;

    const values: any[] = [currentUser.userId];

    if (status) {
      query += ` AND rr.status = $2`;
      values.push(status);
    }

    query += `
      ORDER BY rr.created_at DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limit);

    const result = await db.query(query, values);

    const reports = result.rows.map(row => ({
      id: row.id.toString(),
      reason: row.reason,
      description: row.description || '',
      status: row.status,
      created_at: row.created_at,
      resolved_at: row.resolved_at,
      resolution_notes: row.resolution_notes,
      action_taken: row.action_taken,
      review_id: row.review_id,
      review_content: row.review_content,
      rating: row.rating,
      review_deleted: row.review_deleted,
      reviewable_type: row.reviewable_type,
      reviewable_id: row.reviewable_id,
      review_author_username: row.review_author_username,
      review_author_display_name: row.review_author_display_name,
      resolved_by_username: row.resolved_by_username,
      resolved_by_display_name: row.resolved_by_display_name,
      content_title: row.content_title,
      type: 'review',
    }));

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });
  } catch (error: any) {
    console.error('Error en GET /api/user/review-reports:', error);
    return NextResponse.json(
      { success: false, error: error.message, reports: [] },
      { status: 500 }
    );
  }
}
