import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * ============================================
 * API ENDPOINT: PATCH /api/comments/[id]
 * ============================================
 * 
 * Edita un comentario existente
 * Solo el autor o admin/moderador pueden editar
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);
    const body = await request.json();
    const { content, is_spoiler, images } = body;

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'ID de comentario inválido' },
        { status: 400 }
      );
    }

    // Verificar que el comentario existe y obtener el user_id
    const commentCheck = await pool.query(
      `SELECT user_id FROM app.comments WHERE id = $1 AND deleted_at IS NULL`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    const commentOwnerId = commentCheck.rows[0].user_id;

    // Verificar permisos: debe ser el autor, admin o moderador
    if (commentOwnerId !== currentUser.userId && !currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar este comentario' },
        { status: 403 }
      );
    }

    // Validaciones
    if (content !== undefined) {
      if (content.trim().length === 0) {
        return NextResponse.json(
          { error: 'El contenido no puede estar vacío' },
          { status: 400 }
        );
      }

      if (content.length > 5000) {
        return NextResponse.json(
          { error: 'El comentario no puede exceder 5000 caracteres' },
          { status: 400 }
        );
      }
    }

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length > 4) {
        return NextResponse.json(
          { error: 'Máximo 4 imágenes permitidas' },
          { status: 400 }
        );
      }
    }

    // Construir query de actualización dinámica
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (content !== undefined) {
      updates.push(`content = $${paramCount}`);
      values.push(content.trim());
      paramCount++;
    }

    if (is_spoiler !== undefined) {
      updates.push(`is_spoiler = $${paramCount}`);
      values.push(is_spoiler);
      paramCount++;
    }

    if (images !== undefined) {
      updates.push(`images = $${paramCount}`);
      values.push(JSON.stringify(images));
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(commentId);

    const query = `
      UPDATE app.comments 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    await pool.query(query, values);

    return NextResponse.json({
      success: true,
      message: 'Comentario actualizado exitosamente',
    });

  } catch (error: any) {
    console.error('Error en PATCH /api/comments/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al actualizar comentario',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================
 * API ENDPOINT: DELETE /api/comments/[id]
 * ============================================
 * 
 * Elimina un comentario (soft delete)
 * Solo el autor o admin/moderador pueden eliminar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: 'ID de comentario inválido' },
        { status: 400 }
      );
    }

    // Verificar que el comentario existe y obtener el user_id
    const commentCheck = await pool.query(
      `SELECT user_id FROM app.comments WHERE id = $1 AND deleted_at IS NULL`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    const commentOwnerId = commentCheck.rows[0].user_id;

    // Verificar permisos: debe ser el autor, admin o moderador
    if (commentOwnerId !== currentUser.userId && !currentUser.isAdmin && !currentUser.isModerator) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este comentario' },
        { status: 403 }
      );
    }

    // Soft delete
    await pool.query(
      `UPDATE app.comments 
       SET deleted_at = NOW() 
       WHERE id = $1`,
      [commentId]
    );

    console.log(`🗑️ Comentario eliminado: ID ${commentId}, Usuario: ${currentUser.userId}`);

    return NextResponse.json({
      success: true,
      message: 'Comentario eliminado exitosamente',
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/comments/[id]:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al eliminar comentario',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
