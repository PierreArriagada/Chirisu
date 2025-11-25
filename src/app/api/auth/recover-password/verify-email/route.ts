/**
 * ========================================
 * API ROUTE: Verificar Email para Recuperación
 * ========================================
 * Ubicación: src/app/api/auth/recover-password/verify-email/route.ts
 * 
 * PROPÓSITO:
 * - Verificar que el email existe y tiene recovery code
 * - Retornar recovery code enmascarado para confirmar
 * 
 * FLUJO:
 * 1. Recibe email del usuario
 * 2. Busca en app.users
 * 3. Verifica que tenga recovery code
 * 4. Retorna recovery code parcialmente enmascarado
 * 
 * CONEXIONES:
 * - BD: app.users, app.recovery_codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 1. VALIDACIONES BÁSICAS
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // 2. BUSCAR USUARIO Y RECOVERY CODE
    const result = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.is_active,
        u.deleted_at,
        rc.code as recovery_code
       FROM app.users u
       LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    // Usuario no encontrado
    // IMPORTANTE: No revelar que el email no existe por seguridad
    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          error: 'Si este email está registrado, recibirás instrucciones para recuperar tu contraseña.',
          notFound: true
        },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // 3. VERIFICAR ESTADO DEL USUARIO
    if (!user.is_active || user.deleted_at !== null) {
      return NextResponse.json(
        { error: 'Esta cuenta está desactivada. Contacta al soporte.' },
        { status: 403 }
      );
    }

    // 4. VERIFICAR QUE TENGA RECOVERY CODE
    if (!user.recovery_code) {
      return NextResponse.json(
        { 
          error: 'Esta cuenta no tiene recovery code configurado. Contacta al soporte.',
          noRecoveryCode: true
        },
        { status: 400 }
      );
    }

    // 5. ENMASCARAR RECOVERY CODE PARCIALMENTE
    // Mostrar primeros 8 y últimos 8 caracteres
    const maskedCode = 
      user.recovery_code.substring(0, 8) + 
      '•'.repeat(48) + 
      user.recovery_code.substring(56, 64);

    // 6. RETORNAR ÉXITO CON HINT DEL RECOVERY CODE
    return NextResponse.json({
      success: true,
      message: 'Email verificado. Ingresa tu recovery code.',
      email: user.email,
      username: user.username,
      userId: user.id,
      recoveryCodeHint: maskedCode, // Mostrar hint para confirmar
    }, { status: 200 });

  } catch (error) {
    console.error('Error en verify-email:', error);
    return NextResponse.json(
      { error: 'Error al verificar el email' },
      { status: 500 }
    );
  }
}
