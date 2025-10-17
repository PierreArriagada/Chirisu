-- ============================================
-- SCRIPT: Implementación Sistema de Rankings, Favoritos y Trailers
-- Fecha: 13 de Octubre, 2025
-- Descripción: Tablas y funciones para página /anime completa
-- ============================================

SET search_path TO app, public;

-- ============================================
-- SECCIÓN 1: SISTEMA DE FAVORITOS
-- ============================================

-- Tabla polimórfica para favoritos
CREATE TABLE IF NOT EXISTS user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    favorable_type VARCHAR(20) NOT NULL, -- 'character', 'voice_actor', 'anime', 'manga', 'novel'
    favorable_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, favorable_type, favorable_id)
);

COMMENT ON TABLE user_favorites IS 'Favoritos polimórficos: personajes, actores de voz, medios';
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_polymorphic ON user_favorites(favorable_type, favorable_id);

-- ============================================
-- SECCIÓN 2: PERSONAJES Y ACTORES DE VOZ
-- ============================================

-- Ampliar tabla de personajes
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS name_romaji VARCHAR(255),
ADD COLUMN IF NOT EXISTS name_native VARCHAR(255),
ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Agregar índice único para slug si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'characters_slug_key') THEN
        ALTER TABLE characters ADD CONSTRAINT characters_slug_key UNIQUE (slug);
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_characters_favorites ON characters(favorites_count DESC);

