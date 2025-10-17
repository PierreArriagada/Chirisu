import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/manga/[id]/characters
 * Obtiene los personajes de un manga específico
 * Incluye tanto personajes principales como secundarios
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

    // Obtener personajes con su rol (main o supporting)
    const charactersQuery = `
      SELECT 
        c.id,
        c.name,
        c.name_romaji,
        c.name_native,
        c.description,
        c.image_url,
        c.slug,
        c.favorites_count,
        cc.role
      FROM app.characterable_characters cc
      JOIN app.characters c ON c.id = cc.character_id
      WHERE cc.characterable_type = 'manga' 
        AND cc.characterable_id = $1
      ORDER BY 
        CASE cc.role 
          WHEN 'main' THEN 1 
          WHEN 'supporting' THEN 2 
          ELSE 3 
        END,
        c.id
    `;

    const result = await pool.query(charactersQuery, [mangaId]);

    // Separar personajes por rol
    const mainCharacters = result.rows.filter((c: any) => c.role === 'main');
    const supportingCharacters = result.rows.filter((c: any) => c.role === 'supporting');

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
    console.error('❌ Error en GET /api/manga/[id]/characters:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener personajes del manga',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
