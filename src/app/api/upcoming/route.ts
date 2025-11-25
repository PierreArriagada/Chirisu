/**
 * ========================================
 * API ROUTE: PRÓXIMOS ESTRENOS
 * ========================================
 * 
 * GET /api/upcoming?type=anime&limit=10
 * 
 * Obtiene contenido próximo a estrenarse ordenado por fecha de inicio
 */

import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

const VALID_TYPES = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'] as const;
type MediaType = typeof VALID_TYPES[number];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as MediaType || 'anime';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validar tipo
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Debe ser: anime, manga, novel, donghua, manhua, manhwa, o fan_comic' },
        { status: 400 }
      );
    }

    // Mapear tipo a tabla
    const tableMap: Record<MediaType, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan_comics'
    };

    const table = tableMap[type];
    
    // Obtener el ID del status "not_yet_aired" (Aún no estrenado)
    const statusResult = await db.query<{ id: number }>(
      `SELECT id FROM app.media_statuses WHERE code = 'not_yet_aired'`
    );

    if (statusResult.rows.length === 0) {
      return NextResponse.json({ upcoming: [] });
    }

    const notYetAiredStatusId = statusResult.rows[0].id;

    // Columna de visibilidad según tipo
    const visibilityColumn = (type === 'anime' || type === 'donghua') ? 'is_published' : 'is_approved';

    // Query para obtener próximos estrenos
    // Fan Comics usa 'title' en lugar de 'title_romaji'
    const titleColumn = type === 'fan_comic' ? 'title' : 'title_romaji';
    
    const result = await db.query(
      `SELECT 
        m.id,
        m.slug,
        m.${titleColumn} as title,
        m.cover_image_url as "coverImage",
        m.start_date as "startDate",
        m.average_score as "averageScore",
        COALESCE(m.ranking, 999999) as ranking
      FROM app.${table} m
      WHERE m.status_id = $1
        AND m.${visibilityColumn} = true
        AND m.deleted_at IS NULL
      ORDER BY 
        CASE 
          WHEN m.start_date IS NOT NULL THEN m.start_date
          ELSE '9999-12-31'::date
        END ASC,
        m.created_at DESC
      LIMIT $2`,
      [notYetAiredStatusId, limit]
    );

    const upcoming = result.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      coverImage: row.coverImage,
      startDate: row.startDate,
      averageScore: row.averageScore || 0,
      ranking: row.ranking === 999999 ? undefined : row.ranking,
    }));

    console.log(`✅ Próximos estrenos de ${type}: ${upcoming.length} items`);

    return NextResponse.json({ 
      success: true,
      upcoming,
      total: upcoming.length 
    });

  } catch (error) {
    console.error('❌ Error en GET /api/upcoming:', error);
    return NextResponse.json(
      { error: 'Error al obtener próximos estrenos' },
      { status: 500 }
    );
  }
}
