import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/characters
 * 
 * Query params:
 * - top: 'true' para obtener top characters (opcional)
 * - limit: número de resultados (default: 10)
 * - mediaType: 'anime' | 'manga' | 'novel' (opcional, filtrar por tipo de media)
 * - mediaId: ID del medio (opcional, obtener personajes de un medio específico)
 * 
 * Ejemplos:
 * - /api/characters?top=true&limit=10
 * - /api/characters?mediaType=anime&mediaId=1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const top = searchParams.get('top') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');

    // Caso 1: Top Characters globales
    if (top) {
      const result = await pool.query(
        'SELECT * FROM app.get_top_characters($1)',
        [limit]
      );

      const characters = result.rows.map(row => ({
        id: row.character_id,
        name: row.character_name,
        image: row.character_image,
        slug: row.character_slug,
        favoritesCount: row.favorites_count,
        appearancesCount: parseInt(row.appearances_count) || 0
      }));

      return NextResponse.json({
        count: characters.length,
        characters
      });
    }

    // Caso 2: Personajes de un medio específico
    if (mediaType && mediaId) {
      const result = await pool.query(`
        SELECT 
          c.id,
          COALESCE(c.name_romaji, c.name, c.name_native) as name,
          c.image_url,
          c.slug,
          c.favorites_count,
          cc.role,
          va.id as voice_actor_id,
          COALESCE(va.name_romaji, va.name_native) as voice_actor_name,
          va.image_url as voice_actor_image,
          va.language as voice_actor_language
        FROM app.characters c
        INNER JOIN app.characterable_characters cc 
          ON c.id = cc.character_id
        LEFT JOIN app.character_voice_actors cva 
          ON c.id = cva.character_id 
          AND cva.media_type = $1 
          AND cva.media_id = $2
        LEFT JOIN app.voice_actors va 
          ON cva.voice_actor_id = va.id
        WHERE cc.characterable_type = $1 
          AND cc.characterable_id = $2
        ORDER BY 
          CASE cc.role 
            WHEN 'main' THEN 1 
            WHEN 'supporting' THEN 2 
            ELSE 3 
          END,
          c.favorites_count DESC
        LIMIT $3
      `, [mediaType, parseInt(mediaId), limit]);

      const characters = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        image: row.image_url,
        slug: row.slug,
        favoritesCount: row.favorites_count,
        role: row.role,
        voiceActor: row.voice_actor_id ? {
          id: row.voice_actor_id,
          name: row.voice_actor_name,
          image: row.voice_actor_image,
          language: row.voice_actor_language
        } : null
      }));

      return NextResponse.json({
        mediaType,
        mediaId: parseInt(mediaId),
        count: characters.length,
        characters
      });
    }

    // Caso 3: Listar todos los personajes (con paginación básica)
    const result = await pool.query(`
      SELECT 
        c.id,
        COALESCE(c.name_romaji, c.name, c.name_native) as name,
        c.image_url,
        c.slug,
        c.favorites_count,
        COUNT(DISTINCT (cc.characterable_type, cc.characterable_id)) as appearances_count
      FROM app.characters c
      LEFT JOIN app.characterable_characters cc ON c.id = cc.character_id
      GROUP BY c.id, c.name_romaji, c.name, c.name_native, c.image_url, c.slug, c.favorites_count
      ORDER BY c.favorites_count DESC
      LIMIT $1
    `, [limit]);

    const characters = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      image: row.image_url,
      slug: row.slug,
      favoritesCount: row.favorites_count,
      appearancesCount: parseInt(row.appearances_count) || 0
    }));

    return NextResponse.json({
      count: characters.length,
      characters
    });

  } catch (error) {
    console.error('Error en /api/characters:', error);
    return NextResponse.json(
      { error: 'Error al obtener personajes' },
      { status: 500 }
    );
  }
}
