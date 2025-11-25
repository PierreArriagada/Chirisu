/**
 * ========================================
 * API ROUTE: REPORTES DEL USUARIO
 * ========================================
 * 
 * GET /api/user/reports
 * - Obtiene los reportes creados por el usuario actual
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
    const status = searchParams.get('status'); // pending, in_review, resolved, dismissed

    let query = `
      SELECT 
        r.id,
        r.reportable_type,
        r.reportable_id,
        r.report_reason,
        r.status,
        r.moderator_notes,
        r.created_at,
        r.resolved_at,
        reviewer.username as reviewed_by_username,
        reviewer.display_name as reviewed_by_display_name,
        CASE 
          WHEN r.reportable_type = 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = r.reportable_id)
          WHEN r.reportable_type = 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = r.reportable_id)
          ELSE 'Contenido'
        END as content_title
      FROM app.content_reports r
      LEFT JOIN app.users reviewer ON r.reviewed_by = reviewer.id
      WHERE r.reported_by = $1
    `;

    const values: any[] = [currentUser.userId];

    if (status) {
      query += ` AND r.status = $2`;
      values.push(status);
    }

    query += `
      ORDER BY r.created_at DESC
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
    console.error('❌ Error en GET /api/user/reports:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}
