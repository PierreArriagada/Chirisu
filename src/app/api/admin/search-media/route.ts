import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

// Configuración del pool de conexiones
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bd_chirisu",
  password: "123456",
  port: 5432,
});

/**
 * GET /api/admin/search-media
 * Busca contenido de cualquier tipo para relacionar
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get("chirisu_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "No autorizado - Token no encontrado" },
        { status: 401 }
      );
    }

    // Decodificar y verificar el token
    let payload: any;
    try {
      const base64Payload = token.split(".")[1];
      payload = JSON.parse(Buffer.from(base64Payload, "base64").toString());

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "Token expirado" }, { status: 401 });
      }
    } catch (decodeError) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verificar que el usuario es admin o moderador
    if (!payload || (!payload.isAdmin && !payload.isModerator)) {
      return NextResponse.json(
        { error: "Acceso denegado - Solo administradores y moderadores" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const mediaType = searchParams.get('type') || 'all'; // anime, manga, novels, etc. o 'all'

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${query}%`;
    const results: any[] = [];

    const types = mediaType === 'all' 
      ? ['anime', 'manga', 'novels', 'donghua', 'manhua', 'manhwa', 'fan_comic']
      : [mediaType];

    // Buscar en cada tipo de media
    for (const type of types) {
      try {
        // Anime tiene 'year', otros tipos tienen 'start_date'
        const dateField = type === 'anime' ? 'year' : 'EXTRACT(YEAR FROM start_date)::integer as year';
        
        const typeResults = await pool.query(
          `SELECT 
             id,
             '${type}' as type,
             title_romaji,
             title_native,
             title_english,
             title_spanish,
             synopsis,
             cover_image_url,
             ${dateField}
           FROM app.${type}
           WHERE deleted_at IS NULL
           AND (
             title_romaji ILIKE $1 OR
             title_native ILIKE $1 OR
             title_english ILIKE $1 OR
             title_spanish ILIKE $1
           )
           LIMIT 10`,
          [searchPattern]
        );

        results.push(...typeResults.rows);
      } catch (error) {
        console.error(`Error searching ${type}:`, error);
        // Continuar con los otros tipos aunque uno falle
      }
    }

    // Ordenar por relevancia (primero coincidencias exactas)
    results.sort((a, b) => {
      const aExact = [a.title_romaji, a.title_spanish, a.title_english]
        .some(t => t?.toLowerCase() === query.toLowerCase());
      const bExact = [b.title_romaji, b.title_spanish, b.title_english]
        .some(t => t?.toLowerCase() === query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return NextResponse.json({
      results: results.slice(0, 20) // Máximo 20 resultados
    });

  } catch (error) {
    console.error("Error searching media:", error);
    return NextResponse.json(
      {
        error: "Error al buscar contenido",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
