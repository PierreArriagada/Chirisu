import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/favorites
 * 
 * Query params:
 * - type: 'character' | 'voice_actor' | 'staff' | 'anime' | 'manga' | 'novel' (opcional)
 * - userId: ID del usuario (required)
 * - itemId: ID del item (opcional, para verificar si está en favoritos)
 * 
 * Si itemId está presente, retorna { inFavorites: boolean }
 * Si no, obtiene la lista de favoritos del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');
    const itemId = searchParams.get('itemId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    // Si itemId está presente, solo verificar si está en favoritos
    if (itemId && type) {
      const checkResult = await pool.query(`
        SELECT id FROM app.user_favorites
        WHERE user_id = $1 AND favorable_type = $2 AND favorable_id = $3
      `, [parseInt(userId), type, parseInt(itemId)]);

      return NextResponse.json({
        inFavorites: checkResult.rows.length > 0,
        favoriteId: checkResult.rows[0]?.id || null
      });
    }

    let query = `
      SELECT 
        uf.id,
        uf.favorable_type,
        uf.favorable_id,
        uf.created_at
      FROM app.user_favorites uf
      WHERE uf.user_id = $1
    `;

    const params: any[] = [parseInt(userId)];

    if (type) {
      query += ' AND uf.favorable_type = $2';
      params.push(type);
    }

    query += ' ORDER BY uf.created_at DESC';

    const result = await pool.query(query, params);

    // Enriquecer los datos según el tipo
    const favorites = await Promise.all(
      result.rows.map(async (row: any) => {
        let details = null;

        switch (row.favorable_type) {
          case 'character':
            const charResult = await pool.query(`
              SELECT 
                id,
                COALESCE(name_romaji, name, name_native) as name,
                image_url,
                slug
              FROM app.characters
              WHERE id = $1
            `, [row.favorable_id]);
            details = charResult.rows[0];
            break;

          case 'voice_actor':
            const vaResult = await pool.query(`
              SELECT 
                id,
                COALESCE(name_romaji, name_native) as name,
                image_url,
                slug,
                language
              FROM app.voice_actors
              WHERE id = $1
            `, [row.favorable_id]);
            details = vaResult.rows[0];
            break;

          case 'staff':
            const staffResult = await pool.query(`
              SELECT 
                id,
                COALESCE(name_romaji, name_native) as name,
                image_url,
                slug,
                primary_occupations
              FROM app.staff
              WHERE id = $1
            `, [row.favorable_id]);
            details = staffResult.rows[0];
            break;

          case 'anime':
            const animeResult = await pool.query(`
              SELECT 
                id,
                COALESCE(title_romaji, title_english, title_native) as title,
                cover_image_url,
                slug
              FROM app.anime
              WHERE id = $1
            `, [row.favorable_id]);
            details = animeResult.rows[0];
            break;

          case 'manga':
            const mangaResult = await pool.query(`
              SELECT 
                id,
                COALESCE(title_romaji, title_english, title_native) as title,
                cover_image_url,
                slug
              FROM app.manga
              WHERE id = $1
            `, [row.favorable_id]);
            details = mangaResult.rows[0];
            break;

          case 'novel':
            const novelResult = await pool.query(`
              SELECT 
                id,
                COALESCE(title_romaji, title_english, title_native) as title,
                cover_image_url,
                slug
              FROM app.novels
              WHERE id = $1
            `, [row.favorable_id]);
            details = novelResult.rows[0];
            break;
        }

        return {
          id: row.id,
          type: row.favorable_type,
          favorableId: row.favorable_id,
          createdAt: row.created_at,
          details
        };
      })
    );

    return NextResponse.json({
      userId: parseInt(userId),
      count: favorites.length,
      favorites
    });

  } catch (error) {
    console.error('Error en GET /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al obtener favoritos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/favorites
 * 
 * Body:
 * {
 *   "userId": number,
 *   "favorableType": 'character' | 'voice_actor' | 'staff' | 'anime' | 'manga' | 'novel',
 *   "favorableId": number
 * }
 * 
 * Agrega un favorito
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, favorableType, favorableId } = body;

    // Validaciones
    if (!userId || !favorableType || !favorableId) {
      return NextResponse.json(
        { error: 'userId, favorableType y favorableId son requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['character', 'voice_actor', 'staff', 'anime', 'manga', 'novel'];
    if (!validTypes.includes(favorableType)) {
      return NextResponse.json(
        { error: 'favorableType inválido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await pool.query(`
      SELECT id FROM app.user_favorites
      WHERE user_id = $1 AND favorable_type = $2 AND favorable_id = $3
    `, [userId, favorableType, favorableId]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Ya está en favoritos', alreadyExists: true },
        { status: 409 }
      );
    }

    // Insertar favorito
    const result = await pool.query(`
      INSERT INTO app.user_favorites (user_id, favorable_type, favorable_id)
      VALUES ($1, $2, $3)
      RETURNING id, created_at
    `, [userId, favorableType, favorableId]);

    // Incrementar contador según el tipo
    const tableMap: Record<string, string> = {
      'character': 'characters',
      'voice_actor': 'voice_actors',
      'staff': 'staff',
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels'
    };

    const tableName = tableMap[favorableType];

    await pool.query(`
      UPDATE app.${tableName}
      SET favorites_count = favorites_count + 1
      WHERE id = $1
    `, [favorableId]);

    return NextResponse.json({
      message: 'Favorito agregado',
      favorite: {
        id: result.rows[0].id,
        userId,
        favorableType,
        favorableId,
        createdAt: result.rows[0].created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al agregar favorito' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/favorites
 * 
 * Query Params:
 * - favorableType: string (character, voice_actor, staff, anime, manga, etc.)
 * - favorableId: number
 * 
 * Elimina un favorito del usuario autenticado
 */
export async function DELETE(request: NextRequest) {
  try {
    // Autenticación usando JWT
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión primero.' },
        { status: 401 }
      );
    }

    const userId = currentUser.userId;
    const { searchParams } = new URL(request.url);
    const favorableType = searchParams.get('favorableType');
    const favorableIdStr = searchParams.get('favorableId');

    if (!favorableType || !favorableIdStr) {
      return NextResponse.json(
        { error: 'favorableType y favorableId son requeridos' },
        { status: 400 }
      );
    }

    const favorableId = parseInt(favorableIdStr);

    if (isNaN(favorableId)) {
      return NextResponse.json(
        { error: 'favorableId debe ser un número válido' },
        { status: 400 }
      );
    }

    // Eliminar favorito
    const result = await pool.query(`
      DELETE FROM app.user_favorites
      WHERE user_id = $1 AND favorable_type = $2 AND favorable_id = $3
      RETURNING id
    `, [userId, favorableType, favorableId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Favorito no encontrado' },
        { status: 404 }
      );
    }

    // Decrementar contador según el tipo
    const tableMap: Record<string, string> = {
      'character': 'characters',
      'voice_actor': 'voice_actors',
      'staff': 'staff',
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels'
    };

    const tableName = tableMap[favorableType];

    await pool.query(`
      UPDATE app.${tableName}
      SET favorites_count = GREATEST(favorites_count - 1, 0)
      WHERE id = $1
    `, [favorableId]);

    return NextResponse.json({
      message: 'Favorito eliminado'
    });

  } catch (error) {
    console.error('Error en DELETE /api/favorites:', error);
    return NextResponse.json(
      { error: 'Error al eliminar favorito' },
      { status: 500 }
    );
  }
}
