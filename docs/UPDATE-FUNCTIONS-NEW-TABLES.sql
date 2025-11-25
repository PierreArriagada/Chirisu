/**
 * ========================================
 * SCRIPT: ACTUALIZAR FUNCIONES EXISTENTES
 * ========================================
 * 
 * Este script actualiza funciones existentes para incluir las nuevas tablas:
 * 1. fn_recalculate_all_rankings() - Agregar dougua, manhua, manhwa, fan_comics
 * 2. fn_update_media_review_stats() - Triggers para reviews
 * 3. fn_update_media_popularity() - Triggers para popularidad
 */

SET search_path = app, public;

-- ========================================
-- 1. ACTUALIZAR fn_recalculate_all_rankings()
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
    
    -- Recalcular DOUGUA (nuevo)
    UPDATE app.dougua
    SET ranking = (
        SELECT COUNT(*) + 1
        FROM app.dougua d2
        WHERE d2.deleted_at IS NULL
          AND d2.is_published = true
          AND (
            (d2.average_score * 0.7 + 
             (d2.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.dougua WHERE deleted_at IS NULL AND is_published = true), 0)) * 30) 
            > 
            (dougua.average_score * 0.7 + 
             (dougua.popularity::numeric / NULLIF((SELECT MAX(popularity) FROM app.dougua WHERE deleted_at IS NULL AND is_published = true), 0)) * 30)
          )
    )
    WHERE deleted_at IS NULL AND is_published = true;
    
    -- Recalcular MANHUA (nuevo)
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
    
    -- Recalcular MANHWA (nuevo)
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
    
    -- Recalcular FAN_COMICS (nuevo)
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
    
    RAISE NOTICE 'Rankings recalculados para anime, manga, novels, dougua, manhua, manhwa y fan_comics';
END;
$$;

-- ========================================
-- 2. CREAR TRIGGERS PARA UPDATE DE REVIEWS
-- ========================================

-- Los triggers para fn_update_media_review_stats ya funcionan con polimorfismo
-- Solo necesitamos verificar que detecta las nuevas tablas

-- Trigger para actualizar stats cuando se INSERT/UPDATE/DELETE review
-- (Ya existe, solo verificamos que funciona con nuevas tablas)

DROP TRIGGER IF EXISTS trg_reviews_update_media ON app.reviews;
CREATE TRIGGER trg_reviews_update_media
  AFTER INSERT OR UPDATE OR DELETE ON app.reviews
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_update_media_review_stats();

-- ========================================
-- 3. CREAR TRIGGERS PARA UPDATE DE POPULARIDAD
-- ========================================

-- Trigger para actualizar popularidad cuando cambian list_items
DROP TRIGGER IF EXISTS trg_list_items_update_popularity ON app.list_items;
CREATE TRIGGER trg_list_items_update_popularity
  AFTER INSERT OR UPDATE OR DELETE ON app.list_items
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_update_media_popularity();

-- ========================================
-- 4. ACTUALIZAR fn_update_media_ranking()
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
                WHEN '%I' IN ('anime', 'dougua') THEN m2.is_published = true
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

SELECT 'Funciones actualizadas correctamente' as status;

-- Verificar que fn_recalculate_all_rankings existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'fn_recalculate_all_rankings actualizada'
    ELSE 'ERROR: Funcion no encontrada'
  END as resultado
FROM pg_proc 
WHERE proname = 'fn_recalculate_all_rankings';

-- Verificar que fn_update_media_ranking existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'fn_update_media_ranking actualizada'
    ELSE 'ERROR: Funcion no encontrada'
  END as resultado
FROM pg_proc 
WHERE proname = 'fn_update_media_ranking';
