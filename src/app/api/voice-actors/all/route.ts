import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parámetros de filtrado
    const search = searchParams.get('search') || '';
    const language = searchParams.get('language') || ''; // 'ja', 'es'
    const gender = searchParams.get('gender') || '';
    const sortBy = searchParams.get('sortBy') || 'favorites'; // 'favorites', 'name', 'created'
    const order = searchParams.get('order') || 'DESC';
    
    // Paginación
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const offset = (page - 1) * limit;

    // Construir query base
    let whereConditions = ['1=1'];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Filtro por búsqueda (nombre)
    if (search) {
      whereConditions.push(`(
        LOWER(name_romaji) LIKE LOWER($${paramIndex}) OR 
        LOWER(name_native) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filtro por idioma
    if (language) {
      whereConditions.push(`language = $${paramIndex}`);
      queryParams.push(language);
      paramIndex++;
    }

    // Filtro por género
    if (gender) {
      whereConditions.push(`LOWER(gender) = LOWER($${paramIndex})`);
      queryParams.push(gender);
      paramIndex++;
    }

    // Ordenamiento
    let orderByClause = '';
    switch (sortBy) {
      case 'favorites':
        orderByClause = `favorites_count ${order}, name_romaji ASC`;
        break;
      case 'name':
        orderByClause = `name_romaji ${order}`;
        break;
      case 'created':
        orderByClause = `created_at ${order}`;
        break;
      default:
        orderByClause = `favorites_count DESC`;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal con conteo de roles
    const query = `
      SELECT 
        va.id,
        va.name_romaji,
        va.name_native,
        va.image_url,
        va.slug,
        va.language,
        va.favorites_count,
        va.gender,
        va.hometown,
        COUNT(DISTINCT cva.character_id) as roles_count
      FROM app.voice_actors va
      LEFT JOIN app.character_voice_actors cva ON cva.voice_actor_id = va.id
      WHERE ${whereClause}
      GROUP BY va.id
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Query de conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app.voice_actors
      WHERE ${whereClause}
    `;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Sin limit/offset
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error fetching voice actors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice actors' },
      { status: 500 }
    );
  }
}
