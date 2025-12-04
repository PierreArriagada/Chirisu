/**
 * ========================================
 * API ROUTE: DONGHUA (Chinese Animation)
 * ========================================
 * 
 * GET /api/donghua?limit=20&offset=0&sort=ranking
 * 
 * Obtiene listado de donghua con filtros y ordenamiento
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'ranking';
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Validar límite
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'El límite debe estar entre 1 y 100' },
        { status: 400 }
      );
    }

    // Construir WHERE clause
    let whereConditions = ['d.is_published = true', 'd.deleted_at IS NULL'];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      whereConditions.push(`ms.code = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(
        d.title_romaji ILIKE $${paramCounter} OR 
        d.title_english ILIKE $${paramCounter} OR 
        d.title_spanish ILIKE $${paramCounter} OR
        d.title_native ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Construir ORDER BY clause
    let orderBy = 'ORDER BY d.ranking ASC NULLS LAST, d.average_score DESC NULLS LAST';
    
    switch (sort) {
      case 'score':
        orderBy = 'ORDER BY d.average_score DESC NULLS LAST, d.ratings_count DESC';
        break;
      case 'popularity':
        orderBy = 'ORDER BY d.popularity DESC NULLS LAST, d.favourites DESC';
        break;
      case 'title':
        orderBy = 'ORDER BY d.title_romaji ASC';
        break;
      case 'newest':
        orderBy = 'ORDER BY d.created_at DESC';
        break;
      case 'start_date':
        orderBy = 'ORDER BY d.start_date DESC NULLS LAST';
        break;
      default:
        // ranking es el default
        break;
    }

    // Query principal
    queryParams.push(limit, offset);
    const result = await db.query(
      `SELECT 
        d.id,
        d.slug,
        COALESCE(NULLIF(d.title_spanish, ''), NULLIF(d.title_english, ''), d.title_romaji) as title,
        d.title_romaji as "titleRomaji",
        d.title_english as "titleEnglish",
        d.title_spanish as "titleSpanish",
        d.title_native as "titleNative",
        d.synopsis,
        d.cover_image as "coverImage",
        d.banner_image as "bannerImage",
        d.average_score as "averageScore",
        d.popularity,
        d.favourites,
        d.ratings_count as "ratingsCount",
        d.ranking,
        d.start_date as "startDate",
        d.end_date as "endDate",
        d.episode_count as "episodeCount",
        d.episode_duration as "episodeDuration",
        d.is_nsfw as "isNsfw",
        ms.name as status,
        ms.code as "statusCode"
      FROM app.donghua d
      LEFT JOIN app.media_statuses ms ON d.status_id = ms.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      queryParams
    );

    // Query para contar total
    const countParams = queryParams.slice(0, -2); // Remover limit y offset
    const countResult = await db.query(
      `SELECT COUNT(*) as total
      FROM app.donghua d
      LEFT JOIN app.media_statuses ms ON d.status_id = ms.id
      ${whereClause}`,
      countParams
    );

    const donghua = result.rows;
    const total = parseInt(countResult.rows[0]?.total || '0');

    console.log(`✅ GET /api/donghua: ${donghua.length} items (total: ${total})`);

    return NextResponse.json({
      success: true,
      data: donghua,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/donghua:', error);
    return NextResponse.json(
      { error: 'Error al obtener donghua' },
      { status: 500 }
    );
  }
}
