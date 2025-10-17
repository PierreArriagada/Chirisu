import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API de Reviews (Reseñas)
 * 
 * GET /api/user/reviews?userId={id}
 * - Obtiene todas las reviews del usuario
 * 
 * GET /api/user/reviews?reviewableType={type}&reviewableId={id}
 * - Obtiene todas las reviews de un anime/manga/novel específico
 * 
 * POST /api/user/reviews
 * - Body: { userId, reviewableType, reviewableId, content, overallScore }
 * - Crea una nueva review (solo si el item está en una lista del usuario)
 * 
 * PUT /api/user/reviews/{reviewId}
 * - Body: { content, overallScore }
 * - Actualiza una review existente
 * 
 * DELETE /api/user/reviews/{reviewId}
 * - Elimina una review
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const reviewableType = searchParams.get('reviewableType');
    const reviewableId = searchParams.get('reviewableId');

    if (userId) {
      // Obtener todas las reviews del usuario con datos enriquecidos
      const reviewsResult = await pool.query(`
        SELECT 
          r.id,
          r.user_id,
          r.reviewable_type,
          r.reviewable_id,
          r.content,
          r.overall_score,
          r.helpful_votes,
          r.created_at,
          r.updated_at,
          u.username,
          u.display_name,
          u.avatar_url,
          CASE 
            WHEN r.reviewable_type = 'anime' THEN a.title_romaji
            WHEN r.reviewable_type = 'manga' THEN m.title_romaji
            WHEN r.reviewable_type = 'novel' THEN n.title_romaji
          END as media_title,
          CASE 
            WHEN r.reviewable_type = 'anime' THEN a.cover_image_url
            WHEN r.reviewable_type = 'manga' THEN m.cover_image_url
            WHEN r.reviewable_type = 'novel' THEN n.cover_image_url
          END as media_cover,
          CASE 
            WHEN r.reviewable_type = 'anime' THEN a.slug
            WHEN r.reviewable_type = 'manga' THEN m.slug
            WHEN r.reviewable_type = 'novel' THEN n.slug
          END as media_slug
        FROM app.reviews r
        LEFT JOIN app.users u ON r.user_id = u.id
        LEFT JOIN app.anime a ON r.reviewable_type = 'anime' AND r.reviewable_id = a.id
        LEFT JOIN app.manga m ON r.reviewable_type = 'manga' AND r.reviewable_id = m.id
        LEFT JOIN app.novels n ON r.reviewable_type = 'novel' AND r.reviewable_id = n.id
        WHERE r.user_id = $1 AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
      `, [userId]);

      const reviews = reviewsResult.rows.map(row => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        reviewableType: row.reviewable_type,
        reviewableId: row.reviewable_id.toString(),
        content: row.content,
        overallScore: row.overall_score,
        helpfulVotes: row.helpful_votes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
        },
        media: {
          title: row.media_title,
          cover: row.media_cover,
          slug: row.media_slug,
        },
      }));

      return NextResponse.json({
        success: true,
        reviews,
      });
    } else if (reviewableType && reviewableId) {
      // Obtener todas las reviews de un media específico
      const normalizedType = reviewableType.toLowerCase();
      
      const reviewsResult = await pool.query(`
        SELECT 
          r.id,
          r.user_id,
          r.content,
          r.overall_score,
          r.helpful_votes,
          r.created_at,
          r.updated_at,
          u.username,
          u.display_name,
          u.avatar_url
        FROM app.reviews r
        LEFT JOIN app.users u ON r.user_id = u.id
        WHERE r.reviewable_type = $1 
          AND r.reviewable_id = $2 
          AND r.deleted_at IS NULL
        ORDER BY r.helpful_votes DESC, r.created_at DESC
      `, [normalizedType, reviewableId]);

      const reviews = reviewsResult.rows.map(row => ({
        id: row.id.toString(),
        userId: row.user_id.toString(),
        content: row.content,
        overallScore: row.overall_score,
        helpfulVotes: row.helpful_votes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: {
          username: row.username,
          displayName: row.display_name,
          avatarUrl: row.avatar_url,
        },
      }));

      return NextResponse.json({
        success: true,
        reviews,
      });
    } else {
      return NextResponse.json(
        { error: 'userId o reviewableType+reviewableId son requeridos' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ Error en GET /api/user/reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reviewableType, reviewableId, content, overallScore } = body;

    if (!userId || !reviewableType || !reviewableId || !content || !overallScore) {
      return NextResponse.json(
        { error: 'userId, reviewableType, reviewableId, content y overallScore son requeridos' },
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

    const validTypes = ['anime', 'manga', 'novel'];
    const normalizedType = reviewableType.toLowerCase();
    
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        { error: 'reviewableType debe ser anime, manga o novel' },
        { status: 400 }
      );
    }

    // Verificar que el item esté en alguna lista del usuario
    const inListResult = await pool.query(`
      SELECT li.id 
      FROM app.list_items li
      JOIN app.lists l ON li.list_id = l.id
      WHERE l.user_id = $1 
        AND li.listable_type = $2 
        AND li.listable_id = $3
      LIMIT 1
    `, [userId, normalizedType, reviewableId]);

    if (inListResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Solo puedes escribir una reseña de títulos que estén en tus listas' },
        { status: 403 }
      );
    }

    // Verificar que no exista ya una review de este usuario para este item
    const existsResult = await pool.query(`
      SELECT id FROM app.reviews 
      WHERE user_id = $1 
        AND reviewable_type = $2 
        AND reviewable_id = $3
        AND deleted_at IS NULL
    `, [userId, normalizedType, reviewableId]);

    if (existsResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya has escrito una reseña para este título. Puedes editarla en su lugar.' },
        { status: 400 }
      );
    }

    // Crear la review
    const insertResult = await pool.query(`
      INSERT INTO app.reviews 
      (user_id, reviewable_type, reviewable_id, content, overall_score)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at, updated_at
    `, [userId, normalizedType, reviewableId, content, overallScore]);

    const newReview = insertResult.rows[0];

    console.log(`✅ Review creada: ID ${newReview.id} para ${normalizedType} ${reviewableId} por usuario ${userId}`);
    console.log(`🎯 Los triggers actualizarán automáticamente average_score, ratings_count y ranking`);

    return NextResponse.json({
      success: true,
      review: {
        id: newReview.id.toString(),
        userId,
        reviewableType: normalizedType,
        reviewableId,
        content,
        overallScore,
        helpfulVotes: 0,
        createdAt: newReview.created_at,
        updatedAt: newReview.updated_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
