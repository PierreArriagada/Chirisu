-- ============================================
-- FIX: Actualizar generate_slug y trigger
-- ============================================
-- Este script corrige:
-- 1. Funcion generate_slug() sin ID
-- 2. Trigger auto_generate_slug() actualizado
-- ============================================

SET client_encoding = 'UTF8';

-- ============================================
-- 1. ACTUALIZAR FUNCION generate_slug (SIN ID)
-- ============================================

-- Primero, eliminar la version antigua
DROP FUNCTION IF EXISTS app.generate_slug(TEXT, BIGINT) CASCADE;

-- Crear nueva version SIN parametro ID
CREATE OR REPLACE FUNCTION app.generate_slug(title TEXT) 
RETURNS VARCHAR(255) AS $$
DECLARE
  base_slug VARCHAR(255);
BEGIN
  -- Convertir a minusculas y normalizar caracteres
  base_slug := lower(title);
  
  -- Reemplazar acentos comunes
  base_slug := translate(base_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  -- Quitar caracteres especiales (solo dejar letras, numeros, espacios y guiones)
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Reemplazar espacios multiples por uno solo
  base_slug := regexp_replace(base_slug, '\s+', ' ', 'g');
  
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

COMMENT ON FUNCTION app.generate_slug(TEXT) IS 'Genera un slug unico basado en el titulo (sin ID)';

-- ============================================
-- 2. ACTUALIZAR TRIGGER auto_generate_slug
-- ============================================

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS auto_generate_slug ON app.anime CASCADE;

-- Crear/reemplazar la funcion del trigger
CREATE OR REPLACE FUNCTION app.auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo generar slug si no se proporciono uno
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear trigger
CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug();

COMMENT ON FUNCTION app.auto_generate_slug() IS 'Genera slug automaticamente para anime antes de insert/update';

-- ============================================
-- 3. APLICAR MISMO FIX PARA OTRAS TABLAS
-- ============================================

-- MANGA
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manga CASCADE;

CREATE OR REPLACE FUNCTION app.auto_generate_slug_manga()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug_manga();

-- NOVELS
DROP TRIGGER IF EXISTS auto_generate_slug ON app.novels CASCADE;

CREATE OR REPLACE FUNCTION app.auto_generate_slug_novel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(NEW.title_romaji, NEW.title_english, NEW.title_native)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_slug
  BEFORE INSERT OR UPDATE ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION app.auto_generate_slug_novel();

-- ============================================
-- 4. VERIFICACIONES
-- ============================================

-- Verificar que la funcion existe con la firma correcta
SELECT 
  proname AS funcion,
  pronargs AS num_parametros,
  pg_get_function_arguments(p.oid) AS parametros
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app' 
  AND proname = 'generate_slug';

-- Verificar triggers
SELECT 
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

-- ============================================
-- 5. PRUEBAS
-- ============================================

-- Test 1: Slug simple
SELECT 
  'Test 1' AS test,
  app.generate_slug('Dragon Ball Z') AS resultado,
  'dragon-ball-z' AS esperado;

-- Test 2: Con caracteres especiales
SELECT 
  'Test 2' AS test,
  app.generate_slug('One Piece & Café!') AS resultado,
  'one-piece-cafe' AS esperado;

-- Test 3: Con acentos
SELECT 
  'Test 3' AS test,
  app.generate_slug('Pokémon: Diamante y Perla') AS resultado,
  'pokemon-diamante-y-perla' AS esperado;

-- Test 4: Titulo largo
SELECT 
  'Test 4' AS test,
  app.generate_slug('Shingeki no Kyojin (Attack on Titan)') AS resultado,
  'shingeki-no-kyojin-attack-on-titan' AS esperado;

-- ============================================
-- 6. ACTUALIZAR SLUGS EXISTENTES (OPCIONAL)
-- ============================================

-- Si quieres regenerar slugs de anime existentes SIN ID:
-- DESCOMENTA estas lineas si quieres ejecutarlas:

-- UPDATE app.anime 
-- SET slug = app.generate_slug(
--   COALESCE(title_romaji, title_english, title_native)
-- )
-- WHERE slug LIKE '%-[0-9]%'  -- Solo los que tienen numeros al final
--    OR slug IS NULL;

-- UPDATE app.manga 
-- SET slug = app.generate_slug(
--   COALESCE(title_romaji, title_english, title_native)
-- )
-- WHERE slug LIKE '%-[0-9]%' 
--    OR slug IS NULL;

-- UPDATE app.novels 
-- SET slug = app.generate_slug(
--   COALESCE(title_romaji, title_english, title_native)
-- )
-- WHERE slug LIKE '%-[0-9]%' 
--    OR slug IS NULL;

-- ============================================
-- FIN
-- ============================================

SELECT 'Script ejecutado exitosamente - slugs SIN ID!' AS mensaje;
