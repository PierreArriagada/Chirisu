/**
 * API: /api/reviews/[id]/report
 * 
 * POST - Reportar una reseña
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const { reason, comments } = await request.json();

    // Obtener usuario autenticado desde el token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    console.log('🔍 Report Review - Token check:', {
      hasToken: !!token,
      cookies: cookieStore.getAll().map(c => c.name)
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      userId = decoded.userId;
      console.log('✅ Report Review - User authenticated:', userId);
    } catch (error) {
      console.error('❌ Report Review - Token verification failed:', error);
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Validaciones
    if (!reason) {
      return NextResponse.json(
        { error: 'La razón del reporte es requerida' },
        { status: 400 }
      );
    }

    const validReasons = [
      'spam',
      'offensive_language',
      'harassment',
      'spoilers',
      'irrelevant_content',
      'misinformation',
      'other',
    ];

    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Razón de reporte inválida' },
        { status: 400 }
      );
    }

    if (reason === 'other' && (!comments || comments.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Los comentarios son requeridos para "Otro motivo"' },
        { status: 400 }
      );
    }

    // Verificar que la reseña existe y obtener el ID del autor
    const reviewQuery = `
      SELECT id, user_id
      FROM app.reviews
      WHERE id = $1
    `;
    const reviewResult = await pool.query(reviewQuery, [reviewId]);

    if (reviewResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reseña no encontrada' },
        { status: 404 }
      );
    }

    const reportedUserId = reviewResult.rows[0].user_id;

    // No se puede reportar la propia reseña
    if (reportedUserId === userId) {
      return NextResponse.json(
        { error: 'No puedes reportar tu propia reseña' },
        { status: 400 }
      );
    }

    // Verificar si ya reportó esta reseña antes
    const existingReportQuery = `
      SELECT id 
      FROM app.review_reports 
      WHERE review_id = $1 AND reporter_user_id = $2
    `;
    const existingReport = await pool.query(existingReportQuery, [reviewId, userId]);

    if (existingReport.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya has reportado esta reseña anteriormente' },
        { status: 400 }
      );
    }

    // Crear el reporte
    const insertQuery = `
      INSERT INTO app.review_reports (
        review_id,
        reporter_user_id,
        reported_user_id,
        reason,
        comments,
        status
      ) VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      reviewId,
      userId,
      reportedUserId,
      reason,
      comments?.trim() || null,
    ]);

    const reportId = result.rows[0].id;

    // Notificar al autor de la reseña que fue reportada
    await pool.query(
      `INSERT INTO app.notifications (
        recipient_user_id,
        actor_user_id,
        action_type,
        notifiable_type,
        notifiable_id
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        reportedUserId,
        userId,
        'review_reported',
        'review_report',
        reportId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Reporte creado exitosamente',
      reportId,
    });

  } catch (error: any) {
    console.error('Error al crear reporte:', error);
    return NextResponse.json(
      { error: 'Error al procesar el reporte' },
      { status: 500 }
    );
  }
}
