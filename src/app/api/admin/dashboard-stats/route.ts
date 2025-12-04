import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

/**
 * GET /api/admin/dashboard-stats
 * Obtiene estadísticas completas del sistema para el dashboard del administrador
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
    
    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // ========== ESTADÍSTICAS DE USUARIOS ==========
    const userStatsQuery = await pool.query(`
      SELECT 
        -- Totales
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') as new_users_week,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '30 days') as new_users_month,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '24 hours') as new_users_today,
        -- Por verificación (email verificado = token es NULL y token no expirado)
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND email_verification_token IS NULL) as verified_users,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND has_2fa_setup = true) as users_with_2fa
      FROM app.users
    `);

    // Usuarios activos (por actividad reciente en diferentes tablas)
    const activeUsersQuery = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as active_users FROM (
        SELECT user_id FROM app.reviews WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT user_id FROM app.comments WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT user_id FROM app.user_favorites WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT user_id FROM app.lists WHERE created_at >= NOW() - INTERVAL '30 days'
      ) as active
    `);

    // Actividad de usuarios por día (últimos 7 días)
    const userActivityQuery = await pool.query(`
      SELECT 
        date_trunc('day', activity_date)::date as date,
        COUNT(DISTINCT user_id) as active_users
      FROM (
        SELECT user_id, created_at as activity_date FROM app.reviews WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT user_id, created_at FROM app.comments WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT user_id, created_at FROM app.user_favorites WHERE created_at >= NOW() - INTERVAL '7 days'
      ) as activities
      GROUP BY date_trunc('day', activity_date)
      ORDER BY date DESC
    `);

    // ========== ESTADÍSTICAS DE CONTENIDO MEDIA ==========
    const mediaStatsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM app.anime) as anime_count,
        (SELECT COUNT(*) FROM app.manga) as manga_count,
        (SELECT COUNT(*) FROM app.novels) as novels_count,
        (SELECT COUNT(*) FROM app.donghua) as donghua_count,
        (SELECT COUNT(*) FROM app.manhua) as manhua_count,
        (SELECT COUNT(*) FROM app.manhwa) as manhwa_count,
        (SELECT COUNT(*) FROM app.fan_comics) as fan_comics_count
    `);

    // Anime por estado (usa status_id con JOIN a media_statuses)
    const animeByStatusQuery = await pool.query(`
      SELECT 
        COALESCE(ms.code, 'unknown') as status, 
        COUNT(*) as count
      FROM app.anime a
      LEFT JOIN app.media_statuses ms ON a.status_id = ms.id
      GROUP BY ms.code
      ORDER BY count DESC
    `);

    // Anime por tipo (usa 'type', no 'format')
    const animeByFormatQuery = await pool.query(`
      SELECT 
        COALESCE(type, 'unknown') as format, 
        COUNT(*) as count
      FROM app.anime
      GROUP BY type
      ORDER BY count DESC
    `);

    // ========== ESTADÍSTICAS DE PERSONAJES Y STAFF ==========
    const charactersStatsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM app.characters) as total_characters,
        (SELECT COUNT(*) FROM app.voice_actors) as total_voice_actors,
        (SELECT COUNT(*) FROM app.staff) as total_staff,
        (SELECT COUNT(*) FROM app.studios) as total_studios
    `);

    // ========== ESTADÍSTICAS DE INTERACCIÓN ==========
    const interactionStatsQuery = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM app.reviews) as total_reviews,
        (SELECT COUNT(*) FROM app.reviews WHERE created_at >= NOW() - INTERVAL '7 days') as reviews_this_week,
        (SELECT COUNT(*) FROM app.comments) as total_comments,
        (SELECT COUNT(*) FROM app.comments WHERE created_at >= NOW() - INTERVAL '7 days') as comments_this_week,
        (SELECT COUNT(*) FROM app.user_favorites) as total_favorites,
        (SELECT COUNT(*) FROM app.lists) as total_lists,
        (SELECT COUNT(*) FROM app.list_items) as total_list_items,
        (SELECT COUNT(*) FROM app.user_follows) as total_follows
    `);

    // Distribución de ratings en reviews (usa overall_score, no rating)
    const ratingsDistributionQuery = await pool.query(`
      SELECT 
        overall_score as rating,
        COUNT(*) as count
      FROM app.reviews
      WHERE overall_score IS NOT NULL
      GROUP BY overall_score
      ORDER BY overall_score DESC
    `);

    // ========== ESTADÍSTICAS DE CONTRIBUCIONES ==========
    const contributionsQuery = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending' AND deleted_at IS NULL) as pending,
        COUNT(*) FILTER (WHERE status = 'approved' AND deleted_at IS NULL) as approved,
        COUNT(*) FILTER (WHERE status = 'rejected' AND deleted_at IS NULL) as rejected,
        COUNT(*) FILTER (WHERE deleted_at IS NULL) as total,
        COUNT(*) FILTER (WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '7 days') as this_week
      FROM app.content_contributions
    `);

    // Top contribuidores
    const topContributorsQuery = await pool.query(`
      SELECT 
        u.username,
        u.display_name,
        u.avatar_url,
        COUNT(*) as total_contributions,
        COUNT(*) FILTER (WHERE cc.status = 'approved') as approved_contributions
      FROM app.content_contributions cc
      JOIN app.users u ON cc.contributor_user_id = u.id
      WHERE cc.deleted_at IS NULL
      GROUP BY u.id, u.username, u.display_name, u.avatar_url
      ORDER BY approved_contributions DESC
      LIMIT 5
    `);

    // ========== ESTADÍSTICAS DE REPORTES ==========
    // Usamos try-catch individual para manejar tablas que puedan no existir
    let reportsData = {
      pending_content_reports: 0,
      total_content_reports: 0,
      pending_review_reports: 0,
      total_review_reports: 0
    };

    try {
      const contentReportsQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) as total
        FROM app.content_reports
      `);
      reportsData.pending_content_reports = parseInt(contentReportsQuery.rows[0]?.pending || '0');
      reportsData.total_content_reports = parseInt(contentReportsQuery.rows[0]?.total || '0');
    } catch (e) {
      console.log('content_reports table may not exist');
    }

    try {
      const reviewReportsQuery = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) as total
        FROM app.review_reports
      `);
      reportsData.pending_review_reports = parseInt(reviewReportsQuery.rows[0]?.pending || '0');
      reportsData.total_review_reports = parseInt(reviewReportsQuery.rows[0]?.total || '0');
    } catch (e) {
      console.log('review_reports table may not exist');
    }

    // ========== ESTADÍSTICAS DE GÉNEROS ==========
    const topGenresQuery = await pool.query(`
      SELECT 
        g.name_es as name,
        COUNT(*) as count
      FROM app.genres g
      JOIN app.media_genres mg ON g.id = mg.genre_id
      GROUP BY g.id, g.name_es
      ORDER BY count DESC
      LIMIT 10
    `);

    // ========== ACTIVIDAD RECIENTE ==========
    const recentActivityQuery = await pool.query(`
      (
        SELECT 
          'user' as type,
          'Nuevo usuario: ' || COALESCE(display_name, username) as description,
          created_at as date
        FROM app.users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'review' as type,
          'Nueva review de ' || COALESCE(u.display_name, u.username) as description,
          r.created_at as date
        FROM app.reviews r
        JOIN app.users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'comment' as type,
          'Nuevo comentario de ' || COALESCE(u.display_name, u.username) as description,
          c.created_at as date
        FROM app.comments c
        JOIN app.users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 5
      )
      ORDER BY date DESC
      LIMIT 15
    `);

    // ========== CRECIMIENTO MENSUAL ==========
    const monthlyGrowthQuery = await pool.query(`
      SELECT 
        to_char(date_trunc('month', created_at), 'YYYY-MM') as month,
        COUNT(*) as new_users
      FROM app.users
      WHERE deleted_at IS NULL 
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month ASC
    `);

    // Construir respuesta
    const userStats = userStatsQuery.rows[0];
    const mediaStats = mediaStatsQuery.rows[0];
    const charactersStats = charactersStatsQuery.rows[0];
    const interactionStats = interactionStatsQuery.rows[0];
    const contributions = contributionsQuery.rows[0];

    const stats = {
      // Estadísticas de usuarios
      users: {
        total: parseInt(userStats.total_users || '0'),
        active: parseInt(activeUsersQuery.rows[0]?.active_users || '0'),
        newToday: parseInt(userStats.new_users_today || '0'),
        newThisWeek: parseInt(userStats.new_users_week || '0'),
        newThisMonth: parseInt(userStats.new_users_month || '0'),
        verified: parseInt(userStats.verified_users || '0'),
        with2FA: parseInt(userStats.users_with_2fa || '0'),
        activityByDay: userActivityQuery.rows.map(row => ({
          date: row.date,
          count: parseInt(row.active_users)
        })),
        monthlyGrowth: monthlyGrowthQuery.rows.map(row => ({
          month: row.month,
          count: parseInt(row.new_users)
        }))
      },

      // Estadísticas de contenido media
      media: {
        anime: parseInt(mediaStats.anime_count || '0'),
        manga: parseInt(mediaStats.manga_count || '0'),
        novels: parseInt(mediaStats.novels_count || '0'),
        donghua: parseInt(mediaStats.donghua_count || '0'),
        manhua: parseInt(mediaStats.manhua_count || '0'),
        manhwa: parseInt(mediaStats.manhwa_count || '0'),
        fanComics: parseInt(mediaStats.fan_comics_count || '0'),
        total: parseInt(mediaStats.anime_count || '0') + 
               parseInt(mediaStats.manga_count || '0') + 
               parseInt(mediaStats.novels_count || '0') +
               parseInt(mediaStats.donghua_count || '0') + 
               parseInt(mediaStats.manhua_count || '0') + 
               parseInt(mediaStats.manhwa_count || '0') +
               parseInt(mediaStats.fan_comics_count || '0'),
        animeByStatus: animeByStatusQuery.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        })),
        animeByFormat: animeByFormatQuery.rows.map(row => ({
          format: row.format,
          count: parseInt(row.count)
        }))
      },

      // Estadísticas de personajes y staff
      characters: {
        total: parseInt(charactersStats.total_characters || '0'),
        voiceActors: parseInt(charactersStats.total_voice_actors || '0'),
        staff: parseInt(charactersStats.total_staff || '0'),
        studios: parseInt(charactersStats.total_studios || '0')
      },

      // Estadísticas de interacción
      interactions: {
        reviews: {
          total: parseInt(interactionStats.total_reviews || '0'),
          thisWeek: parseInt(interactionStats.reviews_this_week || '0')
        },
        comments: {
          total: parseInt(interactionStats.total_comments || '0'),
          thisWeek: parseInt(interactionStats.comments_this_week || '0')
        },
        favorites: parseInt(interactionStats.total_favorites || '0'),
        lists: parseInt(interactionStats.total_lists || '0'),
        listItems: parseInt(interactionStats.total_list_items || '0'),
        follows: parseInt(interactionStats.total_follows || '0'),
        ratingsDistribution: ratingsDistributionQuery.rows.map(row => ({
          rating: parseInt(row.rating),
          count: parseInt(row.count)
        }))
      },

      // Estadísticas de contribuciones
      contributions: {
        pending: parseInt(contributions.pending || '0'),
        approved: parseInt(contributions.approved || '0'),
        rejected: parseInt(contributions.rejected || '0'),
        total: parseInt(contributions.total || '0'),
        thisWeek: parseInt(contributions.this_week || '0'),
        topContributors: topContributorsQuery.rows.map(row => ({
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
          total: parseInt(row.total_contributions),
          approved: parseInt(row.approved_contributions)
        }))
      },

      // Estadísticas de reportes
      reports: {
        contentReports: {
          pending: reportsData.pending_content_reports,
          total: reportsData.total_content_reports
        },
        reviewReports: {
          pending: reportsData.pending_review_reports,
          total: reportsData.total_review_reports
        }
      },

      // Top géneros
      topGenres: topGenresQuery.rows.map(row => ({
        name: row.name,
        count: parseInt(row.count)
      })),

      // Actividad reciente
      recentActivity: recentActivityQuery.rows.map(row => ({
        type: row.type,
        description: row.description,
        date: row.date
      }))
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error en GET /api/admin/dashboard-stats:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
