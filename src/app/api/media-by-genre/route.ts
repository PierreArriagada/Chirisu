import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// Mapeo de géneros español → inglés (para búsqueda en BD)
const GENRE_MAP_ES_TO_EN: Record<string, string> = {
  'Acción': 'Action',
  'Aventura': 'Adventure',
  'Comedia': 'Comedy',
  'Drama': 'Drama',
  'Fantasía': 'Fantasy',
  'Horror': 'Horror',
  'Misterio': 'Mystery',
  'Romance': 'Romance',
  'Sci-Fi': 'Sci-Fi',
  'Seinen': 'Seinen',
  'Shounen': 'Shounen',
  'Shoujo': 'Shoujo',
  'Josei': 'Josei',
  'Sobrenatural': 'Supernatural',
  'Deportes': 'Sports',
  'Psicológico': 'Psychological',
  'Histórico': 'Historical',
  'Artes Marciales': 'Martial Arts',
  'Isekai': 'Isekai',
  'Superhéroes': 'Super Power',
  'Ecchi': 'Ecchi',
  'Hentai': 'Hentai',
  'Mecha': 'Mecha',
  'Música': 'Music',
  'Slice of Life': 'Slice of Life',
  'Thriller': 'Thriller',
  'Magia': 'Magic',
  'Escolar': 'School',
  'Vampiros': 'Vampire',
  'Militar': 'Military',
  'Parodia': 'Parody',
  'Samurai': 'Samurai',
  'Demonio': 'Demons',
  'Juegos': 'Game',
  'Espacio': 'Space',
  'Policial': 'Police',
  'Mahou Shoujo': 'Mahou Shoujo',
};

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

    const validTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!mediaType || !validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: 'Parámetro "mediaType" requerido: anime, manga, novel, donghua, manhua, manhwa, o fan_comic' },
        { status: 400 }
      );
    }

    // Mapeo de tipos a tablas
    const tableMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan_comics'
    };
    const table = tableMap[mediaType];
    
    // Columna de visibilidad varía según el tipo
    const visibilityColumn = (mediaType === 'anime' || mediaType === 'donghua') ? 'is_published' : 'is_approved';

    // Fan Comics usa 'title' en lugar de 'title_romaji'
    const titleColumn = mediaType === 'fan_comic' ? 'title' : 'title_romaji';

    // Convertir género de español a inglés para búsqueda
    const genreNameEn = GENRE_MAP_ES_TO_EN[genreName] || genreName;
    
    console.log(`🔍 [/api/media-by-genre] Buscando género: "${genreName}" (EN: "${genreNameEn}") en ${mediaType}`);

    // Query para obtener medios por género
    // Filtra por género y ordena por popularidad/score
    const result = await pool.query(`
      SELECT 
        m.id,
        COALESCE(m.title_spanish, m.${titleColumn}, m.title_english) as title,
        m.cover_image_url,
        m.average_score,
        m.popularity,
        m.favourites,
        m.ratings_count,
        m.slug
      FROM app.${table} m
      INNER JOIN app.media_genres mg ON mg.titleable_type = $1 AND mg.titleable_id = m.id
      INNER JOIN app.genres g ON mg.genre_id = g.id
      WHERE (
        g.name_en ILIKE $2 OR
        g.name_es ILIKE $2 OR
        g.code ILIKE $2
      )
        AND m.${visibilityColumn} = true
        AND m.deleted_at IS NULL
      ORDER BY 
        CASE WHEN m.ratings_count > 0 THEN m.average_score ELSE 0 END DESC,
        m.created_at DESC,
        m.popularity DESC
      LIMIT $3
    `, [mediaType, genreNameEn, limit]);

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
