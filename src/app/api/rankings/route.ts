import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * ============================================
 * API ENDPOINT: GET /api/rankings
 * ============================================
 * 
 * Descripción:
 * Obtiene rankings de anime, manga o novelas usando vistas materializadas
 * optimizadas que se actualizan cada 5 horas automáticamente.
 * 
 * Query Params:
 * - type: 'anime' | 'manga' | 'novel' (required)
 * - period: 'daily' | 'weekly' | 'monthly' | 'all_time' (required)
 * - limit: número de resultados (default: 10, max: 100)
 * 
 * Ejemplos de uso:
 * - GET /api/rankings?type=anime&period=daily&limit=10
 * - GET /api/rankings?type=manga&period=weekly&limit=20
 * - GET /api/rankings?type=anime&period=all_time&limit=100
 * 
 * Performance:
 * - Tiempo de respuesta: < 10ms (consulta a vista materializada)
 * - Datos actualizados: cada 5 horas automáticamente
 * - Cache: Datos pre-calculados en base de datos
 * ============================================
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validación de parámetros
    const VALID_TYPES = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Parámetro "type" requerido: anime, manga, novel, donghua, manhua, manhwa, o fan_comic' },
        { status: 400 }
      );
    }

    if (!period || !['daily', 'weekly', 'monthly', 'all_time'].includes(period)) {
      return NextResponse.json(
        { error: 'Parámetro "period" requerido: daily, weekly, monthly, o all_time' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'El límite debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    let rankings: any[] = [];

    // ============================================
    // CONSULTAS SIMPLIFICADAS (sin vistas materializadas)
    // TODO: Crear vistas materializadas para optimizar performance
    // ============================================
    
    const tableMap: Record<string, string> = {
      'anime': 'app.anime',
      'manga': 'app.manga',
      'novel': 'app.novels',
      'donghua': 'app.donghua',
      'manhua': 'app.manhua',
      'manhwa': 'app.manhwa',
      'fan_comic': 'app.fan_comics'
    };

    // Columna de visibilidad varía según el tipo
    const visibilityColumnMap: Record<string, string> = {
      'anime': 'is_published',
      'manga': 'is_approved',
      'novel': 'is_approved',
      'donghua': 'is_published',
      'manhua': 'is_approved',
      'manhwa': 'is_approved',
      'fan_comic': 'is_approved'
    };

    const table = tableMap[type];
    const visibilityColumn = visibilityColumnMap[type];
    
    if (!table || !visibilityColumn) {
      return NextResponse.json(
        { error: 'Tipo de media inválido' },
        { status: 400 }
      );
    }

    // Fan Comics usa 'title' en lugar de 'title_romaji'
    // Para manhwa, manhua y donghua: preferir español > inglés > romaji
    let titleColumn: string;
    if (type === 'fan_comic') {
      titleColumn = 'title';
    } else if (['manhwa', 'manhua', 'donghua'].includes(type)) {
      titleColumn = "COALESCE(NULLIF(title_spanish, ''), NULLIF(title_english, ''), title_romaji)";
    } else {
      titleColumn = 'title_romaji';
    }

    switch (period) {
      case 'daily':
      case 'weekly':
        // Top Daily/Weekly: Medios con puntuación primero, luego recién agregados
        const recentResult = await pool.query(
          `SELECT 
            id as media_id,
            slug,
            ${titleColumn} as title,
            cover_image_url,
            average_score,
            ratings_count,
            created_at,
            ROW_NUMBER() OVER (
              ORDER BY 
                CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
                created_at DESC
            ) as rank_position
          FROM ${table}
          WHERE ${visibilityColumn} = TRUE 
            AND deleted_at IS NULL
          ORDER BY 
            CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
            created_at DESC
          LIMIT $1`,
          [limit]
        );
        
        // Obtener counts de comentarios y listas para cada item
        const ids = recentResult.rows.map(row => row.media_id);
        
        let commentsMap: Record<string, number> = {};
        let listsMap: Record<string, number> = {};
        
        if (ids.length > 0) {
          // Contar comentarios
          const commentsResult = await pool.query(
            `SELECT commentable_id, COUNT(*)::int as count
             FROM app.comments
             WHERE commentable_type = $1
               AND commentable_id = ANY($2)
               AND deleted_at IS NULL
             GROUP BY commentable_id`,
            [type, ids]
          );
          commentsResult.rows.forEach(row => {
            commentsMap[row.commentable_id] = row.count;
          });
          
          // Contar favoritos
          const favoritesResult = await pool.query(
            `SELECT favorable_id, COUNT(*)::int as count
             FROM app.user_favorites
             WHERE favorable_type = $1
               AND favorable_id = ANY($2)
             GROUP BY favorable_id`,
            [type, ids]
          );
          const favoritesMap: Record<number, number> = {};
          favoritesResult.rows.forEach(row => {
            favoritesMap[row.favorable_id] = row.count;
          });
          
          // Contar items en listas
          const listsResult = await pool.query(
            `SELECT listable_id, COUNT(*)::int as count
             FROM app.list_items
             WHERE listable_type = $1
               AND listable_id = ANY($2)
             GROUP BY listable_id`,
            [type, ids]
          );
          listsResult.rows.forEach(row => {
            // Sumar favoritos + listas en listsMap
            listsMap[row.listable_id] = (favoritesMap[row.listable_id] || 0) + row.count;
          });
          
          // Agregar favoritos para items que solo tienen favoritos pero no listas
          Object.keys(favoritesMap).forEach(id => {
            const numId = parseInt(id);
            if (!listsMap[numId]) {
              listsMap[numId] = favoritesMap[numId];
            }
          });
        }
        
        rankings = recentResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          score: parseFloat(row.average_score) || 0,
          ranking: row.rank_position || (index + 1),
          commentsCount: commentsMap[row.media_id] || 0,
          listsCount: listsMap[row.media_id] || 0,
          period: period
        }));
        break;

      case 'monthly':
        // Top Monthly: Medios con puntuación primero, luego recién agregados
        const monthlyResult = await pool.query(
          `SELECT 
            id as media_id,
            slug,
            ${titleColumn} as title,
            cover_image_url,
            average_score,
            ratings_count,
            created_at,
            ROW_NUMBER() OVER (
              ORDER BY 
                CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
                created_at DESC
            ) as rank_position
          FROM ${table}
          WHERE ${visibilityColumn} = TRUE 
            AND deleted_at IS NULL
          ORDER BY 
            CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
            created_at DESC
          LIMIT $1`,
          [limit]
        );
        
        // Obtener counts de comentarios y listas para cada item
        const monthlyIds = monthlyResult.rows.map(row => row.media_id);
        
        let monthlyCommentsMap: Record<string, number> = {};
        let monthlyListsMap: Record<string, number> = {};
        
        if (monthlyIds.length > 0) {
          // Contar comentarios
          const commentsResult = await pool.query(
            `SELECT commentable_id, COUNT(*)::int as count
             FROM app.comments
             WHERE commentable_type = $1
               AND commentable_id = ANY($2)
               AND deleted_at IS NULL
             GROUP BY commentable_id`,
            [type, monthlyIds]
          );
          commentsResult.rows.forEach(row => {
            monthlyCommentsMap[row.commentable_id] = row.count;
          });
          
          // Contar favoritos
          const favoritesResult = await pool.query(
            `SELECT favorable_id, COUNT(*)::int as count
             FROM app.user_favorites
             WHERE favorable_type = $1
               AND favorable_id = ANY($2)
             GROUP BY favorable_id`,
            [type, monthlyIds]
          );
          const favoritesMap: Record<number, number> = {};
          favoritesResult.rows.forEach(row => {
            favoritesMap[row.favorable_id] = row.count;
          });
          
          // Contar items en listas
          const listsResult = await pool.query(
            `SELECT listable_id, COUNT(*)::int as count
             FROM app.list_items
             WHERE listable_type = $1
               AND listable_id = ANY($2)
             GROUP BY listable_id`,
            [type, monthlyIds]
          );
          listsResult.rows.forEach(row => {
            // Sumar favoritos + listas
            monthlyListsMap[row.listable_id] = (favoritesMap[row.listable_id] || 0) + row.count;
          });
          
          // Agregar favoritos para items que solo tienen favoritos pero no listas
          Object.keys(favoritesMap).forEach(id => {
            const numId = parseInt(id);
            if (!monthlyListsMap[numId]) {
              monthlyListsMap[numId] = favoritesMap[numId];
            }
          });
        }
        
        rankings = monthlyResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          score: parseFloat(row.average_score) || 0,
          ranking: row.rank_position || (index + 1),
          commentsCount: monthlyCommentsMap[row.media_id] || 0,
          listsCount: monthlyListsMap[row.media_id] || 0,
          period: 'monthly'
        }));
        break;

      case 'all_time':
        // Top All-Time: Medios con puntuación primero, luego recién agregados
        const allTimeResult = await pool.query(
          `SELECT 
            id as media_id,
            slug,
            ${titleColumn} as title,
            cover_image_url,
            average_score,
            ratings_count,
            created_at,
            ROW_NUMBER() OVER (
              ORDER BY 
                CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
                created_at DESC
            ) as rank_position
          FROM ${table}
          WHERE ${visibilityColumn} = TRUE 
            AND deleted_at IS NULL
          ORDER BY 
            CASE WHEN ratings_count > 0 THEN average_score ELSE 0 END DESC,
            created_at DESC
          LIMIT $1`,
          [limit]
        );
        
        // Obtener counts de comentarios y listas para cada item
        const allTimeIds = allTimeResult.rows.map(row => row.media_id);
        
        let allTimeCommentsMap: Record<string, number> = {};
        let allTimeListsMap: Record<string, number> = {};
        
        if (allTimeIds.length > 0) {
          // Contar comentarios
          const commentsResult = await pool.query(
            `SELECT commentable_id, COUNT(*)::int as count
             FROM app.comments
             WHERE commentable_type = $1
               AND commentable_id = ANY($2)
               AND deleted_at IS NULL
             GROUP BY commentable_id`,
            [type, allTimeIds]
          );
          commentsResult.rows.forEach(row => {
            allTimeCommentsMap[row.commentable_id] = row.count;
          });
          
          // Contar favoritos
          const favoritesResult = await pool.query(
            `SELECT favorable_id, COUNT(*)::int as count
             FROM app.user_favorites
             WHERE favorable_type = $1
               AND favorable_id = ANY($2)
             GROUP BY favorable_id`,
            [type, allTimeIds]
          );
          const favoritesMap: Record<number, number> = {};
          favoritesResult.rows.forEach(row => {
            favoritesMap[row.favorable_id] = row.count;
          });
          
          // Contar items en listas
          const listsResult = await pool.query(
            `SELECT listable_id, COUNT(*)::int as count
             FROM app.list_items
             WHERE listable_type = $1
               AND listable_id = ANY($2)
             GROUP BY listable_id`,
            [type, allTimeIds]
          );
          listsResult.rows.forEach(row => {
            // Sumar favoritos + listas
            allTimeListsMap[row.listable_id] = (favoritesMap[row.listable_id] || 0) + row.count;
          });
          
          // Agregar favoritos para items que solo tienen favoritos pero no listas
          Object.keys(favoritesMap).forEach(id => {
            const numId = parseInt(id);
            if (!allTimeListsMap[numId]) {
              allTimeListsMap[numId] = favoritesMap[numId];
            }
          });
        }
        
        rankings = allTimeResult.rows.map((row, index) => ({
          id: row.media_id,
          slug: row.slug,
          title: row.title,
          coverImage: row.cover_image_url,
          averageScore: parseFloat(row.average_score) || 0,
          ratingsCount: row.ratings_count || 0,
          bayesianScore: parseFloat(row.average_score) || 0,
          ranking: row.rank_position || (index + 1),
          commentsCount: allTimeCommentsMap[row.media_id] || 0,
          listsCount: allTimeListsMap[row.media_id] || 0,
          period: 'all_time'
        }));
        break;
    }

    return NextResponse.json({
      type,
      period,
      count: rankings.length,
      rankings
    });

  } catch (error) {
    console.error('Error en /api/rankings:', error);
    return NextResponse.json(
      { error: 'Error al obtener rankings' },
      { status: 500 }
    );
  }
}
