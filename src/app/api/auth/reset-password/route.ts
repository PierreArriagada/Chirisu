/**
 * ========================================
 * API ROUTE: RESET PASSWORD
 * POST /api/auth/reset-password
 * ========================================
 * 
 * FLUJO:
 * 1. Recibe token y nueva contraseña
 * 2. Verifica token (existencia, expiración, uso)
 * 3. Hash de nueva contraseña con bcrypt
 * 4. Actualiza contraseña en BD
 * 5. Marca token como usado
 * 6. Envía email de confirmación
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '@/lib/email';

// ============================================
// TIPOS
// ============================================

interface ResetPasswordBody {
  token: string;
  password: string;
}

// ============================================
// ENDPOINT: POST /api/auth/reset-password
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. PARSEAR REQUEST BODY
    const body: ResetPasswordBody = await request.json();
    const { token, password } = body;

    // Validación básica
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // 2. BUSCAR Y VERIFICAR TOKEN
    const tokenQuery = await db.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, prt.used,
              u.email, u.username
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1`,
      [token]
    );

    if (tokenQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }

    const resetToken = tokenQuery.rows[0];

    // Verificar si el token ya fue usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Este token ya fue utilizado' },
        { status: 400 }
      );
    }

    // Verificar si el token expiró
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'El token ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // 3. HASH DE NUEVA CONTRASEÑA
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. ACTUALIZAR CONTRASEÑA EN BD
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // 5. MARCAR TOKEN COMO USADO
    await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    // 6. ENVIAR EMAIL DE CONFIRMACIÓN
    await sendPasswordChangedEmail(resetToken.email, resetToken.username);

    return NextResponse.json(
      { message: 'Contraseña actualizada exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
