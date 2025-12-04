import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/anime/[id]/seasons
 * Obtiene las temporadas de un anime con sus episodios
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

    // Obtener temporadas con conteo de episodios
    const seasonsQuery = `
      SELECT 
        s.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', e.id,
              'episode_number', e.episode_number,
              'title', e.title,
              'title_romaji', e.title_romaji,
              'thumbnail_url', e.thumbnail_url,
              'air_date', e.air_date,
              'duration', e.duration,
              'is_filler', e.is_filler,
              'is_recap', e.is_recap
            ) ORDER BY e.episode_number
          ) FILTER (WHERE e.id IS NOT NULL),
          '[]'
        ) as episodes
      FROM app.seasons s
      LEFT JOIN app.episodes e ON e.season_id = s.id
      WHERE s.seasonable_type = 'anime' AND s.seasonable_id = $1
      GROUP BY s.id
      ORDER BY s.season_number ASC
    `;

    const seasonsResult = await pool.query(seasonsQuery, [animeId]);

    // También obtener episodios sin temporada asignada
    const unassignedQuery = `
      SELECT 
        id,
        episode_number,
        title,
        title_romaji,
        thumbnail_url,
        air_date,
        duration,
        is_filler,
        is_recap
      FROM app.episodes
      WHERE anime_id = $1 AND season_id IS NULL
      ORDER BY episode_number ASC
    `;

    const unassignedResult = await pool.query(unassignedQuery, [animeId]);

    return NextResponse.json({
      success: true,
      data: {
        seasons: seasonsResult.rows,
        unassignedEpisodes: unassignedResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/anime/[id]/seasons:', error);
    return NextResponse.json(
      { error: 'Error al obtener temporadas', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anime/[id]/seasons
 * Crea una nueva temporada para un anime
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
    const { season_number, title, title_english, synopsis, start_date, cover_image_url } = body;

    if (!season_number || season_number < 1) {
      return NextResponse.json(
        { error: 'Número de temporada inválido' },
        { status: 400 }
      );
    }

    // Verificar que la temporada no exista
    const existingCheck = await pool.query(
      'SELECT id FROM app.seasons WHERE seasonable_type = $1 AND seasonable_id = $2 AND season_number = $3',
      ['anime', animeId, season_number]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `La temporada ${season_number} ya existe` },
        { status: 409 }
      );
    }

    const insertQuery = `
      INSERT INTO app.seasons (seasonable_type, seasonable_id, season_number, title, title_english, synopsis, start_date, cover_image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      'anime',
      animeId,
      season_number,
      title || null,
      title_english || null,
      synopsis || null,
      start_date || null,
      cover_image_url || null
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Temporada creada exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/anime/[id]/seasons:', error);
    return NextResponse.json(
      { error: 'Error al crear temporada', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/anime/[id]/seasons
 * Elimina una temporada (requiere season_id en query params)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const animeId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId');

    if (isNaN(animeId)) {
      return NextResponse.json(
        { error: 'ID de anime inválido' },
        { status: 400 }
      );
    }

    if (!seasonId) {
      return NextResponse.json(
        { error: 'ID de temporada requerido' },
        { status: 400 }
      );
    }

    // Verificar que la temporada existe y pertenece al anime
    const seasonCheck = await pool.query(
      'SELECT id FROM app.seasons WHERE id = $1 AND seasonable_type = $2 AND seasonable_id = $3',
      [seasonId, 'anime', animeId]
    );

    if (seasonCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Temporada no encontrada' },
        { status: 404 }
      );
    }

    // Desvincular episodios de esta temporada (no los elimina, solo quita la relación)
    await pool.query(
      'UPDATE app.episodes SET season_id = NULL WHERE season_id = $1',
      [seasonId]
    );

    // Eliminar la temporada
    await pool.query('DELETE FROM app.seasons WHERE id = $1', [seasonId]);

    return NextResponse.json({
      success: true,
      message: 'Temporada eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/anime/[id]/seasons:', error);
    return NextResponse.json(
      { error: 'Error al eliminar temporada', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
