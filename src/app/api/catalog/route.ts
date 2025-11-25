import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * ============================================
 * API ENDPOINT: GET /api/catalog
 * ============================================
 * 
 * Descripción:
 * Obtiene el catálogo completo de un tipo de media con filtros avanzados
 * y paginación. Usado para la sección "Todos los [Tipo]".
 * 
 * Query Params:
 * - type: 'anime' | 'manga' | 'manhwa' | 'manhua' | 'novel' | 'donghua' | 'fan_comic' (required)
 * - year: número (filtro por año de inicio)
 * - season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' (solo para anime/donghua)
 * - format: string (TV, Movie, OVA, etc.)
 * - genre: string (nombre del género)
 * - page: número (default: 1)
 * - limit: número (default: 24, max: 100)
 * - sort: 'alpha' | 'recent' | 'popular' (default: 'alpha')
 * 
 * Ejemplos:
 * - GET /api/catalog?type=anime&year=2023&season=WINTER&page=1&limit=24
 * - GET /api/catalog?type=manga&genre=Action&sort=popular&page=1
 * - GET /api/catalog?type=anime&format=Movie&year=2022
 * ============================================
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const format = searchParams.get('format');
    const genre = searchParams.get('genre');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 100);
    const sort = searchParams.get('sort') || 'alpha';

    // Validación de parámetros
    const VALID_TYPES = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Parámetro "type" requerido: anime, manga, novel, donghua, manhua, manhwa, o fan_comic' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Mapeo de tipo a tabla
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
    const titleColumn = type === 'fan_comic' ? 'title' : 'title_romaji';

    // Construir condiciones WHERE dinámicamente
    const conditions: string[] = [
      `${visibilityColumn} = TRUE`,
      `deleted_at IS NULL`
    ];
    const params: any[] = [];
    let paramIndex = 1;

    // Filtro por año
    if (year) {
      conditions.push(`EXTRACT(YEAR FROM start_date) = $${paramIndex}`);
      params.push(parseInt(year));
      paramIndex++;
    }

    // Filtro por temporada (solo anime/donghua)
    if (season && (type === 'anime' || type === 'donghua')) {
      conditions.push(`season = $${paramIndex}`);
      params.push(season.toUpperCase());
      paramIndex++;
    }

    // Filtro por formato/tipo
    if (format) {
      conditions.push(`type = $${paramIndex}`);
      params.push(format);
      paramIndex++;
    }

    // Filtro por género
    if (genre) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM app.media_genres mg
          INNER JOIN app.genres g ON g.id = mg.genre_id
          WHERE mg.titleable_type = $${paramIndex}
            AND mg.titleable_id = m.id
            AND (g.name_en ILIKE $${paramIndex + 1} OR g.name_es ILIKE $${paramIndex + 1} OR g.code ILIKE $${paramIndex + 1})
        )
      `);
      params.push(type, `%${genre}%`);
      paramIndex += 2;
    }

    // Determinar orden
    let orderBy = '';
    switch (sort) {
      case 'recent':
        orderBy = 'start_date DESC NULLS LAST, created_at DESC';
        break;
      case 'popular':
        orderBy = 'popularity DESC NULLS LAST, favourites DESC NULLS LAST';
        break;
      case 'alpha':
      default:
        orderBy = `${titleColumn} ASC`;
        break;
    }

    // Query principal
    const query = `
      SELECT 
        m.id,
        m.slug,
        m.${titleColumn} as title,
        m.cover_image_url,
        m.type,
        m.start_date,
        m.average_score,
        m.ratings_count,
        m.popularity,
        m.favourites,
        ${type === 'anime' || type === 'donghua' ? 'm.season, m.season_year,' : ''}
        m.created_at
      FROM ${table} m
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${table} m
      WHERE ${conditions.join(' AND ')}
    `;

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)) // Sin LIMIT/OFFSET
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

    const items = itemsResult.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      coverImage: row.cover_image_url,
      type: row.type,
      startDate: row.start_date,
      averageScore: parseFloat(row.average_score) || 0,
      ratingsCount: row.ratings_count || 0,
      popularity: row.popularity || 0,
      favourites: row.favourites || 0,
      season: row.season || null,
      seasonYear: row.season_year || null,
      createdAt: row.created_at
    }));

    return NextResponse.json({
      type,
      page,
      limit,
      total,
      totalPages,
      items,
      filters: {
        year,
        season,
        format,
        genre,
        sort
      }
    });

  } catch (error) {
    console.error('Error en /api/catalog:', error);
    return NextResponse.json(
      { error: 'Error al obtener catálogo' },
      { status: 500 }
    );
  }
}
