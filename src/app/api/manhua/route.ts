/**
 * ========================================
 * API ROUTE: MANHUA (Chinese Comics)
 * ========================================
 * 
 * GET /api/manhua?limit=20&offset=0&sort=ranking
 * 
 * Obtiene listado de manhua con filtros y ordenamiento
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
    let whereConditions = ['m.is_approved = true', 'm.deleted_at IS NULL'];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      whereConditions.push(`ms.code = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(
        m.title_romaji ILIKE $${paramCounter} OR 
        m.title_english ILIKE $${paramCounter} OR 
        m.title_spanish ILIKE $${paramCounter} OR
        m.title_native ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Construir ORDER BY clause
    let orderBy = 'ORDER BY m.ranking ASC NULLS LAST, m.average_score DESC NULLS LAST';
    
    switch (sort) {
      case 'score':
        orderBy = 'ORDER BY m.average_score DESC NULLS LAST, m.ratings_count DESC';
        break;
      case 'popularity':
        orderBy = 'ORDER BY m.popularity DESC NULLS LAST, m.favourites DESC';
        break;
      case 'title':
        orderBy = 'ORDER BY m.title_romaji ASC';
        break;
      case 'newest':
        orderBy = 'ORDER BY m.created_at DESC';
        break;
      case 'start_date':
        orderBy = 'ORDER BY m.start_date DESC NULLS LAST';
        break;
      default:
        // ranking es el default
        break;
    }

    // Query principal
    queryParams.push(limit, offset);
    const result = await db.query(
      `SELECT 
        m.id,
        m.slug,
        COALESCE(NULLIF(m.title_spanish, ''), NULLIF(m.title_english, ''), m.title_romaji) as title,
        m.title_romaji as "titleRomaji",
        m.title_english as "titleEnglish",
        m.title_spanish as "titleSpanish",
        m.title_native as "titleNative",
        m.synopsis,
        m.cover_image as "coverImage",
        m.banner_image as "bannerImage",
        m.average_score as "averageScore",
        m.popularity,
        m.favourites,
        m.ratings_count as "ratingsCount",
        m.ranking,
        m.start_date as "startDate",
        m.end_date as "endDate",
        m.chapters,
        m.volumes,
        m.is_nsfw as "isNsfw",
        ms.name as status,
        ms.code as "statusCode"
      FROM app.manhua m
      LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      queryParams
    );

    // Query para contar total
    const countParams = queryParams.slice(0, -2); // Remover limit y offset
    const countResult = await db.query(
      `SELECT COUNT(*) as total
      FROM app.manhua m
      LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
      ${whereClause}`,
      countParams
    );

    const manhua = result.rows;
    const total = parseInt(countResult.rows[0]?.total || '0');

    console.log(`✅ GET /api/manhua: ${manhua.length} items (total: ${total})`);

    return NextResponse.json({
      success: true,
      data: manhua,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/manhua:', error);
    return NextResponse.json(
      { error: 'Error al obtener manhua' },
      { status: 500 }
    );
  }
}
