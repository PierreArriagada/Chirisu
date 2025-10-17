import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/media-by-genre
 * 
 * Query params:
 * - genreName: Nombre del género en español (requerido)
 * - mediaType: 'anime' | 'manga' | 'novel' (requerido)
 * - limit: número de resultados (default: 20, max: 50)
 * 
 * Retorna los medios más populares del género especificado
 * 
 * Ejemplos:
 * - /api/media-by-genre?genreName=Acción&mediaType=anime&limit=12
 * - /api/media-by-genre?genreName=Fantasía&mediaType=manga
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const genreName = searchParams.get('genreName');
    const mediaType = searchParams.get('mediaType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // Validación
    if (!genreName) {
      return NextResponse.json(
        { error: 'Parámetro "genreName" requerido' },
        { status: 400 }
      );
    }

    if (!mediaType || !['anime', 'manga', 'novel'].includes(mediaType)) {
      return NextResponse.json(
        { error: 'Parámetro "mediaType" requerido: anime, manga, o novel' },
        { status: 400 }
      );
    }

    const table = mediaType === 'novel' ? 'novels' : mediaType;

    // Query para obtener medios por género
    // Filtra por género y ordena por popularidad/score
    const result = await pool.query(`
      SELECT 
        m.id,
        COALESCE(m.title_spanish, m.title_romaji, m.title_english) as title,
        m.cover_image_url,
        m.average_score,
        m.popularity,
        m.favourites,
        m.ratings_count,
        m.slug
      FROM app.${table} m
      INNER JOIN app.media_genres mg ON mg.titleable_type = $1 AND mg.titleable_id = m.id
      INNER JOIN app.genres g ON mg.genre_id = g.id
      WHERE g.name_es = $2
        AND m.is_approved = true
        AND m.is_published = true
        AND m.deleted_at IS NULL
      ORDER BY 
        m.popularity DESC,
        m.average_score DESC NULLS LAST,
        m.favourites DESC
      LIMIT $3
    `, [mediaType, genreName, limit]);

    const media = result.rows.map(row => ({
      id: row.id.toString(),
      title: row.title,
      coverImage: row.cover_image_url || 'https://placehold.co/400x600?text=No+Image',
      averageScore: parseFloat(row.average_score) || 0,
      popularity: row.popularity || 0,
      favourites: row.favourites || 0,
      ratingsCount: row.ratings_count || 0,
      slug: row.slug || row.id.toString(),
      type: mediaType.charAt(0).toUpperCase() + mediaType.slice(1)
    }));

    console.log(`✅ [/api/media-by-genre] Género: ${genreName}, Tipo: ${mediaType}, Resultados: ${media.length}`);

    return NextResponse.json({
      success: true,
      genre: genreName,
      mediaType,
      count: media.length,
      data: media
    });

  } catch (error: any) {
    console.error('❌ [/api/media-by-genre] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener medios por género',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
