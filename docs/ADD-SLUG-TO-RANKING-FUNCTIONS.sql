-- ============================================
-- Script para AGREGAR SLUG a funciones de ranking
-- ============================================
-- Este script modifica las funciones de ranking para incluir
-- el campo slug en los resultados
-- ============================================

-- ============================================
-- IMPORTANTE: Primero hacer DROP de las funciones existentes
-- ============================================
DROP FUNCTION IF EXISTS app.calculate_daily_ranking(character varying, integer);
DROP FUNCTION IF EXISTS app.calculate_weekly_ranking(character varying, integer);
DROP FUNCTION IF EXISTS app.get_top_all_time(character varying, integer);

-- ============================================
-- 1. Modificar calculate_daily_ranking para incluir slug
-- ============================================
CREATE OR REPLACE FUNCTION app.calculate_daily_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    daily_score NUMERIC
) AS $$
BEGIN
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id,
            COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
            a.slug,
            a.cover_image_url,
            a.average_score,
            (
                -- Score basado en actividad en las últimas 24 horas
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'anime' 
                 AND li.listable_id = a.id 
                 AND li.created_at > NOW() - INTERVAL '24 hours') * 10 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'anime' 
                 AND r.reviewable_id = a.id 
                 AND r.created_at > NOW() - INTERVAL '24 hours') * 20 +
                a.popularity * 0.1
            )::NUMERIC AS daily_score
        FROM app.anime a
        WHERE a.is_published = TRUE AND a.deleted_at IS NULL
        ORDER BY daily_score DESC, a.average_score DESC
        LIMIT p_limit;

    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT
            m.id,
            COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
            m.slug,
            m.cover_image_url,
            m.average_score,
            (
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'manga' 
                 AND li.listable_id = m.id 
                 AND li.created_at > NOW() - INTERVAL '24 hours') * 10 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'manga' 
                 AND r.reviewable_id = m.id 
                 AND r.created_at > NOW() - INTERVAL '24 hours') * 20 +
                m.popularity * 0.1
            )::NUMERIC AS daily_score
        FROM app.manga m
        WHERE m.is_approved = TRUE AND m.deleted_at IS NULL
        ORDER BY daily_score DESC, m.average_score DESC
        LIMIT p_limit;

    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT
            n.id,
            COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
            n.slug,
            n.cover_image_url,
            n.average_score,
            (
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'novel' 
                 AND li.listable_id = n.id 
                 AND li.created_at > NOW() - INTERVAL '24 hours') * 10 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'novel' 
                 AND r.reviewable_id = n.id 
                 AND r.created_at > NOW() - INTERVAL '24 hours') * 20 +
                n.popularity * 0.1
            )::NUMERIC AS daily_score
        FROM app.novels n
        WHERE n.is_approved = TRUE AND n.deleted_at IS NULL
        ORDER BY daily_score DESC, n.average_score DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Modificar calculate_weekly_ranking para incluir slug
-- ============================================
CREATE OR REPLACE FUNCTION app.calculate_weekly_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    weekly_score NUMERIC
) AS $$
BEGIN
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id,
            COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
            a.slug,
            a.cover_image_url,
            a.average_score,
            (
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'anime' 
                 AND li.listable_id = a.id 
                 AND li.created_at > NOW() - INTERVAL '7 days') * 5 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'anime' 
                 AND r.reviewable_id = a.id 
                 AND r.created_at > NOW() - INTERVAL '7 days') * 15 +
                a.popularity * 0.5
            )::NUMERIC AS weekly_score
        FROM app.anime a
        WHERE a.is_published = TRUE AND a.deleted_at IS NULL
        ORDER BY weekly_score DESC, a.average_score DESC
        LIMIT p_limit;

    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT
            m.id,
            COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
            m.slug,
            m.cover_image_url,
            m.average_score,
            (
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'manga' 
                 AND li.listable_id = m.id 
                 AND li.created_at > NOW() - INTERVAL '7 days') * 5 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'manga' 
                 AND r.reviewable_id = m.id 
                 AND r.created_at > NOW() - INTERVAL '7 days') * 15 +
                m.popularity * 0.5
            )::NUMERIC AS weekly_score
        FROM app.manga m
        WHERE m.is_approved = TRUE AND m.deleted_at IS NULL
        ORDER BY weekly_score DESC, m.average_score DESC
        LIMIT p_limit;

    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT
            n.id,
            COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
            n.slug,
            n.cover_image_url,
            n.average_score,
            (
                (SELECT COUNT(*) FROM app.list_items li 
                 WHERE li.listable_type = 'novel' 
                 AND li.listable_id = n.id 
                 AND li.created_at > NOW() - INTERVAL '7 days') * 5 +
                (SELECT COUNT(*) FROM app.reviews r 
                 WHERE r.reviewable_type = 'novel' 
                 AND r.reviewable_id = n.id 
                 AND r.created_at > NOW() - INTERVAL '7 days') * 15 +
                n.popularity * 0.5
            )::NUMERIC AS weekly_score
        FROM app.novels n
        WHERE n.is_approved = TRUE AND n.deleted_at IS NULL
        ORDER BY weekly_score DESC, n.average_score DESC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Modificar get_top_all_time para incluir slug
-- ============================================
CREATE OR REPLACE FUNCTION app.get_top_all_time(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    ranking INTEGER
) AS $$
BEGIN
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT
            a.id,
            COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
            a.slug,
            a.cover_image_url,
            a.average_score,
            a.ranking
        FROM app.anime a
        WHERE a.is_published = TRUE AND a.deleted_at IS NULL AND a.ranking IS NOT NULL
        ORDER BY a.ranking ASC
        LIMIT p_limit;

    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT
            m.id,
            COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
            m.slug,
            m.cover_image_url,
            m.average_score,
            m.ranking
        FROM app.manga m
        WHERE m.is_approved = TRUE AND m.deleted_at IS NULL AND m.ranking IS NOT NULL
        ORDER BY m.ranking ASC
        LIMIT p_limit;

    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT
            n.id,
            COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
            n.slug,
            n.cover_image_url,
            n.average_score,
            n.ranking
        FROM app.novels n
        WHERE n.is_approved = TRUE AND n.deleted_at IS NULL AND n.ranking IS NOT NULL
        ORDER BY n.ranking ASC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICAR resultados
-- ============================================
SELECT 'Verificando funciones actualizadas...' as status;

-- Test daily
SELECT * FROM app.calculate_daily_ranking('anime', 1);

-- Test weekly
SELECT * FROM app.calculate_weekly_ranking('anime', 1);

-- Test all_time
SELECT * FROM app.get_top_all_time('anime', 1);
