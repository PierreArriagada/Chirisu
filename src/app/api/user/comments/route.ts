import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * ============================================
 * API ENDPOINT: GET /api/user/comments
 * ============================================
 * 
 * Obtiene el historial de comentarios de un usuario
 * 
 * Query Params:
 * - userId: ID del usuario (optional, si no se proporciona usa el usuario actual)
 * - limit: número de resultados (default: 20, max: 100)
 * - offset: número de registros a saltar (default: 0)
 * - include_deleted: incluir comentarios eliminados (solo para admin/moderador)
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeDeleted = searchParams.get('include_deleted') === 'true';

    // Determinar qué usuario consultar
    const targetUserId = userIdParam ? parseInt(userIdParam) : currentUser.userId;

    // Solo admin/moderador puede incluir eliminados
    const canIncludeDeleted = includeDeleted && (currentUser.isAdmin || currentUser.isModerator);

    // Query
    const query = `
      SELECT 
        c.id,
        c.commentable_type,
        c.commentable_id,
        c.parent_id,
        c.content,
        c.is_spoiler,
        c.images,
        c.likes_count,
        c.replies_count,
        c.created_at,
        c.updated_at,
        c.deleted_at,
        -- Obtener información del medio
        CASE c.commentable_type
          WHEN 'anime' THEN (SELECT title_romaji FROM app.anime WHERE id = c.commentable_id)
          WHEN 'manga' THEN (SELECT title_romaji FROM app.manga WHERE id = c.commentable_id)
          WHEN 'novels' THEN (SELECT title_romaji FROM app.novels WHERE id = c.commentable_id)
          WHEN 'donghua' THEN (SELECT title_romaji FROM app.donghua WHERE id = c.commentable_id)
          WHEN 'manhua' THEN (SELECT title_romaji FROM app.manhua WHERE id = c.commentable_id)
          WHEN 'manhwa' THEN (SELECT title_romaji FROM app.manhwa WHERE id = c.commentable_id)
          WHEN 'fan_comic' THEN (SELECT title_romaji FROM app.fan_comics WHERE id = c.commentable_id)
        END as media_title,
        CASE c.commentable_type
          WHEN 'anime' THEN (SELECT slug FROM app.anime WHERE id = c.commentable_id)
          WHEN 'manga' THEN (SELECT slug FROM app.manga WHERE id = c.commentable_id)
          WHEN 'novels' THEN (SELECT slug FROM app.novels WHERE id = c.commentable_id)
          WHEN 'donghua' THEN (SELECT slug FROM app.donghua WHERE id = c.commentable_id)
          WHEN 'manhua' THEN (SELECT slug FROM app.manhua WHERE id = c.commentable_id)
          WHEN 'manhwa' THEN (SELECT slug FROM app.manhwa WHERE id = c.commentable_id)
          WHEN 'fan_comic' THEN (SELECT slug FROM app.fan_comics WHERE id = c.commentable_id)
        END as media_slug
      FROM app.comments c
      WHERE c.user_id = $1
        ${!canIncludeDeleted ? 'AND c.deleted_at IS NULL' : ''}
      ORDER BY c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [targetUserId, limit, offset]);

    // Obtener conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app.comments
      WHERE user_id = $1
        ${!canIncludeDeleted ? 'AND deleted_at IS NULL' : ''}
    `;
    const countResult = await pool.query(countQuery, [targetUserId]);
    const total = parseInt(countResult.rows[0].total);

    // Formatear respuesta
    const comments = result.rows.map(row => ({
      id: row.id.toString(),
      commentableType: row.commentable_type,
      commentableId: row.commentable_id.toString(),
      parentId: row.parent_id?.toString() || null,
      content: row.content,
      isSpoiler: row.is_spoiler,
      images: row.images || [],
      likesCount: row.likes_count,
      repliesCount: row.replies_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      media: {
        title: row.media_title,
        slug: row.media_slug,
      }
    }));

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    });

  } catch (error: any) {
    console.error('Error en GET /api/user/comments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener historial de comentarios',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
