import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

// ============================================
// ENDPOINT: GET /api/search
// Búsqueda de medios
// Query params: q (query), type (all, anime, manga, novel), limit
// ============================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, anime, manga, novel
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validaciones
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'La búsqueda debe tener al menos 2 caracteres' },
        { status: 400 }
      );
    }

    if (!['all', 'anime', 'manga', 'novel'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de búsqueda inválido. Use: all, anime, manga, novel' },
        { status: 400 }
      );
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;
    const results: any[] = [];

    // Función auxiliar para buscar en una tabla
    const searchInTable = async (tableName: string, mediaType: string) => {
      const searchQuery = `
        SELECT 
          id,
          title_native,
          title_romaji,
          title_english,
          synopsis,
          cover_image_url,
          average_score,
          ratings_count,
          ${mediaType === 'anime' ? 'episode_count, season,' : ''}
          ${mediaType !== 'anime' ? 'volumes, chapters,' : ''}
          status_id,
          created_at
        FROM app.${tableName}
        WHERE 
          ${mediaType === 'anime' ? 'is_published' : 'is_approved'} = TRUE
          AND deleted_at IS NULL
          AND (
            LOWER(title_romaji) LIKE $1 
            OR LOWER(title_english) LIKE $1 
            OR LOWER(title_native) LIKE $1
            OR LOWER(synopsis) LIKE $1
          )
        ORDER BY 
          CASE 
            WHEN LOWER(title_romaji) LIKE $2 THEN 1
            WHEN LOWER(title_english) LIKE $2 THEN 2
            WHEN LOWER(title_native) LIKE $2 THEN 3
            ELSE 4
          END,
          average_score DESC NULLS LAST
        LIMIT $3
      `;

      const result = await db.query(searchQuery, [
        searchTerm, 
        `${query.trim().toLowerCase()}%`, // Para priorizar coincidencias al inicio
        limit
      ]);

      return result.rows.map((row: any) => ({
        id: row.id.toString(),
        title: row.title_romaji || row.title_english || row.title_native,
        titleNative: row.title_native,
        titleRomaji: row.title_romaji,
        titleEnglish: row.title_english,
        synopsis: row.synopsis?.substring(0, 200) + (row.synopsis?.length > 200 ? '...' : ''),
        imageUrl: row.cover_image_url,
        rating: parseFloat(row.average_score) || 0,
        ratingsCount: row.ratings_count || 0,
        type: mediaType,
        ...(mediaType === 'anime' && {
          episodes: row.episode_count,
          season: row.season,
        }),
        ...(mediaType !== 'anime' && {
          volumes: row.volumes,
          chapters: row.chapters,
        }),
        createdAt: row.created_at,
      }));
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

    // Si es búsqueda 'all', ordenar por relevancia y rating
    if (type === 'all') {
      results.sort((a, b) => {
        // Priorizar coincidencias exactas en el título
        const aExactMatch = a.titleRomaji?.toLowerCase() === query.toLowerCase() ||
                           a.titleEnglish?.toLowerCase() === query.toLowerCase();
        const bExactMatch = b.titleRomaji?.toLowerCase() === query.toLowerCase() ||
                           b.titleEnglish?.toLowerCase() === query.toLowerCase();
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // Luego por rating
        return b.rating - a.rating;
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
