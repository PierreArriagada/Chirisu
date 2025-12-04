import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

type MediaType = 'manga' | 'manhua' | 'manhwa' | 'fan_comics' | 'novels';

/**
 * POST /api/media/[type]/[id]/chapters
 * Crea un nuevo capítulo para un manga, manhua, manhwa, fan_comic o novel
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;
    const mediaId = parseInt(id);

    // Validar tipo
    const validTypes: MediaType[] = ['manga', 'manhua', 'manhwa', 'fan_comics', 'novels'];
    if (!validTypes.includes(type as MediaType)) {
      return NextResponse.json(
        { error: 'Tipo de media inválido' },
        { status: 400 }
      );
    }

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'ID de media inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { volume_id, chapter_number, title, title_english, release_date, page_count } = body;

    if (!chapter_number || chapter_number < 0) {
      return NextResponse.json(
        { error: 'Número de capítulo inválido' },
        { status: 400 }
      );
    }

    // Verificar que el capítulo no exista para este media
    const existingCheck = await pool.query(
      'SELECT id FROM app.chapters WHERE chapterable_type = $1 AND chapterable_id = $2 AND chapter_number = $3',
      [type, mediaId, chapter_number]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `El capítulo ${chapter_number} ya existe` },
        { status: 409 }
      );
    }

    // Si hay volume_id, verificar que existe y pertenece a este media
    if (volume_id) {
      const volumeCheck = await pool.query(
        'SELECT id FROM app.volumes WHERE id = $1 AND volumeable_type = $2 AND volumeable_id = $3',
        [volume_id, type, mediaId]
      );

      if (volumeCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Volumen no encontrado o no pertenece a este media' },
          { status: 404 }
        );
      }
    }

    const insertQuery = `
      INSERT INTO app.chapters (chapterable_type, chapterable_id, volume_id, chapter_number, title, title_english, release_date, page_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      type,
      mediaId,
      volume_id || null,
      chapter_number,
      title || null,
      title_english || null,
      release_date || null,
      page_count || null
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Capítulo creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/media/[type]/[id]/chapters:', error);
    return NextResponse.json(
      { error: 'Error al crear capítulo', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/media/[type]/[id]/chapters
 * Obtiene todos los capítulos de un media (sin agrupar por volumen)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;
    const mediaId = parseInt(id);

    // Validar tipo
    const validTypes: MediaType[] = ['manga', 'manhua', 'manhwa', 'fan_comics', 'novels'];
    if (!validTypes.includes(type as MediaType)) {
      return NextResponse.json(
        { error: 'Tipo de media inválido' },
        { status: 400 }
      );
    }

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'ID de media inválido' },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        c.*,
        v.volume_number,
        v.title as volume_title
      FROM app.chapters c
      LEFT JOIN app.volumes v ON c.volume_id = v.id
      WHERE c.chapterable_type = $1 AND c.chapterable_id = $2
      ORDER BY c.chapter_number ASC
    `;

    const result = await pool.query(query, [type, mediaId]);

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media/[type]/[id]/chapters:', error);
    return NextResponse.json(
      { error: 'Error al obtener capítulos', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
