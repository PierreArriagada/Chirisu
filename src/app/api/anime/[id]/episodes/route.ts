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
