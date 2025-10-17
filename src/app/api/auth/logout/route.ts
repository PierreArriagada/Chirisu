/**
 * ========================================
 * API ROUTE: LOGOUT
 * POST /api/auth/logout
 * ========================================
 * 
 * Cierra la sesión eliminando la cookie.
 */

import { NextResponse } from 'next/server';
import { deleteSessionCookie, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/database';

export async function POST() {
  try {
    // Obtener usuario actual (antes de borrar cookie)
    const user = await getCurrentUser();

    // Eliminar cookie de sesión
    await deleteSessionCookie();

    // Registrar en audit log
    if (user) {
      await db.query(
        `INSERT INTO app.audit_log (user_id, action, resource_type)
         VALUES ($1, 'logout', 'auth')`,
        [user.userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/auth/logout:', error);
    
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
