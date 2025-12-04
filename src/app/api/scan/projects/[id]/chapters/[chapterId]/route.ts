/**
 * API: Capítulo específico de Scanlation
 * GET /api/scan/projects/[id]/chapters/[chapterId] - Obtener capítulo
 * PUT /api/scan/projects/[id]/chapters/[chapterId] - Actualizar capítulo
 * DELETE /api/scan/projects/[id]/chapters/[chapterId] - Eliminar capítulo
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string; chapterId: string }>;
}

// GET: Obtener detalle de un capítulo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, chapterId } = await params;
    const projectId = parseInt(id);
    const chId = parseInt(chapterId);

    if (isNaN(projectId) || isNaN(chId)) {
      return NextResponse.json(
        { success: false, error: 'IDs inválidos' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT c.*, p.media_type, p.media_id, p.group_name
       FROM app.scan_chapters c
       JOIN app.scan_projects p ON p.id = c.project_id
       WHERE c.id = $1 AND c.project_id = $2`,
      [chId, projectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    const ch = result.rows[0];

    return NextResponse.json({
      success: true,
      chapter: {
        id: ch.id,
        projectId: ch.project_id,
        chapterNumber: parseFloat(ch.chapter_number),
        volumeNumber: ch.volume_number,
        title: ch.title,
        chapterUrl: ch.chapter_url,
        releaseDate: ch.release_date,
        createdAt: ch.created_at,
        updatedAt: ch.updated_at,
        project: {
          mediaType: ch.media_type,
          mediaId: ch.media_id,
          groupName: ch.group_name,
        }
      }
    });

  } catch (error) {
    console.error('Error en GET /api/scan/chapters/[chapterId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener capítulo' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar capítulo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id, chapterId } = await params;
    const projectId = parseInt(id);
    const chId = parseInt(chapterId);

    // Verificar que el capítulo existe y el usuario tiene permisos
    const chapterCheck = await pool.query(
      `SELECT c.*, p.user_id, p.status as project_status
       FROM app.scan_chapters c
       JOIN app.scan_projects p ON p.id = c.project_id
       WHERE c.id = $1 AND c.project_id = $2`,
      [chId, projectId]
    );

    if (chapterCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    const chapter = chapterCheck.rows[0];
    const isOwner = chapter.user_id === session.userId;
    const isAdmin = session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este capítulo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { chapterNumber, volumeNumber, title, chapterUrl, releaseDate } = body;

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (chapterNumber !== undefined) {
      updates.push(`chapter_number = $${paramIndex++}`);
      values.push(chapterNumber);
    }
    if (volumeNumber !== undefined) {
      updates.push(`volume_number = $${paramIndex++}`);
      values.push(volumeNumber);
    }
    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (chapterUrl !== undefined) {
      updates.push(`chapter_url = $${paramIndex++}`);
      values.push(chapterUrl);
    }
    if (releaseDate !== undefined) {
      updates.push(`release_date = $${paramIndex++}`);
      values.push(releaseDate);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(chId);

    const result = await pool.query(
      `UPDATE app.scan_chapters 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    const updated = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Capítulo actualizado exitosamente',
      chapter: {
        id: updated.id,
        chapterNumber: parseFloat(updated.chapter_number),
        volumeNumber: updated.volume_number,
        title: updated.title,
        chapterUrl: updated.chapter_url,
        releaseDate: updated.release_date,
        updatedAt: updated.updated_at,
      }
    });

  } catch (error: any) {
    console.error('Error en PUT /api/scan/chapters/[chapterId]:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Este número de capítulo ya existe en el proyecto' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar capítulo' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar capítulo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id, chapterId } = await params;
    const projectId = parseInt(id);
    const chId = parseInt(chapterId);

    // Verificar permisos
    const chapterCheck = await pool.query(
      `SELECT c.*, p.user_id
       FROM app.scan_chapters c
       JOIN app.scan_projects p ON p.id = c.project_id
       WHERE c.id = $1 AND c.project_id = $2`,
      [chId, projectId]
    );

    if (chapterCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Capítulo no encontrado' },
        { status: 404 }
      );
    }

    const chapter = chapterCheck.rows[0];
    const isOwner = chapter.user_id === session.userId;
    const isAdmin = session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para eliminar este capítulo' },
        { status: 403 }
      );
    }

    await pool.query(
      'DELETE FROM app.scan_chapters WHERE id = $1',
      [chId]
    );

    return NextResponse.json({
      success: true,
      message: 'Capítulo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/scan/chapters/[chapterId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar capítulo' },
      { status: 500 }
    );
  }
}
