-- ========================================
-- SCRIPT: Agregar Recovery Codes a Usuarios Existentes
-- ========================================
-- Base de datos: bd_chirisu
-- Usuario: postgres

-- Este script agrega recovery codes a usuarios que no lo tienen

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'AGREGANDO RECOVERY CODES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Insertar recovery codes para usuarios sin ellos
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(64);
  codes_added INT := 0;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.username
    FROM app.users u
    LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
    WHERE u.deleted_at IS NULL 
      AND u.is_active = true
      AND rc.id IS NULL
  LOOP
    -- Generar código aleatorio de 64 caracteres hex
    new_code := encode(gen_random_bytes(32), 'hex');
    
    -- Insertar recovery code
    INSERT INTO app.recovery_codes (user_id, code, created_at, last_regenerated)
    VALUES (user_record.id, new_code, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Recovery code creado para usuario: % (ID: %)', user_record.username, user_record.id;
    codes_added := codes_added + 1;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total de recovery codes agregados: %', codes_added;
END $$;

-- Verificar resultado
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'VERIFICACIÓN POST-ACTUALIZACIÓN'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  u.id,
  u.username,
  u.email,
  CASE 
    WHEN rc.code IS NOT NULL THEN '✅ Tiene'
    ELSE '❌ Falta'
  END as recovery_code_status,
  LENGTH(rc.code) as code_length
FROM app.users u
LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.id;

\echo ''
\echo '✅ ACTUALIZACIÓN COMPLETA'
