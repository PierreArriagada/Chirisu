import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/database';

/**
 * API para obtener datos actuales de contenido para edición/contribución
 * 
 * GET /api/get-media-for-edit?type=[type]&id=[id]
 * - Obtiene todos los datos del contenido específico para permitir edición
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    console.log('🔍 API get-media-for-edit - Parámetros recibidos:', { type, id });

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Parámetros type e id son requeridos' },
        { status: 400 }
      );
    }

    // Mapear tipo a nombre de tabla
    const tableMap: Record<string, string> = {
      anime: 'anime',
      manga: 'manga',
      novel: 'novels',
      novela: 'novels',
      donghua: 'donghua',
      manhua: 'manhua',
      manhwa: 'manhwa',
      'fan-comic': 'fan_comics',
      fan_comic: 'fan_comics',
    };

    const tableName = tableMap[type];
    console.log('📊 Tabla mapeada:', tableName);
    
    if (!tableName) {
      console.error('❌ Tipo inválido:', type);
      return NextResponse.json(
        { error: 'Tipo de contenido inválido' },
        { status: 400 }
      );
    }

    // Obtener datos del contenido (buscar por ID o por slug)
    let result = await pool.query(
      `SELECT * FROM app.${tableName} WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    // Si no se encuentra por ID numérico, intentar buscar por slug
    if (result.rows.length === 0) {
      console.log('🔍 No encontrado por ID, buscando por slug...');
      result = await pool.query(
        `SELECT * FROM app.${tableName} WHERE slug = $1 AND deleted_at IS NULL`,
        [id]
      );
    }

    console.log('📋 Filas encontradas:', result.rows.length);

    if (result.rows.length === 0) {
      console.error('❌ Contenido no encontrado en tabla:', tableName, 'ID/Slug:', id);
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      );
    }

    const content = result.rows[0];
    console.log('✅ Contenido encontrado:', { id: content.id, title: content.title });

    // Obtener géneros asignados
    // Nota: media_genres usa titleable_type y titleable_id (polimórfico)
    const genresResult = await pool.query(
      `SELECT g.id, g.name_es, g.name_en, g.code
       FROM app.media_genres mg
       JOIN app.genres g ON mg.genre_id = g.id
       WHERE mg.titleable_type = $1 AND mg.titleable_id = $2`,
      [type === 'novela' || type === 'novel' ? 'novel' : type === 'fan-comic' ? 'fan_comic' : type, id]
    );

    const genres = genresResult.rows.map(row => ({
      id: row.id,
      name: row.name_es || row.name_en || row.code,
      code: row.code,
    }));

    // Obtener personajes asociados
    const charactersResult = await pool.query(
      `SELECT c.id, c.name, c.name_romaji, c.name_native, c.description, c.image_url, 
              cc.role, c.favorites_count
       FROM app.characterable_characters cc
       JOIN app.characters c ON cc.character_id = c.id
       WHERE cc.characterable_type = $1 AND cc.characterable_id = $2
       ORDER BY cc.role DESC, c.favorites_count DESC`,
      [type === 'novela' || type === 'novel' ? 'novel' : type === 'fan-comic' ? 'fan_comic' : type, id]
    );

    const characters = charactersResult.rows.map(row => ({
      id: row.id,
      name: row.name || row.name_romaji || row.name_native,
      nameRomaji: row.name_romaji,
      nameNative: row.name_native,
      description: row.description,
      imageUrl: row.image_url,
      role: row.role, // 'main' o 'supporting'
    }));

    // Obtener staff (personal)
    const staffResult = await pool.query(
      `SELECT s.id, s.name, s.name_romaji, s.name_native, s.image_url, ss.role
       FROM app.staffable_staff ss
       JOIN app.staff s ON ss.staff_id = s.id
       WHERE ss.staffable_type = $1 AND ss.staffable_id = $2
       ORDER BY ss.role`,
      [type === 'novela' || type === 'novel' ? 'novel' : type === 'fan-comic' ? 'fan_comic' : type, id]
    );

    const staff = staffResult.rows.map(row => ({
      id: row.id,
      name: row.name || row.name_romaji || row.name_native,
      role: row.role, // 'director', 'author', 'illustrator', etc.
      imageUrl: row.image_url,
    }));

    // Obtener estudios
    const studiosResult = await pool.query(
      `SELECT s.id, s.name
       FROM app.studiable_studios ss
       JOIN app.studios s ON ss.studio_id = s.id
       WHERE ss.studiable_type = $1 AND ss.studiable_id = $2`,
      [type === 'novela' || type === 'novel' ? 'novel' : type === 'fan-comic' ? 'fan_comic' : type, id]
    );

    const studios = studiosResult.rows.map(row => ({
      id: row.id,
      name: row.name,
    }));

    // Obtener enlaces externos
    const linksResult = await pool.query(
      `SELECT id, site_name, url
       FROM app.external_links
       WHERE linkable_type = $1 AND linkable_id = $2
       ORDER BY site_name`,
      [type === 'novela' || type === 'novel' ? 'novel' : type === 'fan-comic' ? 'fan_comic' : type, id]
    );

    const externalLinks = linksResult.rows.map(row => ({
      id: row.id,
      platform: row.site_name, // Mapear site_name a platform
      url: row.url,
      label: row.site_name, // Usar site_name como label también
    }));

    return NextResponse.json({
      success: true,
      content: {
        id: content.id.toString(),
        // Títulos
        title: content.title_romaji || content.title_english || content.title_spanish || content.title_native,
        titleRomaji: content.title_romaji,
        titleEnglish: content.title_english,
        titleSpanish: content.title_spanish,
        titleNative: content.title_native,
        alternativeTitles: content.alternative_titles,
        
        // Información básica
        synopsis: content.synopsis,
        coverImage: content.cover_image_url || content.cover_image,
        bannerImage: content.banner_image_url || content.banner_image,
        trailerUrl: content.trailer_url,
        
        // Detalles de anime/donghua
        totalEpisodes: content.episode_count || content.total_episodes,
        episodeDuration: content.duration || content.episode_duration,
        
        // Detalles de manga/novela
        totalChapters: content.chapter_count || content.total_chapters,
        totalVolumes: content.volume_count || content.total_volumes,
        
        // Información general
        status: content.status,
        startDate: content.start_date,
        endDate: content.end_date,
        season: content.season,
        year: content.season_year || content.year,
        
        // Créditos
        studio: content.studio,
        source: content.source,
        author: content.author,
        illustrator: content.illustrator,
        publisher: content.publisher,
        serialization: content.serialization,
        
        // Clasificación
        ageRating: content.age_rating,
        averageRating: content.average_rating,
        
        // URLs
        officialWebsite: content.official_website,
        
        // Estado de publicación
        isPublished: content.is_published,
        isApproved: content.is_approved,
        
        // Metadatos
        createdAt: content.created_at,
        updatedAt: content.updated_at,
        
        // Géneros
        genres,
        
        // Personajes
        characters,
        
        // Staff (directores, autores, etc.)
        staff,
        
        // Estudios
        studios,
        
        // Enlaces externos (scan, sitios oficiales, etc.)
        externalLinks,
      },
    });

  } catch (error: any) {
    console.error('❌ Error en GET /api/get-media-for-edit:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
