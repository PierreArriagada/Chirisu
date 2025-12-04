import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { pool } from '@/lib/database';

// GET - Obtener lista de usuarios con búsqueda opcional
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    console.log('🔍 GET /api/admin/users - Usuario:', {
      userId: payload?.userId,
      email: payload?.email,
      isAdmin: payload?.isAdmin,
      isModerator: payload?.isModerator,
    });
    
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      console.log('❌ Acceso denegado - No es admin ni moderador');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const trackingId = searchParams.get('trackingId');
    const username = searchParams.get('username');
    const email = searchParams.get('email');

    // Construir query dinámico
    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.tracking_id,
        u.is_active,
        u.created_at,
        u.display_name,
        u.avatar_url,
        COUNT(uc.id) as contribution_count,
        COALESCE(
          json_agg(
            DISTINCT r.name
          ) FILTER (WHERE r.name IS NOT NULL),
          '[]'
        ) as roles
      FROM app.users u
      LEFT JOIN app.user_contributions uc ON uc.user_id = u.id
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id
      WHERE u.deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtrar por tracking_id
    if (trackingId) {
      paramCount++;
      query += ` AND u.tracking_id = $${paramCount}`;
      params.push(trackingId);
    }

    // Filtrar por username
    if (username) {
      paramCount++;
      query += ` AND LOWER(u.username) LIKE $${paramCount}`;
      params.push(`%${username.toLowerCase()}%`);
    }

    // Filtrar por email
    if (email) {
      paramCount++;
      query += ` AND LOWER(u.email) LIKE $${paramCount}`;
      params.push(`%${email.toLowerCase()}%`);
    }

    query += `
      GROUP BY u.id, u.username, u.email, u.tracking_id, u.is_active, u.created_at, u.display_name, u.avatar_url
      ORDER BY u.created_at DESC
      LIMIT 100
    `;

    const result = await pool.query(query, params);

    return NextResponse.json({ users: result.rows });

  } catch (error) {
    console.error('Error en GET /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// PATCH - Cambiar rol o estado de usuario
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, suspensionReason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Verificar que la acción sea válida
    const validActions = ['promote', 'demote', 'suspend', 'unsuspend', 'ban', 'promote_scan', 'demote_scan'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Solo admins pueden promover/degradar/banear
    if (['promote', 'demote', 'ban', 'promote_scan', 'demote_scan'].includes(action) && !payload.isAdmin) {
      return NextResponse.json({ 
        error: 'Solo los administradores pueden cambiar roles de usuario' 
      }, { status: 403 });
    }

    // Verificar que el usuario existe
    const userResult = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.is_active,
        COALESCE(
          json_agg(
            DISTINCT r.name
          ) FILTER (WHERE r.name IS NOT NULL),
          '[]'
        ) as roles
      FROM app.users u
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id
      WHERE u.id = $1
      GROUP BY u.id, u.username, u.is_active
    `, [userId]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userRoles = typeof user.roles === 'string' ? JSON.parse(user.roles) : user.roles;
    const isAdmin = userRoles.includes('admin');
    const isModerator = userRoles.includes('moderator');

    // No permitir modificar administradores
    if (isAdmin) {
      return NextResponse.json(
        { error: 'No se puede modificar un administrador' },
        { status: 403 }
      );
    }

    let message = '';

    // Ejecutar la acción
    switch (action) {
      case 'promote':
        if (isModerator) {
          return NextResponse.json({ error: 'El usuario ya es moderador' }, { status: 400 });
        }
        // Obtener el role_id de moderator
        const modRoleResult = await pool.query(
          "SELECT id FROM app.roles WHERE name = 'moderator'"
        );
        if (modRoleResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO app.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, modRoleResult.rows[0].id]
          );
          message = `Usuario ${user.username} promovido a moderador exitosamente`;
        }
        break;

      case 'demote':
        if (!isModerator) {
          return NextResponse.json({ error: 'El usuario no es moderador' }, { status: 400 });
        }
        // Obtener el role_id de moderator
        const modRoleResult2 = await pool.query(
          "SELECT id FROM app.roles WHERE name = 'moderator'"
        );
        if (modRoleResult2.rows.length > 0) {
          await pool.query(
            'DELETE FROM app.user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, modRoleResult2.rows[0].id]
          );
          message = `Usuario ${user.username} degradado a usuario regular exitosamente`;
        }
        break;

      case 'suspend':
        if (!user.is_active) {
          return NextResponse.json({ error: 'El usuario ya está suspendido' }, { status: 400 });
        }
        await pool.query('UPDATE app.users SET is_active = false WHERE id = $1', [userId]);
        message = `Usuario ${user.username} suspendido exitosamente`;
        break;

      case 'unsuspend':
        if (user.is_active) {
          return NextResponse.json({ error: 'El usuario ya está activo' }, { status: 400 });
        }
        await pool.query('UPDATE app.users SET is_active = true WHERE id = $1', [userId]);
        message = `Usuario ${user.username} reactivado exitosamente`;
        break;

      case 'ban':
        // Marcar como eliminado (soft delete)
        await pool.query(
          'UPDATE app.users SET deleted_at = CURRENT_TIMESTAMP, is_active = false WHERE id = $1',
          [userId]
        );
        message = `Usuario ${user.username} baneado permanentemente`;
        break;

      case 'promote_scan':
        const isScan = userRoles.includes('scan');
        if (isScan) {
          return NextResponse.json({ error: 'El usuario ya es scanlator' }, { status: 400 });
        }
        // Obtener el role_id de scan
        const scanRoleResult = await pool.query(
          "SELECT id FROM app.roles WHERE name = 'scan'"
        );
        if (scanRoleResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO app.user_roles (user_id, role_id, assigned_by, assigned_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING',
            [userId, scanRoleResult.rows[0].id, payload.userId]
          );
          message = `Usuario ${user.username} promovido a scanlator exitosamente`;
        } else {
          return NextResponse.json({ error: 'Rol scan no encontrado en la base de datos' }, { status: 500 });
        }
        break;

      case 'demote_scan':
        const hasScanRole = userRoles.includes('scan');
        if (!hasScanRole) {
          return NextResponse.json({ error: 'El usuario no es scanlator' }, { status: 400 });
        }
        // Obtener el role_id de scan
        const scanRoleResult2 = await pool.query(
          "SELECT id FROM app.roles WHERE name = 'scan'"
        );
        if (scanRoleResult2.rows.length > 0) {
          await pool.query(
            'DELETE FROM app.user_roles WHERE user_id = $1 AND role_id = $2',
            [userId, scanRoleResult2.rows[0].id]
          );
          message = `Rol de scanlator removido de ${user.username} exitosamente`;
        }
        break;
    }

    return NextResponse.json({
      success: true,
      message,
    });

  } catch (error) {
    console.error('Error en PATCH /api/admin/users:', error);
    return NextResponse.json(
      { error: 'Error al modificar usuario' },
      { status: 500 }
    );
  }
}
