-- ============================================
-- QUICK START RANKINGS - VERSIÓN CORREGIDA
-- ============================================
-- Este script crea funciones que funcionan INMEDIATAMENTE
-- sin necesidad de crear las vistas materializadas primero.
-- 
-- DIFERENCIAS CON TABLAS:
-- - anime: tiene is_published + is_approved
-- - manga: solo tiene is_approved (NO tiene is_published)
-- - novela: solo tiene is_approved (NO tiene is_published)
-- ============================================

SET search_path TO app, public;

-- ============================================
-- FUNCIÓN 1: RANKING DIARIO
-- ============================================

CREATE OR REPLACE FUNCTION app.get_cached_daily_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    ratings_count INTEGER,
    daily_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    -- Verificar si existe la vista materializada
    IF EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE schemaname = 'app' 
        AND matviewname = 'mv_top_daily_' || p_media_type
    ) THEN
        -- Usar la vista materializada (RÁPIDO)
        RETURN QUERY EXECUTE format(
            'SELECT 
                media_id, 
                title, 
                slug, 
                cover_image_url, 
                average_score, 
                ratings_count, 
                daily_score, 
                rank_position 
            FROM app.mv_top_daily_%I 
            ORDER BY rank_position 
            LIMIT %L',
            p_media_type, p_limit
        );
    ELSE
        -- Calcular en tiempo real (LENTO pero funciona)
        IF p_media_type = 'anime' THEN
            RETURN QUERY
            SELECT
                a.id AS media_id,
                COALESCE(a.title_romaji, a.title_english, a.title_native)::VARCHAR AS title,
                a.slug::VARCHAR,
                a.cover_image_url::VARCHAR,
                a.average_score,
                a.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                    COALESCE(a.popularity, 0) * 0.1
                )::NUMERIC AS daily_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                        COALESCE(a.popularity, 0) * 0.1
                    ) DESC, a.id ASC
                )::BIGINT AS rank_position
            FROM app.anime a
            LEFT JOIN app.list_items li ON li.anime_id = a.id
            LEFT JOIN app.reviews r ON r.anime_id = a.id
            WHERE a.is_approved = TRUE 
              AND a.is_published = TRUE 
              AND a.deleted_at IS NULL
            GROUP BY a.id, a.title_romaji, a.title_english, a.title_native, a.slug, a.cover_image_url, a.average_score, a.ratings_count, a.popularity
            ORDER BY daily_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'manga' THEN
            RETURN QUERY
            SELECT
                m.id AS media_id,
                COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR AS title,
                m.slug::VARCHAR,
                m.cover_image_url::VARCHAR,
                m.average_score,
                m.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                    COALESCE(m.popularity, 0) * 0.1
                )::NUMERIC AS daily_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                        COALESCE(m.popularity, 0) * 0.1
                    ) DESC, m.id ASC
                )::BIGINT AS rank_position
            FROM app.manga m
            LEFT JOIN app.list_items li ON li.manga_id = m.id
            LEFT JOIN app.reviews r ON r.manga_id = m.id
            WHERE m.is_approved = TRUE 
              AND m.deleted_at IS NULL
            GROUP BY m.id, m.title_romaji, m.title_english, m.title_native, m.slug, m.cover_image_url, m.average_score, m.ratings_count, m.popularity
            ORDER BY daily_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'novels' THEN
            RETURN QUERY
            SELECT
                n.id AS media_id,
                COALESCE(n.title_romaji, n.title_english, n.title_native)::VARCHAR AS title,
                n.slug::VARCHAR,
                n.cover_image_url::VARCHAR,
                n.average_score,
                n.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                    COALESCE(n.popularity, 0) * 0.1
                )::NUMERIC AS daily_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '24 hours'), 0) * 10 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '24 hours'), 0) * 20 +
                        COALESCE(n.popularity, 0) * 0.1
                    ) DESC, n.id ASC
                )::BIGINT AS rank_position
            FROM app.novela n
            LEFT JOIN app.list_items li ON li.novela_id = n.id
            LEFT JOIN app.reviews r ON r.novela_id = n.id
            WHERE n.is_approved = TRUE 
              AND n.deleted_at IS NULL
            GROUP BY n.id, n.title_romaji, n.title_english, n.title_native, n.slug, n.cover_image_url, n.average_score, n.ratings_count, n.popularity
            ORDER BY daily_score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCIÓN 2: RANKING SEMANAL
