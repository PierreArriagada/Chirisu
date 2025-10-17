import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/manga/[id]/staff
 * Obtiene el staff de un manga específico
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const mangaId = parseInt(id);

    if (isNaN(mangaId)) {
      return NextResponse.json(
        { error: 'ID de manga inválido' },
        { status: 400 }
      );
    }

    // Verificar que el manga existe
    const mangaCheck = await pool.query(
      'SELECT id FROM app.manga WHERE id = $1',
      [mangaId]
    );

    if (mangaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Manga no encontrado' },
        { status: 404 }
      );
    }

    // Obtener staff con sus roles
    const staffQuery = `
      SELECT 
        s.id,
        s.name_romaji,
        s.name_native,
        s.image_url,
        ss.role
      FROM app.staffable_staff ss
      JOIN app.staff s ON s.id = ss.staff_id
      WHERE ss.staffable_type = 'manga' 
        AND ss.staffable_id = $1
      ORDER BY ss.role, s.id
    `;

    const result = await pool.query(staffQuery, [mangaId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/manga/[id]/staff:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener staff del manga',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
