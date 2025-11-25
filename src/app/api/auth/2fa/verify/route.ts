/**
 * ========================================
 * API ROUTE: VERIFY 2FA (Actualizado)
 * POST /api/auth/2fa/verify
 * ========================================
 * 
 * PROPÓSITO:
 * - Verificar código A2F durante el LOGIN
 * - Generar sesión JWT completa después de verificación exitosa
 * - Soporta código TOTP (6 dígitos) y backup codes
 * 
 * FLUJO:
 * 1. Recibe userId y código 2FA (desde login)
 * 2. Busca secret en app.user_2fa
 * 3. Verifica código TOTP o backup code
 * 4. Si válido:
 *    - Busca roles del usuario en app.user_roles
 *    - Genera token JWT
 *    - Establece cookie de sesión
 *    - Retorna datos del usuario
 * 5. Si usa backup code, lo elimina de la lista
 * 
 * CONEXIONES:
 * - BD: app.user_2fa, app.users, app.user_roles, app.roles
 * - Llamado desde: Frontend después de login exitoso
 * - lib/two-factor.ts: verifyToken(), verifyHashedBackupCode()
 * - lib/auth.ts: generateToken()
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, verifyHashedBackupCode } from '@/lib/two-factor';
import { generateToken } from '@/lib/auth';
import { pool } from '@/lib/database';

// ============================================
// TIPOS
// ============================================

interface Verify2FABody {
  userId: number;
  code: string; // Código de 6 dígitos o backup code
}

// ============================================
// ENDPOINT: POST /api/auth/2fa/verify
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. PARSEAR REQUEST BODY
    const body: Verify2FABody = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'userId y código son requeridos' },
        { status: 400 }
      );
    }

    // 2. OBTENER CONFIGURACIÓN 2FA (schema: app)
    const result = await pool.query(
      `SELECT u2f.secret, u2f.backup_codes, u.email, u.username, u.display_name, u.avatar_url, u.level, u.points
       FROM app.user_2fa u2f
       JOIN app.users u ON u.id = u2f.user_id
       WHERE u2f.user_id = $1 AND u2f.enabled = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '2FA no configurado para este usuario' },
        { status: 400 }
      );
    }

    const { secret, backup_codes, email, username, display_name, avatar_url, level, points } = result.rows[0];

    // 3. VERIFICAR CÓDIGO (intentar como TOTP primero)
    let isValid = false;

    // Intentar como código TOTP (6 dígitos)
    if (code.length === 6 && /^\d+$/.test(code)) {
      const verification = verifyToken(secret, code);
      isValid = verification.valid;
    }

    // Si no es válido como TOTP, intentar como backup code
    if (!isValid && backup_codes && backup_codes.length > 0) {
      const backupVerification = verifyHashedBackupCode(backup_codes, code);
      isValid = backupVerification.valid;

      // Si es válido, actualizar códigos de respaldo (eliminar el usado)
      if (isValid && backupVerification.remainingCodes) {
        await pool.query(
          'UPDATE app.user_2fa SET backup_codes = $1 WHERE user_id = $2',
          [backupVerification.remainingCodes, userId]
        );
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 401 }
      );
    }

    // 4. OBTENER ROLES (schema: app)
    const rolesQuery = await pool.query(
      `SELECT r.name 
       FROM app.user_roles ur 
       JOIN app.roles r ON r.id = ur.role_id 
       WHERE ur.user_id = $1`,
      [userId]
    );

    const roles = rolesQuery.rows.map((r: { name: string }) => r.name);
    const isAdmin = roles.includes('admin');
    const isModerator = roles.includes('moderator');

    // 5. GENERAR SESIÓN JWT
    const token = generateToken({
      userId,
      email,
      username,
      isAdmin,
      isModerator,
      roles,
    });

    const sessionUser = {
      id: userId,
      email,
      username,
      displayName: display_name || username,
      avatarUrl: avatar_url,
      level,
      points,
      isAdmin,
      isModerator,
      roles,
    };

    // 6. CREAR RESPUESTA CON COOKIE DE SESIÓN
    const response = NextResponse.json(
      { 
        success: true,
        user: sessionUser 
      },
      { status: 200 }
    );

    // Establecer cookie de sesión
    response.cookies.set('chirisu_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Error en verify 2FA:', error);
    return NextResponse.json(
      { error: 'Error verificando código 2FA' },
      { status: 500 }
    );
  }
}
