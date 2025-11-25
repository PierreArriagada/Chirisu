/**
 * ========================================
 * SCRIPT: TRIGGERS Y FUNCIONES PARA NUEVAS TABLAS
 * ========================================
 * 
 * Este script crea:
 * 1. Funciones para auto-generar slugs
 * 2. Triggers para updated_at
 * 3. Triggers para status default
 * 4. Triggers para ranking automático
 */

SET search_path = app, public;

-- ========================================
-- PARTE 1: FUNCIONES PARA SLUGS
-- ========================================

-- Función para auto-generar slug en DOUGUA
CREATE OR REPLACE FUNCTION app.fn_dougua_set_slug() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo si slug esta vacio
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Función para auto-generar slug en MANHUA
CREATE OR REPLACE FUNCTION app.fn_manhua_set_slug() 
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

-- Función para auto-generar slug en MANHWA
CREATE OR REPLACE FUNCTION app.fn_manhwa_set_slug() 
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

-- Función para auto-generar slug en FAN_COMICS
CREATE OR REPLACE FUNCTION app.fn_fan_comics_set_slug() 
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title, NEW.title_english, NEW.title_spanish, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ========================================
-- PARTE 2: TRIGGERS PARA SLUGS
-- ========================================

-- Trigger para DOUGUA
DROP TRIGGER IF EXISTS trg_set_dougua_slug ON app.dougua;
CREATE TRIGGER trg_set_dougua_slug
  BEFORE INSERT OR UPDATE ON app.dougua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_dougua_set_slug();

-- Trigger para MANHUA
DROP TRIGGER IF EXISTS trg_set_manhua_slug ON app.manhua;
CREATE TRIGGER trg_set_manhua_slug
  BEFORE INSERT OR UPDATE ON app.manhua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_manhua_set_slug();

-- Trigger para MANHWA
DROP TRIGGER IF EXISTS trg_set_manhwa_slug ON app.manhwa;
CREATE TRIGGER trg_set_manhwa_slug
  BEFORE INSERT OR UPDATE ON app.manhwa
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_manhwa_set_slug();

-- Trigger para FAN_COMICS
DROP TRIGGER IF EXISTS trg_set_fan_comics_slug ON app.fan_comics;
CREATE TRIGGER trg_set_fan_comics_slug
  BEFORE INSERT OR UPDATE ON app.fan_comics
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_fan_comics_set_slug();

-- ========================================
-- PARTE 3: TRIGGERS PARA UPDATED_AT
-- ========================================

-- DOUGUA
DROP TRIGGER IF EXISTS trg_dougua_update_time ON app.dougua;
CREATE TRIGGER trg_dougua_update_time 
  BEFORE UPDATE ON app.dougua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_update_updated_at();

-- MANHUA
DROP TRIGGER IF EXISTS trg_manhua_update_time ON app.manhua;
CREATE TRIGGER trg_manhua_update_time 
  BEFORE UPDATE ON app.manhua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_update_updated_at();

-- MANHWA
DROP TRIGGER IF EXISTS trg_manhwa_update_time ON app.manhwa;
CREATE TRIGGER trg_manhwa_update_time 
  BEFORE UPDATE ON app.manhwa
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_update_updated_at();

-- FAN_COMICS
DROP TRIGGER IF EXISTS trg_fan_comics_update_time ON app.fan_comics;
CREATE TRIGGER trg_fan_comics_update_time 
  BEFORE UPDATE ON app.fan_comics
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_update_updated_at();

-- ========================================
-- PARTE 4: TRIGGERS PARA STATUS DEFAULT
-- ========================================

-- DOUGUA (usa mismo default que anime: not_yet_aired)
DROP TRIGGER IF EXISTS trg_set_dougua_status_default ON app.dougua;
CREATE TRIGGER trg_set_dougua_status_default
  BEFORE INSERT ON app.dougua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_set_default_anime_status();

