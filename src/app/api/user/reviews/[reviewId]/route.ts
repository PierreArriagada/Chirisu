import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para operaciones individuales en reviews
 * 
 * PUT /api/user/reviews/[reviewId]
 * - Body: { content, overallScore }
 * - Actualiza una review existente
 * 
 * DELETE /api/user/reviews/[reviewId]
 * - Elimina (soft delete) una review
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { content, overallScore, userId } = body;

    if (!content || !overallScore) {
      return NextResponse.json(
        { error: 'content y overallScore son requeridos' },
        { status: 400 }
      );
    }

    // Validar que overallScore esté entre 1 y 10
    if (overallScore < 1 || overallScore > 10) {
      return NextResponse.json(
        { error: 'overallScore debe estar entre 1 y 10' },
        { status: 400 }
      );
    }

    // Verificar que la review existe y pertenece al usuario
    const reviewResult = await pool.query(
      `SELECT user_id FROM app.reviews WHERE id = $1 AND deleted_at IS NULL`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    const review = reviewResult.rows[0];

    if (userId && review.user_id.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta review' },
        { status: 403 }
      );
    }

    // Actualizar la review
    const updateResult = await pool.query(`
      UPDATE app.reviews 
      SET content = $1, overall_score = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, updated_at
    `, [content, overallScore, reviewId]);

    console.log(`✅ Review actualizada: ID ${reviewId}`);
    console.log(`🎯 Los triggers actualizarán automáticamente average_score y ranking`);

    return NextResponse.json({
      success: true,
      review: {
        id: reviewId,
        content,
        overallScore,
        updatedAt: updateResult.rows[0].updated_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en PUT /api/user/reviews/[reviewId]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const body = await request.json();
    const { userId } = body;

    // Verificar que la review existe y pertenece al usuario
    const reviewResult = await pool.query(
      `SELECT user_id FROM app.reviews WHERE id = $1 AND deleted_at IS NULL`,
      [reviewId]
    );

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Review no encontrada' },
        { status: 404 }
      );
    }

    const review = reviewResult.rows[0];

    if (userId && review.user_id.toString() !== userId.toString()) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta review' },
        { status: 403 }
      );
    }

    // Soft delete
    await pool.query(
      `UPDATE app.reviews SET deleted_at = NOW() WHERE id = $1`,
      [reviewId]
    );

    console.log(`✅ Review eliminada (soft delete): ID ${reviewId}`);
    console.log(`🎯 Los triggers actualizarán automáticamente average_score y ranking`);

    return NextResponse.json({
      success: true,
      message: 'Review eliminada correctamente',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/user/reviews/[reviewId]:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
