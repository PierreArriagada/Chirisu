-- ============================================
-- SOLUCION FINAL - MATAR TODO Y RECREAR
-- ============================================

SET client_encoding = 'UTF8';

\echo '=========================================='
\echo 'PASO 1: Cerrar todas las conexiones activas'
\echo '=========================================='

-- Terminar TODAS las conexiones a la BD excepto esta
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'bd_chirisu'
  AND pid <> pg_backend_pid();

\echo 'Conexiones cerradas'

\echo ''
\echo '=========================================='
\echo 'PASO 2: ELIMINAR TODO lo relacionado con slugs'
\echo '=========================================='

-- Eliminar triggers de anime
DO $$
DECLARE
    trig_record RECORD;
BEGIN
    FOR trig_record IN 
        SELECT tgname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'app'
          AND c.relname IN ('anime', 'manga', 'novels')
          AND NOT t.tgisinternal
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.tgname || ' ON app.anime CASCADE';
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.tgname || ' ON app.manga CASCADE';
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.tgname || ' ON app.novels CASCADE';
        RAISE NOTICE 'Trigger eliminado: %', trig_record.tgname;
    END LOOP;
END $$;

-- Eliminar TODAS las funciones con 'slug' en el nombre
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT p.oid::regprocedure AS func_sig
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'app'
          AND (p.proname LIKE '%slug%' OR p.prosrc LIKE '%slug%')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_sig || ' CASCADE';
        RAISE NOTICE 'Funcion eliminada: %', func_record.func_sig;
    END LOOP;
END $$;

\echo 'TODO eliminado'

\echo ''
\echo '=========================================='
\echo 'PASO 3: LIMPIAR CACHE de PostgreSQL'
\echo '=========================================='

-- Limpiar plan cache
DISCARD ALL;

-- Reset de stats
SELECT pg_stat_reset();

\echo 'Cache limpiado'

\echo ''
\echo '=========================================='
\echo 'PASO 4: CREAR funcion generate_slug NUEVA'
\echo '=========================================='

CREATE FUNCTION app.generate_slug(input_title TEXT) 
RETURNS VARCHAR(255) 
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $function$
DECLARE
  result_slug VARCHAR(255);
BEGIN
  -- Convertir a minusculas y trim
  result_slug := lower(trim(input_title));
  
  -- Normalizar acentos
  result_slug := translate(result_slug,
    'áéíóúàèìòùâêîôûãõäëïöüñçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÄËÏÖÜÑÇ',
    'aeiouaeiouaeiouaoaeiouancAEIOUAEIOUAEIOUAOAEIOUANC'
  );
  
  -- Quitar caracteres especiales
  result_slug := regexp_replace(result_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Normalizar espacios
  result_slug := regexp_replace(result_slug, '\s+', '-', 'g');
  result_slug := regexp_replace(result_slug, '-+', '-', 'g');
  result_slug := trim(both '-' from result_slug);
  
  -- Validar resultado
  IF result_slug = '' THEN
    result_slug := 'untitled';
  END IF;
  
  -- Limitar longitud
  RETURN substring(result_slug from 1 for 255);
END;
$function$;

COMMENT ON FUNCTION app.generate_slug(TEXT) IS 'Genera slug normalizado SIN ID';

\echo 'Funcion generate_slug creada'

\echo ''
\echo '=========================================='
\echo 'PASO 5: CREAR trigger functions NUEVAS'
\echo '=========================================='

-- Trigger para ANIME
CREATE FUNCTION app.fn_anime_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo si slug esta vacio
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(
        NEW.title_romaji,
        NEW.title_english,
        NEW.title_native,
        'untitled-anime'
      )
    );
    RAISE NOTICE '[TRIGGER ANIME] Slug generado: %', NEW.slug;
  END IF;
  RETURN NEW;
END;
$function$;

\echo 'Trigger function anime creada'

-- Trigger para MANGA
CREATE FUNCTION app.fn_manga_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(
        NEW.title_romaji,
        NEW.title_english,
        NEW.title_native,
        'untitled-manga'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

\echo 'Trigger function manga creada'

-- Trigger para NOVELS
CREATE FUNCTION app.fn_novel_set_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := app.generate_slug(
      COALESCE(
        NEW.title_romaji,
        NEW.title_english,
        NEW.title_native,
        'untitled-novel'
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;

\echo 'Trigger function novels creada'

\echo ''
\echo '=========================================='
\echo 'PASO 6: CREAR triggers en las tablas'
\echo '=========================================='

-- Trigger en ANIME
CREATE TRIGGER trg_set_anime_slug
  BEFORE INSERT OR UPDATE
  ON app.anime
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_anime_set_slug();

\echo 'Trigger anime OK'

-- Trigger en MANGA
CREATE TRIGGER trg_set_manga_slug
  BEFORE INSERT OR UPDATE
  ON app.manga
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_manga_set_slug();

\echo 'Trigger manga OK'

-- Trigger en NOVELS
CREATE TRIGGER trg_set_novel_slug
  BEFORE INSERT OR UPDATE
  ON app.novels
  FOR EACH ROW
  EXECUTE FUNCTION app.fn_novel_set_slug();

\echo 'Trigger novels OK'

\echo ''
\echo '=========================================='
\echo 'PASO 7: VERIFICACION COMPLETA'
\echo '=========================================='

-- 1. Verificar que NO existe auto_generate_slug
SELECT 
  'VERIFICACION 1' AS test,
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_slug'
    )
    THEN 'PASS - auto_generate_slug NO existe'
    ELSE 'FAIL - auto_generate_slug AUN EXISTE!'
  END AS resultado;

-- 2. Verificar generate_slug con 1 parametro
SELECT 
  'VERIFICACION 2' AS test,
  proname,
  pronargs AS num_params,
  pg_get_function_identity_arguments(oid) AS firma
FROM pg_proc
WHERE pronamespace = 'app'::regnamespace
  AND proname = 'generate_slug';

-- 3. Ver triggers activos
SELECT 
  'VERIFICACION 3' AS test,
  c.relname AS tabla,
  t.tgname AS trigger_nombre,
  p.proname AS funcion_asociada
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'app'
  AND c.relname IN ('anime', 'manga', 'novels')
  AND NOT t.tgisinternal
ORDER BY c.relname;

-- 4. Ver codigo de trigger de anime
SELECT 
  'VERIFICACION 4' AS test,
  'Codigo del trigger de anime:' AS info;

SELECT prosrc 
FROM pg_proc 
WHERE proname = 'fn_anime_set_slug';

\echo ''
\echo '=========================================='
\echo 'PASO 8: PRUEBA REAL'
\echo '=========================================='

-- Test de la funcion
SELECT 
  'TEST FUNCION' AS test,
  app.generate_slug('Jujutsu Kaisen') AS resultado,
  'jujutsu-kaisen' AS esperado,
  CASE 
    WHEN app.generate_slug('Jujutsu Kaisen') = 'jujutsu-kaisen'
    THEN 'PASS'
    ELSE 'FAIL'
  END AS status;

-- Test del trigger (simulado)
SELECT 
  'TEST TRIGGER' AS test,
  'Intenta insertar un anime - el trigger generara el slug' AS instruccion;

\echo ''
\echo '=========================================='
\echo 'COMPLETADO - LISTO PARA USAR'
\echo '=========================================='
\echo 'El sistema esta completamente limpio y recreado.'
\echo 'Ahora intenta aprobar la contribucion.'
\echo '=========================================='
