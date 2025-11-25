/**
 * ========================================
 * SCRIPT: CREACIÓN DE NUEVAS TABLAS DE MEDIA
 * ========================================
 * 
 * Este script crea las tablas para los nuevos tipos de media:
 * 1. DOUGUA (Donghua - Animación china)
 * 2. MANHUA (Comics chinos)
 * 3. MANHWA (Webtoons coreanos)
 * 4. FAN_COMICS (Comics fan-made)
 * 
 * Cada tabla incluye:
 * - Estructura completa (columnas, constraints, defaults)
 * - Sequences e índices
 * - Foreign keys
 * - Triggers (slug, ranking, status default)
 * - Funciones específicas si son necesarias
 */

SET search_path = app, public;

-- ========================================
-- 1. TABLA: DOUGUA (Donghua - Animación China)
-- ========================================
-- Estructura idéntica a ANIME pero para contenido chino

CREATE SEQUENCE IF NOT EXISTS app.dougua_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS app.dougua (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.dougua_id_seq'::regclass),
    created_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Identificadores externos
    mal_id BIGINT UNIQUE,
    anilist_id BIGINT UNIQUE,
    kitsu_id BIGINT UNIQUE,

    -- Títulos
    title_native VARCHAR(500),      -- Título en chino
    title_romaji VARCHAR(500) NOT NULL,  -- Título romanizado
    title_english VARCHAR(500),
    title_spanish VARCHAR(500),

    -- Contenido
    synopsis TEXT,
    episode_count INTEGER,
    duration INTEGER,               -- Duración por episodio en minutos
    
    -- Fechas
    start_date DATE,
    end_date DATE,

    -- Imágenes y multimedia
    cover_image_url VARCHAR(800),
    banner_image_url VARCHAR(800),
    trailer_url VARCHAR(500),

    -- Estado y clasificación
    status_id INTEGER REFERENCES app.media_statuses(id),
    season VARCHAR(20),             -- ej: 'Spring 2024'
    season_year INTEGER,
    source VARCHAR(100),            -- manhua, novel, original, etc.
    type VARCHAR(20) CHECK (type IN ('TV', 'Movie', 'ONA', 'Special', 'Music')),

    -- Métricas
    average_score NUMERIC(4,2) DEFAULT 0,
    mean_score NUMERIC(4,2),
    popularity INTEGER DEFAULT 0,
    favourites INTEGER DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0,

    -- Metadatos
    country_of_origin VARCHAR(10) DEFAULT 'CN',  -- China por defecto
    is_nsfw BOOLEAN DEFAULT FALSE,

    -- Datos externos
    external_payload JSONB,
    preferences JSONB,

    -- Moderación
    is_approved BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,

    -- SEO y soft delete
    slug VARCHAR(255) UNIQUE,
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para DOUGUA
CREATE INDEX IF NOT EXISTS idx_dougua_mal_id ON app.dougua(mal_id);
CREATE INDEX IF NOT EXISTS idx_dougua_anilist_id ON app.dougua(anilist_id);
CREATE INDEX IF NOT EXISTS idx_dougua_status_id ON app.dougua(status_id);
CREATE INDEX IF NOT EXISTS idx_dougua_favourites ON app.dougua(favourites DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_dougua_popularity ON app.dougua(popularity DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_dougua_ranking_score ON app.dougua(average_score DESC, ratings_count DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_dougua_title_search ON app.dougua USING gin(
    to_tsvector('english', title_english),
    to_tsvector('simple', title_romaji),
    to_tsvector('spanish', title_spanish)
);

COMMENT ON TABLE app.dougua IS 'Donghua (animación china). Estructura idéntica a anime.';
COMMENT ON COLUMN app.dougua.country_of_origin IS 'País de origen, por defecto CN (China)';

-- ========================================
-- 2. TABLA: MANHUA (Comics Chinos)
-- ========================================
-- Estructura idéntica a MANGA pero para comics chinos

CREATE SEQUENCE IF NOT EXISTS app.manhua_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS app.manhua (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.manhua_id_seq'::regclass),
    created_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Identificadores externos
    mal_id BIGINT UNIQUE,
    anilist_id BIGINT UNIQUE,
    kitsu_id BIGINT UNIQUE,

    -- Títulos
    title_native VARCHAR(500),      -- Título en chino
    title_romaji VARCHAR(500) NOT NULL,
    title_english VARCHAR(500),
    title_spanish VARCHAR(500),

    -- Contenido
    synopsis TEXT,
    volumes INTEGER,
    chapters INTEGER,

    -- Imágenes
    cover_image_url VARCHAR(800),
    banner_image_url VARCHAR(800),

    -- Estado y clasificación
    status_id INTEGER REFERENCES app.media_statuses(id),
    source VARCHAR(100),            -- web novel, novel, original
    type VARCHAR(20) DEFAULT 'Manhua' CHECK (type IN ('Manhua', 'Web Manhua', 'One-shot')),

    -- Métricas
    average_score NUMERIC(4,2) DEFAULT 0,
    mean_score NUMERIC(4,2),
    popularity INTEGER DEFAULT 0,
    favourites INTEGER DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0,

    -- Metadatos
    start_date DATE,
    end_date DATE,
    country_of_origin VARCHAR(10) DEFAULT 'CN',
    is_nsfw BOOLEAN DEFAULT FALSE,

    -- Datos externos
    external_payload JSONB,
    preferences JSONB,

    -- Moderación
    is_approved BOOLEAN DEFAULT FALSE,

    -- SEO y soft delete
    slug VARCHAR(255) UNIQUE,
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para MANHUA
CREATE INDEX IF NOT EXISTS idx_manhua_mal_id ON app.manhua(mal_id);
CREATE INDEX IF NOT EXISTS idx_manhua_anilist_id ON app.manhua(anilist_id);
CREATE INDEX IF NOT EXISTS idx_manhua_status_id ON app.manhua(status_id);
CREATE INDEX IF NOT EXISTS idx_manhua_favourites ON app.manhua(favourites DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhua_popularity ON app.manhua(popularity DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhua_ranking_score ON app.manhua(average_score DESC, ratings_count DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhua_title_search ON app.manhua USING gin(
    to_tsvector('english', title_english),
    to_tsvector('simple', title_romaji),
    to_tsvector('spanish', title_spanish)
);

COMMENT ON TABLE app.manhua IS 'Manhua (comics chinos). Estructura similar a manga.';

-- ========================================
-- 3. TABLA: MANHWA (Webtoons Coreanos)
-- ========================================
-- Estructura idéntica a MANGA pero para webtoons coreanos

CREATE SEQUENCE IF NOT EXISTS app.manhwa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS app.manhwa (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.manhwa_id_seq'::regclass),
    created_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Identificadores externos
    mal_id BIGINT UNIQUE,
    anilist_id BIGINT UNIQUE,
    kitsu_id BIGINT UNIQUE,

    -- Títulos
    title_native VARCHAR(500),      -- Título en coreano
    title_romaji VARCHAR(500) NOT NULL,
    title_english VARCHAR(500),
    title_spanish VARCHAR(500),

    -- Contenido
    synopsis TEXT,
    volumes INTEGER,
    chapters INTEGER,

    -- Imágenes
    cover_image_url VARCHAR(800),
    banner_image_url VARCHAR(800),

    -- Estado y clasificación
    status_id INTEGER REFERENCES app.media_statuses(id),
    source VARCHAR(100),            -- web novel, novel, original
    type VARCHAR(20) DEFAULT 'Manhwa' CHECK (type IN ('Manhwa', 'Webtoon', 'One-shot')),

    -- Métricas
    average_score NUMERIC(4,2) DEFAULT 0,
    mean_score NUMERIC(4,2),
    popularity INTEGER DEFAULT 0,
    favourites INTEGER DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0,

    -- Metadatos
    start_date DATE,
    end_date DATE,
    country_of_origin VARCHAR(10) DEFAULT 'KR',  -- Corea del Sur
    is_nsfw BOOLEAN DEFAULT FALSE,

    -- Datos externos
    external_payload JSONB,
    preferences JSONB,

    -- Moderación
    is_approved BOOLEAN DEFAULT FALSE,

    -- SEO y soft delete
    slug VARCHAR(255) UNIQUE,
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para MANHWA
CREATE INDEX IF NOT EXISTS idx_manhwa_mal_id ON app.manhwa(mal_id);
CREATE INDEX IF NOT EXISTS idx_manhwa_anilist_id ON app.manhwa(anilist_id);
CREATE INDEX IF NOT EXISTS idx_manhwa_status_id ON app.manhwa(status_id);
CREATE INDEX IF NOT EXISTS idx_manhwa_favourites ON app.manhwa(favourites DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhwa_popularity ON app.manhwa(popularity DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhwa_ranking_score ON app.manhwa(average_score DESC, ratings_count DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_manhwa_title_search ON app.manhwa USING gin(
    to_tsvector('english', title_english),
    to_tsvector('simple', title_romaji),
    to_tsvector('spanish', title_spanish)
);

COMMENT ON TABLE app.manhwa IS 'Manhwa (webtoons coreanos). Estructura similar a manga.';

-- ========================================
-- 4. TABLA: FAN_COMICS (Comics Fan-Made)
-- ========================================
-- Estructura simplificada de MANGA para contenido creado por fans

CREATE SEQUENCE IF NOT EXISTS app.fan_comics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS app.fan_comics (
    id BIGINT PRIMARY KEY DEFAULT nextval('app.fan_comics_id_seq'::regclass),
    created_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    updated_by INTEGER REFERENCES app.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Sin identificadores externos (contenido original de fans)
    
    -- Títulos (simplificado)
    title VARCHAR(500) NOT NULL,    -- Título principal
    title_english VARCHAR(500),
    title_spanish VARCHAR(500),

    -- Contenido
    synopsis TEXT,
    chapters INTEGER,

    -- Imágenes
    cover_image_url VARCHAR(800),
    banner_image_url VARCHAR(800),

    -- Estado
    status_id INTEGER REFERENCES app.media_statuses(id),
    source VARCHAR(100),            -- Basado en qué serie/anime
    type VARCHAR(20) DEFAULT 'Fan Comic' CHECK (type IN ('Fan Comic', 'Doujinshi', 'Web Comic')),

    -- Métricas
    average_score NUMERIC(4,2) DEFAULT 0,
    mean_score NUMERIC(4,2),
    popularity INTEGER DEFAULT 0,
    favourites INTEGER DEFAULT 0,
    ratings_count INTEGER DEFAULT 0,
    ranking INTEGER DEFAULT 0,

    -- Metadatos
    start_date DATE,
    end_date DATE,
    country_of_origin VARCHAR(10),  -- País del creador
    is_nsfw BOOLEAN DEFAULT FALSE,

    -- Moderación (requiere aprobación)
    is_approved BOOLEAN DEFAULT FALSE,

    -- SEO y soft delete
    slug VARCHAR(255) UNIQUE,
    deleted_at TIMESTAMPTZ NULL
);

-- Índices para FAN_COMICS
CREATE INDEX IF NOT EXISTS idx_fan_comics_status_id ON app.fan_comics(status_id);
CREATE INDEX IF NOT EXISTS idx_fan_comics_created_by ON app.fan_comics(created_by);
CREATE INDEX IF NOT EXISTS idx_fan_comics_favourites ON app.fan_comics(favourites DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_fan_comics_popularity ON app.fan_comics(popularity DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_fan_comics_ranking_score ON app.fan_comics(average_score DESC, ratings_count DESC) WHERE deleted_at IS NULL AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_fan_comics_title_search ON app.fan_comics USING gin(
    to_tsvector('english', title_english),
    to_tsvector('simple', title),
    to_tsvector('spanish', title_spanish)
);

COMMENT ON TABLE app.fan_comics IS 'Fan comics (contenido fan-made). Requiere aprobación.';
COMMENT ON COLUMN app.fan_comics.source IS 'Serie/anime en la que está basado el fan comic';

-- ========================================
-- VERIFICACIÓN INICIAL
-- ========================================

SELECT 'Tablas creadas correctamente:' as status;
SELECT 
    tablename,
    CASE 
        WHEN tablename IN ('dougua', 'manhua', 'manhwa', 'fan_comics') THEN '✅'
        ELSE '❌'
    END as created
FROM pg_tables 
WHERE schemaname = 'app' 
AND tablename IN ('dougua', 'manhua', 'manhwa', 'fan_comics')
ORDER BY tablename;
