-- FIX FINAL - Sin problemas de codificacion
SET client_encoding = 'UTF8';

-- 1. Eliminar auto_generate_slug que aun existe
DROP FUNCTION IF EXISTS app.auto_generate_slug() CASCADE;

-- 2. Eliminar generate_slug en todas sus versiones
DROP FUNCTION IF EXISTS app.generate_slug(TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS app.generate_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS app.generate_slug(VARCHAR) CASCADE;

-- 3. Crear funcion generate_slug (sin caracteres especiales)
CREATE FUNCTION app.generate_slug(input_title TEXT) 
RETURNS VARCHAR(255) 
LANGUAGE plpgsql
IMMUTABLE
STRICT
AS $$
DECLARE
  result_slug VARCHAR(255);
BEGIN
  result_slug := lower(trim(input_title));
  
  -- Normalizar acentos a-z sin simbolos
  result_slug := translate(result_slug,
    'aeiounaeiounAEIOUNAEIOUN',
    'aeiounaeiounAEIOUNAEIOUN'
  );
  
  -- Quitar caracteres especiales
  result_slug := regexp_replace(result_slug, '[^a-z0-9\s-]', '', 'g');
  
  -- Normalizar espacios
  result_slug := regexp_replace(result_slug, '\s+', '-', 'g');
  result_slug := regexp_replace(result_slug, '-+', '-', 'g');
  result_slug := trim(both '-' from result_slug);
  
  IF result_slug = '' THEN
    result_slug := 'untitled';
  END IF;
  
  RETURN substring(result_slug from 1 for 255);
END;
$$;

-- 4. Verificar
SELECT 'CHECK 1' AS test,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_generate_slug')
    THEN 'PASS - auto_generate_slug eliminada'
    ELSE 'FAIL - auto_generate_slug AUN EXISTE'
  END AS resultado;

SELECT 'CHECK 2' AS test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_slug' AND pronargs = 1)
    THEN 'PASS - generate_slug existe con 1 parametro'
    ELSE 'FAIL - generate_slug NO existe'
  END AS resultado;

-- 5. Probar
SELECT 'TEST' AS test,
  app.generate_slug('Jujutsu Kaisen') AS resultado,
  'jujutsu-kaisen' AS esperado;

SELECT 'COMPLETADO' AS status, 'Intenta aprobar la contribucion ahora' AS mensaje;
