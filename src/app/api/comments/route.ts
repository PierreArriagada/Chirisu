import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

/**
 * ============================================
 * API ENDPOINT: GET /api/comments
 * ============================================
 * 
 * Obtiene comentarios de un medio específico (anime, manga, etc.)
 * Soporta paginación y filtrado por comentario padre
 * 
 * Query Params:
 * - type: 'anime' | 'manga' | 'novels' | 'donghua' | 'manhua' | 'manhwa' | 'fan_comic' (required)
 * - id: ID del medio (required)
 * - parent_id: ID del comentario padre para obtener respuestas (optional)
 * - limit: número de resultados (default: 20, max: 100)
 * - offset: número de registros a saltar (default: 0)
 * - sort: 'newest' | 'oldest' | 'most_liked' (default: 'newest')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const parentId = searchParams.get('parent_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    // Validaciones
    const VALID_TYPES = ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Parámetro "type" inválido' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Parámetro "id" requerido' },
        { status: 400 }
      );
    }

    // Determinar ordenamiento
    let orderBy = 'c.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'c.created_at ASC';
    } else if (sort === 'most_liked') {
      orderBy = 'c.likes_count DESC, c.created_at DESC';
    }

    const queryParams: any[] = [type, parseInt(id)];

    // Agregar user_id del usuario actual (puede ser null) - ANTES del filtro de parent_id
    const currentUser = await getCurrentUser();
    queryParams.push(currentUser?.userId || null);

    // Construir query base con el índice correcto para user_id
    let query = `
      SELECT 
        c.id,
        c.commentable_type,
        c.commentable_id,
        c.user_id,
        c.parent_id,
        c.content,
        c.is_spoiler,
        c.images,
        c.likes_count,
        c.replies_count,
        c.created_at,
        c.updated_at,
        u.username,
        u.display_name,
        u.avatar_url,
        u.level,
        -- Verificar si el usuario actual le dio like
        EXISTS(
          SELECT 1 FROM app.comment_reactions cr
          WHERE cr.comment_id = c.id
          AND cr.user_id = $3
          AND cr.reaction_type = 'like'
        ) as user_liked
      FROM app.comments c
      INNER JOIN app.users u ON c.user_id = u.id
      WHERE c.commentable_type = $1
        AND c.commentable_id = $2
        AND c.deleted_at IS NULL
    `;

    // Filtrar por comentario padre
    if (parentId) {
      query += ` AND c.parent_id = $4`;
      queryParams.push(parseInt(parentId));
    } else {
      // Solo comentarios de nivel superior (sin padre)
      query += ` AND c.parent_id IS NULL`;
    }

    // Agregar ordenamiento, limit y offset
    const limitIndex = queryParams.length + 1;
    const offsetIndex = queryParams.length + 2;
    query += ` ORDER BY ${orderBy} LIMIT $${limitIndex} OFFSET $${offsetIndex}`;
    queryParams.push(limit, offset);

    // Ejecutar query
    const result = await pool.query(query, queryParams);

    // Obtener conteo total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM app.comments c
      WHERE c.commentable_type = $1
        AND c.commentable_id = $2
        AND c.deleted_at IS NULL
        ${parentId ? 'AND c.parent_id = $3' : 'AND c.parent_id IS NULL'}
    `;
    const countParams = parentId ? [type, parseInt(id), parseInt(parentId)] : [type, parseInt(id)];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Formatear respuesta
    const comments = result.rows.map(row => ({
      id: row.id.toString(),
      commentableType: row.commentable_type,
      commentableId: row.commentable_id.toString(),
      userId: row.user_id.toString(),
      parentId: row.parent_id?.toString() || null,
      content: row.content,
      isSpoiler: row.is_spoiler,
      images: row.images || [],
      likesCount: row.likes_count,
      repliesCount: row.replies_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        username: row.username,
        displayName: row.display_name || row.username,
        avatarUrl: row.avatar_url,
        level: row.level || 1,
      },
      userLiked: row.user_liked || false,
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
    console.error('Error en GET /api/comments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener comentarios',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * ============================================
 * API ENDPOINT: POST /api/comments
 * ============================================
 * 
 * Crea un nuevo comentario
 * 
 * Body:
 * - type: tipo de medio
 * - id: ID del medio
 * - content: contenido del comentario (required)
 * - parent_id: ID del comentario padre si es respuesta (optional)
 * - is_spoiler: si el comentario contiene spoilers (optional, default: false)
 * - images: array de URLs de imágenes (optional, max: 4)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, id, content, parent_id, is_spoiler = false, images = [] } = body;

    // Validaciones
    const VALID_TYPES = ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Contenido requerido' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'El comentario no puede exceder 5000 caracteres' },
        { status: 400 }
      );
    }

    if (!Array.isArray(images) || images.length > 4) {
      return NextResponse.json(
        { error: 'Máximo 4 imágenes permitidas' },
        { status: 400 }
      );
    }

    // Verificar que el medio existe
    const mediaCheck = await pool.query(
      `SELECT id FROM app.${type} WHERE id = $1`,
      [parseInt(id)]
    );

    if (mediaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Medio no encontrado' },
        { status: 404 }
      );
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (parent_id) {
      const parentCheck = await pool.query(
        `SELECT id FROM app.comments WHERE id = $1 AND deleted_at IS NULL`,
        [parseInt(parent_id)]
      );

      if (parentCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Comentario padre no encontrado' },
          { status: 404 }
        );
      }
    }

    // Insertar comentario
    const result = await pool.query(
      `INSERT INTO app.comments (
        commentable_type,
        commentable_id,
        user_id,
        parent_id,
        content,
        is_spoiler,
        images,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id`,
      [
        type,
        parseInt(id),
        currentUser.userId,
        parent_id ? parseInt(parent_id) : null,
        content.trim(),
        is_spoiler,
        JSON.stringify(images)
      ]
    );

    const commentId = result.rows[0].id;

    // Si es una respuesta a otro comentario, notificar al autor del comentario padre
    if (parent_id) {
      try {
        const parentComment = await pool.query(
          `SELECT user_id FROM app.comments WHERE id = $1`,
          [parseInt(parent_id)]
        );
        
        if (parentComment.rows.length > 0 && parentComment.rows[0].user_id !== currentUser.userId) {
          // Solo notificar si el autor de la respuesta no es el mismo que el autor del comentario padre
          await createNotification({
            recipientUserId: parentComment.rows[0].user_id,
            actorUserId: currentUser.userId,
            actionType: 'comment_reply',
            notifiableType: 'comment',
            notifiableId: commentId,
          });
        }
      } catch (notifError) {
        console.error('❌ Error al crear notificación de respuesta:', notifError);
        // No interrumpimos el flujo aunque falle la notificación
      }
    }

    console.log(`✅ Comentario creado: ID ${commentId}, Usuario: ${currentUser.userId}, Medio: ${type}/${id}`);

    return NextResponse.json({
      success: true,
      commentId: commentId.toString(),
      message: 'Comentario creado exitosamente',
    });

  } catch (error: any) {
    console.error('Error en POST /api/comments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear comentario',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
