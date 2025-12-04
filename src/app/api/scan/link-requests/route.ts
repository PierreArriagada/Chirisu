/**
 * API para solicitudes de vinculación de grupos a medios
 * GET - Listar solicitudes pendientes (para el dueño del grupo)
 * POST - Crear nueva solicitud de vinculación
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// GET - Listar solicitudes pendientes para mis grupos
export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.userId;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'pending';
  const groupId = searchParams.get('groupId');

  try {
    // Obtener solicitudes de grupos donde soy owner
    let query = `
      SELECT 
        slr.id,
        slr.group_id as "groupId",
        slr.media_type as "mediaType",
        slr.media_id as "mediaId",
        slr.url,
        slr.language,
        slr.status,
        slr.rejection_reason as "rejectionReason",
        slr.created_at as "createdAt",
        sg.name as "groupName",
        u.username as "requestedBy",
        u.avatar_url as "requestedByAvatar",
        CASE slr.media_type
          WHEN 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = slr.media_id)
          WHEN 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = slr.media_id)
          WHEN 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = slr.media_id)
          WHEN 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = slr.media_id)
          WHEN 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = slr.media_id)
          WHEN 'novel' THEN (SELECT title_romaji FROM app.novels WHERE id = slr.media_id)
          WHEN 'fan_comic' THEN (SELECT title FROM app.fan_comics WHERE id = slr.media_id)
        END as "mediaTitle",
        CASE slr.media_type
          WHEN 'anime' THEN (SELECT slug FROM app.anime WHERE id = slr.media_id)
          WHEN 'manga' THEN (SELECT slug FROM app.manga WHERE id = slr.media_id)
          WHEN 'manhwa' THEN (SELECT slug FROM app.manhwa WHERE id = slr.media_id)
          WHEN 'manhua' THEN (SELECT slug FROM app.manhua WHERE id = slr.media_id)
          WHEN 'donghua' THEN (SELECT slug FROM app.donghua WHERE id = slr.media_id)
          WHEN 'novel' THEN (SELECT slug FROM app.novels WHERE id = slr.media_id)
          WHEN 'fan_comic' THEN (SELECT slug FROM app.fan_comics WHERE id = slr.media_id)
        END as "mediaSlug"
      FROM app.scan_link_requests slr
      JOIN app.scanlation_groups sg ON slr.group_id = sg.id
      JOIN app.users u ON slr.requested_by = u.id
      WHERE sg.owner_user_id = $1
        AND slr.status = $2
    `;
    
    const params: any[] = [userId, status];
    
    if (groupId) {
      query += ` AND slr.group_id = $3`;
      params.push(parseInt(groupId));
    }
    
    query += ` ORDER BY slr.created_at DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      requests: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error en GET /api/scan/link-requests:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear solicitud de vinculación
export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.userId;

  try {
    const body = await req.json();
    const { groupId, mediaType, mediaId, url, language = 'es' } = body;

    // Validaciones
    if (!groupId || !mediaType || !mediaId || !url) {
      return NextResponse.json({ 
        error: 'groupId, mediaType, mediaId y url son requeridos' 
      }, { status: 400 });
    }

    // Verificar que el grupo existe y está verificado
    const groupCheck = await pool.query(`
      SELECT id, name, owner_user_id, is_verified 
      FROM app.scanlation_groups 
      WHERE id = $1
    `, [groupId]);

    if (groupCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 404 });
    }

    const group = groupCheck.rows[0];

    // Si el usuario ES el owner del grupo, insertar directamente como aprobado
    if (group.owner_user_id === userId) {
      // Insertar directamente en scanlation_group_links
      const insertResult = await pool.query(`
        INSERT INTO app.scanlation_group_links (group_id, media_type, media_id, url, language, added_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (group_id, media_type, media_id, language) DO UPDATE SET
          url = EXCLUDED.url,
          updated_at = NOW()
        RETURNING id
      `, [groupId, mediaType, mediaId, url, language, userId]);

      return NextResponse.json({
        message: 'Vinculación agregada directamente (eres el dueño del grupo)',
        linkId: insertResult.rows[0].id,
        approved: true
      });
    }

    // Si el grupo NO está verificado (no tiene owner), insertar como no verificado
    if (!group.is_verified || !group.owner_user_id) {
      // Insertar directamente pero marcando de alguna forma que no está verificado
      const insertResult = await pool.query(`
        INSERT INTO app.scanlation_group_links (group_id, media_type, media_id, url, language, added_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (group_id, media_type, media_id, language) DO UPDATE SET
          url = EXCLUDED.url,
          updated_at = NOW()
        RETURNING id
      `, [groupId, mediaType, mediaId, url, language, userId]);

      return NextResponse.json({
        message: 'Vinculación agregada (grupo no verificado, pendiente de verificación)',
        linkId: insertResult.rows[0].id,
        approved: true,
        verified: false
      });
    }

    // El grupo está verificado y tiene owner - crear solicitud pendiente
    // Verificar que no exista solicitud pendiente
    const existingRequest = await pool.query(`
      SELECT id FROM app.scan_link_requests
      WHERE group_id = $1 AND media_type = $2 AND media_id = $3 AND requested_by = $4
    `, [groupId, mediaType, mediaId, userId]);

    if (existingRequest.rows.length > 0) {
      return NextResponse.json({ 
        error: 'Ya existe una solicitud para este grupo y media' 
      }, { status: 409 });
    }

    // Crear solicitud
    const result = await pool.query(`
      INSERT INTO app.scan_link_requests 
        (group_id, media_type, media_id, url, language, requested_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [groupId, mediaType, mediaId, url, language, userId]);

    // Crear notificación para el dueño del grupo
    await pool.query(`
      INSERT INTO app.user_notifications (user_id, type, title, message, data)
      VALUES ($1, 'scan_link_request', 'Nueva solicitud de vinculación', 
              $2, $3)
    `, [
      group.owner_user_id,
      `El usuario @${session.username || 'alguien'} quiere vincular tu grupo "${group.name}" a un título`,
      JSON.stringify({
        requestId: result.rows[0].id,
        groupId,
        mediaType,
        mediaId,
        url
      })
    ]);

    return NextResponse.json({
      message: 'Solicitud de vinculación enviada. El dueño del grupo debe aprobarla.',
      requestId: result.rows[0].id,
      pending: true
    });

  } catch (error: any) {
    console.error('Error en POST /api/scan/link-requests:', error);
    
    if (error.code === '23505') {
      return NextResponse.json({ 
        error: 'Ya existe una solicitud para esta combinación' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
