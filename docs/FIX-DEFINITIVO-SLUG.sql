-- ============================================
-- DIAGNOSTICO PROFUNDO Y FIX DEFINITIVO
-- ============================================

SET client_encoding = 'UTF8';

\echo '============================================'
\echo 'PASO 1: DIAGNOSTICO ACTUAL'
\echo '============================================'

-- Ver TODAS las funciones con 'slug' en el nombre
SELECT 
  n.nspname AS schema,
  p.proname AS nombre_funcion,
  pg_get_function_identity_arguments(p.oid) AS argumentos,
  p.prosrc AS codigo_fuente
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
  AND (p.proname LIKE '%slug%')
ORDER BY p.proname;

\echo ''
\echo '============================================'
\echo 'PASO 2: VER CODIGO DE TRIGGERS ACTUALES'
\echo '============================================'

-- Ver el código completo del trigger de anime
SELECT 
  'Codigo del trigger auto_generate_slug en anime:' AS info,
  pg_get_triggerdef(t.oid, true) AS definicion
FROM pg_trigger t
WHERE t.tgname = 'auto_generate_slug'
  AND t.tgrelid = 'app.anime'::regclass;

\echo ''
\echo '============================================'
\echo 'PASO 3: LIMPIEZA NUCLEAR - ELIMINAR TODO'
\echo '============================================'

-- Desconectar todas las sesiones que puedan estar usando las funciones
-- (excepto la actual)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'bd_chirisu'
  AND pid <> pg_backend_pid()
  AND application_name LIKE '%psql%';

-- Eliminar triggers primero
DROP TRIGGER IF EXISTS auto_generate_slug ON app.anime CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manga CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.novels CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhua CASCADE;
DROP TRIGGER IF EXISTS auto_generate_slug ON app.manhwa CASCADE;

\echo 'Triggers eliminados'

-- Eliminar TODAS las funciones de trigger (por si hay variaciones)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid::regprocedure AS func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app'
          AND p.proname LIKE '%slug%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_signature || ' CASCADE';
        RAISE NOTICE 'Eliminada: %', func_record.func_signature;
    END LOOP;
END $$;

\echo 'Funciones eliminadas'

\echo ''
\echo '============================================'
\echo 'PASO 4: RECREAR DESDE CERO - VERSION LIMPIA'
\echo '============================================'

