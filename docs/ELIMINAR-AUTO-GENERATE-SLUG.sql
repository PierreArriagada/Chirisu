-- Buscar y eliminar auto_generate_slug de forma agresiva
SET client_encoding = 'UTF8';

-- Ver todas las funciones que contienen 'auto' o 'slug'
SELECT 
  p.oid,
  n.nspname AS schema,
  p.proname AS nombre,
  pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname LIKE '%auto%'
   OR p.proname LIKE '%slug%'
ORDER BY p.proname;

-- Eliminar por OID (mas directo)
DO $$
DECLARE
  func_oid OID;
BEGIN
  -- Buscar el OID de auto_generate_slug
  SELECT p.oid INTO func_oid
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'app'
    AND p.proname = 'auto_generate_slug';
  
  IF func_oid IS NOT NULL THEN
    EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure || ' CASCADE';
    RAISE NOTICE 'auto_generate_slug eliminada por OID: %', func_oid;
  ELSE
    RAISE NOTICE 'auto_generate_slug no encontrada';
  END IF;
END $$;

-- Verificar
SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'app' AND p.proname = 'auto_generate_slug'
    )
    THEN 'OK - auto_generate_slug ELIMINADA'
    ELSE 'ERROR - auto_generate_slug AUN EXISTE'
  END AS resultado;
