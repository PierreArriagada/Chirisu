/**
 * @fileoverview API Route para obtener los detalles de un anime.
 * 
 * Esta es una API Route de Next.js que se conecta a la base de datos PostgreSQL
 * para obtener la información de un anime específico y devolverla como JSON.
 * 
 * - Se conecta a la DB usando las credenciales de `process.env.POSTGRES_URL`.
 * - Recibe el 'id' (slug) del anime desde la URL.
 * - Ejecuta una consulta SQL para buscar el anime.
 * - Si lo encuentra, devuelve los datos con un código 200.
 * - Si no lo encuentra, devuelve un error 404.
 */
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Crear un pool de conexiones a la base de datos.
// El pool se crea una vez y se reutiliza en las peticiones.
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false // Necesario para conexiones a servicios en la nube como Vercel/Neon.
  }
});

// PSQL: En un proyecto real, las consultas SQL complejas para unir todas las tablas
// (anime, genres, characters, etc.) se harían aquí. Para este ejemplo,
// mantendremos la consulta simple y nos centraremos en el patrón de conexión y API.

// Esta función maneja las peticiones GET a /api/anime/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const slug = params.id; // El 'id' de la URL es en realidad nuestro slug

  if (!slug) {
    return NextResponse.json({ error: 'Falta el slug del anime' }, { status: 400 });
  }

  try {
    const client = await pool.connect();
    
    // PSQL: Ejemplo de consulta. En una app real, aquí harías un JOIN complejo
    // para obtener todos los datos relacionados (géneros, personajes, etc.).
    const query = `
      SELECT 
        id, 
        title_romaji as title,
        synopsis as description,
        cover_image_url as "imageUrl",
        average_score as rating,
        -- Campos hardcodeados para el ejemplo, deberían venir de la DB
        'Anime' as type,
        'anime-cover-art' as "imageHint",
        1 as ranking,
        12500 as "commentsCount",
        35000 as "listsCount"
      FROM app.anime 
      WHERE title_romaji ILIKE $1 
      LIMIT 1;
    `;
    // Usamos ILIKE para una búsqueda insensible a mayúsculas/minúsculas del slug.
    // Esto es una simplificación. En producción usarías un campo 'slug' dedicado.
    const result = await client.query(query, [`%${slug.replace(/-/g, '%')}%`]);
    
    client.release();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Anime no encontrado' }, { status: 404 });
    }

    // PSQL: Simplificación. Aquí deberías obtener el resto de los datos (details, characters, etc.)
    // con más consultas y construir el objeto completo `mediaData`.
    // Por ahora, solo devolvemos la información básica del título.
    const titleInfo = result.rows[0];
    
    // Mock de datos adicionales para que la página no se rompa
    const fullData = {
        titleInfo: { ...titleInfo, slug },
        details: { type: 'TV', episodes: 24, releaseDate: '2022-10-01', status: 'Finalizado', season: 'Otoño 2022', countryOfOrigin: 'Japón', promotion: 'N/A', producer: 'Bones', licensors: [], genres: ['Acción'], duration: '24 min', rating: 'PG-13', alternativeTitles: [], stats: { score: 9, popularity: 1, favorites: 0, completed: 0, watching: 0, planToWatch: 0 } },
        officialLinks: { officialSites: [], streamingPlatforms: [], fanTranslations: [] },
        characters: [],
        episodes: [],
        reviews: [],
        related: [],
        galleryImages: [],
    };


    return NextResponse.json(fullData);

  } catch (error) {
    console.error('Error en la base de datos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
