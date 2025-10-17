import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

type RouteParams = {
  params: Promise<{
    listId: string;
    itemId: string;
  }>;
};

/**
 * DELETE /api/user/lists/[listId]/items/[itemId]
 * 
 * Elimina un item de una lista específica del usuario
 * 
 * Seguridad:
 * - Requiere autenticación (getCurrentUser)
 * - Solo el dueño de la lista puede eliminar items
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;
    const { listId, itemId } = await params;

    // Validar parámetros
    if (!listId || !itemId) {
      return NextResponse.json(
        { error: 'listId e itemId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la lista pertenece al usuario
    const listCheck = await pool.query(`
      SELECT id FROM app.lists
      WHERE id = $1 AND user_id = $2
    `, [parseInt(listId), userId]);

    if (listCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lista no encontrada o sin permisos' },
        { status: 404 }
      );
    }

    // Eliminar el item de la lista
    const result = await pool.query(`
      DELETE FROM app.list_items
      WHERE list_id = $1 AND id = $2
      RETURNING id, listable_type, listable_id
    `, [parseInt(listId), parseInt(itemId)]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item no encontrado en la lista' },
        { status: 404 }
      );
    }

    const deletedItem = result.rows[0];

    // Decrementar contador en la tabla correspondiente
    const tableMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'dougua': 'dougua',
      'fan_comic': 'fan_comics'
    };

    const tableName = tableMap[deletedItem.listable_type];
    
    if (tableName) {
      await pool.query(`
        UPDATE app.${tableName}
        SET lists_count = GREATEST(lists_count - 1, 0)
        WHERE id = $1
      `, [deletedItem.listable_id]);
    }

    console.log(`✅ Item ${itemId} eliminado de lista ${listId} (usuario ${userId})`);

    return NextResponse.json({
      success: true,
      message: 'Item eliminado de la lista correctamente'
    });

  } catch (error) {
    console.error('❌ Error en DELETE /api/user/lists/[listId]/items/[itemId]:', error);
    return NextResponse.json(
      { error: 'Error al eliminar item de la lista' },
      { status: 500 }
    );
  }
}
