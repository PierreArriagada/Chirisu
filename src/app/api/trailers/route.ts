import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/trailers
 * 
 * Query params:
 * - period: 'daily' | 'weekly' | 'all_time' (default: 'daily')
 * - limit: número de resultados (default: 6)
 * - mediaType: 'anime' | 'manga' | 'novel' (opcional)
 * - mediaId: ID del medio (opcional)
 * 
 * Ejemplos:
 * - /api/trailers?period=daily&limit=6
 * - /api/trailers?mediaType=anime&mediaId=1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily';
    const limit = parseInt(searchParams.get('limit') || '6');
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');

    // Caso 1: Trailers de un medio específico
    if (mediaType && mediaId) {
      const result = await pool.query(`
        SELECT 
          mt.id,
          mt.title,
          mt.url,
          mt.thumbnail_url,
          mt.views_count,
          mt.duration_seconds,
          mt.published_at
        FROM app.media_trailers mt
        WHERE mt.mediable_type = $1 AND mt.mediable_id = $2
        ORDER BY mt.published_at DESC
        LIMIT $3
      `, [mediaType, parseInt(mediaId), limit]);

      const trailers = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.url,
        thumbnail: row.thumbnail_url,
        viewsCount: row.views_count,
        durationSeconds: row.duration_seconds,
        publishedAt: row.published_at
      }));

      return NextResponse.json({
        mediaType,
        mediaId: parseInt(mediaId),
        count: trailers.length,
        trailers
      });
    }

    // Caso 2: Top trailers por período
    if (period === 'daily') {
      const result = await pool.query(
        'SELECT * FROM app.get_top_trailers_daily($1)',
        [limit]
      );

      const trailers = result.rows.map(row => ({
        id: row.trailer_id,
        title: row.title,
        url: row.url,
        thumbnail: row.thumbnail_url,
        viewsCount: row.views_count,
        media: {
          id: row.media_id,
          title: row.media_title,
          type: row.media_type
        }
      }));

      return NextResponse.json({
        period: 'daily',
        count: trailers.length,
        trailers
      });
    }

    // Para weekly/all_time, usar query personalizada
    const timeFilter = period === 'weekly' 
      ? "tv.viewed_at >= CURRENT_DATE - INTERVAL '7 days'"
      : "TRUE"; // all_time

    const result = await pool.query(`
      WITH period_views AS (
        SELECT 
          tv.trailer_id,
          COUNT(*) as period_views
        FROM app.trailer_views tv
        WHERE ${timeFilter}
        GROUP BY tv.trailer_id
      )
      SELECT 
        mt.id as trailer_id,
        mt.title,
        mt.url,
        mt.thumbnail_url,
        COALESCE(pv.period_views, 0) as views_count,
        CASE 
          WHEN mt.mediable_type = 'anime' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.anime WHERE id = mt.mediable_id)
          WHEN mt.mediable_type = 'manga' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.manga WHERE id = mt.mediable_id)
          WHEN mt.mediable_type = 'novel' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.novels WHERE id = mt.mediable_id)
        END as media_title,
        mt.mediable_id as media_id,
        mt.mediable_type as media_type
      FROM app.media_trailers mt
      LEFT JOIN period_views pv ON mt.id = pv.trailer_id
      ORDER BY views_count DESC, mt.views_count DESC
      LIMIT $1
    `, [limit]);

    const trailers = result.rows.map(row => ({
      id: row.trailer_id,
      title: row.title,
      url: row.url,
      thumbnail: row.thumbnail_url,
      viewsCount: parseInt(row.views_count) || 0,
      media: {
        id: row.media_id,
        title: row.media_title,
        type: row.media_type
      }
    }));

    return NextResponse.json({
      period,
      count: trailers.length,
      trailers
    });

  } catch (error) {
    console.error('Error en GET /api/trailers:', error);
    return NextResponse.json(
      { error: 'Error al obtener trailers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trailers
 * 
 * Body:
 * {
 *   "trailerId": number,
 *   "sessionId": string (opcional, para usuarios no autenticados)
 * }
 * 
 * Registra una vista de trailer con deduplicación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trailerId, sessionId } = body;

    if (!trailerId) {
      return NextResponse.json(
        { error: 'trailerId es requerido' },
        { status: 400 }
      );
    }

    // TODO: Obtener userId de la sesión de NextAuth cuando esté implementado
    const userId = null; // Placeholder
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Deduplicación: verificar si ya existe una vista reciente
    const existingView = await pool.query(`
      SELECT id FROM app.trailer_views
      WHERE trailer_id = $1
        AND (
          (user_id IS NOT NULL AND user_id = $2) OR
          (session_id IS NOT NULL AND session_id = $3)
        )
        AND viewed_at >= NOW() - INTERVAL '1 hour'
      LIMIT 1
    `, [trailerId, userId, sessionId]);

    if (existingView.rows.length > 0) {
      return NextResponse.json({
        message: 'Vista ya registrada',
        deduplicated: true
      });
    }

    // Registrar nueva vista
    await pool.query(`
      INSERT INTO app.trailer_views (trailer_id, user_id, ip_address, user_agent, session_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [trailerId, userId, ipAddress, userAgent, sessionId]);

    // Incrementar contador en media_trailers
    const result = await pool.query(`
      UPDATE app.media_trailers
      SET views_count = views_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING views_count
    `, [trailerId]);

    return NextResponse.json({
      message: 'Vista registrada',
      viewsCount: result.rows[0]?.views_count || 0
    });

  } catch (error) {
    console.error('Error en POST /api/trailers:', error);
    return NextResponse.json(
      { error: 'Error al registrar vista' },
      { status: 500 }
    );
  }
}
