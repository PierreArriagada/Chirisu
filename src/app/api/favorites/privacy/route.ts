/**
 * API Route: /api/favorites/privacy
 * Método: PATCH
 * 
 * Descripción:
 * Actualiza la configuración de privacidad de favoritos de personas (personajes, actores, staff).
 * Puede actualizar la privacidad de todos los favoritos de un tipo específico o todos juntos.
 * 
 * Cambios en BD:
 * - UPDATE app.user_favorites SET is_public = $1 
 *   WHERE user_id = $2 AND favorable_type = $3 (si se especifica tipo)
 * - UPDATE app.user_favorites SET is_public = $1 
 *   WHERE user_id = $2 (si no se especifica tipo, actualiza todos)
 * 
 * Seguridad:
 * - Requiere autenticación (verifica userId en headers)
 * - Solo actualiza favoritos del usuario autenticado
 * - Valida tipos permitidos: 'character', 'voice_actor', 'staff'
 * 
 * Request Body:
 * {
 *   "isPublic": boolean,              // true = público, false = privado
 *   "favorableType"?: string          // opcional: 'character' | 'voice_actor' | 'staff'
 * }
 * 
 * Si favorableType no se proporciona, actualiza TODOS los favoritos de personas
 * 
 * Responses:
 * - 200: Privacidad actualizada exitosamente
 * - 400: Datos inválidos
 * - 401: No autenticado
 * - 500: Error del servidor
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

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

    const { isPublic, favorableType } = await request.json();

    // Validar que isPublic sea booleano
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'El campo isPublic debe ser true o false' },
        { status: 400 }
      );
    }

    // Validar tipo si se proporciona
    const validTypes = ['character', 'voice_actor', 'staff'];
    if (favorableType && !validTypes.includes(favorableType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `El tipo debe ser uno de: ${validTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    let updateQuery: string;
    let queryParams: any[];
    let affectedType: string;

    if (favorableType) {
      // Actualizar solo un tipo específico
      updateQuery = `
        UPDATE app.user_favorites 
        SET is_public = $1
        WHERE user_id = $2 
          AND favorable_type = $3
        RETURNING id;
      `;
      queryParams = [isPublic, userId, favorableType];
      affectedType = favorableType;
    } else {
      // Actualizar todos los tipos de favoritos de personas
      updateQuery = `
        UPDATE app.user_favorites 
        SET is_public = $1
        WHERE user_id = $2
          AND favorable_type IN ('character', 'voice_actor', 'staff')
        RETURNING id;
      `;
      queryParams = [isPublic, userId];
      affectedType = 'todos los tipos';
    }

    const result = await pool.query(updateQuery, queryParams);
    const updatedCount = result.rows.length;

    const typeLabel = favorableType === 'character' ? 'personajes' 
                    : favorableType === 'voice_actor' ? 'actores de voz'
                    : favorableType === 'staff' ? 'staff'
                    : 'favoritos de personas';

    console.log(`✅ Privacidad actualizada: ${updatedCount} ${typeLabel} ahora son ${isPublic ? 'públicos' : 'privados'} (usuario ${userId})`);

    return NextResponse.json({
      success: true,
      message: isPublic 
        ? `${updatedCount} ${typeLabel} ahora son públicos`
        : `${updatedCount} ${typeLabel} ahora son privados`,
      updatedCount,
      isPublic,
      favorableType: favorableType || 'all'
    });

  } catch (error) {
    console.error('❌ Error en PATCH /api/favorites/privacy:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar privacidad de favoritos' },
      { status: 500 }
    );
  }
}
