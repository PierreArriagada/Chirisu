import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * GET /api/reports/counts
 * Obtiene contadores de reportes pendientes por tipo de contenido
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener contadores por tipo de contenido reportado (solo pendientes e in_review)
    // 🔒 Aplicar regla de visibilidad de 15 días
    const contentReportsQuery = await pool.query(`
      SELECT 
        reportable_type,
        COUNT(*) as count
      FROM app.content_reports
      WHERE status IN ('pending', 'in_review')
        AND (
          $1 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $2
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )
      GROUP BY reportable_type
    `, [payload.isAdmin, payload.userId]);

    // TODO: Agregar conteo de reportes de usuarios cuando se implemente
    // const userReportsQuery = await pool.query(...);

    // Mapear los contadores
    const counts = {
      comments: 0,
      reviews: 0,
      anime: 0,
      manga: 0,
      novel: 0,
      donghua: 0,
      manhua: 0,
      manhwa: 0,
      fanComic: 0,
      character: 0,
      staff: 0,
      voiceActor: 0,
      studio: 0,
      genre: 0,
      users: 0,
      total: 0,
    };

    contentReportsQuery.rows.forEach((row) => {
      const type = row.reportable_type;
      const count = parseInt(row.count);

      switch (type) {
        case 'comment':
          counts.comments = count;
          break;
        case 'review':
          counts.reviews = count;
          break;
        case 'anime':
          counts.anime = count;
          break;
        case 'manga':
          counts.manga = count;
          break;
        case 'novel':
          counts.novel = count;
          break;
        case 'donghua':
          counts.donghua = count;
          break;
        case 'manhua':
          counts.manhua = count;
          break;
        case 'manhwa':
          counts.manhwa = count;
          break;
        case 'fan_comic':
          counts.fanComic = count;
          break;
        case 'character':
          counts.character = count;
          break;
        case 'staff':
          counts.staff = count;
          break;
        case 'voice_actor':
          counts.voiceActor = count;
          break;
        case 'studio':
          counts.studio = count;
          break;
        case 'genre':
          counts.genre = count;
          break;
      }

      counts.total += count;
    });

    // Obtener contadores de reportes de reviews
    const reviewReportsQuery = await pool.query(`
      SELECT COUNT(*) as count
      FROM app.review_reports
      WHERE status IN ('pending', 'reviewing')
        AND (
          $1 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $2
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )
    `, [payload.isAdmin, payload.userId]);

    counts.reviews = parseInt(reviewReportsQuery.rows[0]?.count || '0');
    counts.total += counts.reviews;

    // Obtener contadores de reportes de comentarios
    const commentReportsQuery = await pool.query(`
      SELECT COUNT(*) as count
      FROM app.comment_reports
      WHERE status IN ('pending', 'reviewing')
        AND (
          $1 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $2
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )
    `, [payload.isAdmin, payload.userId]);

    counts.comments = parseInt(commentReportsQuery.rows[0]?.count || '0');
    counts.total += counts.comments;

    // Obtener contadores de reportes de usuarios
    const userReportsQuery = await pool.query(`
      SELECT COUNT(*) as count
      FROM app.user_reports
      WHERE status IN ('pending', 'reviewing')
        AND (
          $1 = true 
          OR assigned_to IS NULL 
          OR assigned_to = $2
          OR (assigned_at < NOW() - INTERVAL '15 days' AND status != 'resolved')
        )
    `, [payload.isAdmin, payload.userId]);

    counts.users = parseInt(userReportsQuery.rows[0]?.count || '0');
    counts.total += counts.users;

    return NextResponse.json({ counts });

  } catch (error: any) {
    console.error('Error en GET /api/reports/counts:', error);
    return NextResponse.json(
      { error: 'Error al obtener contadores' },
      { status: 500 }
    );
  }
}
