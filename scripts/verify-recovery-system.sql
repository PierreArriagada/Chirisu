-- ========================================
-- SCRIPT DE PRUEBA: Sistema de Recuperación de Contraseña
-- ========================================
-- Base de datos: bd_chirisu
-- Usuario: postgres
-- Contraseña: 123456
--
-- PROPÓSITO:
-- Verificar que el sistema de recuperación de contraseña funciona correctamente
-- con recovery codes y códigos A2F/backup codes

-- ========================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- ========================================

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '1. VERIFICANDO ESTRUCTURA DE TABLAS'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Verificar app.recovery_codes
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'app' 
  AND table_name = 'recovery_codes'
) as recovery_codes_exists;

-- Verificar app.user_2fa
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'app' 
  AND table_name = 'user_2fa'
) as user_2fa_exists;

-- Columnas de recovery_codes
\d app.recovery_codes

-- Columnas de user_2fa
\d app.user_2fa

-- ========================================
-- 2. VERIFICAR USUARIOS CON RECOVERY CODES
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '2. USUARIOS CON RECOVERY CODES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  u.id,
  u.username,
  u.email,
  u.is_active,
  rc.code as recovery_code,
  LENGTH(rc.code) as code_length,
  rc.created_at,
  rc.last_regenerated,
  CASE 
    WHEN rc.last_regenerated > rc.created_at THEN '🔄 Regenerado'
    ELSE '📝 Original'
  END as status
FROM app.users u
LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
WHERE u.deleted_at IS NULL
ORDER BY u.id
LIMIT 10;

-- ========================================
-- 3. VERIFICAR ESTADO DE 2FA Y BACKUP CODES
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '3. ESTADO DE 2FA Y BACKUP CODES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  u.id,
  u.username,
  u2f.enabled as a2f_enabled,
  LENGTH(u2f.secret) as secret_length,
  COALESCE(array_length(u2f.backup_codes, 1), 0) as backup_codes_count,
  CASE
    WHEN array_length(u2f.backup_codes, 1) IS NULL THEN '❌ Sin códigos'
    WHEN array_length(u2f.backup_codes, 1) = 0 THEN '⚠️ Agotados'
    WHEN array_length(u2f.backup_codes, 1) < 3 THEN '⚠️ Pocos (' || array_length(u2f.backup_codes, 1) || ')'
    ELSE '✅ OK (' || array_length(u2f.backup_codes, 1) || ')'
  END as backup_status
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.deleted_at IS NULL AND u.is_active = true
ORDER BY u.id
LIMIT 10;

-- ========================================
-- 4. VERIFICAR INTEGRIDAD DE DATOS
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '4. VERIFICACIÓN DE INTEGRIDAD'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Usuarios sin recovery code
\echo '⚠️ Usuarios activos sin recovery code:'
SELECT 
  u.id,
  u.username,
  u.email
FROM app.users u
LEFT JOIN app.recovery_codes rc ON rc.user_id = u.id
WHERE u.is_active = true 
  AND u.deleted_at IS NULL
  AND rc.id IS NULL;

-- Usuarios sin 2FA configurado
\echo ''
\echo '⚠️ Usuarios activos sin 2FA:'
SELECT 
  u.id,
  u.username,
  u.email
FROM app.users u
LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
WHERE u.is_active = true 
  AND u.deleted_at IS NULL
  AND (u2f.id IS NULL OR u2f.enabled = false);

-- Recovery codes duplicados (no debería haber)
\echo ''
\echo '⚠️ Recovery codes duplicados (debería estar vacío):'
SELECT 
  code,
  COUNT(*) as count
FROM app.recovery_codes
GROUP BY code
HAVING COUNT(*) > 1;

-- Recovery codes con formato inválido
\echo ''
\echo '⚠️ Recovery codes con formato inválido (debería estar vacío):'
SELECT 
  u.username,
  rc.code,
  LENGTH(rc.code) as length
FROM app.recovery_codes rc
JOIN app.users u ON u.id = rc.user_id
WHERE LENGTH(rc.code) != 64 OR rc.code !~ '^[a-f0-9]+$';

-- ========================================
-- 5. ESTADÍSTICAS GENERALES
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '5. ESTADÍSTICAS GENERALES'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
  'Total usuarios activos' as metrica,
  COUNT(*) as valor
