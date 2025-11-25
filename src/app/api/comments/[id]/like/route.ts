import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * ============================================
 * API ENDPOINT: POST /api/comments/[id]/like
 * ============================================
 * 
 * Da like o quita like a un comentario
 */
export async function POST(
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

    // Verificar que el comentario existe
    const commentCheck = await pool.query(
      `SELECT id FROM app.comments WHERE id = $1 AND deleted_at IS NULL`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comentario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si ya existe el like
    const likeCheck = await pool.query(
      `SELECT * FROM app.comment_reactions 
       WHERE comment_id = $1 AND user_id = $2 AND reaction_type = 'like'`,
      [commentId, currentUser.userId]
    );

    if (likeCheck.rows.length > 0) {
      // Ya tiene like, quitarlo (unlike)
      await pool.query(
        `DELETE FROM app.comment_reactions 
         WHERE comment_id = $1 AND user_id = $2`,
        [commentId, currentUser.userId]
      );

      return NextResponse.json({
        success: true,
        action: 'unliked',
        message: 'Like eliminado',
      });
    } else {
      // No tiene like, agregarlo
      await pool.query(
        `INSERT INTO app.comment_reactions (comment_id, user_id, reaction_type)
         VALUES ($1, $2, 'like')`,
        [commentId, currentUser.userId]
      );

      return NextResponse.json({
        success: true,
        action: 'liked',
        message: 'Like agregado',
      });
    }

  } catch (error: any) {
    console.error('Error en POST /api/comments/[id]/like:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al procesar like',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
