-- ============================================
-- SISTEMA DE RANKINGS OPTIMIZADO CON VISTAS MATERIALIZADAS
-- ============================================
-- Descripción: Sistema de rankings de alta performance que usa vistas 
-- materializadas para cachear los cálculos pesados. Se actualiza 
-- automáticamente cada 5 horas usando pg_cron.
--
-- Beneficios:
-- ✅ Queries ultra-rápidos (consulta directa a tabla cacheada)
-- ✅ Bajo consumo de CPU (cálculos solo cada 5 horas)
-- ✅ Escalable (no recalcula en cada request)
-- ✅ Automático (pg_cron se encarga del refresh)
--
-- Arquitectura:
-- 1. Vistas materializadas por tipo de ranking (daily, weekly, all_time)
-- 2. Índices para optimizar consultas
-- 3. Función de refresh manual
-- 4. Job automático con pg_cron (cada 5 horas)
-- ============================================

SET search_path = app, public;

-- ============================================
-- PASO 1: HABILITAR EXTENSIÓN PG_CRON
-- ============================================
-- Nota: Requiere permisos de superusuario
-- En hosting gestionado, verificar si pg_cron está disponible
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- PASO 2: CREAR VISTAS MATERIALIZADAS
-- ============================================

-- --------------------------------------------
-- 2.1 TOP DAILY - Ranking basado en actividad de las últimas 24 horas
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_daily_anime CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_daily_anime AS
SELECT
    a.id AS media_id,
    'anime' AS media_type,
    COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
    a.slug,
    a.cover_image_url,
    a.average_score,
    (
        -- Ponderación: list_items (10 pts) + reviews (20 pts) + popularidad (0.1x)
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'anime' 
         AND li.listable_id = a.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'anime' 
         AND r.reviewable_id = a.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        a.popularity * 0.1
    )::NUMERIC AS daily_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'anime' 
         AND li.listable_id = a.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'anime' 
         AND r.reviewable_id = a.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        a.popularity * 0.1
    ) DESC, a.average_score DESC, a.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.anime a
WHERE a.is_published = TRUE 
  AND a.deleted_at IS NULL
  AND a.is_approved = TRUE
ORDER BY daily_score DESC, a.average_score DESC
LIMIT 100; -- Top 100 para tener margen

COMMENT ON MATERIALIZED VIEW app.mv_top_daily_anime IS 
'Vista materializada con el top 100 de anime basado en actividad de las últimas 24 horas. Se refresca cada 5 horas.';

-- Índices para optimizar consultas
CREATE UNIQUE INDEX idx_mv_top_daily_anime_id ON app.mv_top_daily_anime(media_id);
CREATE INDEX idx_mv_top_daily_anime_rank ON app.mv_top_daily_anime(rank_position);
CREATE INDEX idx_mv_top_daily_anime_score ON app.mv_top_daily_anime(daily_score DESC);

-- --------------------------------------------
-- 2.2 TOP DAILY - MANGA
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_daily_manga CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_daily_manga AS
SELECT
    m.id AS media_id,
    'manga' AS media_type,
    COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
    m.slug,
    m.cover_image_url,
    m.average_score,
    (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'manga' 
         AND li.listable_id = m.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'manga' 
         AND r.reviewable_id = m.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        m.popularity * 0.1
    )::NUMERIC AS daily_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'manga' 
         AND li.listable_id = m.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'manga' 
         AND r.reviewable_id = m.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        m.popularity * 0.1
    ) DESC, m.average_score DESC, m.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.manga m
WHERE m.is_published = TRUE 
  AND m.deleted_at IS NULL
  AND m.is_approved = TRUE
ORDER BY daily_score DESC, m.average_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_daily_manga_id ON app.mv_top_daily_manga(media_id);
CREATE INDEX idx_mv_top_daily_manga_rank ON app.mv_top_daily_manga(rank_position);
CREATE INDEX idx_mv_top_daily_manga_score ON app.mv_top_daily_manga(daily_score DESC);

-- --------------------------------------------
-- 2.3 TOP DAILY - NOVELS
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_daily_novels CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_daily_novels AS
SELECT
    n.id AS media_id,
    'novel' AS media_type,
    COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
    n.slug,
    n.cover_image_url,
    n.average_score,
    (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'novel' 
         AND li.listable_id = n.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'novel' 
         AND r.reviewable_id = n.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        n.popularity * 0.1
    )::NUMERIC AS daily_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'novel' 
         AND li.listable_id = n.id 
         AND li.created_at > NOW() - INTERVAL '24 hours'), 0) * 10 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'novel' 
         AND r.reviewable_id = n.id 
         AND r.created_at > NOW() - INTERVAL '24 hours'), 0) * 20 +
        n.popularity * 0.1
    ) DESC, n.average_score DESC, n.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.novels n
