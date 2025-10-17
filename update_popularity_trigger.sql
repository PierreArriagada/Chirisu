SET search_path = app, public;

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
