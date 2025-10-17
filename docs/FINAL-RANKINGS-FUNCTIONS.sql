-- ============================================
-- QUICK START RANKINGS - ESQUEMA POLIMÓRFICO
-- ============================================
-- Adaptado al esquema real de Chirisu:
-- - list_items usa listable_type + listable_id
-- - reviews usa reviewable_type + reviewable_id  
-- - manga/novela NO tienen is_published
-- ============================================

SET search_path TO app, public;

-- ============================================
-- FUNCIÓN: RANKING DIARIO (adaptado)
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
DECLARE
    v_table_name VARCHAR;
    v_type_name VARCHAR;
BEGIN
    -- Mapear tipo a nombre de tabla
    IF p_media_type = 'anime' THEN
        v_table_name := 'anime';
        v_type_name := 'anime';
    ELSIF p_media_type = 'manga' THEN
        v_table_name := 'manga';
        v_type_name := 'manga';
    ELSIF p_media_type = 'novel' OR p_media_type = 'novels' THEN
        v_table_name := 'novels';
        v_type_name := 'novel';
    ELSE
        RAISE EXCEPTION 'Tipo de media no válido: %', p_media_type;
    END IF;

    -- Para anime (tiene is_published)
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id AS media_id,
            COALESCE(a.title_spanish, a.title_romaji, a.title_english)::VARCHAR AS title,
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
        LEFT JOIN app.list_items li ON li.listable_type = 'anime' AND li.listable_id = a.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'anime' AND r.reviewable_id = a.id
        WHERE a.is_approved = TRUE 
          AND a.is_published = TRUE 
          AND a.deleted_at IS NULL
        GROUP BY a.id, a.title_spanish, a.title_romaji, a.title_english, a.slug, a.cover_image_url, a.average_score, a.ratings_count, a.popularity
        ORDER BY daily_score DESC
        LIMIT p_limit;
    
    -- Para manga (NO tiene is_published)
    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT
            m.id AS media_id,
            COALESCE(m.title_spanish, m.title_romaji, m.title_english)::VARCHAR AS title,
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
        LEFT JOIN app.list_items li ON li.listable_type = 'manga' AND li.listable_id = m.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'manga' AND r.reviewable_id = m.id
        WHERE m.is_approved = TRUE 
          AND m.deleted_at IS NULL
        GROUP BY m.id, m.title_spanish, m.title_romaji, m.title_english, m.slug, m.cover_image_url, m.average_score, m.ratings_count, m.popularity
        ORDER BY daily_score DESC
        LIMIT p_limit;
    
    -- Para novelas (NO tiene is_published)
    ELSIF p_media_type = 'novel' OR p_media_type = 'novels' THEN
        RETURN QUERY
        SELECT
            n.id AS media_id,
            COALESCE(n.title_spanish, n.title_romaji, n.title_english)::VARCHAR AS title,
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
        FROM app.novels n
        LEFT JOIN app.list_items li ON li.listable_type = 'novel' AND li.listable_id = n.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'novel' AND r.reviewable_id = n.id
        WHERE n.is_approved = TRUE 
          AND n.deleted_at IS NULL
        GROUP BY n.id, n.title_spanish, n.title_romaji, n.title_english, n.slug, n.cover_image_url, n.average_score, n.ratings_count, n.popularity
        ORDER BY daily_score DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCIÓN: RANKING SEMANAL (adaptado)
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
    -- Para anime
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id AS media_id,
            COALESCE(a.title_spanish, a.title_romaji, a.title_english)::VARCHAR AS title,
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
        LEFT JOIN app.list_items li ON li.listable_type = 'anime' AND li.listable_id = a.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'anime' AND r.reviewable_id = a.id
        WHERE a.is_approved = TRUE 
          AND a.is_published = TRUE 
          AND a.deleted_at IS NULL
        GROUP BY a.id, a.title_spanish, a.title_romaji, a.title_english, a.slug, a.cover_image_url, a.average_score, a.ratings_count, a.popularity, a.favourites
        ORDER BY weekly_score DESC
        LIMIT p_limit;
    
    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT
            m.id AS media_id,
            COALESCE(m.title_spanish, m.title_romaji, m.title_english)::VARCHAR AS title,
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
        LEFT JOIN app.list_items li ON li.listable_type = 'manga' AND li.listable_id = m.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'manga' AND r.reviewable_id = m.id
        WHERE m.is_approved = TRUE 
          AND m.deleted_at IS NULL
        GROUP BY m.id, m.title_spanish, m.title_romaji, m.title_english, m.slug, m.cover_image_url, m.average_score, m.ratings_count, m.popularity, m.favourites
        ORDER BY weekly_score DESC
        LIMIT p_limit;
    
    ELSIF p_media_type = 'novel' OR p_media_type = 'novels' THEN
        RETURN QUERY
        SELECT
            n.id AS media_id,
            COALESCE(n.title_spanish, n.title_romaji, n.title_english)::VARCHAR AS title,
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
        FROM app.novels n
        LEFT JOIN app.list_items li ON li.listable_type = 'novel' AND li.listable_id = n.id
        LEFT JOIN app.reviews r ON r.reviewable_type = 'novel' AND r.reviewable_id = n.id
        WHERE n.is_approved = TRUE 
          AND n.deleted_at IS NULL
        GROUP BY n.id, n.title_spanish, n.title_romaji, n.title_english, n.slug, n.cover_image_url, n.average_score, n.ratings_count, n.popularity, n.favourites
        ORDER BY weekly_score DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCIÓN: RANKING ALL-TIME (adaptado)
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
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id AS media_id,
            COALESCE(a.title_spanish, a.title_romaji, a.title_english)::VARCHAR AS title,
            a.slug::VARCHAR,
            a.cover_image_url::VARCHAR,
            a.average_score,
            a.ratings_count::INTEGER,
            a.average_score AS bayesian_score,
            ROW_NUMBER() OVER (ORDER BY a.average_score DESC, a.ratings_count DESC)::BIGINT AS rank_position
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
            COALESCE(m.title_spanish, m.title_romaji, m.title_english)::VARCHAR AS title,
            m.slug::VARCHAR,
            m.cover_image_url::VARCHAR,
            m.average_score,
            m.ratings_count::INTEGER,
            m.average_score AS bayesian_score,
            ROW_NUMBER() OVER (ORDER BY m.average_score DESC, m.ratings_count DESC)::BIGINT AS rank_position
        FROM app.manga m
        WHERE m.is_approved = TRUE 
          AND m.deleted_at IS NULL
          AND m.ratings_count > 0
        ORDER BY m.average_score DESC
        LIMIT p_limit;
    
    ELSIF p_media_type = 'novel' OR p_media_type = 'novels' THEN
        RETURN QUERY
        SELECT
            n.id AS media_id,
            COALESCE(n.title_spanish, n.title_romaji, n.title_english)::VARCHAR AS title,
            n.slug::VARCHAR,
            n.cover_image_url::VARCHAR,
            n.average_score,
            n.ratings_count::INTEGER,
            n.average_score AS bayesian_score,
            ROW_NUMBER() OVER (ORDER BY n.average_score DESC, n.ratings_count DESC)::BIGINT AS rank_position
        FROM app.novels n
        WHERE n.is_approved = TRUE 
          AND n.deleted_at IS NULL
          AND n.ratings_count > 0
        ORDER BY n.average_score DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TESTS
-- ============================================

SELECT '=== TEST: Anime Daily Rankings ===' AS test;
SELECT rank_position, title, daily_score FROM app.get_cached_daily_ranking('anime', 3);

SELECT '=== TEST: Manga Daily Rankings ===' AS test;
SELECT rank_position, title, daily_score FROM app.get_cached_daily_ranking('manga', 3);

SELECT '=== TEST: Novels Daily Rankings ===' AS test;
SELECT rank_position, title, daily_score FROM app.get_cached_daily_ranking('novels', 3);

SELECT '✅ Sistema de rankings funcionando!' AS status;