WHERE n.is_published = TRUE 
  AND n.deleted_at IS NULL
  AND n.is_approved = TRUE
ORDER BY daily_score DESC, n.average_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_daily_novels_id ON app.mv_top_daily_novels(media_id);
CREATE INDEX idx_mv_top_daily_novels_rank ON app.mv_top_daily_novels(rank_position);
CREATE INDEX idx_mv_top_daily_novels_score ON app.mv_top_daily_novels(daily_score DESC);

-- --------------------------------------------
-- 2.4 TOP WEEKLY - Ranking basado en actividad de los últimos 7 días
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_weekly_anime CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_weekly_anime AS
SELECT
    a.id AS media_id,
    'anime' AS media_type,
    COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
    a.slug,
    a.cover_image_url,
    a.average_score,
    (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'anime' 
         AND li.listable_id = a.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'anime' 
         AND r.reviewable_id = a.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        a.popularity * 0.2 +
        a.favourites * 0.5
    )::NUMERIC AS weekly_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'anime' 
         AND li.listable_id = a.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'anime' 
         AND r.reviewable_id = a.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        a.popularity * 0.2 +
        a.favourites * 0.5
    ) DESC, a.average_score DESC, a.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.anime a
WHERE a.is_published = TRUE 
  AND a.deleted_at IS NULL
  AND a.is_approved = TRUE
ORDER BY weekly_score DESC, a.average_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_weekly_anime_id ON app.mv_top_weekly_anime(media_id);
CREATE INDEX idx_mv_top_weekly_anime_rank ON app.mv_top_weekly_anime(rank_position);
CREATE INDEX idx_mv_top_weekly_anime_score ON app.mv_top_weekly_anime(weekly_score DESC);

-- --------------------------------------------
-- 2.5 TOP WEEKLY - MANGA
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_weekly_manga CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_weekly_manga AS
SELECT
    m.id AS media_id,
    'manga' AS media_type,
    COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
    m.slug,
    m.cover_image_url,
    m.average_score,
    (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'manga' 
         AND li.listable_id = m.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'manga' 
         AND r.reviewable_id = m.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        m.popularity * 0.2 +
        m.favourites * 0.5
    )::NUMERIC AS weekly_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'manga' 
         AND li.listable_id = m.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'manga' 
         AND r.reviewable_id = m.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        m.popularity * 0.2 +
        m.favourites * 0.5
    ) DESC, m.average_score DESC, m.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.manga m
WHERE m.is_published = TRUE 
  AND m.deleted_at IS NULL
  AND m.is_approved = TRUE
ORDER BY weekly_score DESC, m.average_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_weekly_manga_id ON app.mv_top_weekly_manga(media_id);
CREATE INDEX idx_mv_top_weekly_manga_rank ON app.mv_top_weekly_manga(rank_position);
CREATE INDEX idx_mv_top_weekly_manga_score ON app.mv_top_weekly_manga(weekly_score DESC);

-- --------------------------------------------
-- 2.6 TOP WEEKLY - NOVELS
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_weekly_novels CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_weekly_novels AS
SELECT
    n.id AS media_id,
    'novel' AS media_type,
    COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
    n.slug,
    n.cover_image_url,
    n.average_score,
    (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'novel' 
         AND li.listable_id = n.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'novel' 
         AND r.reviewable_id = n.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        n.popularity * 0.2 +
        n.favourites * 0.5
    )::NUMERIC AS weekly_score,
    ROW_NUMBER() OVER (ORDER BY (
        COALESCE((SELECT COUNT(*) FROM app.list_items li 
         WHERE li.listable_type = 'novel' 
         AND li.listable_id = n.id 
         AND li.created_at > NOW() - INTERVAL '7 days'), 0) * 5 +
        COALESCE((SELECT COUNT(*) FROM app.reviews r 
         WHERE r.reviewable_type = 'novel' 
         AND r.reviewable_id = n.id 
         AND r.created_at > NOW() - INTERVAL '7 days'), 0) * 15 +
        n.popularity * 0.2 +
        n.favourites * 0.5
    ) DESC, n.average_score DESC, n.id ASC) AS rank_position,
    NOW() AS last_updated
FROM app.novels n
WHERE n.is_published = TRUE 
  AND n.deleted_at IS NULL
  AND n.is_approved = TRUE
