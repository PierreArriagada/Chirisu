/**
 * API: /api/reviews/[id]
 * 
 * PUT - Actualizar reseña (solo autor)
 * DELETE - Eliminar reseña (solo autor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

// PUT - Actualizar reseña
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const { content, overallScore, userId } = await request.json();

    // Validaciones
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'El contenido de la reseña es requerido' },
        { status: 400 }
      );
    }

    if (!overallScore || overallScore < 1 || overallScore > 10) {
      return NextResponse.json(
        { error: 'La puntuación debe estar entre 1 y 10' },
        { status: 400 }
      );
    }

    // Verificar que el usuario es el autor de la reseña
    const checkQuery = `
      SELECT user_id 
      FROM app.reviews 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [reviewId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    const reviewOwnerId = parseInt(checkResult.rows[0].user_id);
    const currentUserId = parseInt(userId);

    if (reviewOwnerId !== currentUserId) {
      console.log('🔍 PUT Review - Permission denied:', {
        reviewId,
        reviewOwnerId,
        currentUserId,
        match: reviewOwnerId === currentUserId
      });
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta reseña' },
        { status: 403 }
      );
    }

    // Actualizar la reseña
    const updateQuery = `
      UPDATE app.reviews
      SET 
        content = $1,
        overall_score = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const updateResult = await pool.query(updateQuery, [
      content.trim(),
      overallScore,
      reviewId,
    ]);

    return NextResponse.json({
      success: true,
      review: updateResult.rows[0],
    });

  } catch (error: any) {
    console.error('Error al actualizar reseña:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la reseña' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar reseña
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    
    // Obtener userId del header o query
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener roles del usuario
    const userRolesQuery = `
      SELECT r.name as role_name
      FROM app.user_roles ur
      JOIN app.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `;
    const userRolesResult = await pool.query(userRolesQuery, [userId]);
    const userRoles = userRolesResult.rows.map(row => row.role_name);
    const isAdmin = userRoles.includes('admin');
    const isModerator = userRoles.includes('moderator');

    // Verificar que el usuario es el autor de la reseña
    const checkQuery = `
      SELECT user_id 
      FROM app.reviews 
      WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [reviewId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    const reviewOwnerId = parseInt(checkResult.rows[0].user_id);
    const currentUserId = parseInt(userId);
    const isOwner = reviewOwnerId === currentUserId;
    const canDelete = isOwner || isAdmin || isModerator;

    console.log('🔍 DELETE Review Debug:', {
      reviewId,
      userId,
      currentUserId,
      reviewOwnerId,
      isOwner,
      isAdmin,
      isModerator,
      canDelete,
      userRoles
    });

    if (!canDelete) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta reseña' },
        { status: 403 }
      );
    }

    // Eliminar votos asociados primero
    await pool.query('DELETE FROM app.review_votes WHERE review_id = $1', [reviewId]);

    // Eliminar la reseña
    await pool.query('DELETE FROM app.reviews WHERE id = $1', [reviewId]);

    return NextResponse.json({
      success: true,
      message: 'Reseña eliminada correctamente',
    });

  } catch (error: any) {
    console.error('Error al eliminar reseña:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la reseña' },
      { status: 500 }
    );
  }
}
