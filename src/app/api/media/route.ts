import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

// ============================================
// ENDPOINT: GET /api/media
// Obtener listado de medios (anime, manga, novels)
// Query params: type, page, limit, sort
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const type = searchParams.get('type') || 'anime'; // anime, manga, novel
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'created_at'; // created_at, average_score, title_romaji
    const order = searchParams.get('order') || 'DESC'; // ASC, DESC

    // Validaciones
    if (!['anime', 'manga', 'novel'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de medio inválido. Use: anime, manga, novel' },
        { status: 400 }
      );
    }

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Parámetros de paginación inválidos' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Determinar tabla según tipo
    const tableName = type === 'novel' ? 'novels' : type;

    // Determinar columna de visibilidad según tipo
    // anime usa is_published, manga/novels usan is_approved
    const visibilityColumn = type === 'anime' ? 'is_published' : 'is_approved';

    console.log(`📡 API /media - Type: ${type}, Table: ${tableName}, Visibility: ${visibilityColumn}`);
    console.log(`📡 API /media - Sort: ${sort} ${order}, Limit: ${limit}, Offset: ${offset}`);

    // Query para obtener medios
    const mediaQuery = `
      SELECT 
        id,
        slug,
        title_native,
        title_romaji,
        title_english,
        synopsis,
        cover_image_url,
        banner_image_url,
        average_score,
        ratings_count,
        ${type === 'anime' ? 'episode_count, season, source,' : ''}
        ${type !== 'anime' ? 'volumes, chapters,' : ''}
        status_id,
        created_at,
        updated_at
      FROM app.${tableName}
      WHERE ${visibilityColumn} = TRUE AND deleted_at IS NULL
      ORDER BY ${sort} ${order}
      LIMIT $1 OFFSET $2
    `;

    console.log(`🔍 Query SQL:`, mediaQuery);
    console.log(`🔍 Params:`, [limit, offset]);

    const mediaResult = await db.query(mediaQuery, [limit, offset]);
    
    console.log(`✅ Resultados encontrados: ${mediaResult.rows.length}`);

    // Query para obtener total de registros
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM app.${tableName}
      WHERE ${visibilityColumn} = TRUE AND deleted_at IS NULL
    `;

    const countResult = await db.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    // Obtener estados de medios para mapear status_id
    const statusesQuery = `SELECT id, code, label_es FROM app.media_statuses`;
    const statusesResult = await db.query(statusesQuery);
    const statusesMap = new Map(
      statusesResult.rows.map((s: any) => [s.id, { code: s.code, label: s.label_es }])
    );

    // Para cada medio, obtener géneros
    const mediaWithGenres = await Promise.all(
      mediaResult.rows.map(async (media: any) => {
        const genresQuery = `
          SELECT g.code, g.name_es, g.name_en
          FROM app.media_genres mg
          JOIN app.genres g ON mg.genre_id = g.id
          WHERE mg.titleable_type = $1 AND mg.titleable_id = $2
        `;
        const genresResult = await db.query(genresQuery, [type, media.id]);

        const status = statusesMap.get(media.status_id);

        return {
          id: media.id.toString(),
          slug: media.slug, // Ahora usa el slug real de la BD
          title: media.title_romaji || media.title_english || media.title_native,
          titleNative: media.title_native,
          titleRomaji: media.title_romaji,
          titleEnglish: media.title_english,
          synopsis: media.synopsis,
          imageUrl: media.cover_image_url,
          bannerUrl: media.banner_image_url,
          rating: parseFloat(media.average_score) || 0,
          ratingsCount: parseInt(media.ratings_count) || 0,
          type: type,
          status: status?.label || 'Desconocido',
          statusCode: status?.code || 'unknown',
          ...(type === 'anime' && {
            episodes: media.episode_count,
            season: media.season,
            source: media.source,
          }),
          ...(type !== 'anime' && {
            volumes: media.volumes,
            chapters: media.chapters,
          }),
          genres: genresResult.rows.map((g: any) => ({
            code: g.code,
            nameEs: g.name_es,
            nameEn: g.name_en,
          })),
          createdAt: media.created_at,
          updatedAt: media.updated_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: mediaWithGenres,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener listado de medios' },
      { status: 500 }
    );
  }
}
