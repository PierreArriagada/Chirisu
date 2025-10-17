import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/anime/[id]/characters
 * Obtiene los personajes de un anime específico
 * Incluye tanto personajes principales como secundarios
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json(
        { error: 'ID de anime inválido' },
        { status: 400 }
      );
    }

    // Verificar que el anime existe
    const animeCheck = await pool.query(
      'SELECT id FROM app.anime WHERE id = $1',
      [animeId]
    );

    if (animeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Anime no encontrado' },
        { status: 404 }
      );
    }

    // Obtener personajes con su rol (main o supporting)
    // Usando agregación JSON para obtener todos los actores de voz por personaje
    const charactersQuery = `
      SELECT 
        c.id,
        c.name,
        c.name_romaji,
        c.name_native,
        c.image_url,
        c.description,
        c.slug,
        c.favorites_count,
        c.gender,
        c.age,
        c.blood_type,
        c.date_of_birth,
        cc.role,
        -- Actores de voz japoneses
        MAX(CASE WHEN va.language = 'ja' THEN va.id END) as va_jp_id,
        MAX(CASE WHEN va.language = 'ja' THEN va.name_romaji END) as va_jp_name_romaji,
        MAX(CASE WHEN va.language = 'ja' THEN va.name_native END) as va_jp_name_native,
        MAX(CASE WHEN va.language = 'ja' THEN va.slug END) as va_jp_slug,
        MAX(CASE WHEN va.language = 'ja' THEN va.image_url END) as va_jp_image,
        MAX(CASE WHEN va.language = 'ja' THEN va.bio END) as va_jp_bio,
        MAX(CASE WHEN va.language = 'ja' THEN va.gender END) as va_jp_gender,
        MAX(CASE WHEN va.language = 'ja' THEN va.hometown END) as va_jp_hometown,
        -- Actores de voz españoles
        MAX(CASE WHEN va.language = 'es' THEN va.id END) as va_es_id,
        MAX(CASE WHEN va.language = 'es' THEN va.name_romaji END) as va_es_name_romaji,
        MAX(CASE WHEN va.language = 'es' THEN va.name_native END) as va_es_name_native,
        MAX(CASE WHEN va.language = 'es' THEN va.slug END) as va_es_slug,
        MAX(CASE WHEN va.language = 'es' THEN va.image_url END) as va_es_image,
        MAX(CASE WHEN va.language = 'es' THEN va.bio END) as va_es_bio,
        MAX(CASE WHEN va.language = 'es' THEN va.gender END) as va_es_gender,
        MAX(CASE WHEN va.language = 'es' THEN va.hometown END) as va_es_hometown
      FROM app.characterable_characters cc
      JOIN app.characters c ON c.id = cc.character_id
      LEFT JOIN app.character_voice_actors cva ON cva.character_id = c.id 
        AND cva.media_type = 'anime' 
        AND cva.media_id = $1
      LEFT JOIN app.voice_actors va ON va.id = cva.voice_actor_id
      WHERE cc.characterable_type = 'anime' 
        AND cc.characterable_id = $1
      GROUP BY c.id, c.name, c.name_romaji, c.name_native, c.image_url, 
               c.description, c.slug, c.favorites_count, c.gender, c.age, 
               c.blood_type, c.date_of_birth, cc.role
      ORDER BY 
        CASE cc.role 
          WHEN 'main' THEN 1 
          WHEN 'supporting' THEN 2 
          ELSE 3 
        END,
        c.id
    `;

    const result = await pool.query(charactersQuery, [animeId]);

    // Separar personajes por rol
    const mainCharacters = result.rows.filter(c => c.role === 'main');
    const supportingCharacters = result.rows.filter(c => c.role === 'supporting');

    return NextResponse.json({
      success: true,
      data: {
        main: mainCharacters,
        supporting: supportingCharacters,
        total: result.rows.length,
        mainCount: mainCharacters.length,
        supportingCount: supportingCharacters.length
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/anime/[id]/characters:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener personajes del anime',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
