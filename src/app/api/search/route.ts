import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

// ============================================
// ENDPOINT: GET /api/search
// Búsqueda avanzada de medios con búsqueda en tiempo real
// Query params: 
//   - q (query): término de búsqueda (mínimo 1 carácter)
//   - type (all, anime, manga, novel, etc.)
//   - limit: número de resultados
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validación mínima: aceptar búsquedas desde 1 carácter
    if (!query || query.trim().length < 1) {
      return NextResponse.json({
        success: true,
        query: '',
        type: type,
        results: [],
        count: 0,
      });
    }

    const VALID_TYPES = ['all', 'anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de búsqueda inválido' },
        { status: 400 }
      );
    }

    // Preparar términos de búsqueda
    const searchTerm = query.trim().toLowerCase();
    const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 0); // Separar por palabras
    const searchPattern = `%${searchTerm}%`;
    const startPattern = `${searchTerm}%`;

    const results: any[] = [];

    // Función auxiliar simplificada para búsqueda avanzada
    const searchInTable = async (tableName: string, mediaType: string) => {
      try {
        // fan_comics tiene estructura diferente
        const isFanComic = tableName === 'fan_comics';
        const titleColumn = isFanComic ? 'title' : 'title_romaji';
        const isAnimeType = mediaType === 'anime' || mediaType === 'donghua';
        
        const searchQuery = `
          SELECT 
            id,
            slug,
            ${isFanComic ? 'NULL as title_native,' : 'title_native,'}
            ${titleColumn} as title_romaji,
            title_english,
            title_spanish,
            synopsis,
            cover_image_url,
            average_score,
            ratings_count,
            ${isAnimeType ? 'episode_count, season,' : ''}
            ${!isAnimeType && !isFanComic ? 'volumes,' : ''}
            ${!isAnimeType ? 'chapters,' : ''}
            status_id,
            created_at,
            -- Calcular relevancia
            CASE 
              -- Coincidencia exacta tiene máxima prioridad
              WHEN LOWER(${titleColumn}) = LOWER($1) THEN 1
              WHEN LOWER(title_english) = LOWER($1) THEN 1
              ${!isFanComic ? 'WHEN LOWER(title_native) = LOWER($1) THEN 1' : ''}
              WHEN LOWER(title_spanish) = LOWER($1) THEN 1
              -- Coincidencia al inicio
              WHEN LOWER(${titleColumn}) LIKE LOWER($1) || '%' THEN 2
              WHEN LOWER(title_english) LIKE LOWER($1) || '%' THEN 2
              ${!isFanComic ? 'WHEN LOWER(title_native) LIKE LOWER($1) || \'%\' THEN 2' : ''}
              WHEN LOWER(title_spanish) LIKE LOWER($1) || '%' THEN 2
              -- Coincidencia en cualquier parte
              ELSE 3
            END as relevance_score
          FROM app.${tableName}
          WHERE 
            ${(mediaType === 'anime' || mediaType === 'donghua') ? 'is_published' : 'is_approved'} = TRUE
            AND deleted_at IS NULL
            AND (
              LOWER(${titleColumn}) LIKE '%' || LOWER($1) || '%'
              OR LOWER(title_english) LIKE '%' || LOWER($1) || '%'
              ${!isFanComic ? 'OR LOWER(title_native) LIKE \'%\' || LOWER($1) || \'%\'' : ''}
              OR LOWER(title_spanish) LIKE '%' || LOWER($1) || '%'
            )
          ORDER BY 
            relevance_score ASC,
            average_score DESC NULLS LAST,
            ratings_count DESC NULLS LAST
          LIMIT $2
        `;

        const result = await db.query(searchQuery, [searchTerm, limit]);

        return result.rows.map((row: any) => ({
          id: row.id.toString(),
          slug: row.slug,
          title: row.title_romaji || row.title_english || row.title_native,
          titleNative: row.title_native,
          titleRomaji: row.title_romaji,
          titleEnglish: row.title_english,
          titleSpanish: row.title_spanish || null,
          synopsis: row.synopsis?.substring(0, 200) + (row.synopsis?.length > 200 ? '...' : ''),
          imageUrl: row.cover_image_url,
          rating: parseFloat(row.average_score) || 0,
          ratingsCount: row.ratings_count || 0,
          type: mediaType,
          relevance: row.relevance_score,
          ...((isAnimeType) && {
            episodes: row.episode_count,
            season: row.season,
          }),
          ...(!isAnimeType && !isFanComic && {
            volumes: row.volumes,
          }),
          ...(!isAnimeType && {
            chapters: row.chapters,
          }),
          createdAt: row.created_at,
        }));
      } catch (error) {
        console.error(`❌ Error buscando en ${tableName}:`, error);
        return [];
      }
    };

    // Buscar según el tipo especificado
    if (type === 'all' || type === 'anime') {
      const animeResults = await searchInTable('anime', 'anime');
      results.push(...animeResults);
    }

    if (type === 'all' || type === 'manga') {
      const mangaResults = await searchInTable('manga', 'manga');
      results.push(...mangaResults);
    }

    if (type === 'all' || type === 'novel') {
      const novelResults = await searchInTable('novels', 'novel');
      results.push(...novelResults);
    }

    if (type === 'all' || type === 'donghua') {
      const donghuaResults = await searchInTable('donghua', 'donghua');
      results.push(...donghuaResults);
    }

    if (type === 'all' || type === 'manhua') {
      const manhuaResults = await searchInTable('manhua', 'manhua');
      results.push(...manhuaResults);
    }

    if (type === 'all' || type === 'manhwa') {
      const manhwaResults = await searchInTable('manhwa', 'manhwa');
      results.push(...manhwaResults);
    }

    if (type === 'all' || type === 'fan_comic') {
      const fanComicResults = await searchInTable('fan_comics', 'fan_comic');
      results.push(...fanComicResults);
    }

    // Si es búsqueda 'all', ordenar por relevancia global
    if (type === 'all') {
      results.sort((a, b) => {
        // Primero por relevancia
        if (a.relevance !== b.relevance) {
          return a.relevance - b.relevance;
        }
        // Luego por rating
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Finalmente por popularidad
        return b.ratingsCount - a.ratingsCount;
      });

      // Limitar resultados totales
      results.splice(limit);
    }

    return NextResponse.json({
      success: true,
      query: query,
      type: type,
      results: results,
      count: results.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/search:', error);
    
    return NextResponse.json(
      { error: 'Error al realizar la búsqueda' },
      { status: 500 }
    );
  }
}