import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/media/[type]/[id]/characters
 * Obtiene los personajes de cualquier tipo de media
 * Soporta: anime, manga, manhwa, manhua, donghua, novel, fan_comic
 */

const VALID_TYPES = ['anime', 'manga', 'manhwa', 'manhua', 'donghua', 'novel', 'fan_comic'];

// Mapeo de tipo a tabla
const TABLE_MAP: Record<string, string> = {
  anime: 'anime',
  manga: 'manga',
  manhwa: 'manhwa',
  manhua: 'manhua',
  donghua: 'donghua',
  novel: 'novels',
  fan_comic: 'fan_comics',
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;
    const mediaId = parseInt(id);

    // Validar tipo
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipo de media inválido: ${type}. Tipos válidos: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'ID de media inválido' },
        { status: 400 }
      );
    }

    const tableName = TABLE_MAP[type];

    // Verificar que el media existe
    const mediaCheck = await pool.query(
      `SELECT id FROM app.${tableName} WHERE id = $1`,
      [mediaId]
    );

    if (mediaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: `${type} no encontrado` },
        { status: 404 }
      );
    }

    // Obtener personajes con su rol y actores de voz
    // characterable_type almacena el tipo exacto (manhwa, manhua, etc.)
    const charactersQuery = `
      SELECT 
        c.id,
        c.name,
        c.name_romaji,
        c.name_native,
        c.image_url,
        c.description,
        c.slug,
        c.favorites_count,
        c.gender,
        c.age,
        c.blood_type,
        c.date_of_birth,
        cc.role,
        -- Actores de voz japoneses
        MAX(CASE WHEN va.language = 'ja' THEN va.id END) as va_jp_id,
        MAX(CASE WHEN va.language = 'ja' THEN va.name_romaji END) as va_jp_name_romaji,
        MAX(CASE WHEN va.language = 'ja' THEN va.name_native END) as va_jp_name_native,
        MAX(CASE WHEN va.language = 'ja' THEN va.slug END) as va_jp_slug,
        MAX(CASE WHEN va.language = 'ja' THEN va.image_url END) as va_jp_image,
        MAX(CASE WHEN va.language = 'ja' THEN va.bio END) as va_jp_bio,
        MAX(CASE WHEN va.language = 'ja' THEN va.gender END) as va_jp_gender,
        MAX(CASE WHEN va.language = 'ja' THEN va.hometown END) as va_jp_hometown,
        -- Actores de voz coreanos (para manhwa)
        MAX(CASE WHEN va.language = 'ko' THEN va.id END) as va_ko_id,
        MAX(CASE WHEN va.language = 'ko' THEN va.name_romaji END) as va_ko_name_romaji,
        MAX(CASE WHEN va.language = 'ko' THEN va.name_native END) as va_ko_name_native,
        MAX(CASE WHEN va.language = 'ko' THEN va.slug END) as va_ko_slug,
        MAX(CASE WHEN va.language = 'ko' THEN va.image_url END) as va_ko_image,
        -- Actores de voz chinos (para manhua/donghua)
        MAX(CASE WHEN va.language = 'zh' THEN va.id END) as va_zh_id,
        MAX(CASE WHEN va.language = 'zh' THEN va.name_romaji END) as va_zh_name_romaji,
        MAX(CASE WHEN va.language = 'zh' THEN va.name_native END) as va_zh_name_native,
        MAX(CASE WHEN va.language = 'zh' THEN va.slug END) as va_zh_slug,
        MAX(CASE WHEN va.language = 'zh' THEN va.image_url END) as va_zh_image,
        -- Actores de voz españoles
        MAX(CASE WHEN va.language = 'es' THEN va.id END) as va_es_id,
        MAX(CASE WHEN va.language = 'es' THEN va.name_romaji END) as va_es_name_romaji,
        MAX(CASE WHEN va.language = 'es' THEN va.name_native END) as va_es_name_native,
        MAX(CASE WHEN va.language = 'es' THEN va.slug END) as va_es_slug,
        MAX(CASE WHEN va.language = 'es' THEN va.image_url END) as va_es_image,
        MAX(CASE WHEN va.language = 'es' THEN va.bio END) as va_es_bio,
        MAX(CASE WHEN va.language = 'es' THEN va.gender END) as va_es_gender,
        MAX(CASE WHEN va.language = 'es' THEN va.hometown END) as va_es_hometown
      FROM app.characterable_characters cc
      JOIN app.characters c ON c.id = cc.character_id
      LEFT JOIN app.character_voice_actors cva ON cva.character_id = c.id 
        AND cva.media_type = $1 
        AND cva.media_id = $2
      LEFT JOIN app.voice_actors va ON va.id = cva.voice_actor_id
      WHERE cc.characterable_type = $1 
        AND cc.characterable_id = $2
      GROUP BY c.id, c.name, c.name_romaji, c.name_native, c.image_url, 
               c.description, c.slug, c.favorites_count, c.gender, c.age, 
               c.blood_type, c.date_of_birth, cc.role
      ORDER BY 
        CASE cc.role 
          WHEN 'main' THEN 1 
          WHEN 'supporting' THEN 2 
          ELSE 3 
        END,
        c.id
    `;

    const result = await pool.query(charactersQuery, [type, mediaId]);

    // Separar personajes por rol
    const mainCharacters = result.rows.filter(c => c.role === 'main');
    const supportingCharacters = result.rows.filter(c => c.role === 'supporting');

    return NextResponse.json({
      success: true,
      data: {
        main: mainCharacters,
        supporting: supportingCharacters,
        total: result.rows.length,
        mainCount: mainCharacters.length,
        supportingCount: supportingCharacters.length,
        mediaType: type
      }
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media/[type]/[id]/characters:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener personajes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
