-- =============================================
-- Sistema de Privacidad para Listas y Favoritos
-- Fecha: 2025-10-17
-- Descripción: Agrega soporte de privacidad (público/privado) para favoritos de personas
-- =============================================

-- ===========================================================================
-- 1. Agregar columna is_public a user_favorites
--    Permite que los usuarios controlen si sus favoritos de personajes,
--    actores de voz y staff son públicos o privados
-- ===========================================================================
ALTER TABLE app.user_favorites 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN app.user_favorites.is_public IS 
'Define si los favoritos de personas (personajes/actores/staff) son públicos (TRUE) o privados (FALSE). Por defecto es público.';

-- ===========================================================================
-- 2. Crear índice para mejorar rendimiento en consultas de privacidad
--    Este índice optimiza las consultas que filtran por user_id e is_public
--    Ejemplo: SELECT * FROM user_favorites WHERE user_id = X AND is_public = TRUE
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_user_favorites_public 
ON app.user_favorites(user_id, is_public);

COMMENT ON INDEX app.idx_user_favorites_public IS 
'Índice para optimizar consultas de favoritos públicos/privados por usuario';

-- ===========================================================================
-- 3. Verificar y asegurar que lists ya tiene is_public
--    La tabla lists debería tener esta columna, pero la verificamos por seguridad
-- ===========================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'lists' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE app.lists ADD COLUMN is_public BOOLEAN DEFAULT TRUE;
        COMMENT ON COLUMN app.lists.is_public IS 'Define si la lista es pública o privada';
        RAISE NOTICE 'Columna is_public agregada a app.lists';
    ELSE
        RAISE NOTICE 'Columna is_public ya existe en app.lists';
    END IF;
END $$;

-- ===========================================================================
-- 4. Asegurar que todas las listas predefinidas sean públicas por defecto
--    Las listas del sistema (Viendo, Completado, etc.) deben ser públicas
--    inicialmente para compatibilidad
-- ===========================================================================
UPDATE app.lists 
SET is_public = TRUE 
WHERE is_public IS NULL;

-- ===========================================================================
-- 5. Asegurar que todos los favoritos existentes sean públicos por defecto
--    Los favoritos ya existentes deben ser públicos para compatibilidad
-- ===========================================================================
UPDATE app.user_favorites 
SET is_public = TRUE 
WHERE is_public IS NULL;

-- ===========================================================================
-- VERIFICACIÓN FINAL
-- Muestra el estado de las columnas y datos después de las migraciones
-- ===========================================================================

-- Verificar existencia de columnas
SELECT 
    'user_favorites' as tabla,
    'is_public' as columna,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'user_favorites' 
        AND column_name = 'is_public'
    ) as existe;

SELECT 
    'lists' as tabla,
    'is_public' as columna,
    EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'app' 
        AND table_name = 'lists' 
        AND column_name = 'is_public'
    ) as existe;

-- Mostrar estadísticas de privacidad
SELECT 
    'user_favorites' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE is_public = TRUE) as publicos,
    COUNT(*) FILTER (WHERE is_public = FALSE) as privados
FROM app.user_favorites
UNION ALL
SELECT 
    'lists' as tabla,
    COUNT(*) as total_registros,
    COUNT(*) FILTER (WHERE is_public = TRUE) as publicos,
    COUNT(*) FILTER (WHERE is_public = FALSE) as privados
FROM app.lists;

-- Mensaje final
\echo ''
\echo '✅ Migración de privacidad completada exitosamente'
\echo '📊 Revisa las estadísticas arriba para verificar el estado'
\echo ''
