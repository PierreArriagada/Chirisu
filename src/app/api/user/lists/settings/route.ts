/**
 * API Route: /api/user/lists/settings
 * Método: PATCH
 * 
 * Descripción:
 * Actualiza la configuración de privacidad de las listas predefinidas del usuario
 * (Viendo, Pendiente, Completado, etc.). Las listas predefinidas tienen configuración
 * en una tabla separada que controla su privacidad.
 * 
 * Cambios en BD:
 * - UPDATE app.lists SET is_public = $1 
 *   WHERE user_id = $2 AND name = $3 AND is_default = TRUE
 * 
 * Seguridad:
 * - Requiere autenticación (x-user-id header)
 * - Solo puede actualizar sus propias listas predefinidas
 * - Valida que el nombre de lista sea válido
 * 
 * Request Body:
 * {
 *   "listName": string,  // 'pending' | 'following' | 'watched' | 'favorites'
 *   "isPublic": boolean
 * }
 * 
 * Responses:
 * - 200: Configuración actualizada
 * - 400: Datos inválidos
 * - 401: No autenticado
 * - 404: Lista no encontrada
 * - 500: Error del servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

// Mapeo de nombres internos a nombres de lista en la BD
const LIST_NAME_MAP: Record<string, string> = {
  'pending': 'Por ver',
  'following': 'Siguiendo',
  'watched': 'Completado',
  'favorites': 'Favoritos'
};

export async function PATCH(request: NextRequest) {
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

    const { listName, isPublic } = await request.json();

    // Validar listName
    if (!listName || !LIST_NAME_MAP[listName]) {
      return NextResponse.json(
        { 
          success: false, 
          error: `El nombre de lista debe ser uno de: ${Object.keys(LIST_NAME_MAP).join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validar isPublic
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo isPublic debe ser true o false' },
        { status: 400 }
      );
    }

    const dbListName = LIST_NAME_MAP[listName];

    // Actualizar la privacidad de la lista predefinida
    const updateQuery = `
      UPDATE app.lists 
      SET 
        is_public = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 
        AND name = $3
        AND is_default = TRUE
      RETURNING id, name, is_public;
    `;

    const result = await pool.query(updateQuery, [isPublic, userId, dbListName]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Lista predefinida "${dbListName}" no encontrada para el usuario` 
        },
        { status: 404 }
      );
    }

    const updatedList = result.rows[0];

    console.log(`✅ Lista predefinida "${dbListName}" actualizada: is_public = ${isPublic} (usuario ${userId})`);

    return NextResponse.json({
      success: true,
      message: isPublic 
        ? `Lista "${dbListName}" ahora es pública`
        : `Lista "${dbListName}" ahora es privada`,
      list: {
        id: updatedList.id,
        name: updatedList.name,
        isPublic: updatedList.is_public
      }
    });

  } catch (error) {
    console.error('❌ Error en PATCH /api/user/lists/settings:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración de la lista' },
      { status: 500 }
    );
  }
}
