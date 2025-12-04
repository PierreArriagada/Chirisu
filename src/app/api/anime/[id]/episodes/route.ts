import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/anime/[id]/episodes
 * Obtiene los episodios de un anime específico
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

    // Obtener episodios ordenados por número
    const episodesQuery = `
      SELECT 
        id,
        anime_id,
        episode_number,
        title,
        title_romaji,
        title_japanese,
        synopsis,
        air_date,
        duration,
        thumbnail_url,
        video_url,
        is_filler,
        is_recap,
        created_at,
        updated_at
      FROM app.episodes
      WHERE anime_id = $1
      ORDER BY episode_number ASC
    `;

    const result = await pool.query(episodesQuery, [animeId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/anime/[id]/episodes:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener episodios del anime',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anime/[id]/episodes
 * Crea un nuevo episodio para un anime
 */
export async function POST(
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

    const body = await request.json();
    const { episode_number, title, thumbnail_url, season_id } = body;

    if (!episode_number || episode_number < 1) {
      return NextResponse.json(
        { error: 'Número de episodio inválido' },
        { status: 400 }
      );
    }

    // Verificar que el número de episodio no exista ya
    const existingEpisode = await pool.query(
      'SELECT id FROM app.episodes WHERE anime_id = $1 AND episode_number = $2',
      [animeId, episode_number]
    );

    if (existingEpisode.rows.length > 0) {
      return NextResponse.json(
        { error: `El episodio ${episode_number} ya existe` },
        { status: 409 }
      );
    }

    // Si se proporciona season_id, verificar que existe
    if (season_id) {
      const seasonCheck = await pool.query(
        'SELECT id FROM app.seasons WHERE id = $1 AND seasonable_type = $2 AND seasonable_id = $3',
        [season_id, 'anime', animeId]
      );

      if (seasonCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Temporada no encontrada para este anime' },
          { status: 404 }
        );
      }
    }

    // Insertar el nuevo episodio
    const insertQuery = `
      INSERT INTO app.episodes (anime_id, episode_number, title, thumbnail_url, season_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      animeId,
      episode_number,
      title || null,
      thumbnail_url || null,
      season_id || null
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Episodio creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/anime/[id]/episodes:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear episodio',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
