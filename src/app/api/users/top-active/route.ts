import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/users/top-active
 * 
 * Obtiene los usuarios más activos basándose en:
 * - Contribuciones aprobadas
 * - Cantidad de items en listas (todos los 7 tipos de media)
 * - Reviews escritas
 * 
 * Query params:
 * - limit: número de resultados (default: 5, max: 20)
 * 
 * Retorna usuarios con su nivel de actividad calculado
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);

    // Query compleja que calcula la actividad de cada usuario
    const result = await pool.query(
      `WITH user_stats AS (
        SELECT 
          u.id,
          u.username,
          u.display_name,
          u.avatar_url,
          u.level,
          u.points,
          
          -- Contar contribuciones aprobadas
          COUNT(DISTINCT CASE 
            WHEN uc.status = 'approved' THEN uc.id 
          END) as approved_contributions,
          
          -- Contar items en listas (todos los tipos de media)
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id
              AND li.listable_type IN ('anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic')
          ) as list_items_count,
          
          -- Desglosar por tipo de media en listas
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'anime'
          ) as anime_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'manga'
          ) as manga_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'novels'
          ) as novela_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'donghua'
          ) as donghua_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'manhua'
          ) as manhua_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'manhwa'
          ) as manhwa_count,
          
          (
            SELECT COUNT(DISTINCT li.id)
            FROM app.lists l
            INNER JOIN app.list_items li ON l.id = li.list_id
            WHERE l.user_id = u.id AND li.listable_type = 'fan_comic'
          ) as fan_comic_count,
          
          -- Contar reviews
          COUNT(DISTINCT CASE 
            WHEN r.deleted_at IS NULL THEN r.id 
          END) as reviews_count
          
        FROM app.users u
        LEFT JOIN app.user_contributions uc ON u.id = uc.user_id
        LEFT JOIN app.reviews r ON u.id = r.user_id
        WHERE u.deleted_at IS NULL
          AND u.is_active = TRUE
        GROUP BY u.id, u.username, u.display_name, u.avatar_url, u.level, u.points
      )
      SELECT 
        id,
        username,
        display_name,
        avatar_url,
        level,
        points,
        approved_contributions,
        list_items_count,
        anime_count,
        manga_count,
        novela_count,
        donghua_count,
        manhua_count,
        manhwa_count,
        fan_comic_count,
        reviews_count,
        -- Calcular puntuación de actividad
        -- Contribuciones valen más (5 puntos), items en listas (1 punto), reviews (3 puntos)
        (approved_contributions * 5 + list_items_count * 1 + reviews_count * 3) as activity_score
      FROM user_stats
      WHERE (approved_contributions > 0 OR list_items_count > 0 OR reviews_count > 0)
      ORDER BY activity_score DESC, level DESC, points DESC
      LIMIT $1`,
      [limit]
    );

    const users = result.rows.map(row => ({
      id: row.id.toString(),
      username: row.username,
      displayName: row.display_name || row.username,
      avatarUrl: row.avatar_url,
      level: row.level || 1,
      points: row.points || 0,
      stats: {
        contributions: parseInt(row.approved_contributions) || 0,
        listItems: parseInt(row.list_items_count) || 0,
        reviews: parseInt(row.reviews_count) || 0,
        activityScore: parseInt(row.activity_score) || 0,
      },
      mediaBreakdown: {
        anime: parseInt(row.anime_count) || 0,
        manga: parseInt(row.manga_count) || 0,
        novela: parseInt(row.novela_count) || 0,
        donghua: parseInt(row.donghua_count) || 0,
        manhua: parseInt(row.manhua_count) || 0,
        manhwa: parseInt(row.manhwa_count) || 0,
        fanComic: parseInt(row.fan_comic_count) || 0,
      }
    }));

    return NextResponse.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error: any) {
    console.error('Error en GET /api/users/top-active:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener usuarios activos',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