-- Crear tabla de actores de voz
CREATE TABLE IF NOT EXISTS voice_actors (
    id SERIAL PRIMARY KEY,
    name_romaji VARCHAR(255),
    name_native VARCHAR(255),
    image_url VARCHAR(500),
    language VARCHAR(10) DEFAULT 'ja', -- 'ja', 'es', 'en', etc.
    bio TEXT,
    favorites_count INTEGER DEFAULT 0,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE voice_actors IS 'Actores de voz (seiyuu y dobladores)';
CREATE INDEX IF NOT EXISTS idx_voice_actors_favorites ON voice_actors(favorites_count DESC);
CREATE INDEX IF NOT EXISTS idx_voice_actors_language ON voice_actors(language);

-- Relación characters <-> voice_actors
CREATE TABLE IF NOT EXISTS character_voice_actors (
    character_id INTEGER REFERENCES characters(id) ON DELETE CASCADE,
    voice_actor_id INTEGER REFERENCES voice_actors(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
    media_id INTEGER NOT NULL,
    PRIMARY KEY (character_id, voice_actor_id, media_type, media_id)
);

COMMENT ON TABLE character_voice_actors IS 'Qué actor de voz interpreta a qué personaje en qué medio';

-- ============================================
-- SECCIÓN 3: SISTEMA DE TRAILERS
-- ============================================

-- Tabla para trailers de medios
CREATE TABLE IF NOT EXISTS media_trailers (
    id BIGSERIAL PRIMARY KEY,
    mediable_type VARCHAR(20) NOT NULL,
    mediable_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL, -- YouTube, Vimeo, etc.
    thumbnail_url VARCHAR(500),
    views_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE media_trailers IS 'Trailers de anime/manga/novels con tracking de vistas';
CREATE INDEX IF NOT EXISTS idx_trailers_polymorphic ON media_trailers(mediable_type, mediable_id);
CREATE INDEX IF NOT EXISTS idx_trailers_views ON media_trailers(views_count DESC);

-- Tabla para tracking de vistas individuales (evitar bots)
CREATE TABLE IF NOT EXISTS trailer_views (
    id BIGSERIAL PRIMARY KEY,
    trailer_id BIGINT REFERENCES media_trailers(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL, -- NULL si no autenticado
    ip_address VARCHAR(45), -- IPv4 o IPv6
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255) -- Para usuarios no autenticados
);

COMMENT ON TABLE trailer_views IS 'Tracking de vistas de trailers con deduplicación';
CREATE INDEX IF NOT EXISTS idx_trailer_views_trailer ON trailer_views(trailer_id);
CREATE INDEX IF NOT EXISTS idx_trailer_views_session ON trailer_views(session_id, trailer_id);

-- ============================================
-- SECCIÓN 4: CACHE DE RANKINGS
-- ============================================

-- Tabla para cachear rankings calculados
CREATE TABLE IF NOT EXISTS rankings_cache (
    id SERIAL PRIMARY KEY,
    ranking_type VARCHAR(50) NOT NULL, -- 'top_daily', 'top_weekly', 'top_monthly', 'top_all_time'
    media_type VARCHAR(20) NOT NULL, -- 'anime', 'manga', 'novel'
    media_id BIGINT NOT NULL,
    rank_position INTEGER NOT NULL,
    score NUMERIC(10,2),
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE (ranking_type, media_type, rank_position)
);

COMMENT ON TABLE rankings_cache IS 'Rankings precalculados para optimizar performance';
CREATE INDEX IF NOT EXISTS idx_rankings_cache_lookup ON rankings_cache(ranking_type, media_type, expires_at);

-- ============================================
-- SECCIÓN 5: FUNCIONES DE CÁLCULO DE RANKINGS
-- ============================================

-- Función para Top Diario
CREATE OR REPLACE FUNCTION calculate_daily_ranking(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    daily_score NUMERIC(10,2)
) AS $$
DECLARE
    v_table_name VARCHAR(20);
    v_visibility_column VARCHAR(20);
BEGIN
    -- Determinar tabla y columna de visibilidad
    v_table_name := CASE 
        WHEN p_media_type = 'novel' THEN 'novels'
        ELSE p_media_type
    END;
    
    v_visibility_column := CASE 
        WHEN p_media_type = 'anime' THEN 'is_published'
        ELSE 'is_approved'
    END;

    RETURN QUERY EXECUTE format('
        WITH daily_activity AS (
            SELECT 
                li.listable_id as media_id,
                COUNT(*) * 10 as activity_points
            FROM app.list_items li
            WHERE li.listable_type = $1
              AND li.created_at >= CURRENT_DATE
            GROUP BY li.listable_id
        ),
        daily_ratings AS (
            SELECT
                r.reviewable_id as media_id,
                AVG(r.overall_score) * 5 as rating_points
            FROM app.reviews r
            WHERE r.reviewable_type = $1
              AND r.created_at >= CURRENT_DATE
            GROUP BY r.reviewable_id
        )
        SELECT 
            m.id::BIGINT as media_id,
            COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
            m.cover_image_url::VARCHAR(800),
            m.average_score,
            (COALESCE(da.activity_points, 0) + COALESCE(dr.rating_points, 0) + (m.average_score * 2))::NUMERIC(10,2) as daily_score
        FROM app.%I m
        LEFT JOIN daily_activity da ON m.id = da.media_id
        LEFT JOIN daily_ratings dr ON m.id = dr.media_id
        WHERE m.%I = TRUE 
          AND m.deleted_at IS NULL
        ORDER BY daily_score DESC, m.average_score DESC
        LIMIT $2
    ', v_table_name, v_visibility_column)
    USING p_media_type, p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para Top Semanal
CREATE OR REPLACE FUNCTION calculate_weekly_ranking(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    weekly_score NUMERIC(10,2)
) AS $$
DECLARE
    v_table_name VARCHAR(20);
    v_visibility_column VARCHAR(20);
BEGIN
    v_table_name := CASE 
        WHEN p_media_type = 'novel' THEN 'novels'
        ELSE p_media_type
    END;
    
    v_visibility_column := CASE 
        WHEN p_media_type = 'anime' THEN 'is_published'
        ELSE 'is_approved'
    END;

    RETURN QUERY EXECUTE format('
        WITH weekly_activity AS (
            SELECT 
                li.listable_id as media_id,
                COUNT(*) * 5 as activity_points
            FROM app.list_items li
            WHERE li.listable_type = $1
              AND li.created_at >= CURRENT_DATE - INTERVAL ''7 days''
            GROUP BY li.listable_id
        ),
        weekly_ratings AS (
            SELECT
                r.reviewable_id as media_id,
                AVG(r.overall_score) * 3 as rating_points,
                COUNT(*) as reviews_count
            FROM app.reviews r
            WHERE r.reviewable_type = $1
              AND r.created_at >= CURRENT_DATE - INTERVAL ''7 days''
            GROUP BY r.reviewable_id
        )
        SELECT 
            m.id::BIGINT as media_id,
            COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
            m.cover_image_url::VARCHAR(800),
            m.average_score,
            (COALESCE(wa.activity_points, 0) + COALESCE(wr.rating_points, 0) + (m.average_score * 3))::NUMERIC(10,2) as weekly_score
        FROM app.%I m
        LEFT JOIN weekly_activity wa ON m.id = wa.media_id
        LEFT JOIN weekly_ratings wr ON m.id = wr.media_id
        WHERE m.%I = TRUE 
          AND m.deleted_at IS NULL
        ORDER BY weekly_score DESC, m.average_score DESC
        LIMIT $2
    ', v_table_name, v_visibility_column)
    USING p_media_type, p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para Top de Todos los Tiempos
CREATE OR REPLACE FUNCTION get_top_all_time(p_media_type VARCHAR(20), p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR(255),
    cover_image_url VARCHAR(800),
    average_score NUMERIC(5,2),
    ratings_count INTEGER
) AS $$
DECLARE
    v_table_name VARCHAR(20);
    v_visibility_column VARCHAR(20);
BEGIN
    v_table_name := CASE 
        WHEN p_media_type = 'novel' THEN 'novels'
        ELSE p_media_type
    END;
    
    v_visibility_column := CASE 
        WHEN p_media_type = 'anime' THEN 'is_published'
        ELSE 'is_approved'
    END;

    RETURN QUERY EXECUTE format('
        SELECT 
            m.id::BIGINT as media_id,
            COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR(255) as title,
            m.cover_image_url::VARCHAR(800),
            m.average_score,
            m.ratings_count::INTEGER
        FROM app.%I m
        WHERE m.%I = TRUE 
          AND m.deleted_at IS NULL
          AND m.average_score > 0
          AND m.ratings_count >= 10
        ORDER BY m.average_score DESC, m.ratings_count DESC
        LIMIT $1
    ', v_table_name, v_visibility_column)
    USING p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para Top Personajes
CREATE OR REPLACE FUNCTION get_top_characters(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    character_id INTEGER,
    character_name VARCHAR(255),
    character_image VARCHAR(500),
    character_slug VARCHAR(255),
    favorites_count INTEGER,
    appearances_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH character_appearances AS (
        SELECT 
            cc.character_id,
            COUNT(DISTINCT (cc.characterable_type, cc.characterable_id)) as appearances
        FROM app.characterable_characters cc
        GROUP BY cc.character_id
    )
    SELECT 
        c.id as character_id,
        COALESCE(c.name_romaji, c.name, c.name_native)::VARCHAR(255) as character_name,
        c.image_url::VARCHAR(500) as character_image,
        c.slug::VARCHAR(255) as character_slug,
        c.favorites_count::INTEGER,
        COALESCE(ca.appearances, 0) as appearances_count
    FROM app.characters c
    LEFT JOIN character_appearances ca ON c.id = ca.character_id
    WHERE c.favorites_count > 0
    ORDER BY c.favorites_count DESC, ca.appearances DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Función para Top Trailers Diario
CREATE OR REPLACE FUNCTION get_top_trailers_daily(p_limit INTEGER DEFAULT 6)
RETURNS TABLE (
    trailer_id BIGINT,
    title VARCHAR(255),
    thumbnail_url VARCHAR(500),
    url TEXT,
    views_count INTEGER,
    media_title VARCHAR(255),
    media_id BIGINT,
    media_type VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_views AS (
        SELECT 
            tv.trailer_id,
            COUNT(*) as daily_views
        FROM app.trailer_views tv
        WHERE tv.viewed_at >= CURRENT_DATE
        GROUP BY tv.trailer_id
    )
    SELECT 
        mt.id as trailer_id,
        mt.title::VARCHAR(255),
        mt.thumbnail_url::VARCHAR(500),
        mt.url,
        COALESCE(dv.daily_views, 0)::INTEGER as views_count,
        CASE 
            WHEN mt.mediable_type = 'anime' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.anime WHERE id = mt.mediable_id)
            WHEN mt.mediable_type = 'manga' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.manga WHERE id = mt.mediable_id)
            WHEN mt.mediable_type = 'novel' THEN (SELECT COALESCE(title_romaji, title_english, title_native) FROM app.novels WHERE id = mt.mediable_id)
        END::VARCHAR(255) as media_title,
        mt.mediable_id as media_id,
        mt.mediable_type::VARCHAR(20) as media_type
    FROM app.media_trailers mt
    LEFT JOIN daily_views dv ON mt.id = dv.trailer_id
    ORDER BY views_count DESC, mt.views_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FINALIZACIÓN
-- ============================================

-- Comentarios finales
COMMENT ON FUNCTION calculate_daily_ranking IS 'Calcula ranking diario basado en actividad reciente y ratings';
COMMENT ON FUNCTION calculate_weekly_ranking IS 'Calcula ranking semanal con ponderación de actividad y reviews';
COMMENT ON FUNCTION get_top_all_time IS 'Obtiene top histórico basado en average_score y ratings_count';
COMMENT ON FUNCTION get_top_characters IS 'Obtiene personajes más populares por favoritos y apariciones';
COMMENT ON FUNCTION get_top_trailers_daily IS 'Obtiene trailers más vistos del día';

-- Verificación
DO $$
BEGIN
    RAISE NOTICE '✅ Tablas creadas: user_favorites, voice_actors, character_voice_actors, media_trailers, trailer_views, rankings_cache';
    RAISE NOTICE '✅ Funciones creadas: calculate_daily_ranking, calculate_weekly_ranking, get_top_all_time, get_top_characters, get_top_trailers_daily';
    RAISE NOTICE '✅ Script completado exitosamente';
END$$;