FROM app.users
WHERE is_active = true AND deleted_at IS NULL

UNION ALL

SELECT 
  'Usuarios con recovery code',
  COUNT(DISTINCT rc.user_id)
FROM app.recovery_codes rc
JOIN app.users u ON u.id = rc.user_id
WHERE u.is_active = true

UNION ALL

SELECT 
  'Usuarios con 2FA activo',
  COUNT(DISTINCT u2f.user_id)
FROM app.user_2fa u2f
JOIN app.users u ON u.id = u2f.user_id
WHERE u2f.enabled = true AND u.is_active = true

UNION ALL

SELECT 
  'Recovery codes regenerados',
  COUNT(*)
FROM app.recovery_codes
WHERE last_regenerated > created_at

UNION ALL

SELECT 
  'Promedio de backup codes',
  ROUND(AVG(array_length(backup_codes, 1)), 2)::text::int
FROM app.user_2fa
WHERE backup_codes IS NOT NULL;

-- ========================================
-- 6. EJEMPLO DE RECOVERY CODE PARA PRUEBAS
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '6. RECOVERY CODE DE USUARIO DE PRUEBA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

\echo 'Para probar la recuperación de contraseña, usa estos datos:'
\echo ''

SELECT 
  '📧 Email: ' || u.email as info,
  ''
FROM app.users u
WHERE u.is_active = true AND u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 1

UNION ALL

SELECT 
  '👤 Username: ' || u.username,
  ''
FROM app.users u
WHERE u.is_active = true AND u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 1

UNION ALL

SELECT 
  '🔑 Recovery Code: ',
  rc.code
FROM app.users u
JOIN app.recovery_codes rc ON rc.user_id = u.id
WHERE u.is_active = true AND u.deleted_at IS NULL
ORDER BY u.created_at DESC
LIMIT 1;

\echo ''
\echo '🔐 Código 2FA: Usa Google Authenticator con el secret configurado'
\echo '🔐 O usa uno de los backup codes guardados al registrarte'

-- ========================================
-- 7. FUNCIÓN AUXILIAR: Buscar usuario por recovery code
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '7. FUNCIÓN DE BÚSQUEDA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Crear función si no existe
CREATE OR REPLACE FUNCTION app.find_user_by_recovery_code(recovery_code_input VARCHAR)
RETURNS TABLE (
  user_id INT,
  username VARCHAR,
  email VARCHAR,
  is_active BOOLEAN,
  has_2fa BOOLEAN,
  backup_codes_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.email,
    u.is_active,
    COALESCE(u2f.enabled, false) as has_2fa,
    COALESCE(array_length(u2f.backup_codes, 1), 0) as backup_codes_count
  FROM app.recovery_codes rc
  JOIN app.users u ON u.id = rc.user_id
  LEFT JOIN app.user_2fa u2f ON u2f.user_id = u.id
  WHERE rc.code = recovery_code_input;
END;
$$ LANGUAGE plpgsql;

\echo '✅ Función creada: app.find_user_by_recovery_code(recovery_code)'
\echo ''
\echo 'Ejemplo de uso:'
\echo "SELECT * FROM app.find_user_by_recovery_code('tu_recovery_code_aqui');"

-- ========================================
-- 8. LIMPIEZA Y MANTENIMIENTO
-- ========================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '8. SUGERENCIAS DE MANTENIMIENTO'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

\echo ''
\echo '💡 Comandos útiles de mantenimiento:'
\echo ''
\echo '-- Ver recovery codes antiguos (no regenerados en más de 90 días):'
\echo 'SELECT u.username, rc.code, rc.last_regenerated'
\echo 'FROM app.recovery_codes rc'
\echo 'JOIN app.users u ON u.id = rc.user_id'
\echo 'WHERE rc.last_regenerated < NOW() - INTERVAL ''90 days'';'
\echo ''
\echo '-- Ver usuarios con pocos backup codes:'
\echo 'SELECT u.username, array_length(u2f.backup_codes, 1) as codes'
\echo 'FROM app.user_2fa u2f'
\echo 'JOIN app.users u ON u.id = u2f.user_id'
\echo 'WHERE array_length(u2f.backup_codes, 1) < 3;'

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '✅ VERIFICACIÓN COMPLETA'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
