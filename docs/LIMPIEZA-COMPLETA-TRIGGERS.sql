-- ============================================
-- DIAGNOSTICO Y LIMPIEZA COMPLETA DE TRIGGERS
-- ============================================

SET client_encoding = 'UTF8';

-- ============================================
-- 1. VER TODOS LOS TRIGGERS RELACIONADOS
-- ============================================

SELECT 
  t.tgname AS trigger_name,
  c.relname AS tabla,
  p.proname AS funcion,
  pg_get_triggerdef(t.oid) AS definicion_completa
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'app'
  AND (t.tgname LIKE '%slug%' OR p.proname LIKE '%slug%')
ORDER BY c.relname, t.tgname;

-- ============================================
-- 2. VER TODAS LAS FUNCIONES RELACIONADAS
-- ============================================

SELECT 
  p.proname AS funcion,
  pg_get_functiondef(p.oid) AS definicion_completa
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
  AND (p.proname LIKE '%slug%')
ORDER BY p.proname;

-- ============================================
-- 3. LIMPIEZA TOTAL - ELIMINAR TODO
-- ============================================

-- Eliminar todos los triggers relacionados con slug
DROP TRIGGER IF EXISTS auto_generate_slug ON app.anime CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manga CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.novels CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhua CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhwa CASCADE;

-- Eliminar todas las funciones de trigger relacionadas
DROP FUNCTION IF EXISTS app.auto_generate_slug() CASCADE;
DROP FUNCTION IF EXISTS app.auto_generate_slug_manga() CASCADE;
DROP FUNCTION IF EXISTS app.auto_generate_slug_novel() CASCADE;

-- Eliminar la funcion generate_slug en todas sus versiones
DROP FUNCTION IF EXISTS app.generate_slug(TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS app.generate_slug(TEXT) CASCADE;

-- ============================================
-- 4. RECREAR TODO DESDE CERO
-- ============================================

-- 4.1 Crear funcion generate_slug (SIN ID)
CREATE OR REPLACE FUNCTION app.generate_slug(title TEXT) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  IF title IS NULL OR title = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convertir a minusculas
  base_slug := lower(title);
  
  -- Reemplazar acentos comunes
  base_slug := translate(base_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  -- Quitar caracteres especiales
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Normalizar espacios
  base_slug := regexp_replace(base_slug, '\s+', ' ', 'g');
  base_slug := trim(base_slug);
  
  -- Reemplazar espacios por guiones
  base_slug := regexp_replace(base_slug, '\s', '-', 'g');
  
  -- Quitar guiones multiples
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  
  -- Quitar guiones al inicio y final
  base_slug := trim(both '-' from base_slug);
  
  -- Limitar a 255 caracteres
  base_slug := substring(base_slug from 1 for 255);
  
  RETURN base_slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION app.generate_slug(TEXT) IS 'Genera slug sin ID - solo nombre normalizado';

-- 4.2 Crear trigger function para ANIME
CREATE OR REPLACE FUNCTION app.auto_generate_slug_anime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.3 Crear trigger function para MANGA
CREATE OR REPLACE FUNCTION app.auto_generate_slug_manga()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.4 Crear trigger function para NOVELS
CREATE OR REPLACE FUNCTION app.auto_generate_slug_novel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native, 'untitled')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.5 Crear triggers en las tablas
CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug_anime();

CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug_manga();

CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug_novel();

-- ============================================
-- 5. VERIFICACION FINAL
-- ============================================

-- Ver funcion generate_slug
SELECT 
  'Funcion generate_slug' AS verificacion,
  proname AS nombre,
  pronargs AS num_parametros,
  pg_get_function_arguments(p.oid) AS parametros
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app' 
  AND proname = 'generate_slug';

-- Ver triggers activos
SELECT 
  'Triggers activos' AS verificacion,
  t.tgname AS trigger_name,
  c.relname AS tabla,
  p.proname AS funcion
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'app'
  AND t.tgname = 'auto_generate_slug'
ORDER BY c.relname;

-- Ver definicion completa del trigger de anime
SELECT pg_get_triggerdef(oid) AS definicion_trigger_anime
FROM pg_trigger
WHERE tgname = 'auto_generate_slug'
  AND tgrelid = 'app.anime'::regclass;

-- ============================================
-- 6. PRUEBAS
-- ============================================

-- Test 1: Funcion directa
SELECT 
  'Test funcion directa' AS test,
  app.generate_slug('Jujutsu Kaisen') AS resultado,
  'jujutsu-kaisen' AS esperado;

-- Test 2: Con acentos
SELECT 
  'Test con acentos' AS test,
  app.generate_slug('Pokémon') AS resultado,
  'pokemon' AS esperado;

-- Test 3: Con caracteres especiales
SELECT 
  'Test caracteres especiales' AS test,
  app.generate_slug('One Piece: The Movie!') AS resultado,
  'one-piece-the-movie' AS esperado;

-- ============================================
-- FIN
-- ============================================

SELECT 'Limpieza y recreacion completa exitosa!' AS mensaje;
