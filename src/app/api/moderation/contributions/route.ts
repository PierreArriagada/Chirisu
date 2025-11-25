/**
 * ========================================
 * API ROUTE: MODERACIÓN DE CONTRIBUCIONES
 * ========================================
 * 
 * GET /api/moderation/contributions
 * - Obtiene contribuciones pendientes (solo admins/mods)
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar si el usuario es admin o moderador
    const roleCheck = await db.query(
      `SELECT r.name
       FROM app.user_roles ur
       INNER JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1 AND r.name IN ('admin', 'moderator')`,
      [currentUser.userId]
    );

    if (roleCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta sección' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Obtener contribuciones
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
        u.avatar_url,
        reviewer.username as reviewer_username
      FROM app.user_contributions uc
      INNER JOIN app.users u ON uc.user_id = u.id
      LEFT JOIN app.users reviewer ON uc.reviewed_by = reviewer.id
      WHERE uc.status = $1
      ORDER BY uc.created_at DESC
      LIMIT $2`,
      [status, limit]
    );

    const contributions = result.rows.map((row: any) => ({
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
      reviewer: row.reviewer_username ? {
        username: row.reviewer_username,
      } : null,
    }));

    return NextResponse.json({
      success: true,
      contributions,
      total: contributions.length,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/moderation/contributions:', error);
    return NextResponse.json(
      { error: 'Error al obtener contribuciones' },
      { status: 500 }
    );
  }
}
