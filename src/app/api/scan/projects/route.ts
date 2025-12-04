/**
 * API: Proyectos de Scanlation
 * GET /api/scan/projects - Listar proyectos (del usuario o de un media)
 * POST /api/scan/projects - Crear nuevo proyecto
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// GET: Listar proyectos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    const status = searchParams.get('status');
    const language = searchParams.get('language') || 'es';

    let query = `
      SELECT 
        sp.*,
        u.username as scan_username,
        u.avatar_url as scan_avatar,
        (SELECT COUNT(*) FROM app.scan_chapters sc WHERE sc.project_id = sp.id) as chapter_count,
        (SELECT MAX(chapter_number) FROM app.scan_chapters sc WHERE sc.project_id = sp.id) as latest_chapter,
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
        END as media_cover,
        CASE sp.media_type
          WHEN 'anime' THEN (SELECT slug FROM app.anime WHERE id = sp.media_id)
          WHEN 'manga' THEN (SELECT slug FROM app.manga WHERE id = sp.media_id)
          WHEN 'manhwa' THEN (SELECT slug FROM app.manhwa WHERE id = sp.media_id)
          WHEN 'manhua' THEN (SELECT slug FROM app.manhua WHERE id = sp.media_id)
          WHEN 'donghua' THEN (SELECT slug FROM app.donghua WHERE id = sp.media_id)
          WHEN 'novel' THEN (SELECT slug FROM app.novels WHERE id = sp.media_id)
          WHEN 'fan_comic' THEN (SELECT slug FROM app.fan_comics WHERE id = sp.media_id)
        END as media_slug
      FROM app.scan_projects sp
      JOIN app.users u ON sp.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filtrar por usuario
    if (userId) {
      query += ` AND sp.user_id = $${paramCount}`;
      params.push(parseInt(userId));
      paramCount++;
    }

    // Filtrar por media
    if (mediaType && mediaId) {
      query += ` AND sp.media_type = $${paramCount} AND sp.media_id = $${paramCount + 1}`;
      params.push(mediaType, parseInt(mediaId));
      paramCount += 2;
    }

    // Filtrar por estado
    if (status) {
      query += ` AND sp.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Filtrar por idioma
    if (language) {
      query += ` AND sp.language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }

    query += ` ORDER BY sp.status = 'active' DESC, sp.last_chapter_at DESC NULLS LAST`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      projects: result.rows.map(row => ({
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
        // Info del scan
        scanUsername: row.scan_username,
        scanAvatar: row.scan_avatar,
        // Stats
        chapterCount: parseInt(row.chapter_count) || 0,
        latestChapter: parseFloat(row.latest_chapter) || null,
        // Info del media
        mediaTitle: row.media_title,
        mediaCover: row.media_cover,
        mediaSlug: row.media_slug,
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/scan/projects:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo proyecto
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar rol scan o admin desde BD (usando user_roles)
    const roleCheck = await pool.query(
      `SELECT r.name as role_name 
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id 
       WHERE ur.user_id = $1`,
      [session.userId]
    );
    
    const userRoles = roleCheck.rows.map(r => r.role_name);
    const isScan = userRoles.includes('scan');
    const isAdmin = userRoles.includes('admin') || session.isAdmin;
    
    if (!isScan && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos de scanlator' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      mediaType,
      mediaId,
      groupName,
      websiteUrl,
      projectUrl,
      language = 'es',
      notes,
    } = body;

    // Validaciones
    if (!mediaType || !mediaId || !projectUrl) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: mediaType, mediaId, projectUrl' },
        { status: 400 }
      );
    }

    const validTypes = ['anime', 'manga', 'manhwa', 'manhua', 'donghua', 'novel', 'fan_comic'];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de media inválido' },
        { status: 400 }
      );
    }

    // Verificar que el media existe
    const tableMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      manhwa: 'manhwa',
      manhua: 'manhua',
      donghua: 'donghua',
      novel: 'novels',
      fan_comic: 'fan_comics',
    };

    const mediaCheck = await pool.query(
      `SELECT id FROM app.${tableMap[mediaType]} WHERE id = $1`,
      [mediaId]
    );

    if (mediaCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El media especificado no existe' },
        { status: 404 }
      );
    }

    // Crear proyecto
    const result = await pool.query(
      `INSERT INTO app.scan_projects 
        (user_id, media_type, media_id, group_name, website_url, project_url, language, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [session.userId, mediaType, mediaId, groupName, websiteUrl, projectUrl, language, notes]
    );

    const project = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Proyecto de scanlation creado exitosamente',
      project: {
        id: project.id,
        userId: project.user_id,
        mediaType: project.media_type,
        mediaId: project.media_id,
        groupName: project.group_name,
        projectUrl: project.project_url,
        status: project.status,
        language: project.language,
        createdAt: project.created_at,
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/scan/projects:', error);
    
    // Error de unicidad (proyecto duplicado)
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: 'Ya tienes un proyecto para este media en este idioma' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear proyecto' },
      { status: 500 }
    );
  }
}
