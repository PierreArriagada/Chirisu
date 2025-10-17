-- ============================================
-- TRIGGERS DE OPTIMIZACIÓN PARA CHIRISU
-- Mantienen automáticamente las métricas denormalizadas
-- ============================================

SET search_path = app, public;

-- ============================================
-- 1. TRIGGERS PARA ACTUALIZAR AVERAGE_SCORE Y RATINGS_COUNT
-- ============================================

-- Función para actualizar métricas de reviews en la tabla de medios
CREATE OR REPLACE FUNCTION fn_update_media_review_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_table_name TEXT;
    v_avg_score NUMERIC(4,2);
    v_ratings_count INTEGER;
BEGIN
    -- Determinar la tabla correcta (novels usa nombre diferente)
    v_table_name := CASE 
        WHEN COALESCE(NEW.reviewable_type, OLD.reviewable_type) = 'novel' THEN 'novels'
        ELSE COALESCE(NEW.reviewable_type, OLD.reviewable_type)
    END;

    -- Calcular nuevas métricas
    SELECT 
        COALESCE(AVG(overall_score)::numeric(4,2), 0),
        COUNT(*)::integer
    INTO v_avg_score, v_ratings_count
    FROM app.reviews
    WHERE reviewable_type = COALESCE(NEW.reviewable_type, OLD.reviewable_type)
      AND reviewable_id = COALESCE(NEW.reviewable_id, OLD.reviewable_id)
      AND deleted_at IS NULL;

    -- Actualizar la tabla correspondiente
    EXECUTE format(
        'UPDATE app.%I SET average_score = $1, ratings_count = $2 WHERE id = $3',
        v_table_name
    ) USING v_avg_score, v_ratings_count, COALESCE(NEW.reviewable_id, OLD.reviewable_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT de reviews
DROP TRIGGER IF EXISTS trg_review_insert_update_stats ON app.reviews;
CREATE TRIGGER trg_review_insert_update_stats
    AFTER INSERT ON app.reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_review_stats();

-- Trigger para UPDATE de reviews
DROP TRIGGER IF EXISTS trg_review_update_update_stats ON app.reviews;
CREATE TRIGGER trg_review_update_update_stats
    AFTER UPDATE ON app.reviews
    FOR EACH ROW
    WHEN (OLD.overall_score IS DISTINCT FROM NEW.overall_score OR 
          OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE FUNCTION fn_update_media_review_stats();

-- Trigger para DELETE de reviews (soft delete)
DROP TRIGGER IF EXISTS trg_review_delete_update_stats ON app.reviews;
CREATE TRIGGER trg_review_delete_update_stats
    AFTER UPDATE ON app.reviews
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION fn_update_media_review_stats();

-- ============================================
-- 2. TRIGGERS PARA ACTUALIZAR RANKING
-- ============================================

-- Función para calcular y actualizar ranking basado en average_score y ratings_count
CREATE OR REPLACE FUNCTION fn_update_media_ranking()
RETURNS TRIGGER AS $$
DECLARE
    v_table_name TEXT;
    v_ranking INTEGER;
BEGIN
    -- Determinar la tabla correcta
    v_table_name := TG_TABLE_NAME;

    -- Calcular el ranking: contar cuántos tienen mejor score
    -- Usa Bayesian average: (C * m + R * v) / (C + v)
    -- Donde C = confianza mínima (e.g., 100), m = media global, R = ratings_count, v = average_score
    EXECUTE format('
        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       ORDER BY 
                           -- Bayesian average para evitar que items con 1 review dominen
                           ((100 * 7.0 + ratings_count * average_score) / (100 + ratings_count)) DESC,
                           ratings_count DESC,
                           id ASC
                   ) as rank_position
            FROM app.%I
            WHERE deleted_at IS NULL 
              AND is_approved = TRUE
        )
        SELECT rank_position
        FROM ranked
        WHERE id = $1
    ', v_table_name)
    INTO v_ranking
    USING NEW.id;

    -- Si no hay ranking (no aprobado o eliminado), poner NULL
    IF v_ranking IS NULL THEN
        v_ranking := 0;
    END IF;

    -- Actualizar el ranking en el registro
    NEW.ranking := v_ranking;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agregar columna ranking si no existe
ALTER TABLE app.anime ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;
ALTER TABLE app.manga ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;
ALTER TABLE app.novels ADD COLUMN IF NOT EXISTS ranking INTEGER DEFAULT 0;

-- Triggers para UPDATE de average_score o ratings_count
DROP TRIGGER IF EXISTS trg_anime_ranking_update ON app.anime;
CREATE TRIGGER trg_anime_ranking_update
    BEFORE UPDATE ON app.anime
    FOR EACH ROW
    WHEN (OLD.average_score IS DISTINCT FROM NEW.average_score OR 
          OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
          OLD.is_approved IS DISTINCT FROM NEW.is_approved)
    EXECUTE FUNCTION fn_update_media_ranking();

DROP TRIGGER IF EXISTS trg_manga_ranking_update ON app.manga;
CREATE TRIGGER trg_manga_ranking_update
    BEFORE UPDATE ON app.manga
    FOR EACH ROW
    WHEN (OLD.average_score IS DISTINCT FROM NEW.average_score OR 
          OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
          OLD.is_approved IS DISTINCT FROM NEW.is_approved)
    EXECUTE FUNCTION fn_update_media_ranking();

DROP TRIGGER IF EXISTS trg_novels_ranking_update ON app.novels;
CREATE TRIGGER trg_novels_ranking_update
    BEFORE UPDATE ON app.novels
    FOR EACH ROW
    WHEN (OLD.average_score IS DISTINCT FROM NEW.average_score OR 
          OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
          OLD.is_approved IS DISTINCT FROM NEW.is_approved)
    EXECUTE FUNCTION fn_update_media_ranking();

-- ============================================
-- 3. TRIGGERS PARA ACTUALIZAR FAVOURITES COUNT
-- ============================================

-- Función para contar favoritos desde listas
CREATE OR REPLACE FUNCTION fn_update_media_favourites()
RETURNS TRIGGER AS $$
DECLARE
    v_table_name TEXT;
    v_favourites_count INTEGER;
BEGIN
    -- Determinar tabla y tipo
    v_table_name := CASE 
        WHEN COALESCE(NEW.listable_type, OLD.listable_type) = 'novel' THEN 'novels'
        ELSE COALESCE(NEW.listable_type, OLD.listable_type)
    END;

    -- Contar items en listas que se llaman "Favoritos" o tienen slug "favoritos"
    SELECT COUNT(DISTINCT li.list_id)::integer
    INTO v_favourites_count
    FROM app.list_items li
    JOIN app.lists l ON l.id = li.list_id
    WHERE li.listable_type = COALESCE(NEW.listable_type, OLD.listable_type)
      AND li.listable_id = COALESCE(NEW.listable_id, OLD.listable_id)
      AND (l.slug = 'favoritos' OR LOWER(l.name) LIKE '%favorito%');

    -- Actualizar la tabla correspondiente
    EXECUTE format(
        'UPDATE app.%I SET favourites = $1 WHERE id = $2',
        v_table_name
    ) USING v_favourites_count, COALESCE(NEW.listable_id, OLD.listable_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT de list_items
DROP TRIGGER IF EXISTS trg_list_item_insert_update_favourites ON app.list_items;
CREATE TRIGGER trg_list_item_insert_update_favourites
    AFTER INSERT ON app.list_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_favourites();

-- Trigger para DELETE de list_items
DROP TRIGGER IF EXISTS trg_list_item_delete_update_favourites ON app.list_items;
CREATE TRIGGER trg_list_item_delete_update_favourites
    AFTER DELETE ON app.list_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_favourites();

-- ============================================
-- 4. TRIGGERS PARA ACTUALIZAR POPULARITY
-- ============================================

-- Función para calcular popularidad basada en múltiples factores
CREATE OR REPLACE FUNCTION fn_update_media_popularity()
RETURNS TRIGGER AS $$
DECLARE
    v_table_name TEXT;
    v_popularity INTEGER;
    v_reviewable_type TEXT;
    v_reviewable_id BIGINT;
BEGIN
    -- Determinar el tipo y ID basado en la tabla de origen
    IF TG_TABLE_NAME = 'list_items' THEN
        v_reviewable_type := COALESCE(NEW.listable_type, OLD.listable_type);
        v_reviewable_id := COALESCE(NEW.listable_id, OLD.listable_id);
    ELSIF TG_TABLE_NAME = 'reviews' THEN
        v_reviewable_type := COALESCE(NEW.reviewable_type, OLD.reviewable_type);
        v_reviewable_id := COALESCE(NEW.reviewable_id, OLD.reviewable_id);
    ELSE
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Determinar tabla
    v_table_name := CASE 
        WHEN v_reviewable_type = 'novel' THEN 'novels'
        ELSE v_reviewable_type
    END;

    -- Calcular popularidad: 
    -- users_in_lists * 10 + ratings_count * 5 + favourites * 20
    EXECUTE format('
        WITH stats AS (
            SELECT 
                COUNT(DISTINCT li.list_id) as users_in_lists,
                COALESCE(m.ratings_count, 0) as ratings_count,
                COALESCE(m.favourites, 0) as favourites
            FROM app.%I m
            LEFT JOIN app.list_items li ON li.listable_id = m.id 
                AND li.listable_type = $2
            WHERE m.id = $1
            GROUP BY m.ratings_count, m.favourites
        )
        SELECT (users_in_lists * 10 + ratings_count * 5 + favourites * 20)::integer
        FROM stats
    ', v_table_name)
    INTO v_popularity
    USING v_reviewable_id, v_reviewable_type;

    -- Actualizar popularidad
    EXECUTE format(
        'UPDATE app.%I SET popularity = $1 WHERE id = $2',
        v_table_name
    ) USING COALESCE(v_popularity, 0), v_reviewable_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar popularidad cuando cambian las listas
DROP TRIGGER IF EXISTS trg_list_item_insert_update_popularity ON app.list_items;
CREATE TRIGGER trg_list_item_insert_update_popularity
    AFTER INSERT ON app.list_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_popularity();

DROP TRIGGER IF EXISTS trg_list_item_delete_update_popularity ON app.list_items;
CREATE TRIGGER trg_list_item_delete_update_popularity
    AFTER DELETE ON app.list_items
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_popularity();

-- Triggers para actualizar popularidad cuando cambian las reviews (NUEVO)
DROP TRIGGER IF EXISTS trg_review_insert_update_popularity ON app.reviews;
CREATE TRIGGER trg_review_insert_update_popularity
    AFTER INSERT ON app.reviews
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_media_popularity();

DROP TRIGGER IF EXISTS trg_review_update_update_popularity ON app.reviews;
CREATE TRIGGER trg_review_update_update_popularity
    AFTER UPDATE ON app.reviews
    FOR EACH ROW
    WHEN (NEW.deleted_at IS DISTINCT FROM OLD.deleted_at)
    EXECUTE FUNCTION fn_update_media_popularity();

-- ============================================
-- 5. TRIGGERS PARA CONTADORES DE COMMENTS
-- ============================================

-- Función para actualizar likes_count en comments
CREATE OR REPLACE FUNCTION fn_update_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el contador de likes
    UPDATE app.comments
    SET likes_count = (
        SELECT COUNT(*)::integer
        FROM app.comment_reactions
        WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id)
          AND reaction_type = 'like'
    )
    WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_reaction_insert ON app.comment_reactions;
CREATE TRIGGER trg_comment_reaction_insert
    AFTER INSERT ON app.comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_comment_likes();

DROP TRIGGER IF EXISTS trg_comment_reaction_delete ON app.comment_reactions;
CREATE TRIGGER trg_comment_reaction_delete
    AFTER DELETE ON app.comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_comment_likes();

-- Función para actualizar replies_count
CREATE OR REPLACE FUNCTION fn_update_comment_replies()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si tiene parent_id
    IF COALESCE(NEW.parent_id, OLD.parent_id) IS NOT NULL THEN
        UPDATE app.comments
        SET replies_count = (
            SELECT COUNT(*)::integer
            FROM app.comments
            WHERE parent_id = COALESCE(NEW.parent_id, OLD.parent_id)
              AND deleted_at IS NULL
        )
        WHERE id = COALESCE(NEW.parent_id, OLD.parent_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comment_insert_update_replies ON app.comments;
CREATE TRIGGER trg_comment_insert_update_replies
    AFTER INSERT ON app.comments
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_comment_replies();

DROP TRIGGER IF EXISTS trg_comment_delete_update_replies ON app.comments;
CREATE TRIGGER trg_comment_delete_update_replies
    AFTER UPDATE ON app.comments
    FOR EACH ROW
    WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION fn_update_comment_replies();

-- ============================================
-- 6. TRIGGERS PARA HELPFUL_VOTES EN REVIEWS
-- ============================================

-- Función para actualizar helpful_votes
CREATE OR REPLACE FUNCTION fn_update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE app.reviews
    SET helpful_votes = (
        SELECT COUNT(*)::integer
        FROM app.review_votes
        WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
          AND vote_type = 'helpful'
    )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_vote_insert ON app.review_votes;
CREATE TRIGGER trg_review_vote_insert
    AFTER INSERT ON app.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_review_helpful_votes();

DROP TRIGGER IF EXISTS trg_review_vote_update ON app.review_votes;
CREATE TRIGGER trg_review_vote_update
    AFTER UPDATE ON app.review_votes
    FOR EACH ROW
    WHEN (OLD.vote_type IS DISTINCT FROM NEW.vote_type)
    EXECUTE FUNCTION fn_update_review_helpful_votes();

DROP TRIGGER IF EXISTS trg_review_vote_delete ON app.review_votes;
CREATE TRIGGER trg_review_vote_delete
    AFTER DELETE ON app.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_review_helpful_votes();

-- ============================================
-- 7. TRIGGERS PARA FOLLOWERS/FOLLOWING COUNT
-- ============================================

-- Función para actualizar contadores de seguidores
CREATE OR REPLACE FUNCTION fn_update_user_follows_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar followers_count del usuario seguido
    UPDATE app.users
    SET followers_count = (
        SELECT COUNT(*)::integer
        FROM app.user_follows
        WHERE following_id = COALESCE(NEW.following_id, OLD.following_id)
    )
    WHERE id = COALESCE(NEW.following_id, OLD.following_id);

    -- Actualizar following_count del seguidor
    UPDATE app.users
    SET following_count = (
        SELECT COUNT(*)::integer
        FROM app.user_follows
        WHERE follower_id = COALESCE(NEW.follower_id, OLD.follower_id)
    )
    WHERE id = COALESCE(NEW.follower_id, OLD.follower_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_follow_insert ON app.user_follows;
CREATE TRIGGER trg_user_follow_insert
    AFTER INSERT ON app.user_follows
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_user_follows_count();

DROP TRIGGER IF EXISTS trg_user_follow_delete ON app.user_follows;
CREATE TRIGGER trg_user_follow_delete
    AFTER DELETE ON app.user_follows
    FOR EACH ROW
    EXECUTE FUNCTION fn_update_user_follows_count();

-- ============================================
-- 8. ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índices para mejorar performance de queries de ranking
CREATE INDEX IF NOT EXISTS idx_anime_ranking_score ON app.anime(average_score DESC, ratings_count DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_manga_ranking_score ON app.manga(average_score DESC, ratings_count DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_novels_ranking_score ON app.novels(average_score DESC, ratings_count DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;

-- Índices para popularity
CREATE INDEX IF NOT EXISTS idx_anime_popularity ON app.anime(popularity DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_manga_popularity ON app.manga(popularity DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_novels_popularity ON app.novels(popularity DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;

-- Índices para favourites
CREATE INDEX IF NOT EXISTS idx_anime_favourites ON app.anime(favourites DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_manga_favourites ON app.manga(favourites DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_novels_favourites ON app.novels(favourites DESC) 
    WHERE deleted_at IS NULL AND is_approved = TRUE;

-- Índices para reviews por fecha
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON app.reviews(created_at DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON app.reviews(helpful_votes DESC) 
    WHERE deleted_at IS NULL;

-- Índices para comments
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON app.comments(created_at DESC) 
    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_likes ON app.comments(likes_count DESC) 
    WHERE deleted_at IS NULL;

-- Índices para list_items con status
CREATE INDEX IF NOT EXISTS idx_list_items_status ON app.list_items(status, listable_type);

-- Índice compuesto para búsquedas de listas de usuario
CREATE INDEX IF NOT EXISTS idx_list_items_user_media ON app.list_items(list_id, listable_type, listable_id);

-- ============================================
-- 9. FUNCIÓN PARA RECALCULAR TODOS LOS RANKINGS
-- ============================================

CREATE OR REPLACE FUNCTION fn_recalculate_all_rankings()
RETURNS void AS $$
BEGIN
    -- Recalcular anime
    WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   ORDER BY 
                       ((100 * 7.0 + ratings_count * average_score) / (100 + ratings_count)) DESC,
                       ratings_count DESC,
                       id ASC
               ) as rank_position
        FROM app.anime
        WHERE deleted_at IS NULL AND is_approved = TRUE
    )
    UPDATE app.anime a
    SET ranking = r.rank_position
    FROM ranked r
    WHERE a.id = r.id;

    -- Recalcular manga
    WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   ORDER BY 
                       ((100 * 7.0 + ratings_count * average_score) / (100 + ratings_count)) DESC,
                       ratings_count DESC,
                       id ASC
               ) as rank_position
        FROM app.manga
        WHERE deleted_at IS NULL AND is_approved = TRUE
    )
    UPDATE app.manga m
    SET ranking = r.rank_position
    FROM ranked r
    WHERE m.id = r.id;

    -- Recalcular novels
    WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   ORDER BY 
                       ((100 * 7.0 + ratings_count * average_score) / (100 + ratings_count)) DESC,
                       ratings_count DESC,
                       id ASC
               ) as rank_position
        FROM app.novels
        WHERE deleted_at IS NULL AND is_approved = TRUE
    )
    UPDATE app.novels n
    SET ranking = r.rank_position
    FROM ranked r
    WHERE n.id = r.id;

    RAISE NOTICE 'Rankings recalculados para anime, manga y novels';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. SCRIPT DE INICIALIZACIÓN
-- ============================================

-- Ejecutar este comando para inicializar todos los valores denormalizados
DO $$
BEGIN
    -- Recalcular average_score y ratings_count para todos los medios
    RAISE NOTICE 'Recalculando average_score y ratings_count...';
    
    -- Para anime
    UPDATE app.anime a
    SET average_score = COALESCE(r.avg_score, 0),
        ratings_count = COALESCE(r.count, 0)
    FROM (
        SELECT reviewable_id, 
               AVG(overall_score)::numeric(4,2) as avg_score,
               COUNT(*)::integer as count
        FROM app.reviews
        WHERE reviewable_type = 'anime' AND deleted_at IS NULL
        GROUP BY reviewable_id
    ) r
    WHERE a.id = r.reviewable_id;

    -- Para manga
    UPDATE app.manga m
    SET average_score = COALESCE(r.avg_score, 0),
        ratings_count = COALESCE(r.count, 0)
    FROM (
        SELECT reviewable_id, 
               AVG(overall_score)::numeric(4,2) as avg_score,
               COUNT(*)::integer as count
        FROM app.reviews
        WHERE reviewable_type = 'manga' AND deleted_at IS NULL
        GROUP BY reviewable_id
    ) r
    WHERE m.id = r.reviewable_id;

    -- Para novels
    UPDATE app.novels n
    SET average_score = COALESCE(r.avg_score, 0),
        ratings_count = COALESCE(r.count, 0)
    FROM (
        SELECT reviewable_id, 
               AVG(overall_score)::numeric(4,2) as avg_score,
               COUNT(*)::integer as count
        FROM app.reviews
        WHERE reviewable_type = 'novel' AND deleted_at IS NULL
        GROUP BY reviewable_id
    ) r
    WHERE n.id = r.reviewable_id;

    -- Recalcular todos los rankings
    RAISE NOTICE 'Recalculando rankings...';
    PERFORM fn_recalculate_all_rankings();

    RAISE NOTICE '✅ Inicialización completa';
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver triggers activos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'app'
ORDER BY event_object_table, trigger_name;

-- Ver un ejemplo de ranking
SELECT id, title_romaji, average_score, ratings_count, ranking, popularity, favourites
FROM app.anime
WHERE deleted_at IS NULL AND is_approved = TRUE
ORDER BY ranking ASC
LIMIT 10;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

/*
RESUMEN DE TRIGGERS CREADOS:

1. **Reviews → Media Stats**: Actualiza average_score y ratings_count automáticamente
2. **Media Stats → Ranking**: Calcula ranking usando Bayesian average
3. **List Items → Favourites**: Cuenta items en listas de favoritos
4. **List Items → Popularity**: Calcula popularidad combinando múltiples métricas
5. **Comment Reactions → Likes Count**: Mantiene contador de likes
6. **Comments → Replies Count**: Cuenta respuestas a comentarios
7. **Review Votes → Helpful Votes**: Mantiene contador de votos útiles
8. **User Follows → Followers/Following**: Actualiza contadores de seguidores

BENEFICIOS:
- ✅ Datos siempre consistentes sin código adicional
- ✅ Mejor performance en queries de lectura
- ✅ Ranking automático y actualizado
- ✅ Bayesian average previene manipulación con pocas reviews
- ✅ Índices optimizados para queries comunes

MANTENIMIENTO:
- Ejecutar fn_recalculate_all_rankings() periódicamente (ej: cada noche)
- Los triggers mantienen datos actualizados en tiempo real
- El script de inicialización corrige datos existentes
*/
