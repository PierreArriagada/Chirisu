import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * API de Items de Lista
 * 
 * GET /api/user/lists/{listId}/items
 * - Obtiene todos los items de una lista con datos enriquecidos
 * 
 * POST /api/user/lists/{listId}/items
 * - Body: { itemType, itemId, status }
 * - Añade un item a la lista
 * 
 * DELETE /api/user/lists/{listId}/items
 * - Body: { itemType, itemId }
 * - Elimina un item de la lista
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const { listId } = await params;

    // Obtener todos los items de la lista con datos enriquecidos
    const itemsResult = await pool.query(`
      SELECT 
        li.id,
        li.listable_type,
        li.listable_id,
        li.status,
        li.score,
        li.progress,
        li.created_at,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.title_romaji
          WHEN li.listable_type = 'manga' THEN m.title_romaji
          WHEN li.listable_type = 'novel' THEN n.title_romaji
          WHEN li.listable_type = 'donghua' THEN d.title_romaji
          WHEN li.listable_type = 'manhua' THEN mh.title_romaji
          WHEN li.listable_type = 'manhwa' THEN mw.title_romaji
          WHEN li.listable_type = 'fan_comic' THEN fc.title
        END as title,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.cover_image_url
          WHEN li.listable_type = 'manga' THEN m.cover_image_url
          WHEN li.listable_type = 'novel' THEN n.cover_image_url
          WHEN li.listable_type = 'donghua' THEN d.cover_image_url
          WHEN li.listable_type = 'manhua' THEN mh.cover_image_url
          WHEN li.listable_type = 'manhwa' THEN mw.cover_image_url
          WHEN li.listable_type = 'fan_comic' THEN fc.cover_image_url
        END as cover_image,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.average_score
          WHEN li.listable_type = 'manga' THEN m.average_score
          WHEN li.listable_type = 'novel' THEN n.average_score
          WHEN li.listable_type = 'donghua' THEN d.average_score
          WHEN li.listable_type = 'manhua' THEN mh.average_score
          WHEN li.listable_type = 'manhwa' THEN mw.average_score
          WHEN li.listable_type = 'fan_comic' THEN fc.average_score
        END as average_score,
        CASE 
          WHEN li.listable_type = 'anime' THEN a.slug
          WHEN li.listable_type = 'manga' THEN m.slug
          WHEN li.listable_type = 'novel' THEN n.slug
          WHEN li.listable_type = 'donghua' THEN d.slug
          WHEN li.listable_type = 'manhua' THEN mh.slug
          WHEN li.listable_type = 'manhwa' THEN mw.slug
          WHEN li.listable_type = 'fan_comic' THEN fc.slug
        END as slug
      FROM app.list_items li
      LEFT JOIN app.anime a ON li.listable_type = 'anime' AND li.listable_id = a.id
      LEFT JOIN app.manga m ON li.listable_type = 'manga' AND li.listable_id = m.id
      LEFT JOIN app.novels n ON li.listable_type = 'novel' AND li.listable_id = n.id
      LEFT JOIN app.donghua d ON li.listable_type = 'donghua' AND li.listable_id = d.id
      LEFT JOIN app.manhua mh ON li.listable_type = 'manhua' AND li.listable_id = mh.id
      LEFT JOIN app.manhwa mw ON li.listable_type = 'manhwa' AND li.listable_id = mw.id
      LEFT JOIN app.fan_comics fc ON li.listable_type = 'fan_comic' AND li.listable_id = fc.id
      WHERE li.list_id = $1
      ORDER BY li.created_at DESC
    `, [listId]);

    const items = itemsResult.rows.map(row => ({
      id: row.id.toString(),
      type: row.listable_type,
      itemId: row.listable_id.toString(),
      status: row.status,
      score: row.score,
      progress: row.progress,
      title: row.title,
      coverImage: row.cover_image,
      averageScore: row.average_score,
      slug: row.slug,
      addedAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      items,
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/user/lists/[listId]/items:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    // Autenticación
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;
    const { listId } = await params;
    const body = await request.json();
    const { itemType, itemId, status = 'pendiente', score, progress } = body;

    console.log(`🔍 POST add to list: listId=${listId}, itemType=${itemType}, itemId=${itemId}, userId=${userId}`);

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType y itemId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la lista pertenece al usuario
    const listCheck = await pool.query(`
      SELECT id FROM app.lists
      WHERE id = $1 AND user_id = $2
    `, [parseInt(listId), userId]);

    if (listCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lista no encontrada o sin permisos' },
        { status: 404 }
      );
    }

    // Validar itemType - Ahora incluye todos los 7 tipos
    const validTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    const normalizedType = itemType.toLowerCase();
    
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        { error: 'itemType debe ser anime, manga, novel, donghua, manhua, manhwa o fan_comic' },
        { status: 400 }
      );
    }

    // Verificar si el item ya existe en la lista
    const existsResult = await pool.query(
      `SELECT id FROM app.list_items 
       WHERE list_id = $1 AND listable_type = $2 AND listable_id = $3`,
      [listId, normalizedType, itemId]
    );

    if (existsResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Este item ya está en la lista' },
        { status: 400 }
      );
    }

    // Insertar el item en la lista
    const insertResult = await pool.query(
      `INSERT INTO app.list_items 
       (list_id, listable_type, listable_id, status, score, progress)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [listId, normalizedType, itemId, status, score, progress]
    );

    const newItem = insertResult.rows[0];

    // TODO: Incrementar contador lists_count si la columna existe
    // const tableMap: Record<string, string> = {
    //   'anime': 'anime',
    //   'manga': 'manga',
    //   'novel': 'novels',
    // };
    // const tableName = tableMap[normalizedType];
    // if (tableName) {
    //   await pool.query(`UPDATE app.${tableName} SET lists_count = lists_count + 1 WHERE id = $1`, [itemId]);
    // }

    console.log(`✅ Item añadido a lista ${listId}: ${normalizedType} ${itemId} (usuario ${userId})`);

    return NextResponse.json({
      success: true,
      item: {
        id: newItem.id.toString(),
        listId,
        type: normalizedType,
        itemId,
        status,
        score,
        progress,
        addedAt: newItem.created_at,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en POST /api/user/lists/[listId]/items:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE eliminado - Usar /api/user/lists/[listId]/items/[itemId] en su lugar
// El DELETE con body causaba conflictos con el endpoint de URL params
