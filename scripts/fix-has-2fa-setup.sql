-- ========================================
-- SCRIPT: Fix has_2fa_setup para Usuarios Existentes
-- ========================================
-- Base de datos: bd_chirisu
-- Usuario: postgres
--
-- PROPÓSITO:
-- Corregir usuarios que tienen 2FA activo pero has_2fa_setup = false
-- Esto previene el error "falta configurar 2FA" en login

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'DIAGNÓSTICO: Usuarios con 2FA desincronizado'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Ver usuarios con problema
SELECT 
  u.id,
  u.username,
  u.email,
  u.has_2fa_setup as tiene_2fa_setup,
  u2f.enabled as a2f_activo,
  u2f.enabled_at,
  CASE 
    WHEN u2f.enabled = true AND u.has_2fa_setup = false THEN '❌ INCONSISTENTE'
    WHEN u2f.enabled = true AND u.has_2fa_setup = true THEN '✅ OK'
    WHEN u2f.enabled = false OR u2f.enabled IS NULL THEN '⚠️ 2FA no activado'
    ELSE '❓ Revisar'
  END as estado
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.id;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'CORRECCIÓN: Sincronizando has_2fa_setup'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Actualizar usuarios con 2FA activo pero has_2fa_setup = false
UPDATE app.users u
SET has_2fa_setup = true
FROM app.user_2fa u2f
WHERE u.id = u2f.user_id
  AND u2f.enabled = true
  AND u.has_2fa_setup = false
  AND u.deleted_at IS NULL;

-- Mostrar cuántos se actualizaron
SELECT 'Usuarios corregidos: ' || COUNT(*) as resultado
FROM app.users u
INNER JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u2f.enabled = true 
  AND u.has_2fa_setup = true
  AND u.deleted_at IS NULL;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'CORRECCIÓN: Estableciendo enabled_at'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Actualizar enabled_at para usuarios con 2FA activo pero sin timestamp
UPDATE app.user_2fa
SET enabled_at = COALESCE(enabled_at, created_at, NOW())
WHERE enabled = true
  AND enabled_at IS NULL;

-- Verificar resultado
SELECT 'Timestamps actualizados: ' || COUNT(*) as resultado
FROM app.user_2fa
WHERE enabled = true
  AND enabled_at IS NOT NULL;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'VERIFICACIÓN FINAL'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Ver estado final
SELECT 
  u.id,
  u.username,
  u.email,
  u.has_2fa_setup,
  u2f.enabled,
  u2f.enabled_at,
  CASE 
    WHEN u2f.enabled = true AND u.has_2fa_setup = true AND u2f.enabled_at IS NOT NULL 
      THEN '✅ CORRECTO'
    WHEN u2f.enabled = true AND u.has_2fa_setup = false 
      THEN '❌ SIGUE INCONSISTENTE'
    WHEN u2f.enabled = true AND u2f.enabled_at IS NULL 
      THEN '❌ FALTA enabled_at'
    WHEN u2f.enabled = false OR u2f.enabled IS NULL 
      THEN '⚠️ 2FA no activado'
    ELSE '❓ Estado desconocido'
  END as estado
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.id;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo 'ESTADÍSTICAS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  'Total usuarios activos' as metrica,
  COUNT(*) as cantidad
FROM app.users
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  'Con 2FA activo y correcto',
  COUNT(*)
FROM app.users u
INNER JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u2f.enabled = true
  AND u.has_2fa_setup = true
  AND u2f.enabled_at IS NOT NULL

UNION ALL

SELECT 
  'Con 2FA activo pero inconsistente',
  COUNT(*)
FROM app.users u
INNER JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL
  AND u2f.enabled = true
  AND (u.has_2fa_setup = false OR u2f.enabled_at IS NULL)

UNION ALL

SELECT 
  'Sin 2FA configurado',
  COUNT(*)
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL
  AND (u2f.enabled = false OR u2f.enabled IS NULL);

\echo ''
\echo '✅ CORRECCIÓN COMPLETADA'
\echo ''
\echo 'Si aún hay usuarios inconsistentes, verifica:'
\echo '1. Que el registro esté actualizando has_2fa_setup'
\echo '2. Que verify-registration esté estableciendo enabled_at'
\echo '3. Logs de errores en la aplicación'
