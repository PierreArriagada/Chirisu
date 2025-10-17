/**
 * API Route: /api/lists/[listId]/privacy
 * Método: PATCH
 * 
 * Descripción:
 * Actualiza la configuración de privacidad (público/privado) de una lista específica.
 * Solo el propietario de la lista puede cambiar su privacidad.
 * 
 * Cambios en BD:
 * - UPDATE app.lists SET is_public = $1, updated_at = CURRENT_TIMESTAMP 
 *   WHERE id = $2 AND user_id = $3
 * 
 * Seguridad:
 * - Requiere autenticación (verifica session)
 * - Valida que la lista pertenezca al usuario autenticado
 * - Valida que isPublic sea un booleano válido
 * 
 * Request Body:
 * {
 *   "isPublic": boolean  // true = público, false = privado
 * }
 * 
 * Responses:
 * - 200: Privacidad actualizada exitosamente
 * - 400: Datos inválidos
 * - 401: No autenticado
 * - 404: Lista no encontrada o sin permisos
 * - 500: Error del servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    // Verificar autenticación usando JWT
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;

    const { listId } = await params;
    const { isPublic } = await request.json();

    // Validar que isPublic sea booleano
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo isPublic debe ser true o false' },
        { status: 400 }
      );
    }

    // Actualizar privacidad de la lista
    // Solo si la lista pertenece al usuario autenticado
    const updateQuery = `
      UPDATE app.lists 
      SET 
        is_public = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
        AND user_id = $3
      RETURNING id, name, is_public, updated_at;
    `;

    const result = await pool.query(updateQuery, [isPublic, parseInt(listId), userId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista no encontrada o sin permisos para modificarla' },
        { status: 404 }
      );
    }

    const updatedList = result.rows[0];

    console.log(`✅ Lista ${listId} actualizada: is_public = ${isPublic} por usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: isPublic 
        ? `Lista "${updatedList.name}" ahora es pública` 
        : `Lista "${updatedList.name}" ahora es privada`,
      list: {
        id: updatedList.id,
        name: updatedList.name,
        isPublic: updatedList.is_public,
        updatedAt: updatedList.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Error en PATCH /api/lists/[listId]/privacy:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar privacidad de la lista' },
      { status: 500 }
    );
  }
}
