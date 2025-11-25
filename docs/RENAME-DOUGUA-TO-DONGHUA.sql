/**
 * ========================================
 * SCRIPT: RENOMBRAR DOUGUA → DONGHUA
 * ========================================
 * 
 * Este script renombra todo lo relacionado con "dougua" a "donghua"
 * (nombre correcto para animación china)
 */

SET search_path = app, public;

-- ========================================
-- 1. RENOMBRAR TABLA
-- ========================================

ALTER TABLE IF EXISTS app.dougua RENAME TO donghua;

-- ========================================
-- 2. RENOMBRAR SEQUENCE
-- ========================================

ALTER SEQUENCE IF EXISTS app.dougua_id_seq RENAME TO donghua_id_seq;

-- Actualizar default de la columna id para usar la nueva sequence
ALTER TABLE app.donghua ALTER COLUMN id SET DEFAULT nextval('app.donghua_id_seq'::regclass);

-- ========================================
-- 3. RENOMBRAR ÍNDICES
-- ========================================

ALTER INDEX IF EXISTS app.idx_dougua_mal_id RENAME TO idx_donghua_mal_id;
ALTER INDEX IF EXISTS app.idx_dougua_anilist_id RENAME TO idx_donghua_anilist_id;
ALTER INDEX IF EXISTS app.idx_dougua_status_id RENAME TO idx_donghua_status_id;
ALTER INDEX IF EXISTS app.idx_dougua_favourites RENAME TO idx_donghua_favourites;
ALTER INDEX IF EXISTS app.idx_dougua_popularity RENAME TO idx_donghua_popularity;
ALTER INDEX IF EXISTS app.idx_dougua_ranking_score RENAME TO idx_donghua_ranking_score;
ALTER INDEX IF EXISTS app.idx_dougua_title_search RENAME TO idx_donghua_title_search;

-- ========================================
-- 4. RENOMBRAR FUNCIONES
-- ========================================

ALTER FUNCTION IF EXISTS app.fn_dougua_set_slug() RENAME TO fn_donghua_set_slug;

-- Recrear la función con el comentario actualizado
COMMENT ON FUNCTION app.fn_donghua_set_slug() IS 'Genera slug automático para donghua (animación china)';

-- ========================================
-- 5. RENOMBRAR TRIGGERS
-- ========================================

ALTER TRIGGER IF EXISTS trg_set_dougua_slug ON app.donghua RENAME TO trg_set_donghua_slug;
ALTER TRIGGER IF EXISTS trg_dougua_update_time ON app.donghua RENAME TO trg_donghua_update_time;
ALTER TRIGGER IF EXISTS trg_set_dougua_status_default ON app.donghua RENAME TO trg_set_donghua_status_default;
ALTER TRIGGER IF EXISTS trg_dougua_update_ranking ON app.donghua RENAME TO trg_donghua_update_ranking;

-- Recrear triggers con la función renombrada
DROP TRIGGER IF EXISTS trg_set_donghua_slug ON app.donghua;
CREATE TRIGGER trg_set_donghua_slug
  BEFORE INSERT OR UPDATE ON app.donghua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_donghua_set_slug();

-- ========================================
-- 6. ACTUALIZAR COMENTARIOS
-- ========================================

COMMENT ON TABLE app.donghua IS 'Donghua (animación china). Estructura idéntica a anime.';
COMMENT ON COLUMN app.donghua.country_of_origin IS 'País de origen, por defecto CN (China)';

-- ========================================
-- 7. ACTUALIZAR fn_recalculate_all_rankings()
-- ========================================

