import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * GET /api/voice-actors
 * 
 * Query params:
 * - search: texto de búsqueda (opcional)
 * - language: 'japanese' | 'spanish' | 'english' (opcional)
 * - limit: número de resultados (default: 20)
 * 
 * Ejemplos:
 * - /api/voice-actors?search=Kana&language=japanese&limit=10
 * - /api/voice-actors?search=Mario&language=spanish
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const language = searchParams.get('language');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = `
      SELECT 
        id,
        name_native as name,
        name_romaji,
        language,
        image_url,
        date_of_birth,
        created_at
      FROM app.voice_actors
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    // Filtro por búsqueda
    if (search && search.length >= 2) {
      query += ` AND (
        name_native ILIKE $${paramCount} OR 
        name_romaji ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Filtro por idioma
    if (language) {
      query += ` AND language = $${paramCount}`;
      params.push(language);
      paramCount++;
    }

    query += ` ORDER BY name_native ASC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);

    const voiceActors = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      nameRomaji: row.name_romaji,
      language: row.language,
      imageUrl: row.image_url,
      birthDate: row.date_of_birth,
    }));

    return NextResponse.json({
      count: voiceActors.length,
      voiceActors
    });

  } catch (error) {
    console.error('Error en /api/voice-actors:', error);
    return NextResponse.json(
      { error: 'Error al buscar voice actors' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice-actors
 * 
 * Body:
 * {
 *   name: string,
 *   nameRomaji?: string,
 *   language: 'japanese' | 'spanish' | 'english',
 *   imageUrl?: string,
 *   birthDate?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nameRomaji, language, imageUrl, birthDate } = body;

    if (!name || !language) {
      return NextResponse.json(
        { error: 'Nombre y idioma son requeridos' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO app.voice_actors 
        (name_native, name_romaji, language, image_url, date_of_birth, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, name_native as name, name_romaji, language, image_url, date_of_birth`,
      [name, nameRomaji || null, language, imageUrl || null, birthDate || null]
    );

    const voiceActor = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Voice actor creado exitosamente',
      voiceActor: {
        id: voiceActor.id,
        name: voiceActor.name,
        nameRomaji: voiceActor.name_romaji,
        language: voiceActor.language,
        imageUrl: voiceActor.image_url,
        birthDate: voiceActor.date_of_birth,
      }
    });

  } catch (error) {
    console.error('Error al crear voice actor:', error);
    return NextResponse.json(
      { error: 'Error al crear voice actor' },
      { status: 500 }
    );
  }
}
