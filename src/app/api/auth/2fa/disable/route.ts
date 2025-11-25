/**
 * ========================================
 * API ROUTE: DISABLE 2FA
 * POST /api/auth/2fa/disable
 * ========================================
 * 
 * FLUJO:
 * 1. Verifica autenticación
 * 2. Recibe contraseña actual para confirmar
 * 3. Desactiva 2FA en la base de datos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, verifyPassword } from '@/lib/auth';
import { db } from '@/lib/database';

// ============================================
// TIPOS
// ============================================

interface Disable2FABody {
  password: string; // Contraseña actual para confirmar
}

// ============================================
// ENDPOINT: POST /api/auth/2fa/disable
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
    const body: Disable2FABody = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Contraseña es requerida' },
        { status: 400 }
      );
    }

    // 3. OBTENER USUARIO Y VERIFICAR CONTRASEÑA
    const userQuery = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [sessionUser.id]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const isPasswordValid = await verifyPassword(password, userQuery.rows[0].password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // 4. DESACTIVAR 2FA
    await db.query(
      'UPDATE user_2fa SET enabled = false WHERE user_id = $1',
      [sessionUser.id]
    );

    return NextResponse.json(
      { message: '2FA desactivado exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en disable 2FA:', error);
    return NextResponse.json(
      { error: 'Error desactivando 2FA' },
      { status: 500 }
    );
  }
}
