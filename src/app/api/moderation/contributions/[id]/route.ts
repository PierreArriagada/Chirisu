/**
 * ========================================
 * API ROUTE: DETALLE DE CONTRIBUCIÓN (MODERACIÓN)
 * ========================================
 * 
 * GET /api/moderation/contributions/[id]
 * PATCH /api/moderation/contributions/[id]
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';
// createNotification removido: ahora lo hace el trigger fn_notify_contribution_status_change()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    const roleCheck = await db.query(
      `SELECT r.name
       FROM app.user_roles ur
       INNER JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name IN ('admin', 'moderator')`,
      [currentUser.userId]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'No tienes permisos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const contributionId = parseInt(id);

    if (isNaN(contributionId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Obtener contribución
    const result = await db.query(
      `SELECT 
        uc.id,
        uc.user_id,
        uc.contributable_type,
        uc.contributable_id,
        uc.contribution_data,
        uc.status,
        uc.created_at,
        uc.reviewed_by,
        uc.reviewed_at,
        uc.rejection_reason,
        u.username,
        u.display_name,
        u.avatar_url
      FROM app.user_contributions uc
      INNER JOIN app.users u ON uc.user_id = u.id
      WHERE uc.id = $1`,
      [contributionId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const contribution = {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      contributableType: row.contributable_type,
      contributableId: row.contributable_id?.toString(),
      contributionData: row.contribution_data,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      reviewedBy: row.reviewed_by?.toString(),
      reviewedAt: row.reviewed_at?.toISOString(),
      rejectionReason: row.rejection_reason,
      user: {
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
      },
    };

    return NextResponse.json({
      success: true,
      contribution,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/moderation/contributions/[id]:', error);
    return NextResponse.json(
      { error: 'Error al obtener contribución' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Aprobar o rechazar contribución
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar permisos
    const roleCheck = await db.query(
      `SELECT r.name
       FROM app.user_roles ur
       INNER JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name IN ('admin', 'moderator')`,
      [currentUser.userId]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'No tienes permisos' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const contributionId = parseInt(id);
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      );
    }

    // Obtener contribución
    const contributionResult = await db.query(
      `SELECT * FROM app.user_contributions WHERE id = $1 AND status = 'pending'`,
      [contributionId]
    );

    if (contributionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contribución no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    const contribution = contributionResult.rows[0];

    // ==================================================================
    // APROBAR O RECHAZAR
    // El trigger fn_apply_approved_contribution() creará el registro
    // El trigger fn_notify_contributor_review() notificará al usuario
    // ==================================================================

    const result = await db.withTransaction(async (client) => {
      if (action === 'approve') {
        console.log(`🔄 Aprobando contribución ${contributionId} (tipo: ${contribution.contributable_type})...`);

        // Simplemente actualizar el status a 'approved'
        // El trigger BEFORE UPDATE se encargará de:
        // 1. Crear el registro en la tabla correspondiente (anime, manga, character, etc.)
        // 2. Actualizar contributable_id con el ID del nuevo registro
        // 3. El trigger AFTER UPDATE notificará al usuario
        await client.query(
          `UPDATE app.user_contributions
           SET status = 'approved',
               reviewed_by = $1,
               reviewed_at = NOW()
           WHERE id = $2`,
          [currentUser.userId, contributionId]
        );

        console.log(`✅ Contribución ${contributionId} aprobada. El trigger creó el registro automáticamente.`);

        return {
          success: true,
          message: `Contribución aprobada. El ${contribution.contributable_type} ha sido creado exitosamente.`,
        };

      } else if (action === 'reject') {
        console.log(`🔄 Rechazando contribución ${contributionId}...`);

        if (!rejectionReason || rejectionReason.trim().length === 0) {
          throw new Error('Debes proporcionar un motivo de rechazo');
        }

        // Actualizar a rejected
        // El trigger AFTER UPDATE notificará al usuario automáticamente
        await client.query(
          `UPDATE app.user_contributions
           SET status = 'rejected',
               reviewed_by = $1,
               reviewed_at = NOW(),
               rejection_reason = $2
           WHERE id = $3`,
          [currentUser.userId, rejectionReason.trim(), contributionId]
        );

        console.log(`✅ Contribución ${contributionId} rechazada`);

        return {
          success: true,
          message: 'Contribución rechazada',
        };
      }

      return null;
    });

    if (result) {
      return NextResponse.json(result);
    }

  } catch (error) {
    console.error('❌ Error en PATCH /api/moderation/contributions/[id]:', error);
    return NextResponse.json(
      { error: 'Error al procesar contribución' },
      { status: 500 }
    );
  }
}
