import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/anime/[id]/studios
 * Obtiene los estudios de animación de un anime específico
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

    // Obtener estudios
    const studiosQuery = `
      SELECT 
        st.id,
        st.name,
        ss.is_main_studio
      FROM app.studiable_studios ss
      JOIN app.studios st ON st.id = ss.studio_id
      WHERE ss.studiable_type = 'anime' 
        AND ss.studiable_id = $1
      ORDER BY ss.is_main_studio DESC, st.name
    `;

    const result = await pool.query(studiosQuery, [animeId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/anime/[id]/studios:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener estudios del anime',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