-- MANHUA (usa mismo default que manga: publishing)
DROP TRIGGER IF EXISTS trg_set_manhua_status_default ON app.manhua;
CREATE TRIGGER trg_set_manhua_status_default
  BEFORE INSERT ON app.manhua
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_set_default_publishing_status();

-- MANHWA (usa mismo default que manga: publishing)
DROP TRIGGER IF EXISTS trg_set_manhwa_status_default ON app.manhwa;
CREATE TRIGGER trg_set_manhwa_status_default
  BEFORE INSERT ON app.manhwa
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_set_default_publishing_status();

-- FAN_COMICS (usa mismo default que manga: publishing)
DROP TRIGGER IF EXISTS trg_set_fan_comics_status_default ON app.fan_comics;
CREATE TRIGGER trg_set_fan_comics_status_default
  BEFORE INSERT ON app.fan_comics
  FOR EACH ROW 
  EXECUTE FUNCTION app.fn_set_default_publishing_status();

-- ========================================
-- PARTE 5: TRIGGERS PARA RANKING AUTOMÁTICO
-- ========================================

-- DOUGUA
DROP TRIGGER IF EXISTS trg_dougua_update_ranking ON app.dougua;
CREATE TRIGGER trg_dougua_update_ranking
  BEFORE UPDATE OF average_score, ratings_count, popularity ON app.dougua
  FOR EACH ROW
  WHEN (
    OLD.average_score IS DISTINCT FROM NEW.average_score OR
    OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
    OLD.popularity IS DISTINCT FROM NEW.popularity
  )
  EXECUTE FUNCTION app.fn_update_media_ranking();

-- MANHUA
DROP TRIGGER IF EXISTS trg_manhua_update_ranking ON app.manhua;
CREATE TRIGGER trg_manhua_update_ranking
  BEFORE UPDATE OF average_score, ratings_count, popularity ON app.manhua
  FOR EACH ROW
  WHEN (
    OLD.average_score IS DISTINCT FROM NEW.average_score OR
    OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
    OLD.popularity IS DISTINCT FROM NEW.popularity
  )
  EXECUTE FUNCTION app.fn_update_media_ranking();

-- MANHWA
DROP TRIGGER IF EXISTS trg_manhwa_update_ranking ON app.manhwa;
CREATE TRIGGER trg_manhwa_update_ranking
  BEFORE UPDATE OF average_score, ratings_count, popularity ON app.manhwa
  FOR EACH ROW
  WHEN (
    OLD.average_score IS DISTINCT FROM NEW.average_score OR
    OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
    OLD.popularity IS DISTINCT FROM NEW.popularity
  )
  EXECUTE FUNCTION app.fn_update_media_ranking();

-- FAN_COMICS
DROP TRIGGER IF EXISTS trg_fan_comics_update_ranking ON app.fan_comics;
CREATE TRIGGER trg_fan_comics_update_ranking
  BEFORE UPDATE OF average_score, ratings_count, popularity ON app.fan_comics
  FOR EACH ROW
  WHEN (
    OLD.average_score IS DISTINCT FROM NEW.average_score OR
    OLD.ratings_count IS DISTINCT FROM NEW.ratings_count OR
    OLD.popularity IS DISTINCT FROM NEW.popularity
  )
  EXECUTE FUNCTION app.fn_update_media_ranking();

-- ========================================
-- VERIFICACIÓN DE TRIGGERS
-- ========================================

SELECT 'Verificando triggers creados:' as status;

SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE tgenabled
    WHEN 'O' THEN 'Activo'
    WHEN 'D' THEN 'Desactivado'
    ELSE 'Otro'
  END as estado
FROM pg_trigger
WHERE tgrelid IN (
  'app.dougua'::regclass,
  'app.manhua'::regclass,
  'app.manhwa'::regclass,
  'app.fan_comics'::regclass
)
AND tgname NOT LIKE 'RI_%'  -- Excluir triggers del sistema
ORDER BY table_name, trigger_name;

SELECT 'Triggers creados correctamente' as resultado;