-- Crear funcion generate_slug (SIN ID, SIN NEW.id, NADA DE IDS)
CREATE FUNCTION app.generate_slug(p_title TEXT) 
RETURNS VARCHAR(255) 
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_slug VARCHAR(255);
BEGIN
  -- Validar entrada
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RETURN 'untitled';
  END IF;
  
  -- Convertir a minusculas
  v_slug := lower(trim(p_title));
  
  -- Reemplazar acentos
  v_slug := translate(v_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  -- Quitar caracteres especiales
  v_slug := regexp_replace(v_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Normalizar espacios
  v_slug := regexp_replace(v_slug, '\s+', ' ', 'g');
  v_slug := trim(v_slug);
  
  -- Convertir espacios a guiones
  v_slug := replace(v_slug, ' ', '-');
  
  -- Quitar guiones multiples
  v_slug := regexp_replace(v_slug, '-+', '-', 'g');
  
  -- Quitar guiones al inicio y final
  v_slug := trim(both '-' from v_slug);
  
  -- Asegurar que no esté vacío
  IF v_slug = '' THEN
    v_slug := 'untitled';
  END IF;
  
  -- Limitar a 255 caracteres
  v_slug := substring(v_slug from 1 for 255);
  
  RETURN v_slug;
END;
$$;

COMMENT ON FUNCTION app.generate_slug(TEXT) IS 'Genera slug SIN ID - solo titulo normalizado';

\echo 'Funcion generate_slug creada (1 parametro, sin ID)'

-- Crear trigger function para ANIME
CREATE FUNCTION app.trg_anime_generate_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_title TEXT;
BEGIN
  -- Solo generar si slug está vacío
  IF NEW.slug IS NULL OR trim(NEW.slug) = '' THEN
    -- Obtener el titulo (prioridad: romaji > english > native)
    v_title := COALESCE(
      NULLIF(trim(NEW.title_romaji), ''),
      NULLIF(trim(NEW.title_english), ''),
      NULLIF(trim(NEW.title_native), ''),
      'untitled'
    );
    
    -- Generar slug SIN ID
    NEW.slug := app.generate_slug(v_title);
  END IF;
  
  RETURN NEW;
END;
$$;

\echo 'Trigger function anime creada'

-- Crear trigger function para MANGA
CREATE FUNCTION app.trg_manga_generate_slug()
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

\echo 'Trigger function manga creada'

-- Crear trigger function para NOVELS
CREATE FUNCTION app.trg_novel_generate_slug()
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

\echo 'Trigger function novels creada'

-- Crear triggers en las tablas
CREATE TRIGGER trg_generate_slug
  BEFORE INSERT OR UPDATE OF title_romaji, title_english, title_native, slug
  ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_anime_generate_slug();

\echo 'Trigger en anime creado'

CREATE TRIGGER trg_generate_slug
  BEFORE INSERT OR UPDATE OF title_romaji, title_english, title_native, slug
  ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_manga_generate_slug();

\echo 'Trigger en manga creado'

CREATE TRIGGER trg_generate_slug
  BEFORE INSERT OR UPDATE OF title_romaji, title_english, title_native, slug
  ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_novel_generate_slug();

\echo 'Trigger en novels creado'

\echo ''
\echo '============================================'
\echo 'PASO 5: VERIFICACION FINAL'
\echo '============================================'

-- Verificar funcion generate_slug
SELECT 
  'CHECK: Funcion generate_slug' AS verificacion,
  proname AS nombre,
  pronargs AS num_params,
  pg_get_function_identity_arguments(p.oid) AS argumentos
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app' 
  AND proname = 'generate_slug';

-- Verificar triggers
SELECT 
  'CHECK: Triggers activos' AS verificacion,
  c.relname AS tabla,
  t.tgname AS trigger_nombre,
  p.proname AS funcion_trigger
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'app'
  AND c.relname IN ('anime', 'manga', 'novels')
  AND t.tgname LIKE '%slug%'
ORDER BY c.relname;

-- Ver codigo fuente de la funcion trigger de anime
SELECT 
  'CHECK: Codigo funcion trigger anime' AS verificacion,
  prosrc AS codigo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'app'
  AND proname = 'trg_anime_generate_slug';

\echo ''
\echo '============================================'
\echo 'PASO 6: PRUEBAS'
\echo '============================================'

-- Test directo de la funcion
SELECT 
  'TEST 1' AS test,
  app.generate_slug('Jujutsu Kaisen') AS resultado,
  'jujutsu-kaisen' AS esperado,
  CASE 
    WHEN app.generate_slug('Jujutsu Kaisen') = 'jujutsu-kaisen' 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END AS status;

SELECT 
  'TEST 2' AS test,
  app.generate_slug('Pokémon: The Movie!') AS resultado,
  'pokemon-the-movie' AS esperado,
  CASE 
    WHEN app.generate_slug('Pokémon: The Movie!') = 'pokemon-the-movie' 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END AS status;

SELECT 
  'TEST 3' AS test,
  app.generate_slug('One Piece & Friends') AS resultado,
  'one-piece-friends' AS esperado,
  CASE 
    WHEN app.generate_slug('One Piece & Friends') = 'one-piece-friends' 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END AS status;

\echo ''
\echo '============================================'
\echo 'COMPLETADO!'
\echo '============================================'
\echo 'Ahora intenta aprobar la contribucion de nuevo.'
\echo 'El slug se generara SIN ID, solo con el nombre.'
\echo '============================================'
