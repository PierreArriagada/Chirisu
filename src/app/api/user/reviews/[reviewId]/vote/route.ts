import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para votar en reviews
 * 
 * POST /api/user/reviews/[reviewId]/vote
 * - Body: { userId, voteType: 'helpful' | 'not_helpful' }
 * - Marca una review como útil o no útil
 * 
 * DELETE /api/user/reviews/[reviewId]/vote
 * - Body: { userId }
 * - Elimina el voto del usuario en esta review
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params;
    const body = await request.json();
    const { userId, voteType } = body;

    if (!userId || !voteType) {
      return NextResponse.json(
        { error: 'userId y voteType son requeridos' },
        { status: 400 }
      );
    }

    if (voteType !== 'helpful' && voteType !== 'not_helpful') {
      return NextResponse.json(
        { error: 'voteType debe ser helpful o not_helpful' },
        { status: 400 }
      );
    }

    // Verificar que la review existe
    const reviewResult = await pool.query(
      `SELECT id, user_id FROM app.reviews WHERE id = $1 AND deleted_at IS NULL`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    // No permitir votar en tu propia review
    if (reviewResult.rows[0].user_id.toString() === userId.toString()) {
      return NextResponse.json(
        { error: 'No puedes votar en tu propia review' },
        { status: 400 }
      );
    }

    // Verificar si ya votó
    const existingVoteResult = await pool.query(
      `SELECT vote_type FROM app.review_votes WHERE review_id = $1 AND user_id = $2`,
      [reviewId, userId]
    );

    if (existingVoteResult.rows.length > 0) {
      // Ya votó, actualizar el voto
      await pool.query(
        `UPDATE app.review_votes SET vote_type = $1 WHERE review_id = $2 AND user_id = $3`,
        [voteType, reviewId, userId]
      );

      // Recalcular helpful_votes
      const votesResult = await pool.query(
        `SELECT COUNT(*) as count FROM app.review_votes 
         WHERE review_id = $1 AND vote_type = 'helpful'`,
        [reviewId]
      );

      const helpfulCount = parseInt(votesResult.rows[0].count);

      await pool.query(
        `UPDATE app.reviews SET helpful_votes = $1 WHERE id = $2`,
        [helpfulCount, reviewId]
      );

      console.log(`✅ Voto actualizado en review ${reviewId} por usuario ${userId}: ${voteType}`);
    } else {
      // Nuevo voto
      await pool.query(
        `INSERT INTO app.review_votes (review_id, user_id, vote_type)
         VALUES ($1, $2, $3)`,
        [reviewId, userId, voteType]
      );

      // Recalcular helpful_votes
      const votesResult = await pool.query(
        `SELECT COUNT(*) as count FROM app.review_votes 
         WHERE review_id = $1 AND vote_type = 'helpful'`,
        [reviewId]
      );

      const helpfulCount = parseInt(votesResult.rows[0].count);

      await pool.query(
        `UPDATE app.reviews SET helpful_votes = $1 WHERE id = $2`,
        [helpfulCount, reviewId]
      );

      console.log(`✅ Nuevo voto en review ${reviewId} por usuario ${userId}: ${voteType}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Voto registrado correctamente',
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/reviews/[reviewId]/vote:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const { reviewId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Eliminar el voto
    const deleteResult = await pool.query(
      `DELETE FROM app.review_votes WHERE review_id = $1 AND user_id = $2`,
      [reviewId, userId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'No se encontró tu voto en esta review' },
        { status: 404 }
      );
    }

    // Recalcular helpful_votes
    const votesResult = await pool.query(
      `SELECT COUNT(*) as count FROM app.review_votes 
       WHERE review_id = $1 AND vote_type = 'helpful'`,
      [reviewId]
    );

    const helpfulCount = parseInt(votesResult.rows[0].count);

    await pool.query(
      `UPDATE app.reviews SET helpful_votes = $1 WHERE id = $2`,
      [helpfulCount, reviewId]
    );

    console.log(`✅ Voto eliminado de review ${reviewId} por usuario ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Voto eliminado correctamente',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/user/reviews/[reviewId]/vote:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