ORDER BY weekly_score DESC, n.average_score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_weekly_novels_id ON app.mv_top_weekly_novels(media_id);
CREATE INDEX idx_mv_top_weekly_novels_rank ON app.mv_top_weekly_novels(rank_position);
CREATE INDEX idx_mv_top_weekly_novels_score ON app.mv_top_weekly_novels(weekly_score DESC);

-- --------------------------------------------
-- 2.7 TOP ALL TIME - Ranking histórico basado en Bayesian average
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_alltime_anime CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_alltime_anime AS
SELECT
    a.id AS media_id,
    'anime' AS media_type,
    COALESCE(a.title_romaji, a.title_english, a.title_native) AS title,
    a.slug,
    a.cover_image_url,
    a.average_score,
    a.ratings_count,
    -- Bayesian average: (C * m + R * v) / (C + R)
    -- C = confianza mínima (100), m = media global (7.0), R = ratings_count, v = average_score
    ((100 * 7.0 + a.ratings_count * a.average_score) / (100 + a.ratings_count))::NUMERIC AS bayesian_score,
    ROW_NUMBER() OVER (ORDER BY 
        ((100 * 7.0 + a.ratings_count * a.average_score) / (100 + a.ratings_count)) DESC,
        a.ratings_count DESC,
        a.id ASC
    ) AS rank_position,
    NOW() AS last_updated
FROM app.anime a
WHERE a.is_published = TRUE 
  AND a.deleted_at IS NULL
  AND a.is_approved = TRUE
  AND a.ratings_count > 0
ORDER BY bayesian_score DESC, a.ratings_count DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_alltime_anime_id ON app.mv_top_alltime_anime(media_id);
CREATE INDEX idx_mv_top_alltime_anime_rank ON app.mv_top_alltime_anime(rank_position);
CREATE INDEX idx_mv_top_alltime_anime_score ON app.mv_top_alltime_anime(bayesian_score DESC);

-- --------------------------------------------
-- 2.8 TOP ALL TIME - MANGA
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_alltime_manga CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_alltime_manga AS
SELECT
    m.id AS media_id,
    'manga' AS media_type,
    COALESCE(m.title_romaji, m.title_english, m.title_native) AS title,
    m.slug,
    m.cover_image_url,
    m.average_score,
    m.ratings_count,
    ((100 * 7.0 + m.ratings_count * m.average_score) / (100 + m.ratings_count))::NUMERIC AS bayesian_score,
    ROW_NUMBER() OVER (ORDER BY 
        ((100 * 7.0 + m.ratings_count * m.average_score) / (100 + m.ratings_count)) DESC,
        m.ratings_count DESC,
        m.id ASC
    ) AS rank_position,
    NOW() AS last_updated
FROM app.manga m
WHERE m.is_published = TRUE 
  AND m.deleted_at IS NULL
  AND m.is_approved = TRUE
  AND m.ratings_count > 0
ORDER BY bayesian_score DESC, m.ratings_count DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_alltime_manga_id ON app.mv_top_alltime_manga(media_id);
CREATE INDEX idx_mv_top_alltime_manga_rank ON app.mv_top_alltime_manga(rank_position);
CREATE INDEX idx_mv_top_alltime_manga_score ON app.mv_top_alltime_manga(bayesian_score DESC);

-- --------------------------------------------
-- 2.9 TOP ALL TIME - NOVELS
-- --------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS app.mv_top_alltime_novels CASCADE;
CREATE MATERIALIZED VIEW app.mv_top_alltime_novels AS
SELECT
    n.id AS media_id,
    'novel' AS media_type,
    COALESCE(n.title_romaji, n.title_english, n.title_native) AS title,
    n.slug,
    n.cover_image_url,
    n.average_score,
    n.ratings_count,
    ((100 * 7.0 + n.ratings_count * n.average_score) / (100 + n.ratings_count))::NUMERIC AS bayesian_score,
    ROW_NUMBER() OVER (ORDER BY 
        ((100 * 7.0 + n.ratings_count * n.average_score) / (100 + n.ratings_count)) DESC,
        n.ratings_count DESC,
        n.id ASC
    ) AS rank_position,
    NOW() AS last_updated
FROM app.novels n
WHERE n.is_published = TRUE 
  AND n.deleted_at IS NULL
  AND n.is_approved = TRUE
  AND n.ratings_count > 0
ORDER BY bayesian_score DESC, n.ratings_count DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_mv_top_alltime_novels_id ON app.mv_top_alltime_novels(media_id);
CREATE INDEX idx_mv_top_alltime_novels_rank ON app.mv_top_alltime_novels(rank_position);
CREATE INDEX idx_mv_top_alltime_novels_score ON app.mv_top_alltime_novels(bayesian_score DESC);

