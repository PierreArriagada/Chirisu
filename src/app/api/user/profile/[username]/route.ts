/**
 * API: /api/user/profile/[username]
 * 
 * GET - Obtener perfil público de un usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username es requerido' },
        { status: 400 }
      );
    }

    // Obtener información pública del usuario
    const userQuery = `
      SELECT 
        u.id,
        u.username,
        u.tracking_id,
        u.display_name,
        u.avatar_url,
        u.bio,
        u.created_at,
        u.date_of_birth,
        COALESCE(r.name, 'user') as role
      FROM app.users u
      LEFT JOIN app.user_roles ur ON u.id = ur.user_id
      LEFT JOIN app.roles r ON ur.role_id = r.id
      WHERE u.username = $1
    `;

    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Obtener estadísticas de reviews
    const reviewStatsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_score)::numeric(10,1) as avg_score
      FROM app.reviews
      WHERE user_id = $1
    `;
    const reviewStats = await pool.query(reviewStatsQuery, [user.id]);

    // Obtener estadísticas de listas
    const listStatsQuery = `
      SELECT 
        COUNT(*) as total_lists,
        COUNT(*) FILTER (WHERE is_public = true) as public_lists
      FROM app.lists
      WHERE user_id = $1
    `;
    const listStats = await pool.query(listStatsQuery, [user.id]);

    // Obtener estadísticas de contribuciones
    const contributionsQuery = `
      SELECT 
        COUNT(*) as total_contributions,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_contributions
      FROM app.user_contributions
      WHERE user_id = $1
    `;
    const contributionsResult = await pool.query(contributionsQuery, [user.id]);
    
    const totalContributions = parseInt(contributionsResult.rows[0]?.total_contributions) || 0;
    const approvedContributions = parseInt(contributionsResult.rows[0]?.approved_contributions) || 0;

    // Obtener reviews públicas recientes (últimas 5)
    const recentReviewsQuery = `
      SELECT 
        r.id,
        r.overall_score,
        r.content,
        r.created_at,
        r.reviewable_type,
        r.reviewable_id,
        r.helpful_votes
      FROM app.reviews r
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
      LIMIT 5
    `;
    const recentReviews = await pool.query(recentReviewsQuery, [user.id]);

    // Obtener títulos de los media de las reviews
    const reviewsWithMedia = await Promise.all(
      recentReviews.rows.map(async (review) => {
        // Obtener título con prioridad: español > romaji > inglés > nativo
        const mediaQuery = `
          SELECT 
            id,
            slug,
            COALESCE(
              NULLIF(title_spanish, ''),
              NULLIF(title_romaji, ''),
              NULLIF(title_english, ''),
              NULLIF(title_native, '')
            ) as title,
            title_spanish,
            title_romaji,
            title_english
          FROM app.${review.reviewable_type} 
          WHERE id = $1
        `;
        try {
          const mediaResult = await pool.query(mediaQuery, [review.reviewable_id]);
          return {
            ...review,
            media: mediaResult.rows[0] || null,
          };
        } catch (e) {
          console.error(`Error al obtener media para review ${review.id}:`, e);
          return {
            ...review,
            media: null,
          };
        }
      })
    );

    // Obtener listas públicas
    const publicListsQuery = `
      SELECT 
        l.id,
        l.name,
        l.description,
        l.created_at,
        l.updated_at,
        COUNT(li.id) as items_count
      FROM app.lists l
      LEFT JOIN app.list_items li ON l.id = li.list_id
      WHERE l.user_id = $1 AND l.is_public = true
      GROUP BY l.id
      ORDER BY l.updated_at DESC
      LIMIT 10
    `;
    const publicLists = await pool.query(publicListsQuery, [user.id]);

    // Construir respuesta con datos públicos
    const publicProfile = {
      id: user.id,
      username: user.username,
      trackingId: user.tracking_id,
      displayName: user.display_name || user.username,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      joinedAt: user.created_at,
      role: user.role,
      dateOfBirth: user.date_of_birth,
      stats: {
        totalReviews: parseInt(reviewStats.rows[0].total_reviews) || 0,
        avgScore: parseFloat(reviewStats.rows[0].avg_score) || 0,
        totalLists: parseInt(listStats.rows[0].total_lists) || 0,
        publicLists: parseInt(listStats.rows[0].public_lists) || 0,
        totalContributions: totalContributions,
        approvedContributions: approvedContributions,
      },
      recentReviews: reviewsWithMedia,
      publicLists: publicLists.rows,
    };

    return NextResponse.json({
      success: true,
      user: publicProfile,
    });

  } catch (error: any) {
    console.error('Error al obtener perfil público:', error);
    return NextResponse.json(
      { error: 'Error al obtener el perfil del usuario' },
      { status: 500 }
    );
  }
}
