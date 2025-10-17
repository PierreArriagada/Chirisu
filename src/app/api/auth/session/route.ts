/**
 * ========================================
 * API ROUTE: SESIÓN ACTUAL
 * GET /api/auth/session
 * ========================================
 * 
 * Verifica si hay una sesión activa y retorna
 * los datos del usuario autenticado.
 * 
 * Se llama al cargar la app para restaurar sesión.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';
import type { SessionUser } from '@/lib/auth';

export async function GET() {
  try {
    // 1. OBTENER USUARIO ACTUAL DEL TOKEN JWT
    const jwtUser = await getCurrentUser();

    // No hay sesión
    if (!jwtUser) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    // 2. OBTENER DATOS ACTUALIZADOS DE LA BASE DE DATOS
    // (por si cambiaron permisos, nombre, etc.)
    const result = await db.query<{
      id: number;
      email: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      is_active: boolean;
    }>(
      `SELECT 
        id, email, username, display_name, avatar_url, is_active
       FROM app.users 
       WHERE id = $1 AND is_active = TRUE AND deleted_at IS NULL
       LIMIT 1`,
      [jwtUser.userId]
    );

    // Usuario no encontrado o desactivado
    if (result.rows.length === 0) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // 2.1. OBTENER ROLES DEL USUARIO
    const rolesResult = await db.query<{
      role_name: string;
    }>(
      `SELECT r.name as role_name
       FROM app.user_roles ur
       JOIN app.roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [jwtUser.userId]
    );

    const userRoles = rolesResult.rows.map(r => r.role_name);
    const isAdmin = userRoles.includes('admin');
    const isModerator = userRoles.includes('moderator');

    // 3. PREPARAR RESPUESTA
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      isAdmin: isAdmin,
      isModerator: isModerator,
    };

    return NextResponse.json({
      user: sessionUser,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/auth/session:', error);
    
    return NextResponse.json(
      { error: 'Error al verificar sesión' },
      { status: 500 }
    );
  }
}
