import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

// ============================================
// ENDPOINT: GET /api/media/[id]
// Obtener detalles completos de un medio
// Query params: type (anime, manga, novel)
// ============================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'anime';
    const { id } = await params;

    // Validaciones
    if (!['anime', 'manga', 'novel'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de medio inválido. Use: anime, manga, novel' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de medio requerido' },
        { status: 400 }
      );
    }

    const tableName = type === 'novel' ? 'novels' : type;

    // Determinar columna de visibilidad según tipo
    const visibilityColumn = type === 'anime' ? 'is_published' : 'is_approved';

    // Determinar si es un ID numérico o un slug
    const isNumericId = !isNaN(parseInt(id));
    const whereClause = isNumericId 
      ? `m.id = $1` 
      : `m.slug = $1`;

    console.log(`📡 API /media/[id] - ID: ${id}, Es numérico: ${isNumericId}, Type: ${type}`);

    // 1. OBTENER DATOS DEL MEDIO
    const mediaQuery = `
      SELECT 
        m.*,
        ms.code as status_code,
        ms.label_es as status_label,
        u.username as created_by_username,
        u.display_name as created_by_name
      FROM app.${tableName} m
      LEFT JOIN app.media_statuses ms ON m.status_id = ms.id
      LEFT JOIN app.users u ON m.created_by = u.id
      WHERE ${whereClause} AND m.${visibilityColumn} = TRUE AND m.deleted_at IS NULL
    `;

    const mediaResult = await db.query(mediaQuery, [id]);

    if (mediaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Medio no encontrado' },
        { status: 404 }
      );
    }

    const media = mediaResult.rows[0];
    const mediaId = media.id; // ← Guardar el ID numérico real

    // 2. OBTENER GÉNEROS
    const genresQuery = `
      SELECT g.code, g.name_es, g.name_en
      FROM app.media_genres mg
      JOIN app.genres g ON mg.genre_id = g.id
      WHERE mg.titleable_type = $1 AND mg.titleable_id = $2
    `;
    const genresResult = await db.query(genresQuery, [type, mediaId]); // ← Usar mediaId

    // 3. OBTENER ENLACES EXTERNOS
    const linksQuery = `
      SELECT site_name as site, url
      FROM app.external_links
      WHERE linkable_type = $1 AND linkable_id = $2
    `;
    const linksResult = await db.query(linksQuery, [type, mediaId]); // ← Usar mediaId

    // 4. OBTENER TÍTULOS ALTERNATIVOS
    const alternativeTitlesQuery = `
      SELECT language, text
      FROM app.alternative_titles
      WHERE titleable_type = $1 AND titleable_id = $2
      ORDER BY language
    `;
    const alternativeTitlesResult = await db.query(alternativeTitlesQuery, [type, mediaId]);

    // 5. OBTENER ESTUDIOS
    const studiosQuery = `
      SELECT s.id, s.name, ss.is_main_studio
      FROM app.studiable_studios ss
      JOIN app.studios s ON s.id = ss.studio_id
      WHERE ss.studiable_type = $1 AND ss.studiable_id = $2
      ORDER BY ss.is_main_studio DESC, s.name ASC
    `;
    const studiosResult = await db.query(studiosQuery, [type, mediaId]);

    // 6. OBTENER PERSONAJES PRINCIPALES
    const charactersQuery = `
      SELECT c.id, c.name, cc.role
      FROM app.characterable_characters cc
      JOIN app.characters c ON c.id = cc.character_id
      WHERE cc.characterable_type = $1 AND cc.characterable_id = $2
      ORDER BY (cc.role = 'main') DESC, c.name ASC
    `;
    const charactersResult = await db.query(charactersQuery, [type, mediaId]);

    // 7. OBTENER RELACIONES (adaptaciones, secuelas, etc.)
    const relationsQuery = `
      SELECT 
        mr.relation_type,
        mr.target_type,
        mr.target_id,
        CASE 
          WHEN mr.target_type = 'anime' THEN a.title_romaji
          WHEN mr.target_type = 'manga' THEN m.title_romaji
          WHEN mr.target_type = 'novel' THEN n.title_romaji
        END as title,
        CASE 
          WHEN mr.target_type = 'anime' THEN a.slug
          WHEN mr.target_type = 'manga' THEN m.slug
          WHEN mr.target_type = 'novel' THEN n.slug
        END as slug,
        CASE 
          WHEN mr.target_type = 'anime' THEN a.cover_image_url
          WHEN mr.target_type = 'manga' THEN m.cover_image_url
          WHEN mr.target_type = 'novel' THEN n.cover_image_url
        END as cover_image_url
      FROM app.media_relations mr
      LEFT JOIN app.anime a ON mr.target_type = 'anime' AND mr.target_id = a.id
      LEFT JOIN app.manga m ON mr.target_type = 'manga' AND mr.target_id = m.id
      LEFT JOIN app.novels n ON mr.target_type = 'novel' AND mr.target_id = n.id
      WHERE mr.source_type = $1 AND mr.source_id = $2
    `;
    const relationsResult = await db.query(relationsQuery, [type, mediaId]);

    // 8. OBTENER RESEÑAS RECIENTES
    const reviewsQuery = `
      SELECT 
        r.id,
        r.content,
        r.overall_score,
        r.created_at,
        u.username,
        u.display_name,
        u.avatar_url
      FROM app.reviews r
      JOIN app.users u ON u.id = r.user_id
      WHERE r.reviewable_type = $1 
        AND r.reviewable_id = $2 
        AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT 5
    `;
    const reviewsResult = await db.query(reviewsQuery, [type, mediaId]);

    // 9. CONTAR COMENTARIOS
    const commentsQuery = `
      SELECT COUNT(*)::int AS comments_count
      FROM app.comments
      WHERE commentable_type = $1 AND commentable_id = $2 AND deleted_at IS NULL
    `;
    const commentsResult = await db.query(commentsQuery, [type, mediaId]);

    // 10. OBTENER ESTADÍSTICAS DE LISTAS (cuántos usuarios lo tienen)
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE li.status = 'watching' OR li.status = 'reading' OR li.status = 'viendo') as watching_count,
        COUNT(*) FILTER (WHERE li.status = 'completed' OR li.status = 'completado') as completed_count,
        COUNT(*) FILTER (WHERE li.status = 'plan_to_watch' OR li.status = 'plan_to_read' OR li.status = 'pendiente') as plan_to_count,
        COUNT(*) FILTER (
          WHERE li.list_id IN (
            SELECT l.id FROM app.lists l WHERE l.slug = 'favoritos'
          )
        ) as favorites_count
      FROM app.list_items li
      WHERE li.listable_type = $1 AND li.listable_id = $2
    `;
    const statsResult = await db.query(statsQuery, [type, mediaId]); // ← Usar mediaId
    
    console.log(`📊 Stats para ${type} ${mediaId}:`, statsResult.rows[0]);

    // 5. CONSTRUIR RESPUESTA
    const response = {
      id: media.id.toString(),
      title: media.title_romaji || media.title_english || media.title_native,
      titleNative: media.title_native,
      titleRomaji: media.title_romaji,
      titleEnglish: media.title_english,
      synopsis: media.synopsis,
      imageUrl: media.cover_image_url,
      bannerUrl: media.banner_image_url,
      rating: parseFloat(media.average_score) || 0,
      ratingsCount: media.ratings_count || 0,
      ranking: media.ranking || 0,
      popularity: media.popularity || 0,
      type: type,
      status: media.status_label || 'Desconocido',
      statusCode: media.status_code || 'unknown',
      slug: media.slug,
      countryOfOrigin: media.country_of_origin,
      
      // Campos específicos de anime
      ...(type === 'anime' && {
        episodes: media.episode_count,
        season: media.season,
        source: media.source,
        startDate: media.start_date,
        endDate: media.end_date,
      }),
      
      // Campos específicos de manga/novels
      ...(type !== 'anime' && {
        volumes: media.volumes,
        chapters: media.chapters,
      }),

      // Géneros
      genres: genresResult.rows.map((g: any) => ({
        code: g.code,
        nameEs: g.name_es,
        nameEn: g.name_en,
      })),

      // Enlaces externos
      externalLinks: linksResult.rows.map((l: any) => ({
        site: l.site,
        url: l.url,
      })),

      // Títulos alternativos
      alternativeTitles: alternativeTitlesResult.rows.map((alt: any) => ({
        language: alt.language,
        text: alt.text,
      })),

      // Estudios
      studios: studiosResult.rows.map((studio: any) => ({
        id: studio.id,
        name: studio.name,
        isMain: studio.is_main_studio,
      })),

      // Personajes
      characters: charactersResult.rows.map((character: any) => ({
        id: character.id,
        name: character.name,
        role: character.role,
      })),

      // Relaciones (adaptaciones, secuelas, etc.)
      relations: relationsResult.rows.map((relation: any) => ({
        type: relation.relation_type,
        targetType: relation.target_type,
        targetId: relation.target_id,
        title: relation.title,
        slug: relation.slug,
        coverImageUrl: relation.cover_image_url,
      })),

      // Reseñas
      reviews: reviewsResult.rows.map((review: any) => ({
        id: review.id,
        content: review.content,
        overallScore: review.overall_score,
        createdAt: review.created_at,
        user: {
          username: review.username,
          displayName: review.display_name,
          avatarUrl: review.avatar_url,
        },
      })),

      // IDs externos
      malId: media.mal_id,
      anilistId: media.anilist_id,
      kitsuId: media.kitsu_id,

      // Estadísticas
      stats: {
        totalUsers: parseInt(statsResult.rows[0]?.total_users || 0),
        watchingCount: parseInt(statsResult.rows[0]?.watching_count || 0),
        completedCount: parseInt(statsResult.rows[0]?.completed_count || 0),
        planToCount: parseInt(statsResult.rows[0]?.plan_to_count || 0),
        favoritesCount: parseInt(statsResult.rows[0]?.favorites_count || 0),
      },

      commentsCount: commentsResult.rows[0]?.comments_count || 0,

      // Metadatos
      createdBy: media.created_by ? {
        username: media.created_by_username,
        displayName: media.created_by_name,
      } : null,
      isApproved: media.is_approved,
      createdAt: media.created_at,
      updatedAt: media.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('❌ Error en GET /api/media/[id]:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener detalles del medio' },
      { status: 500 }
    );
  }
}
