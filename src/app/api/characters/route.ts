import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/characters
 * 
 * Query params:
 * - top: 'true' para obtener top characters (opcional)
 * - limit: número de resultados (default: 10)
 * - mediaType: 'anime' | 'manga' | 'novel' (opcional, filtrar por tipo de media)
 * - mediaId: ID del medio (opcional, obtener personajes de un medio específico)
 * 
 * Ejemplos:
 * - /api/characters?top=true&limit=10
 * - /api/characters?mediaType=anime&mediaId=1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const top = searchParams.get('top') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');

    // Caso 1: Top Characters globales (ordenados por favoritos)
    if (top) {
      // Consulta que calcula personajes más añadidos a favoritos
      // Si no hay favoritos, ordena por número de apariciones
      const result = await pool.query(
        `SELECT 
          c.id as character_id,
          COALESCE(c.name_romaji, c.name_native, c.name) as character_name,
          c.image_url as character_image,
          c.slug as character_slug,
          COUNT(DISTINCT uf.user_id) as favorites_count,
          COUNT(DISTINCT CASE 
            WHEN cc.characterable_type = 'anime' THEN cc.characterable_id
            WHEN cc.characterable_type = 'manga' THEN cc.characterable_id
            WHEN cc.characterable_type = 'donghua' THEN cc.characterable_id
            WHEN cc.characterable_type = 'manhua' THEN cc.characterable_id
            WHEN cc.characterable_type = 'manhwa' THEN cc.characterable_id
            WHEN cc.characterable_type = 'novels' THEN cc.characterable_id
            WHEN cc.characterable_type = 'fan_comic' THEN cc.characterable_id
          END) as appearances_count
        FROM app.characters c
        LEFT JOIN app.user_favorites uf 
          ON uf.favorable_id = c.id 
          AND uf.favorable_type = 'character'
        LEFT JOIN app.characterable_characters cc 
          ON cc.character_id = c.id
        GROUP BY c.id, c.name_romaji, c.name_native, c.name, c.image_url, c.slug
        ORDER BY favorites_count DESC, appearances_count DESC, c.id ASC
        LIMIT $1`,
        [limit]
      );

      const characters = result.rows.map(row => ({
        id: row.character_id,
        name: row.character_name,
        image: row.character_image,
        slug: row.character_slug,
        favoritesCount: parseInt(row.favorites_count) || 0,
        appearancesCount: parseInt(row.appearances_count) || 0
      }));

      return NextResponse.json({
        count: characters.length,
        characters
      });
    }

    // Caso 2: Personajes de un medio específico
    if (mediaType && mediaId) {
      const result = await pool.query(`
        SELECT 
          c.id,
          COALESCE(c.name_romaji, c.name, c.name_native) as name,
          c.image_url,
          c.slug,
          c.favorites_count,
          cc.role,
          va.id as voice_actor_id,
          COALESCE(va.name_romaji, va.name_native) as voice_actor_name,
          va.image_url as voice_actor_image,
          va.language as voice_actor_language
        FROM app.characters c
        INNER JOIN app.characterable_characters cc 
          ON c.id = cc.character_id
        LEFT JOIN app.character_voice_actors cva 
          ON c.id = cva.character_id 
          AND cva.media_type = $1 
          AND cva.media_id = $2
        LEFT JOIN app.voice_actors va 
          ON cva.voice_actor_id = va.id
        WHERE cc.characterable_type = $1 
          AND cc.characterable_id = $2
        ORDER BY 
          CASE cc.role 
            WHEN 'main' THEN 1 
            WHEN 'supporting' THEN 2 
            ELSE 3 
          END,
          c.favorites_count DESC
        LIMIT $3
      `, [mediaType, parseInt(mediaId), limit]);

      const characters = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        image: row.image_url,
        slug: row.slug,
        favoritesCount: row.favorites_count,
        role: row.role,
        voiceActor: row.voice_actor_id ? {
          id: row.voice_actor_id,
          name: row.voice_actor_name,
          image: row.voice_actor_image,
          language: row.voice_actor_language
        } : null
      }));

      return NextResponse.json({
        mediaType,
        mediaId: parseInt(mediaId),
        count: characters.length,
        characters
      });
    }

    // Caso 3: Listar todos los personajes (con paginación básica)
    const result = await pool.query(`
      SELECT 
        c.id,
        COALESCE(c.name_romaji, c.name, c.name_native) as name,
        c.image_url,
        c.slug,
        c.favorites_count,
        COUNT(DISTINCT (cc.characterable_type, cc.characterable_id)) as appearances_count
      FROM app.characters c
      LEFT JOIN app.characterable_characters cc ON c.id = cc.character_id
      GROUP BY c.id, c.name_romaji, c.name, c.name_native, c.image_url, c.slug, c.favorites_count
      ORDER BY c.favorites_count DESC
      LIMIT $1
    `, [limit]);

    const characters = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      image: row.image_url,
      slug: row.slug,
      favoritesCount: row.favorites_count,
      appearancesCount: parseInt(row.appearances_count) || 0
    }));

    return NextResponse.json({
      count: characters.length,
      characters
    });

  } catch (error) {
    console.error('Error en /api/characters:', error);
    return NextResponse.json(
      { error: 'Error al obtener personajes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/characters
 * Crea un nuevo personaje (para contribuciones)
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

    const { name, nameRomaji, nameNative, imageUrl } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'El nombre del personaje es requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya existe por nombre
    const existingResult = await pool.query(
      `SELECT id, name, name_romaji, name_native, image_url 
       FROM app.characters 
       WHERE LOWER(name) = LOWER($1) OR LOWER(COALESCE(name_romaji, '')) = LOWER($2)`,
      [name.trim(), nameRomaji?.trim() || '']
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json({
        success: true,
        character: {
          id: existingResult.rows[0].id,
          name: existingResult.rows[0].name,
          nameRomaji: existingResult.rows[0].name_romaji,
          nameNative: existingResult.rows[0].name_native,
          imageUrl: existingResult.rows[0].image_url,
        },
        message: 'El personaje ya existe',
      });
    }

    // Crear nuevo personaje
    const result = await pool.query(
      `INSERT INTO app.characters (name, name_romaji, name_native, image_url) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, name_romaji, name_native, image_url`,
      [name.trim(), nameRomaji?.trim() || null, nameNative?.trim() || null, imageUrl || null]
    );

    return NextResponse.json({
      success: true,
      character: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        nameRomaji: result.rows[0].name_romaji,
        nameNative: result.rows[0].name_native,
        imageUrl: result.rows[0].image_url,
      },
      message: 'Personaje creado exitosamente',
    });

  } catch (error) {
    console.error('❌ Error en POST /api/characters:', error);
    return NextResponse.json(
      { error: 'Error al crear personaje' },
      { status: 500 }
    );
  }
}
