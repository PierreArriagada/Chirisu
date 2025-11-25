-- ============================================================================
-- MIGRACIÓN: Agregar columna dominant_color a todas las tablas de medios
-- ============================================================================
-- 
-- Esta columna almacenará el color dominante de la imagen de portada en
-- formato hexadecimal (ej: #FF5733). Esto mejora el rendimiento al evitar
-- extraer el color en el cliente cada vez que se carga una página.
--
-- ============================================================================

BEGIN;

-- ANIME
ALTER TABLE IF EXISTS app.anime 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.anime.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- MANGA
ALTER TABLE IF EXISTS app.manga 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.manga.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- MANHWA
ALTER TABLE IF EXISTS app.manhwa 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.manhwa.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- MANHUA
ALTER TABLE IF EXISTS app.manhua 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.manhua.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- NOVELS
ALTER TABLE IF EXISTS app.novels 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.novels.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- DONGHUA
ALTER TABLE IF EXISTS app.donghua 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.donghua.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

-- FAN COMICS
ALTER TABLE IF EXISTS app.fan_comics 
ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7);

COMMENT ON COLUMN app.fan_comics.dominant_color IS 'Color dominante de la portada en formato hex (#RRGGBB)';

COMMIT;

-- Verificación
SELECT 
    'anime' as tabla,
    COUNT(*) FILTER (WHERE dominant_color IS NOT NULL) as con_color,
    COUNT(*) as total
FROM app.anime
UNION ALL
SELECT 'manga', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.manga
UNION ALL
SELECT 'manhwa', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.manhwa
UNION ALL
SELECT 'manhua', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.manhua
UNION ALL
SELECT 'novels', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.novels
UNION ALL
SELECT 'donghua', COUNT(*) FILTER (WHERE dominant_color IS NOT NULL), COUNT(*) FROM app.donghua;
