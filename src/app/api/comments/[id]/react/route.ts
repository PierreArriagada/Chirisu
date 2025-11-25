import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/comments/[id]/react
 * Da like a un comentario o quita el like
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    const cookieStore = await cookies();
    const token = cookieStore.get('chirisu_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const commentId = parseInt(id);

    if (isNaN(commentId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que el comentario existe
    const commentCheck = await pool.query(
      `SELECT id FROM app.comments WHERE id = $1 AND deleted_at IS NULL`,
      [commentId]
    );

    if (commentCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }

    // Verificar si ya tiene like
    const existingReaction = await pool.query(
      `SELECT comment_id, user_id FROM app.comment_reactions 
       WHERE comment_id = $1 AND user_id = $2 AND reaction_type = 'like'`,
      [commentId, payload.userId]
    );

    let action: 'added' | 'removed';

    if (existingReaction.rows.length > 0) {
      // Quitar like
      await pool.query(
        `DELETE FROM app.comment_reactions 
         WHERE comment_id = $1 AND user_id = $2`,
        [commentId, payload.userId]
      );
      action = 'removed';
    } else {
      // Agregar like
      await pool.query(
        `INSERT INTO app.comment_reactions (comment_id, user_id, reaction_type) 
         VALUES ($1, $2, 'like')`,
        [commentId, payload.userId]
      );
      action = 'added';
    }

    // Obtener nuevo conteo
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM app.comment_reactions 
       WHERE comment_id = $1 AND reaction_type = 'like'`,
      [commentId]
    );

    return NextResponse.json({
      success: true,
      action,
      likesCount: parseInt(countResult.rows[0].count),
    });

  } catch (error: any) {
    console.error('Error en POST /api/comments/[id]/react:', error);
    return NextResponse.json(
      { error: 'Error al procesar reacción', details: error.message },
      { status: 500 }
    );
  }
}
