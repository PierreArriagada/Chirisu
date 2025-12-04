/**
 * API: Proyecto específico de Scanlation
 * GET /api/scan/projects/[id] - Obtener proyecto
 * PUT /api/scan/projects/[id] - Actualizar proyecto
 * DELETE /api/scan/projects/[id] - Eliminar proyecto
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener proyecto específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { success: false, error: 'ID de proyecto inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        sp.*,
        u.username as scan_username,
        u.avatar_url as scan_avatar,
        CASE sp.media_type
          WHEN 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = sp.media_id)
          WHEN 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = sp.media_id)
          WHEN 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = sp.media_id)
          WHEN 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = sp.media_id)
          WHEN 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = sp.media_id)
          WHEN 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = sp.media_id)
          WHEN 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = sp.media_id)
        END as media_title,
        CASE sp.media_type
          WHEN 'anime' THEN (SELECT cover_image_url FROM app.anime WHERE id = sp.media_id)
          WHEN 'manga' THEN (SELECT cover_image_url FROM app.manga WHERE id = sp.media_id)
          WHEN 'manhwa' THEN (SELECT cover_image_url FROM app.manhwa WHERE id = sp.media_id)
          WHEN 'manhua' THEN (SELECT cover_image_url FROM app.manhua WHERE id = sp.media_id)
          WHEN 'donghua' THEN (SELECT cover_image_url FROM app.donghua WHERE id = sp.media_id)
          WHEN 'novel' THEN (SELECT cover_image_url FROM app.novels WHERE id = sp.media_id)
          WHEN 'fan_comic' THEN (SELECT cover_image_url FROM app.fan_comics WHERE id = sp.media_id)
        END as media_cover
      FROM app.scan_projects sp
      JOIN app.users u ON sp.user_id = u.id
      WHERE sp.id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    // Obtener capítulos
    const chaptersResult = await pool.query(
      `SELECT * FROM app.scan_chapters 
       WHERE project_id = $1 
       ORDER BY chapter_number DESC`,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      project: {
        id: row.id,
        userId: row.user_id,
        mediaType: row.media_type,
        mediaId: row.media_id,
        groupName: row.group_name,
        websiteUrl: row.website_url,
        projectUrl: row.project_url,
        status: row.status,
        language: row.language,
        lastChapterAt: row.last_chapter_at,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        scanUsername: row.scan_username,
        scanAvatar: row.scan_avatar,
        mediaTitle: row.media_title,
        mediaCover: row.media_cover,
        chapters: chaptersResult.rows.map(ch => ({
          id: ch.id,
          chapterNumber: parseFloat(ch.chapter_number),
          volumeNumber: ch.volume_number,
          title: ch.title,
          chapterUrl: ch.chapter_url,
          releaseDate: ch.release_date,
        })),
      }
    });

  } catch (error) {
    console.error('Error en GET /api/scan/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener proyecto' },
      { status: 500 }
    );
  }
}

// PUT: Actualizar proyecto
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id);

    // Verificar que el proyecto existe y pertenece al usuario
    const projectCheck = await pool.query(
      'SELECT user_id FROM app.scan_projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const isOwner = projectCheck.rows[0].user_id === session.userId;
    const isAdmin = session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este proyecto' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { groupName, websiteUrl, projectUrl, status, notes } = body;

    // Validar status si se proporciona
    const validStatuses = ['active', 'hiatus', 'completed', 'dropped', 'licensed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Estado inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE app.scan_projects SET
        group_name = COALESCE($1, group_name),
        website_url = COALESCE($2, website_url),
        project_url = COALESCE($3, project_url),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes),
        updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [groupName, websiteUrl, projectUrl, status, notes, projectId]
    );

    return NextResponse.json({
      success: true,
      message: 'Proyecto actualizado',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Error en PUT /api/scan/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar proyecto' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar proyecto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id);

    // Verificar permisos
    const projectCheck = await pool.query(
      'SELECT user_id FROM app.scan_projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const isOwner = projectCheck.rows[0].user_id === session.userId;
    const isAdmin = session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para eliminar este proyecto' },
        { status: 403 }
      );
    }

    await pool.query('DELETE FROM app.scan_projects WHERE id = $1', [projectId]);

    return NextResponse.json({
      success: true,
      message: 'Proyecto eliminado'
    });

  } catch (error) {
    console.error('Error en DELETE /api/scan/projects/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar proyecto' },
      { status: 500 }
    );
  }
}
