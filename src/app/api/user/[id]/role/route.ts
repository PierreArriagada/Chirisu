/**
 * API: Obtener rol de un usuario
 * GET /api/user/[id]/role - Obtener roles y permisos del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Obtener el usuario
    const userResult = await pool.query(
      `SELECT u.id, u.username
       FROM app.users u
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Obtener todos los roles del usuario desde user_roles
    const rolesResult = await pool.query(
      `SELECT r.name, r.display_name
       FROM app.roles r
       JOIN app.user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const roles = rolesResult.rows.map(r => r.name);
    const primaryRole = roles.includes('admin') ? 'admin' 
                      : roles.includes('moderator') ? 'moderator'
                      : roles.includes('scan') ? 'scan'
                      : 'user';

    // Obtener permisos de todos los roles del usuario
    const permissionsResult = await pool.query(
      `SELECT DISTINCT p.name
       FROM app.permissions p
       JOIN app.role_permissions rp ON rp.permission_id = p.id
       JOIN app.user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    const permissions = permissionsResult.rows.map(p => p.name);

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.username,
      role: primaryRole,
      roles,
      permissions,
      // Helpers rápidos
      isAdmin: roles.includes('admin'),
      isModerator: roles.includes('moderator'),
      isScanlator: roles.includes('scan'),
    });

  } catch (error) {
    console.error('Error en GET /api/user/[id]/role:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener rol del usuario' },
      { status: 500 }
    );
  }
}
