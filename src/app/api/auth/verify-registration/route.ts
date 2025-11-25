/**
 * ========================================
 * API ROUTE: Verify Registration 2FA
 * ========================================
 * Ubicación: src/app/api/auth/verify-registration/route.ts
 * 
 * PROPÓSITO:
 * - Verificar código A2F durante el registro
 * - Activar cuenta solo después de verificar A2F
 * 
 * FLUJO:
 * 1. Recibe: userId, código de 6 dígitos
 * 2. Busca secret de A2F del usuario
 * 3. Verifica código con speakeasy
 * 4. Si válido:
 *    - Marca user_2fa.enabled = true
 *    - Marca users.has_2fa_setup = true
 *    - Genera sesión JWT
 * 5. Retorna sesión completa
 * 
 * CONEXIONES:
 * - BD: UPDATE en user_2fa, users
 * - lib/two-factor.ts: verifyToken()
 * - lib/auth.ts: setSessionCookie()
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { verifyToken } from '@/lib/two-factor';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Buscar configuración de A2F del usuario
    const twoFactorResult = await pool.query(
      'SELECT secret, enabled FROM app.user_2fa WHERE user_id = $1',
      [userId]
    );

    if (twoFactorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Configuración de A2F no encontrada' },
        { status: 404 }
      );
    }

    const { secret, enabled } = twoFactorResult.rows[0];

    // Si ya está habilitado, obtener usuario y crear sesión directamente
    if (enabled) {
      // Obtener datos del usuario
      const userResult = await pool.query(
        `SELECT u.id, u.username, u.email, u.avatar_url,
                COALESCE(r.name, 'user') as role
         FROM app.users u
         LEFT JOIN app.user_roles ur ON ur.user_id = u.id
         LEFT JOIN app.roles r ON r.id = ur.role_id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      const user = userResult.rows[0];

      // Generar token JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.role === 'admin',
        isModerator: user.role === 'moderator',
      });

      // Crear respuesta con cookie de sesión
      const response = NextResponse.json(
        {
          message: 'La cuenta ya está activada. Redirigiendo...',
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatar_url,
          },
          alreadyActivated: true,
        },
        { status: 200 }
      );

      // Establecer cookie de sesión
      response.cookies.set('chirisu_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 días
        path: '/',
      });

      return response;
    }

    // Verificar código TOTP
    const verification = verifyToken(secret, code);

    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Código inválido. Verifica e intenta de nuevo.' },
        { status: 401 }
      );
    }

    // ✅ Código válido - Activar cuenta

    // 1. Activar A2F con timestamp
    await pool.query(
      'UPDATE app.user_2fa SET enabled = true, enabled_at = NOW() WHERE user_id = $1',
      [userId]
    );

    // 2. Marcar que el usuario tiene 2FA configurado
    await pool.query(
      'UPDATE app.users SET has_2fa_setup = true WHERE id = $1',
      [userId]
    );

    // 3. Obtener datos completos del usuario para crear sesión (con rol)
    const userResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.avatar_url,
              COALESCE(r.name, 'user') as role
       FROM app.users u
       LEFT JOIN app.user_roles ur ON ur.user_id = u.id
       LEFT JOIN app.roles r ON r.id = ur.role_id
       WHERE u.id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    // 4. Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.role === 'admin',
      isModerator: user.role === 'moderator',
    });

    // 5. Crear respuesta con cookie de sesión
    const response = NextResponse.json(
      {
        message: '¡Cuenta activada exitosamente!',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url,
        },
      },
      { status: 200 }
    );

    // Establecer cookie de sesión
    response.cookies.set('chirisu_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 días
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en verificación de registro:', error);
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    );
  }
}