-- ============================================
-- PASO 3: FUNCIONES OPTIMIZADAS QUE USAN LAS VISTAS MATERIALIZADAS
-- ============================================

-- --------------------------------------------
-- 3.1 Función para obtener Top Daily (ultra-rápida)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION app.get_cached_daily_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 10
)
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    daily_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.daily_score,
            mv.rank_position
        FROM app.mv_top_daily_anime mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.daily_score,
            mv.rank_position
        FROM app.mv_top_daily_manga mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.daily_score,
            mv.rank_position
        FROM app.mv_top_daily_novels mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION app.get_cached_daily_ranking IS 
'Obtiene el ranking diario desde la vista materializada (ultra-rápido). Los datos se actualizan cada 5 horas.';

-- --------------------------------------------
-- 3.2 Función para obtener Top Weekly (ultra-rápida)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION app.get_cached_weekly_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 20
)
RETURNS TABLE(
    media_id BIGINT,
    title VARCHAR,
    slug VARCHAR,
    cover_image_url VARCHAR,
    average_score NUMERIC,
    weekly_score NUMERIC,
    rank_position BIGINT
) AS $$
BEGIN
    IF p_media_type = 'anime' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.weekly_score,
            mv.rank_position
        FROM app.mv_top_weekly_anime mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.weekly_score,
            mv.rank_position
        FROM app.mv_top_weekly_manga mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.weekly_score,
            mv.rank_position
        FROM app.mv_top_weekly_novels mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION app.get_cached_weekly_ranking IS 
'Obtiene el ranking semanal desde la vista materializada (ultra-rápido). Los datos se actualizan cada 5 horas.';

-- --------------------------------------------
-- 3.3 Función para obtener Top All Time (ultra-rápida)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION app.get_cached_alltime_ranking(
    p_media_type VARCHAR,
    p_limit INT DEFAULT 100
)
RETURNS TABLE(
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
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.ratings_count::INTEGER,
            mv.bayesian_score,
            mv.rank_position
        FROM app.mv_top_alltime_anime mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'manga' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.ratings_count::INTEGER,
            mv.bayesian_score,
            mv.rank_position
        FROM app.mv_top_alltime_manga mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
        
    ELSIF p_media_type = 'novel' THEN
        RETURN QUERY
        SELECT 
            mv.media_id,
            mv.title,
            mv.slug,
            mv.cover_image_url,
            mv.average_score,
            mv.ratings_count::INTEGER,
            mv.bayesian_score,
            mv.rank_position
        FROM app.mv_top_alltime_novels mv
        ORDER BY mv.rank_position ASC
        LIMIT p_limit;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION app.get_cached_alltime_ranking IS 
'Obtiene el ranking histórico (all-time) desde la vista materializada (ultra-rápido). Los datos se actualizan cada 5 horas.';

-- ============================================
-- PASO 4: FUNCIÓN PARA REFRESCAR TODAS LAS VISTAS
-- ============================================

CREATE OR REPLACE FUNCTION app.refresh_all_ranking_views()
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE '[%] Iniciando refresh de vistas materializadas...', NOW();
    
    -- Daily rankings
    RAISE NOTICE '[%] Refrescando daily anime...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_daily_anime;
    
    RAISE NOTICE '[%] Refrescando daily manga...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_daily_manga;
    
    RAISE NOTICE '[%] Refrescando daily novels...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_daily_novels;
    
    -- Weekly rankings
    RAISE NOTICE '[%] Refrescando weekly anime...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_weekly_anime;
    
    RAISE NOTICE '[%] Refrescando weekly manga...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_weekly_manga;
    
    RAISE NOTICE '[%] Refrescando weekly novels...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_weekly_novels;
    
    -- All-time rankings
    RAISE NOTICE '[%] Refrescando all-time anime...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_alltime_anime;
    
    RAISE NOTICE '[%] Refrescando all-time manga...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_alltime_manga;
    
    RAISE NOTICE '[%] Refrescando all-time novels...', NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY app.mv_top_alltime_novels;
    
    RAISE NOTICE '[%] ✅ Refresh completado exitosamente', NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION app.refresh_all_ranking_views IS 
'Refresca todas las vistas materializadas de rankings. Se ejecuta automáticamente cada 5 horas vía pg_cron.';

-- ============================================
-- PASO 5: CONFIGURAR PG_CRON PARA REFRESH AUTOMÁTICO
-- ============================================

-- Eliminar job existente si existe
SELECT cron.unschedule('refresh-ranking-views') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'refresh-ranking-views'
);

