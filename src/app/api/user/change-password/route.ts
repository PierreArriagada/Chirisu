import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';

/**
 * PATCH /api/user/change-password
 * Permite al usuario cambiar su contraseña
 */
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token y obtener userId
    const sessionResult = await db.query<{ user_id: number }>(
      `SELECT user_id FROM app.sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      );
    }

    const userId = sessionResult.rows[0].user_id;

    // Obtener datos del body
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas nuevas no coinciden' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      );
    }

    // Obtener usuario y verificar contraseña actual
    const userResult = await db.query<{ id: number; password_hash: string; email: string }>(
      `SELECT id, password_hash, email FROM app.users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await db.query(
      `UPDATE app.users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // Registrar en audit log
    await db.query(
      `INSERT INTO app.audit_log (user_id, action, resource_type, resource_id, new_values)
       VALUES ($1, 'change_password', 'user', $2, $3)`,
      [userId, userId, JSON.stringify({ timestamp: new Date().toISOString() })]
    );

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error en PATCH /api/user/change-password:', error);
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña', details: error.message },
      { status: 500 }
    );
  }
}
