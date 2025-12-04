/**
 * API: Gestión de grupo de scanlation específico
 * GET /api/scan/groups/[id] - Obtener detalles del grupo
 * PATCH /api/scan/groups/[id] - Actualizar grupo (solo owner o admin)
 * POST /api/scan/groups/[id]/claim - Reclamar grupo como owner
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Obtener detalles del grupo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT 
        sg.*,
        u.username as owner_username,
        u.display_name as owner_display_name,
        u.avatar_url as owner_avatar,
        (SELECT COUNT(*) FROM app.scanlation_group_links sgl WHERE sgl.group_id = sg.id) as links_count,
        (SELECT COUNT(*) FROM app.scan_projects sp WHERE sp.group_name = sg.name) as projects_count
       FROM app.scanlation_groups sg
       LEFT JOIN app.users u ON sg.owner_user_id = u.id
       WHERE sg.id = $1`,
      [groupId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    const group = result.rows[0];

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        websiteUrl: group.website_url,
        discordUrl: group.discord_url,
        description: group.description,
        logoUrl: group.logo_url,
        isVerified: group.is_verified,
        verifiedAt: group.verified_at,
        ownerUserId: group.owner_user_id,
        owner: group.owner_user_id ? {
          id: group.owner_user_id,
          username: group.owner_username,
          displayName: group.owner_display_name,
          avatarUrl: group.owner_avatar,
        } : null,
        linksCount: parseInt(group.links_count) || 0,
        projectsCount: parseInt(group.projects_count) || 0,
        createdAt: group.created_at,
        updatedAt: group.updated_at,
      }
    });

  } catch (error) {
    console.error('Error en GET /api/scan/groups/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener grupo' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar grupo (solo owner o admin)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }

    // Verificar que el grupo existe y el usuario tiene permisos
    const groupCheck = await pool.query(
      `SELECT sg.*, 
              EXISTS(SELECT 1 FROM app.user_roles ur JOIN app.roles r ON ur.role_id = r.id 
                     WHERE ur.user_id = $2 AND r.name = 'admin') as is_admin
       FROM app.scanlation_groups sg
       WHERE sg.id = $1`,
      [groupId, session.userId]
    );

    if (groupCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    const group = groupCheck.rows[0];
    const isOwner = group.owner_user_id === session.userId;
    const isAdmin = group.is_admin || session.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este grupo' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { websiteUrl, discordUrl, description, logoUrl } = body;

    await pool.query(
      `UPDATE app.scanlation_groups 
       SET website_url = COALESCE($2, website_url),
           discord_url = COALESCE($3, discord_url),
           description = COALESCE($4, description),
           logo_url = COALESCE($5, logo_url),
           updated_at = NOW()
       WHERE id = $1`,
      [groupId, websiteUrl, discordUrl, description, logoUrl]
    );

    return NextResponse.json({
      success: true,
      message: 'Grupo actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error en PATCH /api/scan/groups/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar grupo' },
      { status: 500 }
    );
  }
}

// POST: Reclamar grupo como owner (solo usuarios con rol scan)
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
    const groupId = parseInt(id);

    if (isNaN(groupId)) {
      return NextResponse.json(
        { success: false, error: 'ID de grupo inválido' },
        { status: 400 }
      );
    }

    // Verificar que el usuario tiene rol scan
    const roleCheck = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM app.user_roles ur 
        JOIN app.roles r ON ur.role_id = r.id 
        WHERE ur.user_id = $1 AND r.name IN ('scan', 'admin')
      ) as has_scan_role`,
      [session.userId]
    );

    if (!roleCheck.rows[0].has_scan_role) {
      return NextResponse.json(
        { success: false, error: 'Necesitas rol de scanlator para reclamar un grupo' },
        { status: 403 }
      );
    }

    // Verificar que el grupo existe y no tiene owner
    const groupCheck = await pool.query(
      `SELECT * FROM app.scanlation_groups WHERE id = $1`,
      [groupId]
    );

    if (groupCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    const group = groupCheck.rows[0];

    if (group.owner_user_id) {
      return NextResponse.json(
        { success: false, error: 'Este grupo ya tiene un encargado' },
        { status: 409 }
      );
    }

    // Reclamar el grupo
    await pool.query(
      `UPDATE app.scanlation_groups 
       SET owner_user_id = $2,
           is_verified = true,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [groupId, session.userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Grupo reclamado exitosamente. Ahora eres el encargado verificado.'
    });

  } catch (error) {
    console.error('Error en POST /api/scan/groups/[id] (claim):', error);
    return NextResponse.json(
      { success: false, error: 'Error al reclamar grupo' },
      { status: 500 }
    );
  }
}