-- Crear job que se ejecuta cada 5 horas
-- Horarios: 00:00, 05:00, 10:00, 15:00, 20:00 (5 veces al día)
SELECT cron.schedule(
    'refresh-ranking-views',           -- Nombre del job
    '0 */5 * * *',                     -- Cron expression: cada 5 horas en punto
    'SELECT app.refresh_all_ranking_views();'  -- Comando a ejecutar
);

COMMENT ON EXTENSION pg_cron IS 
'Job scheduler para PostgreSQL. Ejecuta refresh_all_ranking_views() cada 5 horas.';

-- ============================================
-- PASO 6: INICIALIZACIÓN - REFRESH INICIAL
-- ============================================

-- Ejecutar primer refresh para poblar las vistas
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'INICIALIZANDO SISTEMA DE RANKINGS OPTIMIZADO';
    RAISE NOTICE '==================================================';
    
    PERFORM app.refresh_all_ranking_views();
    
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ SISTEMA INICIALIZADO CORRECTAMENTE';
    RAISE NOTICE 'Las vistas se refrescarán automáticamente cada 5 horas';
    RAISE NOTICE 'Próximo refresh: %', NOW() + INTERVAL '5 hours';
    RAISE NOTICE '==================================================';
END $$;

-- ============================================
-- PASO 7: VERIFICACIÓN Y TESTING
-- ============================================

-- Ver estadísticas de las vistas materializadas
SELECT 
    schemaname,
    matviewname AS view_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size,
    (SELECT last_updated FROM app.mv_top_daily_anime LIMIT 1) AS last_refresh
FROM pg_matviews
WHERE schemaname = 'app'
  AND matviewname LIKE 'mv_top_%'
ORDER BY matviewname;

-- Ver jobs programados
SELECT 
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname = 'refresh-ranking-views';

-- Testing: Obtener top 5 de cada tipo
SELECT '=== TOP 5 DAILY ANIME ===' AS section;
SELECT rank_position, title, daily_score 
FROM app.get_cached_daily_ranking('anime', 5);

SELECT '=== TOP 5 WEEKLY MANGA ===' AS section;
SELECT rank_position, title, weekly_score 
FROM app.get_cached_weekly_ranking('manga', 5);

SELECT '=== TOP 5 ALL-TIME NOVELS ===' AS section;
SELECT rank_position, title, bayesian_score 
FROM app.get_cached_alltime_ranking('novel', 5);

-- ============================================
-- DOCUMENTACIÓN Y MANTENIMIENTO
-- ============================================

/*
COMANDOS ÚTILES PARA ADMINISTRACIÓN:

1. REFRESH MANUAL (si necesitas actualizar antes de las 5 horas):
   SELECT app.refresh_all_ranking_views();

2. VER ESTADO DE LAS VISTAS:
   SELECT matviewname, last_analyzed 
   FROM pg_stat_user_tables 
   WHERE schemaname = 'app' AND relname LIKE 'mv_top_%';

3. VER LOGS DEL CRON JOB:
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-ranking-views')
   ORDER BY start_time DESC 
   LIMIT 10;

4. DESACTIVAR JOB TEMPORALMENTE:
   UPDATE cron.job SET active = FALSE WHERE jobname = 'refresh-ranking-views';

5. REACTIVAR JOB:
   UPDATE cron.job SET active = TRUE WHERE jobname = 'refresh-ranking-views';

6. CAMBIAR FRECUENCIA (ej: cada 3 horas):
   SELECT cron.alter_job('refresh-ranking-views', schedule => '0 */3 * * *');

7. VER TAMAÑO DE LAS VISTAS:
   SELECT 
       matviewname,
       pg_size_pretty(pg_total_relation_size('app.'||matviewname)) AS size
   FROM pg_matviews 
   WHERE schemaname = 'app' AND matviewname LIKE 'mv_top_%';

PERFORMANCE ESPERADO:
- Consultas a vistas materializadas: < 1ms (lectura directa de índice)
- Refresh completo: 2-10 segundos (depende del volumen de datos)
- Consumo de espacio: ~1-5 MB por vista (100 registros cada una)
- CPU durante refresh: Bajo (solo cálculos cada 5 horas)
- CPU durante queries: Mínimo (solo SELECT con índices)

ESCALABILIDAD:
- Hasta 100,000 medios: Excelente
- Hasta 1,000,000 medios: Bueno (considerar aumentar intervalo a 6 horas)
- Más de 1,000,000: Considerar particionamiento o cacheo adicional

COMPATIBILIDAD:
- PostgreSQL 12+: ✅ Compatible
- pg_cron requerido: ✅ (incluido en muchos hostings gestionados)
- Hosting sin pg_cron: Usar alternativa con cronjob externo que llame a refresh_all_ranking_views()
*/

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
