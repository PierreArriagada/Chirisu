/**
 * API para gestionar una solicitud de vinculación específica
 * GET - Obtener detalles
 * PUT - Aprobar o rechazar (solo el owner del grupo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Obtener detalles de la solicitud
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const result = await pool.query(`
      SELECT 
        slr.*,
        sg.name as group_name,
        sg.owner_user_id,
        u.username as requested_by_username
      FROM app.scan_link_requests slr
      JOIN app.scanlation_groups sg ON slr.group_id = sg.id
      JOIN app.users u ON slr.requested_by = u.id
      WHERE slr.id = $1
    `, [requestId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error en GET /api/scan/link-requests/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Aprobar o rechazar solicitud
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.userId;

  try {
    const body = await req.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida. Debe ser approve o reject' }, { status: 400 });
    }

    // Obtener la solicitud y verificar que el usuario es el owner del grupo
    const requestResult = await pool.query(`
      SELECT 
        slr.*,
        sg.owner_user_id,
        sg.name as group_name,
        u.username as requested_by_username,
        u.id as requester_id
      FROM app.scan_link_requests slr
      JOIN app.scanlation_groups sg ON slr.group_id = sg.id
      JOIN app.users u ON slr.requested_by = u.id
      WHERE slr.id = $1
    `, [requestId]);

    if (requestResult.rows.length === 0) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    const request = requestResult.rows[0];

    // Verificar que es el owner del grupo
    if (request.owner_user_id !== userId) {
      // Verificar si es admin
      const adminCheck = await pool.query(`
        SELECT 1 FROM app.user_roles ur
        JOIN app.roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 AND r.name = 'admin'
      `, [userId]);

      if (adminCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: 'Solo el dueño del grupo puede aprobar/rechazar solicitudes' 
        }, { status: 403 });
      }
    }

    if (request.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Actualizar la solicitud
    await pool.query(`
      UPDATE app.scan_link_requests
      SET 
        status = $1,
        rejection_reason = $2,
        reviewed_by = $3,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $4
    `, [newStatus, rejectionReason || null, userId, requestId]);

    // Si se aprueba, crear el link en scanlation_group_links
    if (action === 'approve') {
      await pool.query(`
        INSERT INTO app.scanlation_group_links 
          (group_id, media_type, media_id, url, language, added_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (group_id, media_type, media_id, language) DO UPDATE SET
          url = EXCLUDED.url,
          updated_at = NOW()
      `, [
        request.group_id, 
        request.media_type, 
        request.media_id, 
        request.url, 
        request.language,
        request.requested_by
      ]);

      // Notificar al usuario que solicitó
      await pool.query(`
        INSERT INTO app.user_notifications (user_id, type, title, message, data)
        VALUES ($1, 'scan_link_approved', '✅ Solicitud aprobada', $2, $3)
      `, [
        request.requester_id,
        `Tu solicitud de vincular "${request.group_name}" fue aprobada`,
        JSON.stringify({
          requestId,
          groupId: request.group_id,
          mediaType: request.media_type,
          mediaId: request.media_id
        })
      ]);
    } else {
      // Notificar rechazo
      await pool.query(`
        INSERT INTO app.user_notifications (user_id, type, title, message, data)
        VALUES ($1, 'scan_link_rejected', '❌ Solicitud rechazada', $2, $3)
      `, [
        request.requester_id,
        `Tu solicitud de vincular "${request.group_name}" fue rechazada${rejectionReason ? ': ' + rejectionReason : ''}`,
        JSON.stringify({
          requestId,
          groupId: request.group_id,
          mediaType: request.media_type,
          mediaId: request.media_id,
          reason: rejectionReason
        })
      ]);
    }

    return NextResponse.json({
      message: action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada',
      status: newStatus
    });

  } catch (error) {
    console.error('Error en PUT /api/scan/link-requests/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE - Cancelar solicitud (solo el que la creó)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const userId = session.userId;

  try {
    const result = await pool.query(`
      DELETE FROM app.scan_link_requests
      WHERE id = $1 AND requested_by = $2 AND status = 'pending'
      RETURNING id
    `, [requestId, userId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: 'Solicitud no encontrada o no puedes cancelarla' 
      }, { status: 404 });
    }

    return NextResponse.json({ message: 'Solicitud cancelada' });
  } catch (error) {
    console.error('Error en DELETE /api/scan/link-requests/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
