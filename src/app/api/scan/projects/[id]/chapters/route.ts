/**
 * API: Capítulos de un proyecto de Scanlation
 * GET /api/scan/projects/[id]/chapters - Listar capítulos
 * POST /api/scan/projects/[id]/chapters - Agregar capítulo
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Listar capítulos de un proyecto
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

    // Verificar que el proyecto existe
    const projectCheck = await pool.query(
      'SELECT id, media_type, media_id FROM app.scan_projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `SELECT * FROM app.scan_chapters 
       WHERE project_id = $1 
       ORDER BY chapter_number DESC`,
      [projectId]
    );

    return NextResponse.json({
      success: true,
      projectId,
      chapters: result.rows.map(ch => ({
        id: ch.id,
        chapterNumber: parseFloat(ch.chapter_number),
        volumeNumber: ch.volume_number,
        title: ch.title,
        chapterUrl: ch.chapter_url,
        releaseDate: ch.release_date,
        createdAt: ch.created_at,
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/scan/projects/[id]/chapters:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener capítulos' },
      { status: 500 }
    );
  }
}

// POST: Agregar capítulo
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      'SELECT user_id, status FROM app.scan_projects WHERE id = $1',
      [projectId]
    );

    if (projectCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    const project = projectCheck.rows[0];
    const isOwner = project.user_id === session.userId;
    const isAdmin = session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para agregar capítulos a este proyecto' },
        { status: 403 }
      );
    }

    // No permitir agregar capítulos a proyectos abandonados o licenciados
    if (['dropped', 'licensed'].includes(project.status)) {
      return NextResponse.json(
        { success: false, error: 'No se pueden agregar capítulos a proyectos abandonados o licenciados' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { chapterNumber, volumeNumber, title, chapterUrl, releaseDate } = body;

    // Validaciones
    if (!chapterNumber || !chapterUrl) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: chapterNumber, chapterUrl' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO app.scan_chapters 
        (project_id, chapter_number, volume_number, title, chapter_url, release_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
       RETURNING *`,
      [projectId, chapterNumber, volumeNumber, title, chapterUrl, releaseDate]
    );

    const chapter = result.rows[0];

    // El trigger ya actualiza last_chapter_at en scan_projects

    return NextResponse.json({
      success: true,
      message: 'Capítulo agregado exitosamente',
      chapter: {
        id: chapter.id,
        chapterNumber: parseFloat(chapter.chapter_number),
        volumeNumber: chapter.volume_number,
        title: chapter.title,
        chapterUrl: chapter.chapter_url,
        releaseDate: chapter.release_date,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/scan/projects/[id]/chapters:', error);

    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Este número de capítulo ya existe en el proyecto' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al agregar capítulo' },
      { status: 500 }
    );
  }
}