-- ============================================

CREATE OR REPLACE FUNCTION app.get_cached_weekly_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    ratings_count INTEGER,
    weekly_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    -- Verificar si existe la vista materializada
    IF EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE schemaname = 'app' 
        AND matviewname = 'mv_top_weekly_' || p_media_type
    ) THEN
        -- Usar la vista materializada (RÁPIDO)
        RETURN QUERY EXECUTE format(
            'SELECT 
                media_id, 
                title, 
                slug, 
                cover_image_url, 
                average_score, 
                ratings_count, 
                weekly_score, 
                rank_position 
            FROM app.mv_top_weekly_%I 
            ORDER BY rank_position 
            LIMIT %L',
            p_media_type, p_limit
        );
    ELSE
        -- Calcular en tiempo real (LENTO pero funciona)
        IF p_media_type = 'anime' THEN
            RETURN QUERY
            SELECT
                a.id AS media_id,
                COALESCE(a.title_romaji, a.title_english, a.title_native)::VARCHAR AS title,
                a.slug::VARCHAR,
                a.cover_image_url::VARCHAR,
                a.average_score,
                a.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                    COALESCE(a.popularity, 0) * 0.2 +
                    COALESCE(a.favourites, 0) * 0.5
                )::NUMERIC AS weekly_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                        COALESCE(a.popularity, 0) * 0.2 +
                        COALESCE(a.favourites, 0) * 0.5
                    ) DESC, a.id ASC
                )::BIGINT AS rank_position
            FROM app.anime a
            LEFT JOIN app.list_items li ON li.anime_id = a.id
            LEFT JOIN app.reviews r ON r.anime_id = a.id
            WHERE a.is_approved = TRUE 
              AND a.is_published = TRUE 
              AND a.deleted_at IS NULL
            GROUP BY a.id, a.title_romaji, a.title_english, a.title_native, a.slug, a.cover_image_url, a.average_score, a.ratings_count, a.popularity, a.favourites
            ORDER BY weekly_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'manga' THEN
            RETURN QUERY
            SELECT
                m.id AS media_id,
                COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR AS title,
                m.slug::VARCHAR,
                m.cover_image_url::VARCHAR,
                m.average_score,
                m.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                    COALESCE(m.popularity, 0) * 0.2 +
                    COALESCE(m.favourites, 0) * 0.5
                )::NUMERIC AS weekly_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                        COALESCE(m.popularity, 0) * 0.2 +
                        COALESCE(m.favourites, 0) * 0.5
                    ) DESC, m.id ASC
                )::BIGINT AS rank_position
            FROM app.manga m
            LEFT JOIN app.list_items li ON li.manga_id = m.id
            LEFT JOIN app.reviews r ON r.manga_id = m.id
            WHERE m.is_approved = TRUE 
              AND m.deleted_at IS NULL
            GROUP BY m.id, m.title_romaji, m.title_english, m.title_native, m.slug, m.cover_image_url, m.average_score, m.ratings_count, m.popularity, m.favourites
            ORDER BY weekly_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'novels' THEN
            RETURN QUERY
            SELECT
                n.id AS media_id,
                COALESCE(n.title_romaji, n.title_english, n.title_native)::VARCHAR AS title,
                n.slug::VARCHAR,
                n.cover_image_url::VARCHAR,
                n.average_score,
                n.ratings_count::INTEGER,
                (
                    COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                    COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                    COALESCE(n.popularity, 0) * 0.2 +
                    COALESCE(n.favourites, 0) * 0.5
                )::NUMERIC AS weekly_score,
                ROW_NUMBER() OVER (
                    ORDER BY (
                        COALESCE(COUNT(DISTINCT li.id) FILTER (WHERE li.created_at >= NOW() - INTERVAL '7 days'), 0) * 5 +
                        COALESCE(COUNT(DISTINCT r.id) FILTER (WHERE r.created_at >= NOW() - INTERVAL '7 days'), 0) * 15 +
                        COALESCE(n.popularity, 0) * 0.2 +
                        COALESCE(n.favourites, 0) * 0.5
                    ) DESC, n.id ASC
                )::BIGINT AS rank_position
            FROM app.novela n
            LEFT JOIN app.list_items li ON li.novela_id = n.id
            LEFT JOIN app.reviews r ON r.novela_id = n.id
            WHERE n.is_approved = TRUE 
              AND n.deleted_at IS NULL
            GROUP BY n.id, n.title_romaji, n.title_english, n.title_native, n.slug, n.cover_image_url, n.average_score, n.ratings_count, n.popularity, n.favourites
            ORDER BY weekly_score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCIÓN 3: RANKING ALL-TIME (Por puntuación)
