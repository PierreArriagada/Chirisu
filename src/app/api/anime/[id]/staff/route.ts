import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/anime/[id]/staff
 * Obtiene el staff de un anime específico
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

    // Obtener staff con sus roles
    const staffQuery = `
      SELECT 
        s.id,
        s.name,
        s.name_romaji,
        s.name_native,
        s.image_url,
        s.slug,
        s.bio,
        s.primary_occupations,
        s.gender,
        s.date_of_birth,
        s.hometown,
        s.favorites_count,
        ss.role
      FROM app.staffable_staff ss
      JOIN app.staff s ON s.id = ss.staff_id
      WHERE ss.staffable_type = 'anime' 
        AND ss.staffable_id = $1
      ORDER BY ss.role, s.id
    `;

    const result = await pool.query(staffQuery, [animeId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/anime/[id]/staff:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener staff del anime',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
