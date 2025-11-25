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

    console.log(`🔍 DELETE request: listId=${listId}, itemId=${itemId}, userId=${userId}`);

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

    console.log(`📋 Lista check: encontradas=${listCheck.rows.length}, listId=${listId}, userId=${userId}`);

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

    console.log(`🗑️ Delete result: rows=${result.rows.length}, intentando eliminar itemId=${itemId} de listId=${listId}`);
    if (result.rows.length > 0) {
      console.log(`   Deleted:`, result.rows[0]);
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item no encontrado en la lista' },
        { status: 404 }
      );
    }

    const deletedItem = result.rows[0];

    // TODO: Decrementar contador lists_count cuando la columna exista en la BD
    // const tableMap: Record<string, string> = {
    //   'anime': 'anime',
    //   'manga': 'manga',
    //   'novel': 'novels',
    // };
    // const tableName = tableMap[deletedItem.listable_type];
    // if (tableName) {
    //   await pool.query(`UPDATE app.${tableName} SET lists_count = GREATEST(lists_count - 1, 0) WHERE id = $1`, [deletedItem.listable_id]);
    // }

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
