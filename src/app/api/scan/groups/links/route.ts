/**
 * API: Enlaces de grupos de scanlation
 * POST /api/scan/groups/links - Agregar enlace de traducción a un grupo
 * GET /api/scan/groups/links - Obtener enlaces de un media específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// GET: Obtener enlaces de traducciones para un media
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    const groupId = searchParams.get('groupId');

    let query = `
      SELECT 
        sgl.id,
        sgl.url,
        sgl.status,
        sgl.language,
        sgl.created_at,
        sg.id as group_id,
        sg.name as group_name,
        sg.slug as group_slug,
        sg.website_url as group_website,
        sg.logo_url as group_logo,
        sg.is_verified as group_verified
      FROM app.scanlation_group_links sgl
      JOIN app.scanlation_groups sg ON sg.id = sgl.group_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (mediaType && mediaId) {
      query += ` AND sgl.media_type = $${paramCount} AND sgl.media_id = $${paramCount + 1}`;
      params.push(mediaType, parseInt(mediaId));
      paramCount += 2;
    }

    if (groupId) {
      query += ` AND sgl.group_id = $${paramCount}`;
      params.push(parseInt(groupId));
      paramCount++;
    }

    query += ` ORDER BY sg.is_verified DESC, sgl.status = 'active' DESC, sg.name ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      links: result.rows.map(row => ({
        id: row.id,
        url: row.url,
        status: row.status,
        language: row.language,
        createdAt: row.created_at,
        group: {
          id: row.group_id,
          name: row.group_name,
          slug: row.group_slug,
          websiteUrl: row.group_website,
          logoUrl: row.group_logo,
          isVerified: row.group_verified,
        }
      }))
    });

  } catch (error) {
    console.error('Error en GET /api/scan/groups/links:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener enlaces' },
      { status: 500 }
    );
  }
}

// POST: Agregar enlace de traducción
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    
    const body = await request.json();
    const { 
      groupId, 
      groupName, // Si no existe groupId, crear grupo con este nombre
      mediaType, 
      mediaId, 
      url, 
      status = 'active',
      language = 'es'
    } = body;

    // Validaciones
    if (!mediaType || !mediaId || !url) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos: mediaType, mediaId, url' },
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

    let finalGroupId = groupId;

    // Si no hay groupId pero hay groupName, buscar o crear el grupo
    if (!finalGroupId && groupName) {
      // Buscar grupo existente
      const existingGroup = await pool.query(
        `SELECT id FROM app.scanlation_groups WHERE LOWER(name) = LOWER($1)`,
        [groupName.trim()]
      );

      if (existingGroup.rows.length > 0) {
        finalGroupId = existingGroup.rows[0].id;
      } else {
        // Crear nuevo grupo
        const slug = groupName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();

        const newGroup = await pool.query(
          `INSERT INTO app.scanlation_groups (name, slug, created_by)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [groupName.trim(), slug, session?.userId || null]
        );
        finalGroupId = newGroup.rows[0].id;
      }
    }

    if (!finalGroupId) {
      return NextResponse.json(
        { success: false, error: 'Se requiere groupId o groupName' },
        { status: 400 }
      );
    }

    // Insertar o actualizar enlace
    const result = await pool.query(
      `INSERT INTO app.scanlation_group_links 
        (group_id, media_type, media_id, url, status, language, added_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (group_id, media_type, media_id, language) 
       DO UPDATE SET url = $4, status = $5, updated_at = NOW()
       RETURNING id, url, status, language, created_at`,
      [finalGroupId, mediaType, parseInt(mediaId), url, status, language, session?.userId || null]
    );

    // Obtener info del grupo
    const groupInfo = await pool.query(
      `SELECT id, name, slug, is_verified FROM app.scanlation_groups WHERE id = $1`,
      [finalGroupId]
    );

    const link = result.rows[0];
    const group = groupInfo.rows[0];

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        url: link.url,
        status: link.status,
        language: link.language,
        createdAt: link.created_at,
        group: {
          id: group.id,
          name: group.name,
          slug: group.slug,
          isVerified: group.is_verified,
        }
      },
      message: 'Enlace agregado exitosamente'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en POST /api/scan/groups/links:', error);
    return NextResponse.json(
      { success: false, error: 'Error al agregar enlace' },
      { status: 500 }
    );
  }
}