-- ============================================

CREATE OR REPLACE FUNCTION app.get_cached_alltime_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    ratings_count INTEGER,
    bayesian_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    -- Verificar si existe la vista materializada
    IF EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE schemaname = 'app' 
        AND matviewname = 'mv_top_alltime_' || p_media_type
    ) THEN
        -- Usar la vista materializada (RÁPIDO)
        RETURN QUERY EXECUTE format(
            'SELECT 
                media_id, 
                title, 
                slug, 
                cover_image_url, 
                average_score, 
                ratings_count, 
                bayesian_score, 
                rank_position 
            FROM app.mv_top_alltime_%I 
            ORDER BY rank_position 
            LIMIT %L',
            p_media_type, p_limit
        );
    ELSE
        -- Calcular en tiempo real (LENTO pero funciona)
        IF p_media_type = 'anime' THEN
            RETURN QUERY
            SELECT
                a.id AS media_id,
                COALESCE(a.title_romaji, a.title_english, a.title_native)::VARCHAR AS title,
                a.slug::VARCHAR,
                a.cover_image_url::VARCHAR,
                a.average_score,
                a.ratings_count::INTEGER,
                a.average_score AS bayesian_score,
                ROW_NUMBER() OVER (ORDER BY a.average_score DESC, a.ratings_count DESC, a.id ASC)::BIGINT AS rank_position
            FROM app.anime a
            WHERE a.is_approved = TRUE 
              AND a.is_published = TRUE 
              AND a.deleted_at IS NULL
              AND a.ratings_count > 0
            ORDER BY a.average_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'manga' THEN
            RETURN QUERY
            SELECT
                m.id AS media_id,
                COALESCE(m.title_romaji, m.title_english, m.title_native)::VARCHAR AS title,
                m.slug::VARCHAR,
                m.cover_image_url::VARCHAR,
                m.average_score,
                m.ratings_count::INTEGER,
                m.average_score AS bayesian_score,
                ROW_NUMBER() OVER (ORDER BY m.average_score DESC, m.ratings_count DESC, m.id ASC)::BIGINT AS rank_position
            FROM app.manga m
            WHERE m.is_approved = TRUE 
              AND m.deleted_at IS NULL
              AND m.ratings_count > 0
            ORDER BY m.average_score DESC
            LIMIT p_limit;

        ELSIF p_media_type = 'novels' THEN
            RETURN QUERY
            SELECT
                n.id AS media_id,
                COALESCE(n.title_romaji, n.title_english, n.title_native)::VARCHAR AS title,
                n.slug::VARCHAR,
                n.cover_image_url::VARCHAR,
                n.average_score,
                n.ratings_count::INTEGER,
                n.average_score AS bayesian_score,
                ROW_NUMBER() OVER (ORDER BY n.average_score DESC, n.ratings_count DESC, n.id ASC)::BIGINT AS rank_position
            FROM app.novela n
            WHERE n.is_approved = TRUE 
              AND n.deleted_at IS NULL
              AND n.ratings_count > 0
            ORDER BY n.average_score DESC
            LIMIT p_limit;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '=== TEST: Top 3 Anime ===' AS test;
SELECT rank_position, title, daily_score 
FROM app.get_cached_daily_ranking('anime', 3);

SELECT '=== TEST: Top 3 Manga ===' AS test;
SELECT rank_position, title, daily_score 
FROM app.get_cached_daily_ranking('manga', 3);

SELECT '=== TEST: Top 3 Novels ===' AS test;
SELECT rank_position, title, daily_score 
FROM app.get_cached_daily_ranking('novels', 3);

SELECT '✅ Funciones creadas correctamente' AS status;
SELECT 'Ahora puedes usar /api/rankings' AS next_step;
SELECT 'Para mejor performance, ejecuta: docs/OPTIMIZED-RANKING-SYSTEM.sql' AS recommendation;

-- ============================================
-- FIN
-- ============================================
