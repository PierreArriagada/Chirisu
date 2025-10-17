import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parámetros de filtrado
    const search = searchParams.get('search') || '';
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
        LOWER(name) LIKE LOWER($${paramIndex}) OR 
        LOWER(name_romaji) LIKE LOWER($${paramIndex}) OR 
        LOWER(name_native) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
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
        orderByClause = `COALESCE(name_romaji, name) ${order}`;
        break;
      case 'created':
        orderByClause = `created_at ${order}`;
        break;
      default:
        orderByClause = `favorites_count DESC`;
    }

    const whereClause = whereConditions.join(' AND ');

    // Query principal
    const query = `
      SELECT 
        id,
        name,
        name_romaji,
        name_native,
        image_url,
        slug,
        favorites_count,
        gender,
        age,
        description
      FROM app.characters
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    // Query de conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app.characters
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
    console.error('❌ Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    );
  }
}
