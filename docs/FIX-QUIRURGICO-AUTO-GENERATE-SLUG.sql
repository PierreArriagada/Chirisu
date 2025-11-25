-- ============================================
-- FIX QUIRURGICO - Eliminar auto_generate_slug
-- ============================================

SET client_encoding = 'UTF8';

-- ============================================
-- 1. MOSTRAR QUE EXISTE EL PROBLEMA
-- ============================================

\echo '=========================================='
\echo 'ANTES - Mostrando funciones con auto_generate_slug'
\echo '=========================================='

SELECT 
  n.nspname || '.' || p.proname AS funcion_completa,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  p.prosrc AS codigo_interno
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
  AND p.proname LIKE '%auto_generate_slug%';

-- ============================================
-- 2. ELIMINAR TRIGGERS QUE USAN auto_generate_slug
-- ============================================

\echo ''
\echo 'Eliminando triggers que usan auto_generate_slug...'

DROP TRIGGER IF EXISTS auto_generate_slug ON app.anime CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manga CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.novels CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhua CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhwa CASCADE;

\echo 'OK - Triggers con nombre auto_generate_slug eliminados'

-- ============================================
-- 3. ELIMINAR LA FUNCION auto_generate_slug()
-- ============================================

\echo ''
\echo 'Eliminando funcion auto_generate_slug()...'

-- Esta es la función problemática que tiene el código viejo
DROP FUNCTION IF EXISTS app.auto_generate_slug() CASCADE;

\echo 'OK - Funcion app.auto_generate_slug() eliminada'

-- ============================================
-- 4. VERIFICAR QUE YA NO EXISTE
-- ============================================

\echo ''
\echo '=========================================='
\echo 'DESPUES - Verificando que no existe'
\echo '=========================================='

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app' AND p.proname = 'auto_generate_slug'
    )
    THEN 'ERROR: auto_generate_slug AUN EXISTE!'
    ELSE 'OK: auto_generate_slug eliminada correctamente'
  END AS verificacion;

-- ============================================
-- 5. CREAR NUEVA FUNCION generate_slug (sin ID)
-- ============================================

\echo ''
\echo 'Creando nueva funcion generate_slug (sin ID)...'

DROP FUNCTION IF EXISTS app.generate_slug(TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS app.generate_slug(TEXT) CASCADE;

CREATE FUNCTION app.generate_slug(p_title TEXT) 
RETURNS VARCHAR(255) 
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_slug VARCHAR(255);
BEGIN
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RETURN 'untitled';
  END IF;
  
  v_slug := lower(trim(p_title));
  
  v_slug := translate(v_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
  v_slug := regexp_replace(v_slug, '\s+', ' ', 'g');
  v_slug := trim(v_slug);
  v_slug := replace(v_slug, ' ', '-');
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  v_slug := trim(both '-' from v_slug);
  
  IF v_slug = '' THEN
    v_slug := 'untitled';
  END IF;
  
  v_slug := substring(v_slug from 1 for 255);
  
  RETURN v_slug;
END;
$$;

\echo 'OK - Funcion generate_slug creada'

-- ============================================
-- 6. CREAR NUEVA TRIGGER FUNCTION (nombre diferente)
-- ============================================

\echo ''
\echo 'Creando nueva trigger function: trg_before_insert_anime()...'

CREATE OR REPLACE FUNCTION app.trg_before_insert_anime()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title TEXT;
BEGIN
  -- Solo generar slug si esta vacio
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    v_title := COALESCE(
      NULLIF(trim(NEW.title_romaji), ''),
      NULLIF(trim(NEW.title_english), ''),
      NULLIF(trim(NEW.title_native), ''),
      'untitled'
    );
    
    -- Llamar a generate_slug con 1 parametro (sin ID)
    NEW.slug := app.generate_slug(v_title);
    
    RAISE NOTICE 'Slug generado para anime: %', NEW.slug;
  END IF;
  
  RETURN NEW;
END;
$$;

\echo 'OK - Trigger function para anime creada'

-- ============================================
-- 7. CREAR TRIGGER CON NUEVO NOMBRE
-- ============================================

\echo ''
\echo 'Creando trigger: before_insert_update_anime...'

DROP TRIGGER IF EXISTS before_insert_update_anime ON app.anime CASCADE;

CREATE TRIGGER before_insert_update_anime
  BEFORE INSERT OR UPDATE
  ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_before_insert_anime();

\echo 'OK - Trigger creado'

-- ============================================
-- 8. HACER LO MISMO PARA MANGA Y NOVELS
-- ============================================

\echo ''
\echo 'Creando triggers para manga y novels...'

-- MANGA
CREATE OR REPLACE FUNCTION app.trg_before_insert_manga()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title TEXT;
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    v_title := COALESCE(
      NULLIF(trim(NEW.title_romaji), ''),
      NULLIF(trim(NEW.title_english), ''),
      NULLIF(trim(NEW.title_native), ''),
      'untitled'
    );
    NEW.slug := app.generate_slug(v_title);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_update_manga ON app.manga CASCADE;

CREATE TRIGGER before_insert_update_manga
  BEFORE INSERT OR UPDATE
  ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_before_insert_manga();

-- NOVELS
CREATE OR REPLACE FUNCTION app.trg_before_insert_novel()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title TEXT;
BEGIN
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    v_title := COALESCE(
      NULLIF(trim(NEW.title_romaji), ''),
      NULLIF(trim(NEW.title_english), ''),
      NULLIF(trim(NEW.title_native), ''),
      'untitled'
    );
    NEW.slug := app.generate_slug(v_title);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS before_insert_update_novel ON app.novels CASCADE;

CREATE TRIGGER before_insert_update_novel
  BEFORE INSERT OR UPDATE
  ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_before_insert_novel();

\echo 'OK - Triggers para manga y novels creados'

-- ============================================
-- 9. VERIFICACION COMPLETA
-- ============================================

\echo ''
\echo '=========================================='
\echo 'VERIFICACION FINAL'
\echo '=========================================='

-- Verificar que no existe auto_generate_slug
SELECT 
  'CHECK 1: auto_generate_slug eliminada' AS test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app' AND p.proname = 'auto_generate_slug'
    )
    THEN 'PASS'
    ELSE 'FAIL - AUN EXISTE!'
  END AS resultado;

-- Verificar que existe generate_slug con 1 parametro
SELECT 
  'CHECK 2: generate_slug con 1 param' AS test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app' 
        AND p.proname = 'generate_slug'
        AND pronargs = 1
    )
    THEN 'PASS'
    ELSE 'FAIL'
  END AS resultado;

-- Listar todos los triggers activos
SELECT 
  'Triggers activos:' AS info,
  c.relname AS tabla,
  t.tgname AS trigger_nombre,
  p.proname AS funcion
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'app'
  AND c.relname IN ('anime', 'manga', 'novels')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================
-- 10. PRUEBA PRACTICA
-- ============================================

\echo ''
\echo '=========================================='
\echo 'PRUEBA PRACTICA'
\echo '=========================================='

SELECT 
  'Test generate_slug directa' AS test,
  app.generate_slug('Jujutsu Kaisen') AS resultado,
  'jujutsu-kaisen' AS esperado;

\echo ''
\echo '=========================================='
\echo 'COMPLETADO!'
\echo '=========================================='
\echo 'Ahora intenta aprobar la contribucion.'
\echo 'El trigger usara la nueva funcion sin ID.'
\echo '=========================================='