CREATE OR REPLACE FUNCTION app.fn_recalculate_all_rankings() 
RETURNS VOID 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Recalcular ANIME
    UPDATE app.anime
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.anime a2
        WHERE a2.deleted_at IS NULL
          AND a2.is_published = true
          AND (
            (a2.average_score * 0.7 + 
             (a2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.anime WHERE deleted_at IS NULL AND is_published = true), 0)) * 30) 
            > 
            (anime.average_score * 0.7 + 
             (anime.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.anime WHERE deleted_at IS NULL AND is_published = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_published = true;
    
    -- Recalcular MANGA
    UPDATE app.manga
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.manga m2
        WHERE m2.deleted_at IS NULL
          AND m2.is_approved = true
          AND (
            (m2.average_score * 0.7 + 
             (m2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manga WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30) 
            > 
            (manga.average_score * 0.7 + 
             (manga.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manga WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_approved = true;
    
    -- Recalcular NOVELS
    UPDATE app.novels
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.novels n2
        WHERE n2.deleted_at IS NULL
          AND n2.is_approved = true
          AND (
            (n2.average_score * 0.7 + 
             (n2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.novels WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30) 
            > 
            (novels.average_score * 0.7 + 
             (novels.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.novels WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_approved = true;
    
    -- Recalcular DONGHUA (renombrado de dougua)
    UPDATE app.donghua
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.donghua d2
        WHERE d2.deleted_at IS NULL
          AND d2.is_published = true
          AND (
            (d2.average_score * 0.7 + 
             (d2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.donghua WHERE deleted_at IS NULL AND is_published = true), 0)) * 30) 
            > 
            (donghua.average_score * 0.7 + 
             (donghua.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.donghua WHERE deleted_at IS NULL AND is_published = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_published = true;
    
    -- Recalcular MANHUA
    UPDATE app.manhua
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.manhua mh2
        WHERE mh2.deleted_at IS NULL
          AND mh2.is_approved = true
          AND (
            (mh2.average_score * 0.7 + 
             (mh2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manhua WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30) 
            > 
            (manhua.average_score * 0.7 + 
             (manhua.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manhua WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_approved = true;
    
    -- Recalcular MANHWA
    UPDATE app.manhwa
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.manhwa mw2
        WHERE mw2.deleted_at IS NULL
          AND mw2.is_approved = true
          AND (
            (mw2.average_score * 0.7 + 
             (mw2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manhwa WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30) 
            > 
            (manhwa.average_score * 0.7 + 
             (manhwa.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.manhwa WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_approved = true;
    
    -- Recalcular FAN_COMICS
    UPDATE app.fan_comics
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.fan_comics fc2
        WHERE fc2.deleted_at IS NULL
          AND fc2.is_approved = true
          AND (
            (fc2.average_score * 0.7 + 
             (fc2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.fan_comics WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30) 
            > 
            (fan_comics.average_score * 0.7 + 
             (fan_comics.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.fan_comics WHERE deleted_at IS NULL AND is_approved = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_approved = true;
    
    RAISE NOTICE 'Rankings recalculados para anime, manga, novels, donghua, manhua, manhwa y fan_comics';
END;
$$;

-- ========================================
-- 8. ACTUALIZAR fn_update_media_ranking()
-- ========================================

CREATE OR REPLACE FUNCTION app.fn_update_media_ranking() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $_$
DECLARE
    v_table_name TEXT;
    v_ranking INTEGER;
BEGIN
    v_table_name := TG_TABLE_NAME;
    
    -- Calcular ranking basado en fórmula: 70% score + 30% popularidad normalizada
    EXECUTE format($sql$
        SELECT COUNT(*) + 1
        FROM app.%I m2
        WHERE m2.deleted_at IS NULL
          AND CASE 
                WHEN '%I' IN ('anime', 'donghua') THEN m2.is_published = true
                ELSE m2.is_approved = true
              END
          AND (
            (m2.average_score * 0.7 + 
             (m2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.%I WHERE deleted_at IS NULL), 0)) * 30)
            >
            ($1 * 0.7 + 
             ($2::numeric / NULLIF((SELECT MAX(popularity) FROM app.%I WHERE deleted_at IS NULL), 0)) * 30)
          )
    $sql$, v_table_name, v_table_name, v_table_name, v_table_name)
    INTO v_ranking
    USING NEW.average_score, NEW.popularity;
    
    NEW.ranking := COALESCE(v_ranking, 1);
    
    RETURN NEW;
END;
$_$;

-- ========================================
-- VERIFICACIÓN
-- ========================================

SELECT 'Verificando cambios de dougua -> donghua:' as status;

-- Verificar que la tabla existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Tabla donghua existe'
    ELSE '❌ ERROR: Tabla no encontrada'
  END as resultado
FROM pg_tables 
WHERE schemaname = 'app' AND tablename = 'donghua';

-- Verificar que dougua no existe
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Tabla dougua eliminada correctamente'
    ELSE '⚠️ WARNING: Tabla dougua aún existe'
  END as resultado
FROM pg_tables 
WHERE schemaname = 'app' AND tablename = 'dougua';

-- Verificar función
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Función fn_donghua_set_slug existe'
    ELSE '❌ ERROR: Función no encontrada'
  END as resultado
FROM pg_proc 
WHERE proname = 'fn_donghua_set_slug';

-- Verificar triggers
SELECT 
  '✅ Trigger: ' || tgname as resultado
FROM pg_trigger
WHERE tgrelid = 'app.donghua'::regclass
AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;

-- Verificar índices
SELECT 
  '✅ Índice: ' || indexname as resultado
FROM pg_indexes
WHERE schemaname = 'app' 
AND tablename = 'donghua'
ORDER BY indexname;

SELECT '========================================' as separador;
SELECT 'Renombrado completado: dougua -> donghua' as conclusion;
SELECT '========================================' as separador;
