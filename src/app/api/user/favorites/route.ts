import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API de Favoritos - Sistema polimórfico
 * 
 * GET /api/user/favorites?userId={id}
 * - Obtiene todos los favoritos del usuario
 * 
 * POST /api/user/favorites
 * - Body: { userId, itemType: 'anime'|'manga'|'novel', itemId }
 * - Añade un item a la lista "Favoritos" del usuario
 * 
 * DELETE /api/user/favorites
 * - Body: { userId, itemType, itemId }
 * - Quita un item de favoritos
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Buscar la lista "Favoritos" del usuario
    const listResult = await pool.query(
      `SELECT id FROM app.lists WHERE user_id = $1 AND slug = 'favoritos' LIMIT 1`,
      [userId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        favorites: [],
      });
    }

    const listId = listResult.rows[0].id;

    // Obtener todos los items de favoritos con datos enriquecidos
    const itemsResult = await pool.query(`
      SELECT 
        li.id as list_item_id,
        li.listable_type,
        li.listable_id,
        li.status,
        li.progress,
        li.score,
        li.created_at,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.title_romaji
          WHEN li.listable_type = 'manga' THEN m.title_romaji
          WHEN li.listable_type = 'novel' THEN n.title_romaji
        END as title,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.cover_image_url
          WHEN li.listable_type = 'manga' THEN m.cover_image_url
          WHEN li.listable_type = 'novel' THEN n.cover_image_url
        END as cover_image,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.average_score
          WHEN li.listable_type = 'manga' THEN m.average_score
          WHEN li.listable_type = 'novel' THEN n.average_score
        END as average_score,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.slug
          WHEN li.listable_type = 'manga' THEN m.slug
          WHEN li.listable_type = 'novel' THEN n.slug
        END as slug
      FROM app.list_items li
      LEFT JOIN app.anime a ON li.listable_type = 'anime' AND li.listable_id = a.id
      LEFT JOIN app.manga m ON li.listable_type = 'manga' AND li.listable_id = m.id
      LEFT JOIN app.novels n ON li.listable_type = 'novel' AND li.listable_id = n.id
      WHERE li.list_id = $1
      ORDER BY li.created_at DESC
    `, [listId]);

    const favorites = itemsResult.rows.map(row => ({
      id: row.listable_id.toString(),
      slug: row.slug || row.listable_id.toString(),
      title: row.title,
      type: row.listable_type.charAt(0).toUpperCase() + row.listable_type.slice(1),
      imageUrl: row.cover_image || 'https://placehold.co/400x600?text=No+Image',
      rating: parseFloat(row.average_score) || 0,
      status: row.status,
      progress: row.progress,
      score: row.score,
    }));

    return NextResponse.json({
      success: true,
      favorites,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/user/favorites:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemType, itemId } = body;

    if (!userId || !itemType || !itemId) {
      return NextResponse.json(
        { error: 'userId, itemType e itemId son requeridos' },
        { status: 400 }
      );
    }

    // Validar itemType
    if (!['anime', 'manga', 'novel'].includes(itemType.toLowerCase())) {
      return NextResponse.json(
        { error: 'itemType debe ser anime, manga o novel' },
        { status: 400 }
      );
    }

    const normalizedType = itemType.toLowerCase();

    // Buscar o crear la lista "Favoritos"
    let listResult = await pool.query(
      `SELECT id FROM app.lists WHERE user_id = $1 AND slug = 'favoritos' LIMIT 1`,
      [userId]
    );

    let listId;
    if (listResult.rows.length === 0) {
      // Crear la lista de favoritos si no existe
      const createResult = await pool.query(
        `INSERT INTO app.lists (user_id, name, slug, is_public, is_default)
         VALUES ($1, 'Favoritos', 'favoritos', FALSE, TRUE)
         RETURNING id`,
        [userId]
      );
      listId = createResult.rows[0].id;
    } else {
      listId = listResult.rows[0].id;
    }

    // Verificar si ya existe en favoritos
    const existsResult = await pool.query(
      `SELECT id FROM app.list_items 
       WHERE list_id = $1 AND listable_type = $2 AND listable_id = $3`,
      [listId, normalizedType, itemId]
    );

    if (existsResult.rows.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'El item ya está en favoritos',
      });
    }

    // Añadir a favoritos
    await pool.query(
      `INSERT INTO app.list_items (list_id, listable_type, listable_id, status)
       VALUES ($1, $2, $3, 'favorito')`,
      [listId, normalizedType, itemId]
    );

    console.log(`✅ Añadido a favoritos: User ${userId}, ${normalizedType} ${itemId}`);

    return NextResponse.json({
      success: true,
      message: 'Añadido a favoritos',
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/favorites:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, itemType, itemId } = body;

    if (!userId || !itemType || !itemId) {
      return NextResponse.json(
        { error: 'userId, itemType e itemId son requeridos' },
        { status: 400 }
      );
    }

    const normalizedType = itemType.toLowerCase();

    // Buscar la lista de favoritos
    const listResult = await pool.query(
      `SELECT id FROM app.lists WHERE user_id = $1 AND slug = 'favoritos' LIMIT 1`,
      [userId]
    );

    if (listResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Lista de favoritos no encontrada',
      });
    }

    const listId = listResult.rows[0].id;

    // Eliminar de favoritos
    const deleteResult = await pool.query(
      `DELETE FROM app.list_items 
       WHERE list_id = $1 AND listable_type = $2 AND listable_id = $3
       RETURNING id`,
      [listId, normalizedType, itemId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'El item no estaba en favoritos',
      });
    }

    console.log(`✅ Eliminado de favoritos: User ${userId}, ${normalizedType} ${itemId}`);

    return NextResponse.json({
      success: true,
      message: 'Eliminado de favoritos',
    });

  } catch (error: any) {
    console.error('❌ Error en DELETE /api/user/favorites:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
