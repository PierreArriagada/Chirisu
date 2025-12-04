import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

type MediaType = 'manga' | 'manhua' | 'manhwa' | 'fan_comics' | 'novels';

/**
 * GET /api/media/[type]/[id]/volumes
 * Obtiene los tomos/volúmenes de un manga, manhua, manhwa, fan_comic o novel con sus capítulos
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

    // Obtener volúmenes con sus capítulos
    const volumesQuery = `
      SELECT 
        v.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'chapter_number', c.chapter_number,
              'title', c.title,
              'title_english', c.title_english,
              'release_date', c.release_date,
              'page_count', c.page_count
            ) ORDER BY c.chapter_number
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as chapters
      FROM app.volumes v
      LEFT JOIN app.chapters c ON c.volume_id = v.id
      WHERE v.volumeable_type = $1 AND v.volumeable_id = $2
      GROUP BY v.id
      ORDER BY v.volume_number ASC
    `;

    const volumesResult = await pool.query(volumesQuery, [type, mediaId]);

    // También obtener capítulos sin volumen asignado
    const unassignedQuery = `
      SELECT 
        id,
        chapter_number,
        title,
        title_english,
        release_date,
        page_count
      FROM app.chapters
      WHERE chapterable_type = $1 AND chapterable_id = $2 AND volume_id IS NULL
      ORDER BY chapter_number ASC
    `;

    const unassignedResult = await pool.query(unassignedQuery, [type, mediaId]);

    return NextResponse.json({
      success: true,
      data: {
        volumes: volumesResult.rows,
        unassignedChapters: unassignedResult.rows
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media/[type]/[id]/volumes:', error);
    return NextResponse.json(
      { error: 'Error al obtener volúmenes', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/[type]/[id]/volumes
 * Crea un nuevo tomo/volumen
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
    const { volume_number, title, title_english, synopsis, release_date, cover_image_url, isbn } = body;

    if (!volume_number || volume_number < 1) {
      return NextResponse.json(
        { error: 'Número de volumen inválido' },
        { status: 400 }
      );
    }

    // Verificar que el volumen no exista
    const existingCheck = await pool.query(
      'SELECT id FROM app.volumes WHERE volumeable_type = $1 AND volumeable_id = $2 AND volume_number = $3',
      [type, mediaId, volume_number]
    );

    if (existingCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `El volumen ${volume_number} ya existe` },
        { status: 409 }
      );
    }

    const insertQuery = `
      INSERT INTO app.volumes (volumeable_type, volumeable_id, volume_number, title, title_english, synopsis, release_date, cover_image_url, isbn)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      type,
      mediaId,
      volume_number,
      title || null,
      title_english || null,
      synopsis || null,
      release_date || null,
      cover_image_url || null,
      isbn || null
    ]);

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Volumen creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error en POST /api/media/[type]/[id]/volumes:', error);
    return NextResponse.json(
      { error: 'Error al crear volumen', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/[type]/[id]/volumes
 * Elimina un volumen (requiere volumeId en query params)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;
    const mediaId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const volumeId = searchParams.get('volumeId');

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

    if (!volumeId) {
      return NextResponse.json(
        { error: 'ID de volumen requerido' },
        { status: 400 }
      );
    }

    // Verificar que el volumen existe y pertenece al media
    const volumeCheck = await pool.query(
      'SELECT id FROM app.volumes WHERE id = $1 AND volumeable_type = $2 AND volumeable_id = $3',
      [volumeId, type, mediaId]
    );

    if (volumeCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Volumen no encontrado' },
        { status: 404 }
      );
    }

    // Desvincular capítulos de este volumen (no los elimina, solo quita la relación)
    await pool.query(
      'UPDATE app.chapters SET volume_id = NULL WHERE volume_id = $1',
      [volumeId]
    );

    // Eliminar el volumen
    await pool.query('DELETE FROM app.volumes WHERE id = $1', [volumeId]);

    return NextResponse.json({
      success: true,
      message: 'Volumen eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/media/[type]/[id]/volumes:', error);
    return NextResponse.json(
      { error: 'Error al eliminar volumen', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}
