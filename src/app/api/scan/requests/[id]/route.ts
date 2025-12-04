/**
 * API: Gestión de solicitud específica de Scanlator
 * GET /api/scan/requests/[id] - Obtener solicitud
 * PUT /api/scan/requests/[id] - Aprobar/Rechazar solicitud (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener solicitud específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        sr.*,
        u.username,
        u.email,
        u.avatar_url,
        u.display_name,
        u.created_at as user_created_at,
        reviewer.username as reviewer_username
       FROM app.scan_requests sr
       JOIN app.users u ON sr.user_id = u.id
       LEFT JOIN app.users reviewer ON sr.reviewed_by = reviewer.id
       WHERE sr.id = $1`,
      [requestId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    const r = result.rows[0];

    // Solo admin o el propio usuario pueden ver la solicitud
    if (!session.isAdmin && r.user_id !== session.userId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver esta solicitud' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      request: {
        id: r.id,
        userId: r.user_id,
        username: r.username,
        email: r.email,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        userCreatedAt: r.user_created_at,
        groupName: r.group_name,
        groupUrl: r.group_url,
        experience: r.experience,
        mediaTypes: r.media_types,
        languages: r.languages,
        portfolioUrls: r.portfolio_urls,
        status: r.status,
        reviewedBy: r.reviewer_username,
        reviewedAt: r.reviewed_at,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at,
      }
    });

  } catch (error) {
    console.error('Error en GET /api/scan/requests/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitud' },
      { status: 500 }
    );
  }
}

// PUT: Aprobar o rechazar solicitud
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo admins pueden aprobar/rechazar
    if (!session.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Solo administradores pueden procesar solicitudes' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requestId = parseInt(id);

    if (isNaN(requestId)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Acción inválida. Usa "approve" o "reject"' },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe y está pendiente
    const requestCheck = await pool.query(
      `SELECT * FROM app.scan_requests WHERE id = $1`,
      [requestId]
    );

    if (requestCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (requestCheck.rows[0].status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Esta solicitud ya fue procesada' },
        { status: 400 }
      );
    }

    const userId = requestCheck.rows[0].user_id;

    if (action === 'approve') {
      // Obtener el ID del rol scan
      const scanRoleResult = await pool.query(
        "SELECT id FROM app.roles WHERE name = 'scan'"
      );

      if (scanRoleResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Rol scan no encontrado en la base de datos' },
          { status: 500 }
        );
      }

      const scanRoleId = scanRoleResult.rows[0].id;

      // Actualizar solicitud
      await pool.query(
        `UPDATE app.scan_requests
         SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
         WHERE id = $2`,
        [session.userId, requestId]
      );

      // Asignar rol scan al usuario
      await pool.query(
        `INSERT INTO app.user_roles (user_id, role_id, assigned_by, assigned_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [userId, scanRoleId, session.userId]
      );

      // Crear notificación
      await pool.query(
        `INSERT INTO app.notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'role_assigned', '🎉 ¡Solicitud Aprobada!', 
                 'Tu solicitud para ser Scanlator ha sido aprobada. Ya puedes gestionar tus proyectos de traducción.',
                 NOW())`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        message: 'Solicitud aprobada. El usuario ahora es scanlator.'
      });

    } else {
      // Rechazar
      if (!rejectionReason || rejectionReason.trim().length < 10) {
        return NextResponse.json(
          { success: false, error: 'Debes proporcionar una razón de rechazo (mínimo 10 caracteres)' },
          { status: 400 }
        );
      }

      await pool.query(
        `UPDATE app.scan_requests
         SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), 
             rejection_reason = $2, updated_at = NOW()
         WHERE id = $3`,
        [session.userId, rejectionReason, requestId]
      );

      // Crear notificación
      await pool.query(
        `INSERT INTO app.notifications (user_id, type, title, message, created_at)
         VALUES ($1, 'role_rejected', '❌ Solicitud Rechazada', 
                 $2, NOW())`,
        [userId, `Tu solicitud para ser Scanlator ha sido rechazada. Razón: ${rejectionReason}`]
      );

      return NextResponse.json({
        success: true,
        message: 'Solicitud rechazada.'
      });
    }

  } catch (error) {
    console.error('Error en PUT /api/scan/requests/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
