import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { extractDominantColorHex } from '@/lib/color-extractor';

/**
 * ============================================================================
 * ENDPOINT: POST /api/media/extract-color
 * ============================================================================
 * 
 * Extrae el color dominante de una imagen y lo guarda en la BD.
 * 
 * Body:
 * {
 *   "mediaId": number,
 *   "mediaType": "anime" | "manga" | "manhwa" | "manhua" | "novel" | "donghua",
 *   "imageUrl": string,
 *   "force": boolean (opcional, fuerza recalcular aunque ya exista)
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "color": "#RRGGBB",
 *   "updated": boolean
 * }
 * 
 * ============================================================================
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mediaId, mediaType, imageUrl, force = false } = body;

    // Validaciones
    if (!mediaId || !mediaType || !imageUrl) {
      return NextResponse.json(
        { error: 'mediaId, mediaType e imageUrl son requeridos' },
        { status: 400 }
      );
    }

    const validTypes = ['anime', 'manga', 'novel', 'donghua', 'manhua', 'manhwa', 'fan_comic'];
    if (!validTypes.includes(mediaType)) {
      return NextResponse.json(
        { error: `Tipo inválido. Use: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Mapeo de tipo a tabla
    const tableMap: Record<string, string> = {
      'anime': 'anime',
      'manga': 'manga',
      'novel': 'novels',
      'donghua': 'donghua',
      'manhua': 'manhua',
      'manhwa': 'manhwa',
      'fan_comic': 'fan_comics'
    };
    const tableName = tableMap[mediaType];

    console.log(`\n🎨 ======== EXTRACCIÓN DE COLOR ========`);
    console.log(`   Medio: ${mediaType} #${mediaId}`);
    console.log(`   Imagen: ${imageUrl}`);

    // 1. Verificar si ya tiene color y si la imagen cambió
    const checkQuery = `
      SELECT 
        id, 
        dominant_color, 
        cover_image_url,
        title_romaji
      FROM app.${tableName}
      WHERE id = $1
    `;
    const checkResult = await db.query(checkQuery, [mediaId]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Medio no encontrado' },
        { status: 404 }
      );
    }

    const media = checkResult.rows[0];
    const currentColor = media.dominant_color;
    const currentImageUrl = media.cover_image_url;
    const title = media.title_romaji || 'Sin título';

    console.log(`   Título: ${title}`);
    console.log(`   Color actual: ${currentColor || 'ninguno'}`);
    console.log(`   URL en BD: ${currentImageUrl}`);

    // 2. Decidir si necesita extracción
    const needsExtraction = 
      force || 
      !currentColor || 
      currentImageUrl !== imageUrl;

    if (!needsExtraction) {
      console.log(`   ✅ Color ya existe y la imagen no cambió. Usando caché.`);
      return NextResponse.json({
        success: true,
        color: currentColor,
        updated: false,
        cached: true,
      });
    }

    console.log(`   🔍 Extrayendo color...`);
    console.log(`   Razón: ${force ? 'Forzado' : !currentColor ? 'Sin color' : 'Imagen cambió'}`);

    // 3. Extraer color de la imagen
    const color = await extractDominantColorHex(imageUrl);

    if (!color) {
      console.log(`   ❌ No se pudo extraer color`);
      return NextResponse.json(
        { error: 'No se pudo extraer el color de la imagen' },
        { status: 500 }
      );
    }

    // 4. Guardar en BD
    const updateQuery = `
      UPDATE app.${tableName}
      SET 
        dominant_color = $1,
        cover_image_url = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING dominant_color
    `;
    
    const updateResult = await db.query(updateQuery, [color, imageUrl, mediaId]);

    console.log(`   ✅ Color guardado: ${color}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      color: color,
      updated: true,
      cached: false,
    });

  } catch (error) {
    console.error('❌ Error en POST /api/media/extract-color:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al extraer color',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
