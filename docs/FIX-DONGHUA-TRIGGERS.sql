/**
 * ========================================
 * SCRIPT: RECREAR TRIGGERS DONGHUA
 * ========================================
 */

SET search_path = app, public;

-- Crear función para donghua
CREATE OR REPLACE FUNCTION app.fn_donghua_set_slug() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar triggers antiguos si existen
DROP TRIGGER IF EXISTS trg_dougua_update_time ON app.donghua;
DROP TRIGGER IF EXISTS trg_set_dougua_status_default ON app.donghua;
DROP TRIGGER IF EXISTS trg_dougua_update_ranking ON app.donghua;

-- Recrear todos los triggers con nombres correctos
CREATE TRIGGER trg_set_donghua_slug
  BEFORE INSERT OR UPDATE ON app.donghua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_donghua_set_slug();

CREATE TRIGGER trg_donghua_update_time 
  BEFORE UPDATE ON app.donghua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_update_updated_at();

CREATE TRIGGER trg_set_donghua_status_default
  BEFORE INSERT ON app.donghua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_set_default_anime_status();

CREATE TRIGGER trg_donghua_update_ranking
  BEFORE UPDATE OF average_score, ratings_count, popularity ON app.donghua
  FOR EACH ROW
  WHEN (
    OLD.average_score IS DISTINCT FROM NEW.average_score OR
    OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
    OLD.popularity IS DISTINCT FROM NEW.popularity
  )
  EXECUTE FUNCTION app.fn_update_media_ranking();

-- Verificar
SELECT 'Triggers de donghua:' as status;
SELECT tgname, tgenabled FROM pg_trigger 
WHERE tgrelid = 'app.donghua'::regclass AND tgname NOT LIKE 'RI_%'
ORDER BY tgname;
