/**
 * ========================================
 * API ROUTE: ENABLE 2FA
 * POST /api/auth/2fa/enable
 * ========================================
 * 
 * FLUJO:
 * 1. Verifica autenticación
 * 2. Recibe código de verificación
 * 3. Verifica que el código sea válido
 * 4. Activa 2FA en la base de datos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyToken } from '@/lib/two-factor';
import { db } from '@/lib/database';

// ============================================
// TIPOS
// ============================================

interface Enable2FABody {
  token: string; // Código de 6 dígitos del authenticator
}

// ============================================
// ENDPOINT: POST /api/auth/2fa/enable
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. VERIFICAR AUTENTICACIÓN
    const sessionUser = await getSessionUser(request);
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. PARSEAR REQUEST BODY
    const body: Enable2FABody = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token es requerido' },
        { status: 400 }
      );
    }

    // 3. OBTENER SECRET DE BD
    const result = await db.query(
      'SELECT secret, enabled FROM user_2fa WHERE user_id = $1',
      [sessionUser.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Primero debes configurar 2FA' },
        { status: 400 }
      );
    }

    const { secret, enabled } = result.rows[0];

    if (enabled) {
      return NextResponse.json(
        { error: '2FA ya está activado' },
        { status: 400 }
      );
    }

    // 4. VERIFICAR TOKEN
    const verification = verifyToken(secret, token);

    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }

    // 5. ACTIVAR 2FA
    await db.query(
      'UPDATE user_2fa SET enabled = true, enabled_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [sessionUser.id]
    );

    return NextResponse.json(
      { message: '2FA activado exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en enable 2FA:', error);
    return NextResponse.json(
      { error: 'Error activando 2FA' },
      { status: 500 }
    );
  }
}
