/**
 * ========================================
 * API ROUTE: FAN COMICS
 * ========================================
 * 
 * GET /api/fan-comics?limit=20&offset=0&sort=ranking
 * 
 * Obtiene listado de fan comics con filtros y ordenamiento
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
    let whereConditions = ['fc.is_approved = true', 'fc.deleted_at IS NULL'];
    const queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      whereConditions.push(`ms.code = $${paramCounter}`);
      queryParams.push(status);
      paramCounter++;
    }

    if (search) {
      whereConditions.push(`(
        fc.title_romaji ILIKE $${paramCounter} OR 
        fc.title_english ILIKE $${paramCounter} OR 
        fc.title_spanish ILIKE $${paramCounter} OR
        fc.title_native ILIKE $${paramCounter}
      )`);
      queryParams.push(`%${search}%`);
      paramCounter++;
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Construir ORDER BY clause
    let orderBy = 'ORDER BY fc.ranking ASC NULLS LAST, fc.average_score DESC NULLS LAST';
    
    switch (sort) {
      case 'score':
        orderBy = 'ORDER BY fc.average_score DESC NULLS LAST, fc.ratings_count DESC';
        break;
      case 'popularity':
        orderBy = 'ORDER BY fc.popularity DESC NULLS LAST, fc.favourites DESC';
        break;
      case 'title':
        orderBy = 'ORDER BY fc.title_romaji ASC';
        break;
      case 'newest':
        orderBy = 'ORDER BY fc.created_at DESC';
        break;
      case 'start_date':
        orderBy = 'ORDER BY fc.start_date DESC NULLS LAST';
        break;
      default:
        // ranking es el default
        break;
    }

    // Query principal
    queryParams.push(limit, offset);
    const result = await db.query(
      `SELECT 
        fc.id,
        fc.slug,
        fc.title_romaji as title,
        fc.title_english as "titleEnglish",
        fc.title_spanish as "titleSpanish",
        fc.title_native as "titleNative",
        fc.synopsis,
        fc.cover_image as "coverImage",
        fc.banner_image as "bannerImage",
        fc.average_score as "averageScore",
        fc.popularity,
        fc.favourites,
        fc.ratings_count as "ratingsCount",
        fc.ranking,
        fc.start_date as "startDate",
        fc.end_date as "endDate",
        fc.chapters,
        fc.is_nsfw as "isNsfw",
        ms.name as status,
        ms.code as "statusCode"
      FROM app.fan_comics fc
      LEFT JOIN app.media_statuses ms ON fc.status_id = ms.id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`,
      queryParams
    );

    // Query para contar total
    const countParams = queryParams.slice(0, -2); // Remover limit y offset
    const countResult = await db.query(
      `SELECT COUNT(*) as total
      FROM app.fan_comics fc
      LEFT JOIN app.media_statuses ms ON fc.status_id = ms.id
      ${whereClause}`,
      countParams
    );

    const fanComics = result.rows;
    const total = parseInt(countResult.rows[0]?.total || '0');

    console.log(`✅ GET /api/fan-comics: ${fanComics.length} items (total: ${total})`);

    return NextResponse.json({
      success: true,
      data: fanComics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/fan-comics:', error);
    return NextResponse.json(
      { error: 'Error al obtener fan comics' },
      { status: 500 }
    );
  }
}
