/**
 * ========================================
 * API ROUTE: DEBUG AUTH
 * ========================================
 * 
 * GET /api/debug/auth
 * - Muestra información de autenticación actual
 */

import 'server-only';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'No hay token de sesión',
      });
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({
        authenticated: false,
        message: 'Token inválido o expirado',
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
        isAdmin: payload.isAdmin,
        isModerator: payload.isModerator,
        roles: payload.roles,
      },
    });

  } catch (error) {
    console.error('❌ Error en GET /api/debug/auth:', error);
    return NextResponse.json(
      { error: 'Error al verificar autenticación' },
      { status: 500 }
    );
  }
}
